"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnswerValue, Form, Question } from "@/lib/types";

type Stage = "welcome" | "question" | "submitting" | "done" | "error";

const RATINGS = [1, 2, 3, 4, 5];

function isEmpty(value: AnswerValue): boolean {
  return value === null || value === undefined || value === "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function FormFiller({ form }: { form: Form }) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const question = form.questions[index];
  const total = form.questions.length;

  const brandStyle = useMemo(
    () => ({ ["--brand" as string]: form.themeColor }),
    [form.themeColor],
  );

  useEffect(() => {
    if (stage === "question") {
      inputRef.current?.focus();
    }
  }, [stage, index]);

  function setAnswer(value: AnswerValue) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: value }));
    setFieldError(null);
  }

  function validateCurrent(): boolean {
    if (!question) return true;
    const value = answers[question.id] ?? null;
    if (question.required && isEmpty(value)) {
      setFieldError("This question is required.");
      return false;
    }
    if (question.type === "email" && !isEmpty(value) && !isValidEmail(String(value))) {
      setFieldError("Please enter a valid email address.");
      return false;
    }
    return true;
  }

  async function goNext() {
    if (!validateCurrent()) return;
    if (index === total - 1) {
      await submit();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function goBack() {
    setFieldError(null);
    if (index === 0) {
      setStage("welcome");
    } else {
      setIndex((i) => i - 1);
    }
  }

  async function submit() {
    setStage("submitting");
    setSubmitError(null);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      setStage("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    }
  }

  function selectAndAdvance(value: AnswerValue) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: value }));
    setFieldError(null);
    window.setTimeout(() => {
      if (index === total - 1) {
        void submit();
      } else {
        setIndex((i) => i + 1);
      }
    }, 250);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (stage === "welcome" && e.key === "Enter") {
        e.preventDefault();
        setStage("question");
        return;
      }
      if (stage !== "question" || !question) return;

      if (e.key === "Enter" && !e.shiftKey) {
        const isTextarea = (e.target as HTMLElement)?.tagName === "TEXTAREA";
        if (isTextarea && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        void goNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, answers, question]);

  const progress = stage === "welcome" ? 0 : stage === "done" ? 100 : ((index + (stage === "submitting" ? 1 : 0)) / total) * 100;

  return (
    <div style={brandStyle} className="flex min-h-screen flex-col bg-white">
      <div className="h-1.5 w-full bg-black/5">
        <div
          className="h-full bg-[var(--brand)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        {stage === "welcome" && (
          <div className="w-full max-w-xl animate-rise-in text-center">
            <h1 className="text-4xl font-bold tracking-tight text-black/90">{form.title}</h1>
            {form.description && (
              <p className="mt-4 text-lg text-black/50">{form.description}</p>
            )}
            <button
              onClick={() => setStage("question")}
              className="mt-8 rounded-lg bg-[var(--brand)] px-6 py-3 text-base font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Start {total > 0 ? `(${total} question${total === 1 ? "" : "s"})` : ""}
            </button>
            <p className="mt-3 text-xs text-black/30">press Enter ↵</p>
          </div>
        )}

        {stage === "question" && question && (
          <div key={question.id} className="w-full max-w-xl animate-rise-in">
            <p className="mb-2 text-sm font-medium text-[var(--brand)]">
              {index + 1} → {total}
            </p>
            <h2 className="text-2xl font-semibold text-black/90 sm:text-3xl">
              {question.title}
              {question.required && <span className="ml-1 text-[var(--brand)]">*</span>}
            </h2>
            {question.description && (
              <p className="mt-2 text-black/50">{question.description}</p>
            )}

            <div className="mt-6">
              <QuestionInput
                question={question}
                value={answers[question.id] ?? null}
                inputRef={inputRef}
                onChange={setAnswer}
                onSelectAndAdvance={selectAndAdvance}
              />
            </div>

            {fieldError && <p className="mt-3 text-sm text-red-500">{fieldError}</p>}

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={goNext}
                className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                {index === total - 1 ? "Submit" : "OK"}
              </button>
              <button
                onClick={goBack}
                className="text-sm font-medium text-black/40 hover:text-black/70"
              >
                Back
              </button>
              <span className="ml-auto text-xs text-black/30">press Enter ↵</span>
            </div>
          </div>
        )}

        {stage === "submitting" && (
          <div className="animate-rise-in text-center text-black/50">Submitting…</div>
        )}

        {stage === "done" && (
          <div className="w-full max-w-xl animate-rise-in text-center">
            <h1 className="text-3xl font-bold text-black/90">Thank you!</h1>
            <p className="mt-3 text-black/50">Your response has been recorded.</p>
          </div>
        )}

        {stage === "error" && (
          <div className="w-full max-w-xl animate-rise-in text-center">
            <h1 className="text-2xl font-bold text-red-500">Couldn&apos;t submit</h1>
            <p className="mt-3 text-black/50">{submitError}</p>
            <button
              onClick={() => setStage("question")}
              className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <footer className="pb-6 text-center text-xs text-black/25">
        Powered by PseudoTypeForm
      </footer>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  inputRef,
  onChange,
  onSelectAndAdvance,
}: {
  question: Question;
  value: AnswerValue;
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onChange: (value: AnswerValue) => void;
  onSelectAndAdvance: (value: AnswerValue) => void;
}) {
  switch (question.type) {
    case "short_text":
    case "email":
      return (
        <input
          ref={(el) => {
            inputRef.current = el;
          }}
          type={question.type === "email" ? "email" : "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here…"
          className="w-full border-b-2 border-black/10 bg-transparent pb-3 text-xl outline-none focus:border-[var(--brand)]"
        />
      );
    case "number":
      return (
        <input
          ref={(el) => {
            inputRef.current = el;
          }}
          type="number"
          value={typeof value === "number" ? value : value === null ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          placeholder="Type a number…"
          className="w-full border-b-2 border-black/10 bg-transparent pb-3 text-xl outline-none focus:border-[var(--brand)]"
        />
      );
    case "long_text":
      return (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here…"
          rows={4}
          className="w-full resize-none border-b-2 border-black/10 bg-transparent pb-3 text-xl outline-none focus:border-[var(--brand)]"
        />
      );
    case "multiple_choice":
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((option, i) => {
            const selected = value === option;
            return (
              <button
                key={option}
                onClick={() => onSelectAndAdvance(option)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition ${
                  selected
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-black/90"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-black/20 text-xs text-black/40">
                  {i + 1}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      );
    case "yes_no":
      return (
        <div className="flex gap-3">
          {(["Yes", "No"] as const).map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                onClick={() => onSelectAndAdvance(option)}
                className={`flex-1 rounded-lg border px-4 py-3 text-base font-medium transition ${
                  selected
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-black/90"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    case "rating":
      return (
        <div className="flex gap-2">
          {RATINGS.map((n) => {
            const selected = value === n;
            return (
              <button
                key={n}
                onClick={() => onSelectAndAdvance(n)}
                className={`flex h-12 w-12 items-center justify-center rounded-full border text-base font-medium transition ${
                  selected
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      );
    default:
      return null;
  }
}
