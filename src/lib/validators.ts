// Pure validators and masks (no external libraries) for the personal data
// form on /profile. No function here persists any data; they are only string
// transformations. No interface text lives here; that belongs in
// src/lib/i18n/en.ts (see DOCUMENT_RULES for the country → mask/validate
// mapping, without labels).

// ---------------------------------------------------------------------------
// Generic masks (CPF, BR phone, CEP), kept as they were
// ---------------------------------------------------------------------------

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

// ---------------------------------------------------------------------------
// Generic validations, kept as they were
// ---------------------------------------------------------------------------

export function validaCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  // rejects repeated sequences (111.111.111-11 etc.), which would pass the
  // check-digit calculation but are not valid CPFs
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  function calculaDigito(base: number[]): number {
    let peso = base.length + 1;
    const soma = base.reduce((acc, digit) => {
      peso -= 1;
      return acc + digit * (peso + 1);
    }, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const digito1 = calculaDigito(digits.slice(0, 9));
  const digito2 = calculaDigito(digits.slice(0, 10));

  return digito1 === digits[9] && digito2 === digits[10];
}

export function validaEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validaCEP(value: string): boolean {
  return /^\d{5}-?\d{3}$/.test(value.trim());
}

// ---------------------------------------------------------------------------
// Date of birth, now parameterized by regional format (the field used to be
// fixed to DD/MM/YYYY; each country has its own). "DMY"/"MDY" use the "/"
// separator, "YMD" (ISO standard, the fallback for countries without a
// specific rule) uses "-".
// ---------------------------------------------------------------------------

export type DateFormat = "DMY" | "MDY" | "YMD";

export function dateFormatPlaceholder(format: DateFormat): string {
  switch (format) {
    case "DMY":
      return "DD/MM/YYYY";
    case "MDY":
      return "MM/DD/YYYY";
    case "YMD":
      return "YYYY-MM-DD";
  }
}

export function maskData(value: string, format: DateFormat): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (format === "YMD") {
    return digits
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(\d{2})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d{1,4})$/, "$1/$2");
}

export function validaData(value: string, format: DateFormat): boolean {
  const trimmed = value.trim();
  let dia: number;
  let mes: number;
  let ano: number;

  if (format === "YMD") {
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, anoStr, mesStr, diaStr] = match;
    ano = Number(anoStr);
    mes = Number(mesStr);
    dia = Number(diaStr);
  } else {
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    const [, aStr, bStr, anoStr] = match;
    if (format === "DMY") {
      dia = Number(aStr);
      mes = Number(bStr);
    } else {
      mes = Number(aStr);
      dia = Number(bStr);
    }
    ano = Number(anoStr);
  }

  const data = new Date(ano, mes - 1, dia);
  const dataValida =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
  if (!dataValida) return false;

  if (data > new Date()) return false;

  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const aniversarioJaPassouEsteAno =
    hoje.getMonth() > mes - 1 ||
    (hoje.getMonth() === mes - 1 && hoje.getDate() >= dia);
  if (!aniversarioJaPassouEsteAno) idade -= 1;

  return idade >= 18;
}

// ---------------------------------------------------------------------------
// Phone: mask with the country calling code, parameterized by country. BR
// and US/CA use the local pattern with parentheses around the area code; the
// rest use space-separated blocks, which is enough to not block typing
// without pretending to know each carrier's official format.
// ---------------------------------------------------------------------------

export function maskPhoneBR(value: string): string {
  const masked = maskTelefone(value);
  return masked ? `+55 ${masked}` : "";
}

export function maskPhoneNANP(dialCode: string) {
  return (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const masked = digits
      .replace(/(\d{3})(\d)/, "($1) $2")
      .replace(/(\d{3})(\d{1,4})$/, "$1-$2");
    return masked ? `${dialCode} ${masked}` : "";
  };
}

export function makePhoneMask(dialCode: string, groups: number[], maxDigits: number) {
  return (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, maxDigits);
    if (!digits) return "";
    const parts: string[] = [];
    let idx = 0;
    for (const len of groups) {
      if (idx >= digits.length) break;
      parts.push(digits.slice(idx, idx + len));
      idx += len;
    }
    return `${dialCode} ${parts.join(" ")}`;
  };
}

export function validaTelefonePais(value: string, maxDigits: number): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === maxDigits;
}

// generic fallback for countries without a specific phone rule: it doesn't
// enforce an exact length, only a plausible range (E.164 format)
export function validaTelefoneGenerico(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

// ---------------------------------------------------------------------------
// Identity documents per country: each country maps to a rule
// { mask?, validate }. Used through DOCUMENT_RULES/getDocumentRule, so the
// components don't pile up `if (country === "BR") ... else if (country ===
// "US") ...`. Labels and placeholders do NOT live here; that is interface
// text and belongs in src/lib/i18n/en.ts.
// ---------------------------------------------------------------------------

export type DocumentRule = {
  mask?: (value: string) => string;
  valida: (value: string) => boolean;
};

function soDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

// US: SSN/ITIN. No public check digit, format only (9 digits; the first
// group can't be 000/666/9xx, a real SSA rule)
function maskSSN(value: string): string {
  const digits = soDigitos(value).slice(0, 9);
  return digits
    .replace(/(\d{3})(\d)/, "$1-$2")
    .replace(/(\d{2})(\d{1,4})$/, "$1-$2");
}
function validaSSN(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 9) return false;
  const area = digits.slice(0, 3);
  return area !== "000" && area !== "666" && Number(area) < 900;
}

// GB: National Insurance Number. 2 letters (excluding D,F,I,Q,U,V) + 6
// digits + optional A-D suffix. No public checksum, format only.
function maskNINO(value: string): string {
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
  const letters = clean.slice(0, 2);
  const digits = clean.slice(2, 8);
  const suffix = clean.slice(8, 9);
  const groups = [letters, digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6), suffix];
  return groups.filter(Boolean).join(" ");
}
function validaNINO(value: string): boolean {
  const clean = value.replace(/\s/g, "").toUpperCase();
  return /^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-D]?$/.test(clean);
}

// PT: NIF. 9 digits, no separators in common use
function maskNIF(value: string): string {
  return soDigitos(value).slice(0, 9);
}
// PT: NIF. 9 digits, real check digit (mod 11), same idea as the CPF
function validaNIF(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 9) return false;
  const nums = digits.split("").map(Number);
  const soma = nums.slice(0, 8).reduce((acc, d, i) => acc + d * (9 - i), 0);
  const resto = soma % 11;
  const check = resto < 2 ? 0 : 11 - resto;
  return check === nums[8];
}

// DE: Steuerliche Identifikationsnummer. 11 digits, grouped for readability
function maskSteuerID(value: string): string {
  const digits = soDigitos(value).slice(0, 11);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 11)]
    .filter(Boolean)
    .join(" ");
}
// DE: Steuerliche Identifikationsnummer. 11 digits, format only (the
// official checksum uses a digit-frequency algorithm we don't replicate
// here, to avoid pretending the validation is stronger than it is)
function validaSteuerID(value: string): boolean {
  return /^\d{11}$/.test(soDigitos(value)) && soDigitos(value)[0] !== "0";
}

// FR: numéro fiscal de référence. 13 digits, grouped in pairs
function maskNumeroFiscalFR(value: string): string {
  const digits = soDigitos(value).slice(0, 13);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 2) groups.push(digits.slice(i, i + 2));
  return groups.join(" ");
}
// FR: numéro fiscal de référence. 13 digits, format only
function validaNumeroFiscalFR(value: string): boolean {
  return /^\d{13}$/.test(soDigitos(value));
}

// IT: Codice Fiscale. 16 alphanumeric characters; only normalizes case/length
function maskCodiceFiscale(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 16);
}
// IT: Codice Fiscale. 16 alphanumeric characters in the official pattern, format only
function validaCodiceFiscale(value: string): boolean {
  const clean = value.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(clean);
}

// CA: Social Insurance Number. 9 digits with a real Luhn (mod 10) checksum
function validaSIN(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 9) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  }
  return soma % 10 === 0;
}
function maskSIN(value: string): string {
  return soDigitos(value)
    .slice(0, 9)
    .replace(/(\d{3})(\d)/, "$1-$2")
    .replace(/(\d{3})(\d{1,3})$/, "$1-$2");
}

// AU: Tax File Number (9 digits). Real weighted checksum (mod 11)
function validaTFN(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 9) return false;
  const pesos = [1, 4, 3, 7, 5, 8, 6, 9, 10];
  const soma = digits.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  return soma % 11 === 0;
}
function maskTFN(value: string): string {
  return soDigitos(value)
    .slice(0, 9)
    .replace(/(\d{3})(\d)/, "$1 $2")
    .replace(/(\d{3})(\d{1,3})$/, "$1 $2");
}

// MX: RFC. Only normalizes case/length (13 characters at most)
function maskRFC(value: string): string {
  return value.replace(/[^a-zA-Z0-9ÑñX]/g, "").toUpperCase().slice(0, 13);
}
// MX: RFC. 12 (company) or 13 (individual) alphanumeric characters
function validaRFC(value: string): boolean {
  const clean = value.replace(/[^A-Za-z0-9ÑñX]/g, "").toUpperCase();
  return /^[A-ZÑX&]{3,4}\d{6}[A-Z0-9]{3}$/.test(clean);
}

// AR: CUIT. 11 digits, real weighted checksum (mod 11)
function validaCUIT(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 11) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const soma = digits
    .slice(0, 10)
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  const check = resto === 0 ? 0 : 11 - resto;
  if (check === 11 || check === 10) return false;
  return check === Number(digits[10]);
}
function maskCUIT(value: string): string {
  return soDigitos(value)
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "$1-$2")
    .replace(/(\d{2})-(\d{8})(\d{1})$/, "$1-$2-$3");
}

// CL: RUT. Real check digit (mod 11, "K" possible)
function validaRUT(value: string): boolean {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let soma = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    soma += Number(body[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (soma % 11);
  const check = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return check === dv;
}
function maskRUT(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const grouped = body
    .split("")
    .reverse()
    .reduce((acc, d, i) => (i > 0 && i % 3 === 0 ? d + "." + acc : d + acc), "");
  return dv ? `${grouped}-${dv}` : grouped;
}

// JP: My Number (Kojin Bangō). 12 digits, format only
function validaMyNumber(value: string): boolean {
  return /^\d{12}$/.test(soDigitos(value));
}
function maskMyNumber(value: string): string {
  return soDigitos(value)
    .slice(0, 12)
    .replace(/(\d{4})(\d)/, "$1 $2")
    .replace(/(\d{4}) (\d{4})(\d{1,4})$/, "$1 $2 $3");
}

// SG: NRIC/FIN. Only normalizes case/length (9 characters)
function maskNRIC(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
}
// SG: NRIC/FIN. Letter + 7 digits + letter, format only (the official
// checksum uses a weight table that isn't public for every prefix)
function validaNRIC(value: string): boolean {
  const clean = value.replace(/\s/g, "").toUpperCase();
  return /^[STFGM]\d{7}[A-Z]$/.test(clean);
}

// AE: Emirates ID. 15 digits, format only
function validaEmiratesID(value: string): boolean {
  return /^\d{15}$/.test(soDigitos(value));
}
function maskEmiratesID(value: string): string {
  return soDigitos(value)
    .slice(0, 15)
    .replace(/(\d{3})(\d)/, "$1-$2")
    .replace(/(\d{3})-(\d{4})(\d)/, "$1-$2-$3")
    .replace(/(\d{3})-(\d{4})-(\d{7})(\d{1,4})$/, "$1-$2-$3-$4");
}

// CH: AHV/AVS. 13 digits (starts with 756), format only
function validaAHV(value: string): boolean {
  return /^\d{13}$/.test(soDigitos(value));
}
function maskAHV(value: string): string {
  return soDigitos(value)
    .slice(0, 13)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{4})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{4})\.(\d{4})(\d{1,2})$/, "$1.$2.$3.$4");
}

// ES: DNI/NIE. 8 digits (or X/Y/Z + 7 for an NIE) + a real control letter
// (mod 23, official table)
const ES_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
function validaDNI(value: string): boolean {
  const clean = value.replace(/[^0-9XYZxyz]/gi, "").toUpperCase();
  if (clean.length !== 9) return false;
  const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const firstChar = clean[0];
  const numPart = prefixMap[firstChar] !== undefined ? prefixMap[firstChar] + clean.slice(1, 8) : clean.slice(0, 8);
  if (!/^\d{8}$/.test(numPart)) return false;
  const letter = clean[8];
  return ES_LETTERS[Number(numPart) % 23] === letter;
}
function maskDNI(value: string): string {
  const clean = value.replace(/[^0-9XYZxyz]/gi, "").toUpperCase().slice(0, 9);
  const digits = clean.slice(0, -1);
  const letter = clean.slice(-1);
  return letter ? `${digits}-${letter}` : digits;
}

// NL: BSN. Real "11-proef" checksum (weighted sum, last weight -1)
function validaBSN(value: string): boolean {
  const digits = soDigitos(value);
  if (digits.length !== 9) return false;
  if (/^0+$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  const soma = nums.slice(0, 8).reduce((acc, d, i) => acc + d * (9 - i), 0) - nums[8];
  return soma % 11 === 0;
}

// generic fallback for countries without a specific rule: only requires a
// plausible minimum length, without making up a format or checksum
export const GENERIC_DOCUMENT_RULE: DocumentRule = {
  valida: (value) => value.trim().replace(/\s/g, "").length >= 4,
};

// country (ISO alpha-2) → document validation rule map, so the components
// don't pile up `if (country === "BR")`. Countries not in the map fall back
// to GENERIC_DOCUMENT_RULE.
// Extend as new markets are served.
export const DOCUMENT_RULES: Record<string, DocumentRule> = {
  BR: { mask: maskCPF, valida: validaCPF },
  US: { mask: maskSSN, valida: validaSSN },
  GB: { mask: maskNINO, valida: validaNINO },
  PT: { mask: maskNIF, valida: validaNIF },
  DE: { mask: maskSteuerID, valida: validaSteuerID },
  FR: { mask: maskNumeroFiscalFR, valida: validaNumeroFiscalFR },
  ES: { mask: maskDNI, valida: validaDNI },
  IT: { mask: maskCodiceFiscale, valida: validaCodiceFiscale },
  CA: { mask: maskSIN, valida: validaSIN },
  AU: { mask: maskTFN, valida: validaTFN },
  MX: { mask: maskRFC, valida: validaRFC },
  AR: { mask: maskCUIT, valida: validaCUIT },
  CL: { mask: maskRUT, valida: validaRUT },
  JP: { mask: maskMyNumber, valida: validaMyNumber },
  SG: { mask: maskNRIC, valida: validaNRIC },
  AE: { mask: maskEmiratesID, valida: validaEmiratesID },
  CH: { mask: maskAHV, valida: validaAHV },
  NL: { valida: validaBSN },
};

export function getDocumentRule(countryCode: string): DocumentRule {
  return DOCUMENT_RULES[countryCode] ?? GENERIC_DOCUMENT_RULE;
}
