import {
  maskCEP,
  maskPhoneBR,
  maskPhoneNANP,
  makePhoneMask,
  validaCEP,
  validaTelefoneGenerico,
  validaTelefonePais,
  type DateFormat,
} from "./validators";

export type Country = {
  code: string; // ISO 3166-1 alpha-2 (maiúsculo)
  name: string; // nome em inglês
};

// Lista ampla para o seletor de país (busca + bandeira). Não é um cadastro
// ISO 3166 oficial exaustivo, mas cobre os estados soberanos reconhecidos
// mais os territórios comumente usados em formulários internacionais.
// expandir conforme os mercados atendidos
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

export type CountryConfig = {
  dateFormat: DateFormat;
  phone: {
    dialCode: string;
    mask: (value: string) => string;
    valida: (value: string) => boolean;
  };
  postalMask?: (value: string) => string;
  postalValida?: (value: string) => boolean;
  /** só definido para países com lista fechada de estados (por ora, só BR) */
  states?: string[];
};

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

// Config detalhada dos países com regra própria de documento/telefone/data/
// código postal. Fora daqui, GENERIC_COUNTRY_CONFIG assume o comportamento
// (documento genérico, data em ISO, telefone livre, código postal livre).
// expandir conforme os mercados atendidos
export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  BR: {
    dateFormat: "DMY",
    phone: { dialCode: "+55", mask: maskPhoneBR, valida: (v) => validaTelefonePais(v, 11) },
    postalMask: maskCEP,
    postalValida: validaCEP,
    states: BR_STATES,
  },
  US: {
    dateFormat: "MDY",
    phone: { dialCode: "+1", mask: maskPhoneNANP("+1"), valida: (v) => validaTelefonePais(v, 10) },
    postalValida: (v) => /^\d{5}(-\d{4})?$/.test(v.trim()),
  },
  GB: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+44",
      mask: makePhoneMask("+44", [4, 6], 10),
      valida: (v) => validaTelefonePais(v, 10),
    },
  },
  PT: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+351",
      mask: makePhoneMask("+351", [3, 3, 3], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{4}-\d{3}$/.test(v.trim()),
  },
  DE: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+49",
      mask: makePhoneMask("+49", [3, 4, 4], 11),
      valida: (v) => validaTelefonePais(v, 11),
    },
    postalValida: (v) => /^\d{5}$/.test(v.trim()),
  },
  FR: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+33",
      mask: makePhoneMask("+33", [1, 2, 2, 2, 2], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{5}$/.test(v.trim()),
  },
  ES: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+34",
      mask: makePhoneMask("+34", [3, 3, 3], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{5}$/.test(v.trim()),
  },
  IT: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+39",
      mask: makePhoneMask("+39", [3, 3, 4], 10),
      valida: (v) => validaTelefonePais(v, 10),
    },
    postalValida: (v) => /^\d{5}$/.test(v.trim()),
  },
  CA: {
    dateFormat: "MDY",
    phone: { dialCode: "+1", mask: maskPhoneNANP("+1"), valida: (v) => validaTelefonePais(v, 10) },
    postalValida: (v) => /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()),
  },
  AU: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+61",
      mask: makePhoneMask("+61", [3, 3, 3], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{4}$/.test(v.trim()),
  },
  MX: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+52",
      mask: makePhoneMask("+52", [2, 4, 4], 10),
      valida: (v) => validaTelefonePais(v, 10),
    },
    postalValida: (v) => /^\d{5}$/.test(v.trim()),
  },
  AR: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+54",
      mask: makePhoneMask("+54", [2, 4, 4], 10),
      valida: (v) => validaTelefonePais(v, 10),
    },
  },
  CL: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+56",
      mask: makePhoneMask("+56", [1, 4, 4], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{7}$/.test(v.replace(/\D/g, "")),
  },
  JP: {
    dateFormat: "YMD",
    phone: {
      dialCode: "+81",
      mask: makePhoneMask("+81", [2, 4, 4], 10),
      valida: (v) => validaTelefonePais(v, 10),
    },
    postalValida: (v) => /^\d{3}-?\d{4}$/.test(v.trim()),
  },
  SG: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+65",
      mask: makePhoneMask("+65", [4, 4], 8),
      valida: (v) => validaTelefonePais(v, 8),
    },
    postalValida: (v) => /^\d{6}$/.test(v.trim()),
  },
  AE: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+971",
      mask: makePhoneMask("+971", [2, 3, 4], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
  },
  CH: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+41",
      mask: makePhoneMask("+41", [2, 3, 2, 2], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{4}$/.test(v.trim()),
  },
  NL: {
    dateFormat: "DMY",
    phone: {
      dialCode: "+31",
      mask: makePhoneMask("+31", [1, 8], 9),
      valida: (v) => validaTelefonePais(v, 9),
    },
    postalValida: (v) => /^\d{4}\s?[A-Za-z]{2}$/.test(v.trim()),
  },
};

export const GENERIC_COUNTRY_CONFIG: CountryConfig = {
  dateFormat: "YMD",
  phone: {
    dialCode: "",
    mask: (value) => value.replace(/[^\d+()\- ]/g, ""),
    valida: validaTelefoneGenerico,
  },
};

export function getCountryConfig(code: string): CountryConfig {
  return COUNTRY_CONFIGS[code] ?? GENERIC_COUNTRY_CONFIG;
}

export function getCountryName(code: string): string {
  return COUNTRIES.find((country) => country.code === code)?.name ?? code;
}
