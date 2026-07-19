"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Pencil, ShieldAlert, TrendingUp } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { INVESTOR_CATEGORY_LABELS } from "@/lib/investor-profile";
import {
  maskCEP,
  maskCPF,
  maskDataNascimento,
  maskTelefone,
  validaCEP,
  validaCPF,
  validaDataNascimento,
  validaEmail,
  validaTelefone,
} from "@/lib/validators";

type FormData = {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  nomeCompleto: "",
  cpf: "",
  dataNascimento: "",
  email: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const MASKS: Partial<Record<keyof FormData, (value: string) => string>> = {
  cpf: maskCPF,
  dataNascimento: maskDataNascimento,
  telefone: maskTelefone,
  cep: maskCEP,
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.nomeCompleto.trim()) errors.nomeCompleto = "Informe seu nome completo.";
  if (!validaCPF(data.cpf)) errors.cpf = "CPF inválido.";
  if (!validaDataNascimento(data.dataNascimento))
    errors.dataNascimento = "Data inválida ou é preciso ter 18 anos ou mais.";
  if (!validaEmail(data.email)) errors.email = "E-mail inválido.";
  if (!validaTelefone(data.telefone)) errors.telefone = "Telefone inválido.";
  if (!validaCEP(data.cep)) errors.cep = "CEP inválido.";
  if (!data.logradouro.trim()) errors.logradouro = "Informe o logradouro.";
  if (!data.numero.trim()) errors.numero = "Informe o número.";
  if (!data.bairro.trim()) errors.bairro = "Informe o bairro.";
  if (!data.cidade.trim()) errors.cidade = "Informe a cidade.";
  if (!data.uf) errors.uf = "Selecione a UF.";
  return errors;
}

function display(value: string): string {
  return value.trim() || "Não informado";
}

export function PersonalDataSection() {
  // CPF, data de nascimento e endereço são dados sensíveis (LGPD) e, como o
  // site ainda não tem backend, vivem só neste estado de componente — nunca
  // em localStorage, cookies ou qualquer outro storage persistente. Os
  // demais campos seguem a mesma regra por simplicidade, já que nada aqui é
  // realmente salvo em lugar nenhum.
  // TODO: ao integrar backend — consentimento LGPD, criptografia em
  // trânsito e repouso, política de privacidade e base legal para coleta de CPF.
  const [saved, setSaved] = useState<FormData>(EMPTY_FORM);
  const [draft, setDraft] = useState<FormData>(EMPTY_FORM);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [errors, setErrors] = useState<FormErrors>({});
  const [justSaved, setJustSaved] = useState(false);
  const { result: investorResult, hydrated: investorHydrated } = useInvestorProfile();

  function startEdit() {
    setDraft(saved);
    setErrors({});
    setJustSaved(false);
    setMode("edit");
  }

  function cancelEdit() {
    setErrors({});
    setMode("view");
  }

  function handleFieldChange(field: keyof FormData) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const raw = event.target.value;
      const masked = MASKS[field]?.(raw) ?? raw;
      setDraft((current) => ({ ...current, [field]: masked }));
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaved(draft);
    setJustSaved(true);
    setMode("view");
  }

  return (
    <section id="dados-pessoais" aria-labelledby="dados-pessoais-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dados-pessoais-heading" className="font-display text-xl text-text-primary">
          Dados pessoais
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Não verificado
          </span>
          {investorHydrated &&
            (investorResult ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue/40 bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Perfil de investidor: {INVESTOR_CATEGORY_LABELS[investorResult.category]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-negative/40 bg-negative/10 px-2.5 py-1 text-xs font-medium text-negative">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Perfil de investidor: pendente
              </span>
            ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        A verificação de identidade (KYC) será exigida quando o produto
        entrar em operação. Nenhuma aprovação é simulada aqui.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
        <AvatarUpload />
      </div>

      {mode === "view" ? (
        <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
          {justSaved && (
            <p className="mb-5 rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive">
              Dados salvos — confirmação simulada, nada foi enviado a um
              servidor.
            </p>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <ReadField label="Nome completo" value={display(saved.nomeCompleto)} />
            <ReadField label="CPF" value={display(saved.cpf)} mono />
            <ReadField label="Data de nascimento" value={display(saved.dataNascimento)} mono />
            <ReadField label="E-mail" value={display(saved.email)} />
            <ReadField label="Telefone" value={display(saved.telefone)} mono />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Endereço
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <ReadField label="CEP" value={display(saved.cep)} mono />
              <ReadField label="Logradouro" value={display(saved.logradouro)} />
              <ReadField label="Número" value={display(saved.numero)} />
              <ReadField label="Complemento" value={display(saved.complemento)} />
              <ReadField label="Bairro" value={display(saved.bairro)} />
              <ReadField
                label="Cidade / UF"
                value={
                  saved.cidade.trim() || saved.uf
                    ? `${display(saved.cidade)} / ${saved.uf || "—"}`
                    : "Não informado"
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startEdit}
            className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-primary hover:border-accent-blue"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Editar
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-6 rounded-lg border border-border bg-bg-surface p-6"
        >
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Pessoais
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                id="pd-nome"
                label="Nome completo"
                value={draft.nomeCompleto}
                onChange={handleFieldChange("nomeCompleto")}
                error={errors.nomeCompleto}
                autoComplete="name"
              />
              <TextField
                id="pd-cpf"
                label="CPF"
                value={draft.cpf}
                onChange={handleFieldChange("cpf")}
                error={errors.cpf}
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
              <TextField
                id="pd-nascimento"
                label="Data de nascimento"
                value={draft.dataNascimento}
                onChange={handleFieldChange("dataNascimento")}
                error={errors.dataNascimento}
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
              />
              <TextField
                id="pd-email"
                label="E-mail"
                type="email"
                value={draft.email}
                onChange={handleFieldChange("email")}
                error={errors.email}
                autoComplete="email"
              />
              <TextField
                id="pd-telefone"
                label="Telefone"
                value={draft.telefone}
                onChange={handleFieldChange("telefone")}
                error={errors.telefone}
                inputMode="tel"
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Endereço
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                id="pd-cep"
                label="CEP"
                value={draft.cep}
                onChange={handleFieldChange("cep")}
                error={errors.cep}
                inputMode="numeric"
                placeholder="00000-000"
              />
              <TextField
                id="pd-logradouro"
                label="Logradouro"
                value={draft.logradouro}
                onChange={handleFieldChange("logradouro")}
                error={errors.logradouro}
                autoComplete="address-line1"
              />
              <TextField
                id="pd-numero"
                label="Número"
                value={draft.numero}
                onChange={handleFieldChange("numero")}
                error={errors.numero}
              />
              <TextField
                id="pd-complemento"
                label="Complemento"
                value={draft.complemento}
                onChange={handleFieldChange("complemento")}
              />
              <TextField
                id="pd-bairro"
                label="Bairro"
                value={draft.bairro}
                onChange={handleFieldChange("bairro")}
                error={errors.bairro}
              />
              <TextField
                id="pd-cidade"
                label="Cidade"
                value={draft.cidade}
                onChange={handleFieldChange("cidade")}
                error={errors.cidade}
                autoComplete="address-level2"
              />
              <div>
                <label htmlFor="pd-uf" className="mb-1 block text-xs text-text-muted">
                  UF
                </label>
                <select
                  id="pd-uf"
                  value={draft.uf}
                  onChange={handleFieldChange("uf")}
                  aria-invalid={Boolean(errors.uf)}
                  aria-describedby={errors.uf ? "pd-uf-error" : undefined}
                  className={`w-full rounded-md border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue ${
                    errors.uf ? "border-negative" : "border-border"
                  }`}
                >
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                {errors.uf && (
                  <p id="pd-uf-error" role="alert" className="mt-1 text-xs text-negative">
                    {errors.uf}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <p className="text-[11px] text-text-muted">
            Ao salvar, os dados ficam só nesta página (estado do navegador) —
            é uma simulação, nada é enviado a um servidor.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary"
            >
              Salvar (simulação)
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ReadField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm text-text-primary ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  placeholder?: string;
}): ReactNode {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue ${
          error ? "border-negative" : "border-border"
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
