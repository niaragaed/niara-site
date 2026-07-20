"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { QUIZ_QUESTIONS, categorizeScore } from "@/lib/investor-profile";
import { en } from "@/lib/i18n/en";

export function InvestorProfileQuiz() {
  const { saveResult } = useInvestorProfile();
  const [step, setStep] = useState(0);
  // respostas ficam só neste estado em memória — nunca são persistidas
  // individualmente; só o escore final vai para o contexto/localStorage.
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    QUIZ_QUESTIONS.map(() => null),
  );

  const question = QUIZ_QUESTIONS[step];
  const selected = answers[step];
  const isLast = step === QUIZ_QUESTIONS.length - 1;
  const progress = ((step + 1) / QUIZ_QUESTIONS.length) * 100;

  function selectOption(weight: number) {
    setAnswers((current) =>
      current.map((value, index) => (index === step ? weight : value)),
    );
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (selected === null) return;
    if (isLast) {
      const score = answers.reduce<number>((sum, value) => sum + (value ?? 0), 0);
      saveResult({
        category: categorizeScore(score),
        score,
        completedAt: new Date().toISOString(),
      });
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{en.profile.investorProfile.questionCounter(step + 1, QUIZ_QUESTIONS.length)}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={QUIZ_QUESTIONS.length}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated"
      >
        <div
          className="h-full rounded-full bg-gradient-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="font-display text-base text-text-primary">
          {question.prompt}
        </legend>
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((option) => {
            const optionId = `${question.id}-${option.weight}`;
            const checked = selected === option.weight;
            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors ${
                  checked
                    ? "border-accent-blue bg-accent-blue/10 text-text-primary"
                    : "border-border text-text-secondary hover:border-accent-blue/50"
                }`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={question.id}
                  checked={checked}
                  onChange={() => selectOption(option.weight)}
                  className="h-4 w-4 accent-accent-blue"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {en.profile.investorProfile.back}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={selected === null}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? en.profile.investorProfile.seeResult : en.profile.investorProfile.next}
          {!isLast && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
