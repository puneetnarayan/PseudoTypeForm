import type { Form, Question, Response } from "./types";

export interface Database {
  forms: Form[];
  responses: Response[];
}

export function now(): string {
  return new Date().toISOString();
}

export function seedDatabase(): Database {
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
