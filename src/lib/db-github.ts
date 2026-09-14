import type { AnswerValue, Form, Response } from "./types";
import { type Database, now, seedDatabase } from "./seed";

// Alias for the fetch Response type, since `Response` above is our own domain type.
type FetchResponse = globalThis.Response;

const API_ROOT = "https://api.github.com";
const MAX_WRITE_ATTEMPTS = 3;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function config() {
  return {
    token: requiredEnv("GITHUB_DATA_TOKEN"),
    owner: process.env.GITHUB_DATA_OWNER || "puneetnarayan",
    repo: process.env.GITHUB_DATA_REPO || "PseudoTypeForm",
    // A dedicated branch keeps data commits out of the branch Vercel builds
    // from, so a form submission never triggers a redeploy.
    branch: process.env.GITHUB_DATA_BRANCH || "data",
    path: process.env.GITHUB_DATA_PATH || "db.json",
  };
}

export function isGithubDataConfigured(): boolean {
  return Boolean(process.env.GITHUB_DATA_TOKEN);
}

async function gh(path: string, init?: RequestInit): Promise<FetchResponse> {
  const { token } = config();
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function throwForStatus(res: FetchResponse, action: string): Promise<never> {
  const body = await res.text();
  throw new Error(`GitHub ${action} failed: ${res.status} ${body}`);
}

async function fetchFile(): Promise<{ db: Database; sha: string } | null> {
  const { owner, repo, path, branch } = config();
  const res = await gh(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
  if (res.status === 404) return null;
  if (!res.ok) return throwForStatus(res, "read");
  const json = (await res.json()) as { content: string; sha: string };
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { db: JSON.parse(content) as Database, sha: json.sha };
}

/**
 * Creates the data file on the (already-existing) data branch, via a plain
 * Contents API write (no `sha` -> creates rather than updates). Deliberately
 * avoids the Git Data API (blobs/trees/commits/refs): fine-grained personal
 * access tokens can't call those endpoints ("Resource not accessible by
 * personal access token"), only the Contents API. This also means it can't
 * create the branch itself — that has to already exist.
 */
async function createInitialFile(db: Database): Promise<void> {
  const { owner, repo, path, branch } = config();
  const content = Buffer.from(JSON.stringify(db, null, 2), "utf-8").toString("base64");

  const res = await gh(`/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message: "data: initialize data store", content, branch }),
  });
  if (res.ok || res.status === 422) return; // 422 here = someone else just created it too; fine.
  if (res.status === 404) {
    throw new Error(
      `GitHub data branch "${branch}" doesn't exist in ${owner}/${repo}. Create it first ` +
        `(the Contents API can create a file on an existing branch, but not the branch itself).`,
    );
  }
  return throwForStatus(res, "initial file creation");
}

async function readDb(): Promise<Database> {
  const existing = await fetchFile();
  if (existing) return existing.db;
  await createInitialFile(seedDatabase());
  const created = await fetchFile();
  if (!created) throw new Error("Failed to initialize GitHub-backed data store");
  return created.db;
}

async function writeDb(message: string, mutate: (db: Database) => void): Promise<Database> {
  const { owner, repo, path, branch } = config();

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    let existing = await fetchFile();
    if (!existing) {
      await createInitialFile(seedDatabase());
      existing = await fetchFile();
      if (!existing) throw new Error("Failed to initialize GitHub-backed data store");
    }

    const db = existing.db;
    mutate(db);
    const content = Buffer.from(JSON.stringify(db, null, 2), "utf-8").toString("base64");

    const res = await gh(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({ message, content, sha: existing.sha, branch }),
    });
    if (res.ok) return db;
    // 409/422 here means someone else committed since our read (stale sha) — retry with a fresh one.
    if (res.status === 409 || res.status === 422) continue;
    return throwForStatus(res, "write");
  }
  throw new Error("GitHub write failed after retries due to concurrent writes");
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
  await writeDb(`data: create form "${form.title}"`, (db) => {
    db.forms.push(form);
  });
  return form;
}

export async function updateForm(
  id: string,
  patch: Partial<Pick<Form, "title" | "description" | "themeColor" | "questions">>,
): Promise<Form | undefined> {
  const db = await writeDb(`data: update form ${id}`, (db) => {
    const form = db.forms.find((f) => f.id === id);
    if (!form) return;
    Object.assign(form, patch, { updatedAt: now() });
  });
  return db.forms.find((f) => f.id === id);
}

export async function deleteForm(id: string): Promise<void> {
  await writeDb(`data: delete form ${id}`, (db) => {
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
  // One commit per full form submission — nothing is committed per-question.
  await writeDb(`data: submit response to form ${formId}`, (db) => {
    db.responses.push(response);
  });
  return response;
}
