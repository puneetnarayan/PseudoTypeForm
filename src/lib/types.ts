export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "multiple_choice"
  | "yes_no"
  | "rating";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  /** Used by "multiple_choice" questions. */
  options?: string[];
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  themeColor: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type AnswerValue = string | number | null;

export interface Response {
  id: string;
  formId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  number: "Number",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
  rating: "Rating (1-5)",
};
