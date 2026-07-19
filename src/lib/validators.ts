// Validadores e máscaras puros (sem libs externas) para o formulário de
// dados pessoais do /profile. Nenhuma função aqui persiste dado nenhum —
// são só transformações de string.

// ---------------------------------------------------------------------------
// Máscaras
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

export function maskDataNascimento(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d{1,4})$/, "$1/$2");
}

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

export function validaCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  // rejeita sequências repetidas (111.111.111-11 etc.), que passariam no
  // cálculo dos dígitos verificadores mas não são CPFs válidos
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

export function validaTelefone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

export function validaCEP(value: string): boolean {
  return /^\d{5}-?\d{3}$/.test(value.trim());
}

export function validaDataNascimento(value: string): boolean {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const [, diaStr, mesStr, anoStr] = match;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);

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
