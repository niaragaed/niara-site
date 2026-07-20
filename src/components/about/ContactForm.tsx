"use client";

import { useState, type FormEvent } from "react";
import { en } from "@/lib/i18n/en";

const INTEREST_OPTIONS = en.contact.form.interestOptions;

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
  const [interest, setInterest] = useState<string>(INTEREST_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = en.contact.form.nameError;
    if (!email.trim()) nextErrors.email = en.contact.form.emailError;
    else if (!isValidEmail(email)) nextErrors.email = en.contact.form.emailInvalid;
    if (!message.trim()) nextErrors.message = en.contact.form.messageError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: integrar com backend/serviço de e-mail (ex.: Resend, Formspied) —
    // por enquanto não há envio real: abrimos o cliente de e-mail do
    // visitante já preenchido, para não fingir que o formulário envia
    // a mensagem sozinho.
    const subject = encodeURIComponent(en.contact.form.subjectPrefix(interest, name));
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nType of inquiry: ${interest}\n\nMessage:\n${message}`,
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
          {en.contact.form.nameLabel}
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
          {en.contact.form.emailLabel}
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
          {en.contact.form.interestLabel}
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
          {en.contact.form.messageLabel}
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
        {en.contact.form.disclaimer(CONTACT_EMAIL)}
      </p>

      <button
        type="submit"
        className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary"
      >
        {en.contact.form.submit}
      </button>
    </form>
  );
}
