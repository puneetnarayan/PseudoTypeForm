"use client";

import type { Question, QuestionType } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/types";

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

export default function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: Question;
  index: number;
  total: number;
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-black/50">
          {index + 1}
        </span>
        <div className="flex items-center gap-1 text-black/40">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded px-1.5 py-0.5 text-sm hover:bg-black/5 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded px-1.5 py-0.5 text-sm hover:bg-black/5 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 rounded px-2 py-0.5 text-sm text-red-500/80 hover:bg-red-50 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={question.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Question title"
          className="w-full border-b border-black/10 pb-2 text-lg font-medium outline-none focus:border-black/40"
        />
        <input
          value={question.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full text-sm text-black/50 outline-none"
        />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <select
            value={question.type}
            onChange={(e) => onChange({ type: e.target.value as QuestionType })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-black/60">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            Required
          </label>
        </div>

        {question.type === "multiple_choice" && (
          <OptionsEditor
            options={question.options ?? []}
            onChange={(options) => onChange({ options })}
          />
        )}
      </div>
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/[0.02] p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-black/40">
        Options
      </span>
      {options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={option}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-black/40"
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, j) => j !== i))}
            className="text-black/30 hover:text-red-500"
            aria-label="Remove option"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        className="self-start text-sm font-medium text-black/50 hover:text-black/80"
      >
        + Add option
      </button>
    </div>
  );
}
