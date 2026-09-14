import { NextResponse } from "next/server";
import { deleteForm, getForm, updateForm } from "@/lib/db";
import type { Question, QuestionType } from "@/lib/types";

const VALID_TYPES: QuestionType[] = [
  "short_text",
  "long_text",
  "email",
  "number",
  "multiple_choice",
  "yes_no",
  "rating",
];

function sanitizeQuestions(input: unknown): Question[] | null {
  if (!Array.isArray(input)) return null;
  const questions: Question[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const q = raw as Record<string, unknown>;
    if (typeof q.type !== "string" || !VALID_TYPES.includes(q.type as QuestionType)) {
      return null;
    }
    if (typeof q.title !== "string") return null;
    questions.push({
      id: typeof q.id === "string" && q.id ? q.id : crypto.randomUUID(),
      type: q.type as QuestionType,
      title: q.title,
      description: typeof q.description === "string" ? q.description : undefined,
      required: Boolean(q.required),
      options:
        q.type === "multiple_choice" && Array.isArray(q.options)
          ? q.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0)
          : undefined,
    });
  }
  return questions;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await getForm(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const patch: Parameters<typeof updateForm>[1] = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title must be a non-empty string" }, { status: 400 });
    }
    patch.title = body.title.trim();
  }
  if (body.description !== undefined) {
    patch.description = typeof body.description === "string" ? body.description : undefined;
  }
  if (body.themeColor !== undefined) {
    patch.themeColor = typeof body.themeColor === "string" ? body.themeColor : existing.themeColor;
  }
  if (body.questions !== undefined) {
    const sanitized = sanitizeQuestions(body.questions);
    if (!sanitized) {
      return NextResponse.json({ error: "Invalid questions payload" }, { status: 400 });
    }
    patch.questions = sanitized;
  }

  const form = await updateForm(id, patch);
  return NextResponse.json(form);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteForm(id);
  return NextResponse.json({ ok: true });
}
