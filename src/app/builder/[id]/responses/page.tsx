import Link from "next/link";
import { notFound } from "next/navigation";
import { getForm, listResponses } from "@/lib/db";
import type { AnswerValue, Question, Response as FormResponse } from "@/lib/types";

function summarizeChoice(question: Question, responses: FormResponse[]) {
  const options = question.type === "yes_no" ? ["Yes", "No"] : question.options ?? [];
  const counts = new Map<string, number>(options.map((o) => [o, 0]));
  let answered = 0;
  for (const r of responses) {
    const value = r.answers[question.id];
    if (value === null || value === undefined || value === "") continue;
    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    answered += 1;
  }
  return { counts, answered };
}

function summarizeRating(question: Question, responses: FormResponse[]) {
  const counts = new Map<number, number>([1, 2, 3, 4, 5].map((n) => [n, 0]));
  let sum = 0;
  let answered = 0;
  for (const r of responses) {
    const value = r.answers[question.id];
    if (typeof value !== "number") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
    sum += value;
    answered += 1;
  }
  return { counts, answered, average: answered ? sum / answered : 0 };
}

function formatValue(value: AnswerValue): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();
  const responses = await listResponses(id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href={`/builder/${id}`} className="text-sm font-medium text-black/50 hover:text-black">
          ← Back to editor
        </Link>
        <Link href={`/f/${id}`} target="_blank" className="text-sm font-medium text-black/50 hover:text-black">
          Preview ↗
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-black/50">
          {responses.length} response{responses.length === 1 ? "" : "s"}
        </p>
      </header>

      {responses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-black/40">
          No responses yet. Share the form link to start collecting answers.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            {form.questions.map((question) => (
              <div key={question.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-medium">{question.title}</h3>
                {question.type === "multiple_choice" || question.type === "yes_no" ? (
                  <ChoiceSummary question={question} responses={responses} themeColor={form.themeColor} />
                ) : question.type === "rating" ? (
                  <RatingSummary question={question} responses={responses} themeColor={form.themeColor} />
                ) : (
                  <TextSummary question={question} responses={responses} />
                )}
              </div>
            ))}
          </section>

          <section className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-black/40">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Submitted</th>
                  {form.questions.map((q) => (
                    <th key={q.id} className="whitespace-nowrap px-4 py-3 font-medium">
                      {q.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-black/40">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    {form.questions.map((q) => (
                      <td key={q.id} className="whitespace-nowrap px-4 py-3">
                        {formatValue(r.answers[q.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function ChoiceSummary({
  question,
  responses,
  themeColor,
}: {
  question: Question;
  responses: FormResponse[];
  themeColor: string;
}) {
  const { counts, answered } = summarizeChoice(question, responses);
  return (
    <div className="flex flex-col gap-2">
      {[...counts.entries()].map(([label, count]) => {
        const pct = answered ? Math.round((count / answered) * 100) : 0;
        return (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 truncate text-black/70">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: themeColor }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-black/40">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RatingSummary({
  question,
  responses,
  themeColor,
}: {
  question: Question;
  responses: FormResponse[];
  themeColor: string;
}) {
  const { counts, answered, average } = summarizeRating(question, responses);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-black/50">
        Average: <span className="font-semibold text-black/80">{average.toFixed(1)}</span> / 5
      </p>
      {[...counts.entries()].map(([rating, count]) => {
        const pct = answered ? Math.round((count / answered) * 100) : 0;
        return (
          <div key={rating} className="flex items-center gap-3 text-sm">
            <span className="w-6 shrink-0 text-black/70">{rating}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: themeColor }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-black/40">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function TextSummary({ question, responses }: { question: Question; responses: FormResponse[] }) {
  const values = responses
    .map((r) => r.answers[question.id])
    .filter((v): v is string | number => v !== null && v !== undefined && v !== "");
  if (values.length === 0) {
    return <p className="text-sm text-black/40">No answers yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5 text-sm text-black/70">
      {values.slice(0, 8).map((v, i) => (
        <li key={i} className="truncate rounded-lg bg-black/[0.03] px-3 py-1.5">
          {v}
        </li>
      ))}
      {values.length > 8 && (
        <li className="text-xs text-black/35">+{values.length - 8} more</li>
      )}
    </ul>
  );
}
