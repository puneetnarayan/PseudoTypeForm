import { NextResponse } from "next/server";
import { createForm, listForms } from "@/lib/db";

export async function GET() {
  const forms = await listForms();
  return NextResponse.json(forms);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const form = await createForm({
    title,
    description: typeof body.description === "string" ? body.description : undefined,
  });
  return NextResponse.json(form, { status: 201 });
}
