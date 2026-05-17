/**
 * Per-semester "Wrapped" recap calculations. Pure functions.
 */
import type { SemStat, SubjectStat } from "./insights";

export type WrappedSubject = SubjectStat & {
  subject_name: string;
  course_code: string | null;
};

export type WrappedRecap = {
  semester: SemStat;
  best: WrappedSubject | null;
  toughest: WrappedSubject | null;
  sgpaDelta: number | null;        // vs previous semester
  cgpaDelta: number | null;        // contribution to cgpa vs running cgpa before this sem
  topPercentile: number;           // 0-100 — how this sem ranks among user's sems
  isPersonalBest: boolean;
  improvementStreakBefore: number; // # of consecutive improving sems ending here
};

export function buildWrapped(args: {
  semesters: SemStat[];
  subjectsBySem: Record<string, WrappedSubject[]>;
  semesterId: string;
}): WrappedRecap | null {
  const { semesters, subjectsBySem, semesterId } = args;
  const idx = semesters.findIndex((s) => s.id === semesterId);
  if (idx === -1) return null;

  const sem = semesters[idx];
  const subs = subjectsBySem[semesterId] ?? [];

  const graded = subs.filter((s) => s.grade > 0);
  const best = graded.length
    ? graded.reduce((a, b) => (b.grade > a.grade ? b : a))
    : null;
  const toughest = graded.length
    ? graded.reduce((a, b) => (b.grade < a.grade ? b : a))
    : null;

  const prev = idx > 0 ? semesters[idx - 1] : null;
  const sgpaDelta = prev ? sem.sgpa - prev.sgpa : null;

  // CGPA before vs after including this sem
  const before = semesters.slice(0, idx);
  const beforeCreds = before.reduce((a, s) => a + s.credits, 0);
  const beforeWeighted = before.reduce((a, s) => a + s.sgpa * s.credits, 0);
  const cgpaBefore = beforeCreds > 0 ? beforeWeighted / beforeCreds : sem.sgpa;
  const cgpaAfter =
    (beforeWeighted + sem.sgpa * sem.credits) / (beforeCreds + sem.credits || 1);
  const cgpaDelta = beforeCreds > 0 ? cgpaAfter - cgpaBefore : null;

  // Percentile rank among all sems (1 = best)
  const sorted = [...semesters].sort((a, b) => b.sgpa - a.sgpa);
  const rank = sorted.findIndex((s) => s.id === semesterId) + 1;
  const topPercentile = Math.round((1 - (rank - 1) / Math.max(1, semesters.length)) * 100);
  const isPersonalBest = rank === 1 && semesters.length > 1;

  // Improvement streak ending at this sem
  let streak = 0;
  for (let i = idx; i > 0; i--) {
    if (semesters[i].sgpa > semesters[i - 1].sgpa) streak++;
    else break;
  }

  return {
    semester: sem,
    best,
    toughest,
    sgpaDelta,
    cgpaDelta,
    topPercentile,
    isPersonalBest,
    improvementStreakBefore: streak,
  };
}

// ─── Probability-of-hitting-target ───
// Deterministic heuristic based on historical SGPA spread.
// Returns a band label + ~probability for messaging.
export function reachProbability(args: {
  requiredSGPA: number;
  sgpas: number[];
}): { label: string; pct: number; tone: "positive" | "warning" | "neutral" } {
  const { requiredSGPA, sgpas } = args;
  if (sgpas.length === 0) {
    return { label: "Unknown — add data", pct: 50, tone: "neutral" };
  }
  const mean = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
  const variance =
    sgpas.reduce((a, b) => a + (b - mean) ** 2, 0) / sgpas.length;
  const sd = Math.max(0.25, Math.sqrt(variance)); // floor to avoid overconfidence

  const z = (requiredSGPA - mean) / sd;
  // crude normal CDF approximation (Abramowitz 26.2.17) for P(X >= required)
  const p = 1 - normCdf(z);
  const pct = Math.round(p * 100);

  if (pct >= 75) return { label: "Very likely", pct, tone: "positive" };
  if (pct >= 50) return { label: "Achievable", pct, tone: "positive" };
  if (pct >= 25) return { label: "Stretch goal", pct, tone: "warning" };
  return { label: "Tough — push hard", pct, tone: "warning" };
}

function normCdf(z: number): number {
  // Abramowitz & Stegun approximation
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}
