export type Subject = {
  id: string;
  subject_name: string;
  course_code: string | null;
  credits: number;
  grade: number; // 0-10
};

export type Semester = {
  id: string;
  semester_number: number;
  semester_name: string;
  created_at: string;
};

export function calcSGPA(subjects: Pick<Subject, "credits" | "grade">[]): number {
  const totalCredits = subjects.reduce((s, x) => s + Number(x.credits || 0), 0);
  if (totalCredits === 0) return 0;
  const weighted = subjects.reduce(
    (s, x) => s + Number(x.credits || 0) * Number(x.grade || 0),
    0,
  );
  return weighted / totalCredits;
}

export function calcTotalCredits(subjects: Pick<Subject, "credits">[]): number {
  return subjects.reduce((s, x) => s + Number(x.credits || 0), 0);
}

export function calcCGPA(
  semesterStats: { sgpa: number; credits: number }[],
): number {
  const totalCredits = semesterStats.reduce((s, x) => s + x.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = semesterStats.reduce((s, x) => s + x.sgpa * x.credits, 0);
  return weighted / totalCredits;
}

export function gradeLetter(grade: number): string {
  if (grade >= 9) return "A+";
  if (grade >= 8) return "A";
  if (grade >= 7) return "B";
  if (grade >= 6) return "C";
  if (grade >= 5) return "D";
  if (grade > 0) return "E";
  return "—";
}

export function gradeColor(grade: number): string {
  if (grade >= 9) return "text-success";
  if (grade >= 7) return "text-primary";
  if (grade >= 5) return "text-warning";
  if (grade > 0) return "text-destructive";
  return "text-muted-foreground";
}

export function fmt(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "0.00";
}
