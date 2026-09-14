import { promises as fs } from "fs";
import path from "path";
import type { AnswerValue, Form, Response } from "./types";
import { type Database, now, seedDatabase } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

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
