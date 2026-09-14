"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Form } from "@/lib/types";

export default function FormCard({ form }: { form: Form }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${form.title}"? This also deletes its responses.`)) return;
    setDeleting(true);
    await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-40 flex-col justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: form.themeColor }}
          />
          <h3 className="truncate font-semibold text-black/90">{form.title}</h3>
        </div>
        <p className="line-clamp-2 text-sm text-black/50">
          {form.description || "No description"}
        </p>
        <p className="text-xs text-black/35">
          {form.questions.length} question{form.questions.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/builder/${form.id}`} className="font-medium text-black/70 hover:text-black">
          Edit
        </Link>
        <Link href={`/f/${form.id}`} target="_blank" className="font-medium text-black/70 hover:text-black">
          Preview
        </Link>
        <Link
          href={`/builder/${form.id}/responses`}
          className="font-medium text-black/70 hover:text-black"
        >
          Responses
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto font-medium text-red-500/80 hover:text-red-600 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
