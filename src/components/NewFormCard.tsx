"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewFormCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Could not create form");
      const form = await res.json();
      router.push(`/builder/${form.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 text-black/50 transition hover:border-black/30 hover:text-black/70"
      >
        <span className="text-3xl leading-none">+</span>
        <span className="text-sm font-medium">Create a new form</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="flex h-full min-h-40 flex-col justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-black/40">
          Form title
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Customer Feedback"
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[var(--brand,#4C6FFF)]"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-black/50 hover:text-black/80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
