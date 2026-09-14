import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { AnswerValue, Form, Question, Response } from "./types";

// Vercel (and most serverless hosts) ship a read-only filesystem except for
// os.tmpdir(); process.cwd() is only writable in local development.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "pseudotypeform-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

interface Database {
  forms: Form[];
  responses: Response[];
}

function now(): string {
  return new Date().toISOString();
}

function seedDatabase(): Database {
  const formId = crypto.randomUUID();
  const questions: Question[] = [
    {
      id: crypto.randomUUID(),
      type: "short_text",
      title: "What's your name?",
      required: true,
    },
    {
      id: crypto.randomUUID(),
      type: "email",
      title: "What's the best email to reach you at?",
      required: true,
    },
    {
      id: crypto.randomUUID(),
      type: "multiple_choice",
      title: "How did you hear about us?",
      required: true,
      options: ["Search engine", "Social media", "Friend or colleague", "Other"],
    },
    {
      id: crypto.randomUUID(),
      type: "rating",
      title: "How likely are you to recommend us to a friend?",
      description: "1 is not likely, 5 is extremely likely.",
      required: true,
    },
    {
      id: crypto.randomUUID(),
      type: "long_text",
      title: "Anything else you'd like to share?",
      required: false,
    },
  ];

  const form: Form = {
    id: formId,
    title: "Customer Feedback",
    description: "Help us improve — this takes less than a minute.",
    themeColor: "#4C6FFF",
    questions,
    createdAt: now(),
    updatedAt: now(),
  };

  return { forms: [form], responses: [] };
}

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDb(): Promise<Database> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as Database;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const seeded = seedDatabase();
      await fs.writeFile(DB_PATH, JSON.stringify(seeded, null, 2));
      return seeded;
    }
    throw err;
  }
}

async function readDb(): Promise<Database> {
  return ensureDb();
}

async function writeDb(mutate: (db: Database) => void): Promise<Database> {
  const task = writeQueue.then(async () => {
    const db = await ensureDb();
    mutate(db);
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export async function listForms(): Promise<Form[]> {
  const db = await readDb();
  return [...db.forms].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getForm(id: string): Promise<Form | undefined> {
  const db = await readDb();
  return db.forms.find((f) => f.id === id);
}

export async function createForm(input: {
  title: string;
  description?: string;
  themeColor?: string;
}): Promise<Form> {
  const form: Form = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    themeColor: input.themeColor ?? "#4C6FFF",
    questions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  await writeDb((db) => {
    db.forms.push(form);
  });
  return form;
}

export async function updateForm(
  id: string,
  patch: Partial<Pick<Form, "title" | "description" | "themeColor" | "questions">>,
): Promise<Form | undefined> {
  const db = await writeDb((db) => {
    const form = db.forms.find((f) => f.id === id);
    if (!form) return;
    Object.assign(form, patch, { updatedAt: now() });
  });
  return db.forms.find((f) => f.id === id);
}

export async function deleteForm(id: string): Promise<void> {
  await writeDb((db) => {
    db.forms = db.forms.filter((f) => f.id !== id);
    db.responses = db.responses.filter((r) => r.formId !== id);
  });
}

export async function listResponses(formId: string): Promise<Response[]> {
  const db = await readDb();
  return db.responses
    .filter((r) => r.formId === formId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function addResponse(
  formId: string,
  answers: Record<string, AnswerValue>,
): Promise<Response> {
  const response: Response = {
    id: crypto.randomUUID(),
    formId,
    answers,
    submittedAt: now(),
  };
  await writeDb((db) => {
    db.responses.push(response);
  });
  return response;
}
