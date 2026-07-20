"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Pencil, ShieldAlert, TrendingUp } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { CountrySelect } from "./CountrySelect";
import { Flag } from "@/components/ui/Flag";
import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { INVESTOR_CATEGORY_LABELS } from "@/lib/investor-profile";
import { en } from "@/lib/i18n/en";
import { COUNTRIES, getCountryConfig, getCountryName } from "@/lib/countries";
import {
  dateFormatPlaceholder,
  getDocumentRule,
  maskData,
  validaData,
  validaEmail,
} from "@/lib/validators";

type FormData = {
  pais: string;
  nomeCompleto: string;
  documento: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  pais: "",
  nomeCompleto: "",
  documento: "",
  dataNascimento: "",
  email: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

const GEO_ENDPOINT = "https://ipwho.is/";

function getDocumentText(countryCode: string): { label: string; placeholder: string } {
  return en.profile.personalData.documents[countryCode] ?? en.profile.personalData.genericDocument;
}

function getPostalLabel(countryCode: string): string {
  return en.profile.personalData.postalLabels[countryCode] ?? en.profile.personalData.postalLabelDefault;
}

function getRegionLabel(countryCode: string): string {
  return countryCode === "BR"
    ? en.profile.personalData.regionLabelBR
    : en.profile.personalData.regionLabelDefault;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  const t = en.profile.personalData.errors;
  const config = getCountryConfig(data.pais);
  const documentRule = getDocumentRule(data.pais);

  if (!data.pais) errors.pais = t.country;
  if (!data.nomeCompleto.trim()) errors.nomeCompleto = t.fullName;
  if (!documentRule.valida(data.documento)) errors.documento = t.document(getDocumentText(data.pais).label);
  if (!validaData(data.dataNascimento, config.dateFormat)) errors.dataNascimento = t.dob;
  if (!validaEmail(data.email)) errors.email = t.email;
  if (!config.phone.valida(data.telefone)) errors.telefone = t.phone;
  if (config.postalValida && !config.postalValida(data.cep)) {
    errors.cep = t.postalCode(getPostalLabel(data.pais));
  }
  if (!data.logradouro.trim()) errors.logradouro = t.street;
  if (!data.numero.trim()) errors.numero = t.number;
  if (!data.bairro.trim()) errors.bairro = t.neighborhood;
  if (!data.cidade.trim()) errors.cidade = t.city;
  if (!data.estado.trim()) errors.estado = t.region(getRegionLabel(data.pais));
  return errors;
}

function display(value: string): string {
  return value.trim() || en.profile.personalData.notInformed;
}

export function PersonalDataSection() {
  // CPF (ou equivalente por país), data de nascimento e endereço são dados
  // sensíveis (LGPD) e, como o site ainda não tem backend, vivem só neste
  // estado de componente — nunca em localStorage, cookies ou qualquer outro
  // storage persistente. Os demais campos seguem a mesma regra por
  // simplicidade, já que nada aqui é realmente salvo em lugar nenhum.
  // TODO: ao integrar backend — consentimento LGPD, criptografia em
  // trânsito e repouso, política de privacidade e base legal para coleta de
  // documentos de identificação.
  const [saved, setSaved] = useState<FormData>(EMPTY_FORM);
  const [draft, setDraft] = useState<FormData>(EMPTY_FORM);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [errors, setErrors] = useState<FormErrors>({});
  const [justSaved, setJustSaved] = useState(false);
  const { result: investorResult, hydrated: investorHydrated } = useInvestorProfile();

  // País por geolocalização de IP (mesma abordagem do HeroGlobe: ipwho.is,
  // sem navigator.geolocation, falha graciosa) — só como sugestão inicial;
  // nunca sobrescreve uma escolha que o usuário já tenha feito, e se a
  // detecção falhar o campo fica vazio, obrigando a escolha manual.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(GEO_ENDPOINT, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("geo lookup failed");
        return response.json();
      })
      .then((data: { success?: boolean; country_code?: string }) => {
        if (cancelled) return;
        if (data?.success === false || typeof data.country_code !== "string") return;
        const code = data.country_code.toUpperCase();
        if (!COUNTRIES.some((country) => country.code === code)) return;
        setDraft((current) => (current.pais ? current : { ...current, pais: code }));
      })
      .catch(() => {
        // API de geolocalização indisponível/bloqueada — deixa o país
        // vazio, o usuário escolhe manualmente.
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const countryConfig = getCountryConfig(draft.pais);
  const documentRule = getDocumentRule(draft.pais);
  const documentText = getDocumentText(draft.pais);
  const postalLabel = getPostalLabel(draft.pais);
  const regionLabel = getRegionLabel(draft.pais);

  const savedDocumentText = getDocumentText(saved.pais);
  const savedPostalLabel = getPostalLabel(saved.pais);

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

  function handleCountryChange(code: string) {
    // trocar o país limpa o documento e o erro — um CPF válido não pode
    // ficar preenchido num campo que virou SSN
    setDraft((current) => ({ ...current, pais: code, documento: "" }));
    setErrors((current) => ({ ...current, pais: undefined, documento: undefined }));
  }

  function handleFieldChange(field: keyof FormData) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const raw = event.target.value;
      let masked = raw;
      if (field === "documento") masked = documentRule.mask ? documentRule.mask(raw) : raw;
      else if (field === "dataNascimento") masked = maskData(raw, countryConfig.dateFormat);
      else if (field === "telefone") masked = countryConfig.phone.mask(raw);
      else if (field === "cep") masked = countryConfig.postalMask ? countryConfig.postalMask(raw) : raw;
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
    <section id="personal-data" aria-labelledby="personal-data-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="personal-data-heading" className="font-display text-xl text-text-primary">
          {en.profile.nav.personalData}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            {en.profile.personalData.notVerified}
          </span>
          {investorHydrated &&
            (investorResult ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue/40 bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {en.profile.personalData.investorLabelPrefix}{" "}
                {INVESTOR_CATEGORY_LABELS[investorResult.category]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-negative/40 bg-negative/10 px-2.5 py-1 text-xs font-medium text-negative">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {en.profile.personalData.investorPending}
              </span>
            ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{en.profile.personalData.kycNote}</p>

      <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
        <AvatarUpload />
      </div>

      {mode === "view" ? (
        <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
          {justSaved && (
            <p className="mb-5 rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive">
              {en.profile.personalData.savedConfirmation}
            </p>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-text-muted">{en.profile.personalData.country}</dt>
              <dd className="mt-0.5 flex items-center gap-2 text-sm text-text-primary">
                {saved.pais ? (
                  <>
                    <Flag country={saved.pais.toLowerCase()} size="sm" />
                    {getCountryName(saved.pais)}
                  </>
                ) : (
                  en.profile.personalData.notInformed
                )}
              </dd>
            </div>
            <ReadField label={en.profile.personalData.fullName} value={display(saved.nomeCompleto)} />
            <ReadField label={savedDocumentText.label} value={display(saved.documento)} mono />
            <ReadField label={en.profile.personalData.dob} value={display(saved.dataNascimento)} mono />
            <ReadField label={en.profile.personalData.email} value={display(saved.email)} />
            <ReadField label={en.profile.personalData.phone} value={display(saved.telefone)} mono />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {en.profile.personalData.addressSection}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <ReadField label={savedPostalLabel} value={display(saved.cep)} mono />
              <ReadField label={en.profile.personalData.street} value={display(saved.logradouro)} />
              <ReadField label={en.profile.personalData.number} value={display(saved.numero)} />
              <ReadField label={en.profile.personalData.complement} value={display(saved.complemento)} />
              <ReadField label={en.profile.personalData.neighborhood} value={display(saved.bairro)} />
              <ReadField
                label={en.profile.personalData.cityState}
                value={
                  saved.cidade.trim() || saved.estado.trim()
                    ? `${display(saved.cidade)} / ${saved.estado || "—"}`
                    : en.profile.personalData.notInformed
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
            {en.profile.personalData.edit}
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
              {en.profile.personalData.personalSection}
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CountrySelect value={draft.pais} onChange={handleCountryChange} error={errors.pais} />
              <TextField
                id="pd-nome"
                label={en.profile.personalData.fullName}
                value={draft.nomeCompleto}
                onChange={handleFieldChange("nomeCompleto")}
                error={errors.nomeCompleto}
                autoComplete="name"
              />
              <TextField
                id="pd-documento"
                label={documentText.label}
                value={draft.documento}
                onChange={handleFieldChange("documento")}
                error={errors.documento}
                placeholder={documentText.placeholder}
              />
              <TextField
                id="pd-nascimento"
                label={en.profile.personalData.dob}
                value={draft.dataNascimento}
                onChange={handleFieldChange("dataNascimento")}
                error={errors.dataNascimento}
                inputMode="numeric"
                placeholder={dateFormatPlaceholder(countryConfig.dateFormat)}
              />
              <TextField
                id="pd-email"
                label={en.profile.personalData.email}
                type="email"
                value={draft.email}
                onChange={handleFieldChange("email")}
                error={errors.email}
                autoComplete="email"
              />
              <TextField
                id="pd-telefone"
                label={en.profile.personalData.phone}
                value={draft.telefone}
                onChange={handleFieldChange("telefone")}
                error={errors.telefone}
                inputMode="tel"
                placeholder={countryConfig.phone.dialCode}
                autoComplete="tel"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {en.profile.personalData.addressSection}
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                id="pd-cep"
                label={postalLabel}
                value={draft.cep}
                onChange={handleFieldChange("cep")}
                error={errors.cep}
              />
              <TextField
                id="pd-logradouro"
                label={en.profile.personalData.street}
                value={draft.logradouro}
                onChange={handleFieldChange("logradouro")}
                error={errors.logradouro}
                autoComplete="address-line1"
              />
              <TextField
                id="pd-numero"
                label={en.profile.personalData.number}
                value={draft.numero}
                onChange={handleFieldChange("numero")}
                error={errors.numero}
              />
              <TextField
                id="pd-complemento"
                label={en.profile.personalData.complement}
                value={draft.complemento}
                onChange={handleFieldChange("complemento")}
              />
              <TextField
                id="pd-bairro"
                label={en.profile.personalData.neighborhood}
                value={draft.bairro}
                onChange={handleFieldChange("bairro")}
                error={errors.bairro}
              />
              <TextField
                id="pd-cidade"
                label={en.profile.personalData.city}
                value={draft.cidade}
                onChange={handleFieldChange("cidade")}
                error={errors.cidade}
                autoComplete="address-level2"
              />
              {countryConfig.states ? (
                <div>
                  <label htmlFor="pd-estado" className="mb-1 block text-xs text-text-muted">
                    {regionLabel}
                  </label>
                  <select
                    id="pd-estado"
                    value={draft.estado}
                    onChange={handleFieldChange("estado")}
                    aria-invalid={Boolean(errors.estado)}
                    aria-describedby={errors.estado ? "pd-estado-error" : undefined}
                    className={`w-full rounded-md border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue ${
                      errors.estado ? "border-negative" : "border-border"
                    }`}
                  >
                    <option value="">{en.profile.personalData.selectState}</option>
                    {countryConfig.states.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {errors.estado && (
                    <p id="pd-estado-error" role="alert" className="mt-1 text-xs text-negative">
                      {errors.estado}
                    </p>
                  )}
                </div>
              ) : (
                <TextField
                  id="pd-estado"
                  label={regionLabel}
                  value={draft.estado}
                  onChange={handleFieldChange("estado")}
                  error={errors.estado}
                  autoComplete="address-level1"
                />
              )}
            </div>
          </fieldset>

          <p className="text-[11px] text-text-muted">{en.profile.personalData.saveHint}</p>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary"
            >
              {en.profile.personalData.save}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              {en.profile.personalData.cancel}
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
