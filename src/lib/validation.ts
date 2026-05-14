import { z } from "zod";

export function normalizeCourseCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.replace(/[\s_-]+/g, " ").trim().toUpperCase();
  return v.length ? v : null;
}

export function sanitizeText(input: string): string {
  // Strip control characters, trim. We render via React (auto-escapes), so no HTML needed.
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export const semesterSchema = z.object({
  semester_number: z
    .number({ invalid_type_error: "Number is required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(20, "Must be 20 or less"),
  semester_name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(1, "Name is required").max(80, "Max 80 characters")),
});

export const subjectSchema = z.object({
  subject_name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(1, "Subject name is required").max(120, "Max 120 characters")),
  course_code: z
    .string()
    .optional()
    .nullable()
    .transform((v) => normalizeCourseCode(v ?? null))
    .pipe(
      z
        .string()
        .max(20, "Max 20 characters")
        .regex(/^[A-Z0-9 .\-]+$/, "Letters, numbers, spaces, dot or dash only")
        .nullable(),
    ),
  credits: z
    .number({ invalid_type_error: "Credits must be a number" })
    .finite("Credits must be a number")
    .min(0.5, "Min 0.5")
    .max(30, "Max 30"),
  grade: z
    .number({ invalid_type_error: "Grade must be a number" })
    .finite("Grade must be a number")
    .min(0, "Min 0")
    .max(10, "Max 10"),
});

export const profileSchema = z.object({
  full_name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(1, "Name cannot be empty").max(100, "Max 100 characters")),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
export type SemesterInput = z.infer<typeof semesterSchema>;

/** Maps Postgres / PostgREST errors to friendly user-facing messages. */
export function friendlyDbError(err: { code?: string; message?: string } | null | undefined): string {
  if (!err) return "Something went wrong";
  if (err.code === "23505") return "This course code already exists in this semester.";
  if (err.code === "23514") return "One of the values is out of the allowed range.";
  if (err.code === "PGRST301" || err.code === "42501") return "You don't have permission to do that.";
  if (err.code === "23503") return "This item is referenced by other data and cannot be removed.";
  if (err.code === "PGRST116") return "The requested item was not found.";
  // Generic fallback — never leak raw DB/PostgREST messages to users.
  return "Something went wrong. Please try again.";
}
