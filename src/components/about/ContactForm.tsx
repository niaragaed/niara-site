"use client";

import { useState, type FormEvent } from "react";

const INTEREST_OPTIONS = ["Empresa emissora", "Investidor", "Imprensa", "Suporte", "Outro"];

const CONTACT_EMAIL = "niaragaed@gmail.com";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState(INTEREST_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Informe seu nome.";
    if (!email.trim()) nextErrors.email = "Informe um e-mail.";
    else if (!isValidEmail(email)) nextErrors.email = "E-mail em formato inválido.";
    if (!message.trim()) nextErrors.message = "Escreva uma mensagem.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: integrar com backend/serviço de e-mail (ex.: Resend, Formspied) —
    // por enquanto não há envio real: abrimos o cliente de e-mail do
    // visitante já preenchido, para não fingir que o formulário envia
    // a mensagem sozinho.
    const subject = encodeURIComponent(`[Niara] Contato — ${interest} — ${name}`);
    const body = encodeURIComponent(
      `Nome: ${name}\nE-mail: ${email}\nTipo de interesse: ${interest}\n\nMensagem:\n${message}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-border bg-bg-surface p-6"
    >
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-xs text-text-muted">
          Nome
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        {errors.name && <p className="mt-1 text-xs text-negative">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1 block text-xs text-text-muted">
          E-mail
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        {errors.email && <p className="mt-1 text-xs text-negative">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="contact-interest" className="mb-1 block text-xs text-text-muted">
          Tipo de interesse
        </label>
        <select
          id="contact-interest"
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
          className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
        >
          {INTEREST_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-xs text-text-muted">
          Mensagem
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        {errors.message && <p className="mt-1 text-xs text-negative">{errors.message}</p>}
      </div>

      <p className="text-[11px] text-text-muted">
        Ainda não há envio automático — ao enviar, seu cliente de e-mail
        padrão vai abrir com a mensagem já preenchida para {CONTACT_EMAIL}.
      </p>

      <button
        type="submit"
        className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary"
      >
        Abrir e-mail
      </button>
    </form>
  );
}
