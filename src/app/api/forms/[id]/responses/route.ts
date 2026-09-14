import { NextResponse } from "next/server";
import { addResponse, getForm, listResponses } from "@/lib/db";
import type { AnswerValue } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const responses = await listResponses(id);
  return NextResponse.json(responses);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const rawAnswers = body.answers;
  if (!rawAnswers || typeof rawAnswers !== "object") {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  const answers: Record<string, AnswerValue> = {};
  for (const question of form.questions) {
    const value = (rawAnswers as Record<string, unknown>)[question.id];
    if (question.required && (value === undefined || value === null || value === "")) {
      return NextResponse.json(
        { error: `"${question.title}" is required` },
        { status: 400 },
      );
    }
    if (value === undefined) {
      answers[question.id] = null;
    } else if (typeof value === "string" || typeof value === "number" || value === null) {
      answers[question.id] = value;
    } else {
      return NextResponse.json({ error: "Invalid answer value" }, { status: 400 });
    }
  }

  const response = await addResponse(id, answers);
  return NextResponse.json(response, { status: 201 });
}
