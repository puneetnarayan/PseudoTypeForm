"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Form, Question } from "@/lib/types";
import QuestionEditor from "./QuestionEditor";

function blankQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "short_text",
    title: "",
    required: true,
  };
}

export default function FormBuilder({ form: initialForm }: { form: Form }) {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? "");
  const [themeColor, setThemeColor] = useState(initialForm.themeColor);
  const [questions, setQuestions] = useState<Question[]>(initialForm.questions);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const sharePath = `/f/${initialForm.id}`;

  const dirty = useMemo(() => {
    return (
      title !== initialForm.title ||
      description !== (initialForm.description ?? "") ||
      themeColor !== initialForm.themeColor ||
      JSON.stringify(questions) !== JSON.stringify(initialForm.questions)
    );
  }, [title, description, themeColor, questions, initialForm]);

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    setQuestions((qs) => {
      const index = qs.findIndex((q) => q.id === id);
      const target = index + direction;
      if (target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${initialForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, themeColor, questions }),
      });
      if (res.ok) {
        setSavedAt(Date.now());
        initialForm.title = title;
        initialForm.description = description;
        initialForm.themeColor = themeColor;
        initialForm.questions = questions;
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-black/50 hover:text-black">
          ← All forms
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/builder/${initialForm.id}/responses`}
            className="text-sm font-medium text-black/50 hover:text-black"
          >
            View responses
          </Link>
          <Link
            href={`/f/${initialForm.id}`}
            target="_blank"
            className="text-sm font-medium text-black/50 hover:text-black"
          >
            Preview ↗
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Form title"
            className="border-b border-black/10 pb-2 text-2xl font-bold outline-none focus:border-black/40"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description shown on the welcome screen (optional)"
            rows={2}
            className="resize-none text-black/60 outline-none"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-black/50">Theme color</label>
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-black/10"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            total={questions.length}
            onChange={(patch) => updateQuestion(question.id, patch)}
            onRemove={() => removeQuestion(question.id)}
            onMove={(direction) => moveQuestion(question.id, direction)}
          />
        ))}

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
          className="rounded-2xl border-2 border-dashed border-black/15 py-4 text-sm font-medium text-black/50 transition hover:border-black/30 hover:text-black/70"
        >
          + Add question
        </button>
      </section>

      <div className="sticky bottom-6 flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm text-black/50">
          <input
            readOnly
            value={sharePath}
            className="w-56 rounded-lg border border-black/10 px-2 py-1.5 text-xs sm:w-72"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!dirty && savedAt && (
            <span className="text-xs text-black/40">Saved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || !title.trim()}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
