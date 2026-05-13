/**
 * Deterministic academic insights, achievements, and grading-scale helpers.
 * Pure functions — no side effects, no AI, no randomness. Safe to memoize.
 */

export type SemStat = {
  id: string;
  semester_number: number;
  semester_name: string;
  sgpa: number;
  credits: number;
  subjectCount: number;
};

export type SubjectStat = {
  id: string;
  semester_id: string;
  credits: number;
  grade: number;
};

// ──────────────────────────── Insights ────────────────────────────

export type Insight = { tone: "positive" | "neutral" | "warning"; text: string };

export function generateInsights(semesters: SemStat[], cgpa: number): Insight[] {
  const out: Insight[] = [];
  if (semesters.length === 0) return out;

  // Trend: last 3 SGPAs strictly increasing
  const last3 = semesters.slice(-3);
  if (last3.length === 3 && last3[0].sgpa < last3[1].sgpa && last3[1].sgpa < last3[2].sgpa) {
    out.push({ tone: "positive", text: "Your SGPA has improved for 3 consecutive semesters — clear upward trend." });
  } else if (last3.length === 3 && last3[0].sgpa > last3[1].sgpa && last3[1].sgpa > last3[2].sgpa) {
    out.push({ tone: "warning", text: "Your SGPA has dropped for 3 consecutive semesters. Consider lighter loads or extra revision." });
  }

  // Best & worst
  const sorted = [...semesters].sort((a, b) => b.sgpa - a.sgpa);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best && worst && best.id !== worst.id && best.sgpa - worst.sgpa >= 0.5) {
    out.push({
      tone: "neutral",
      text: `Strongest semester: ${best.semester_name} (${best.sgpa.toFixed(2)}). Weakest: ${worst.semester_name} (${worst.sgpa.toFixed(2)}).`,
    });
  }

  // Credit load correlation
  const heavy = semesters.filter((s) => s.credits >= 22);
  const light = semesters.filter((s) => s.credits > 0 && s.credits < 18);
  if (heavy.length >= 2 && light.length >= 2) {
    const avgHeavy = heavy.reduce((a, s) => a + s.sgpa, 0) / heavy.length;
    const avgLight = light.reduce((a, s) => a + s.sgpa, 0) / light.length;
    if (avgLight - avgHeavy >= 0.4) {
      out.push({ tone: "neutral", text: "You perform noticeably better in lighter-credit semesters — pace your hard courses." });
    } else if (avgHeavy - avgLight >= 0.4) {
      out.push({ tone: "positive", text: "You handle heavy semesters well — credit load isn't holding you back." });
    }
  }

  // CGPA bands
  if (cgpa >= 9) out.push({ tone: "positive", text: "CGPA ≥ 9.0 — top-tier territory. Keep this consistency for a stellar transcript." });
  else if (cgpa >= 8) out.push({ tone: "positive", text: "Solid CGPA. Push 1–2 high-credit subjects next term to break into the 9+ range." });
  else if (cgpa >= 7) out.push({ tone: "neutral", text: "On track. A 9+ in a high-credit course can lift your CGPA by ~0.1–0.2." });
  else if (cgpa > 0) out.push({ tone: "warning", text: "Focus on attendance and consistent revision — small wins compound fast." });

  return out.slice(0, 4);
}

// ──────────────────────────── Achievements ────────────────────────────

export type Achievement = { id: string; label: string; earned: boolean; hint?: string };

export function computeAchievements(args: {
  semesters: SemStat[];
  cgpa: number;
  totalCredits: number;
}): Achievement[] {
  const { semesters, cgpa, totalCredits } = args;
  const sgpas = semesters.map((s) => s.sgpa);
  const maxSGPA = sgpas.length ? Math.max(...sgpas) : 0;

  // Improvement streak: consecutive sems where SGPA strictly increased
  let streak = 0, best = 0;
  for (let i = 1; i < semesters.length; i++) {
    if (semesters[i].sgpa > semesters[i - 1].sgpa) { streak++; best = Math.max(best, streak); }
    else streak = 0;
  }
  // Excellence streak from latest
  let excStreak = 0;
  for (let i = semesters.length - 1; i >= 0; i--) {
    if (semesters[i].sgpa >= 8) excStreak++; else break;
  }

  return [
    { id: "first_sem", label: "First Semester", earned: semesters.length >= 1 },
    { id: "perfect_sgpa", label: "Perfect SGPA", earned: maxSGPA >= 9.95, hint: "Score 10.0 in any semester" },
    { id: "distinction", label: "Distinction", earned: cgpa >= 8, hint: "CGPA ≥ 8.0" },
    { id: "excellence", label: "Excellence", earned: cgpa >= 9, hint: "CGPA ≥ 9.0" },
    { id: "improving", label: "On the Rise", earned: best >= 2, hint: "2+ semesters of improvement" },
    { id: "streak3", label: "3+ Streak", earned: excStreak >= 3, hint: "3 consecutive sems with SGPA ≥ 8" },
    { id: "credits100", label: "100+ Credits", earned: totalCredits >= 100 },
    { id: "credits200", label: "200+ Credits", earned: totalCredits >= 200 },
  ];
}

// ──────────────────────────── CPI Goal Simulator ────────────────────────────

export type CpiSimResult =
  | { kind: "ok"; requiredSGPA: number }
  | { kind: "already"; message: string }
  | { kind: "impossible"; maxReachableCPI: number }
  | { kind: "invalid"; message: string };

/**
 * Solve for the SGPA required next semester to reach `targetCPI`,
 * given current `currentCPI` over `currentCredits`, taking `nextCredits` more.
 *
 *   newCPI = (currentCPI * currentCredits + nextSGPA * nextCredits) / (currentCredits + nextCredits)
 *   nextSGPA = (target * (cur + next) - currentCPI * cur) / next
 */
export function simulateCpiGoal(args: {
  currentCPI: number;
  currentCredits: number;
  targetCPI: number;
  nextCredits: number;
  scaleMax?: number;
}): CpiSimResult {
  const scaleMax = args.scaleMax ?? 10;
  const { currentCPI, currentCredits, targetCPI, nextCredits } = args;

  if (![currentCPI, currentCredits, targetCPI, nextCredits].every(Number.isFinite)) {
    return { kind: "invalid", message: "Please fill in all fields with valid numbers." };
  }
  if (currentCredits < 0 || nextCredits <= 0) {
    return { kind: "invalid", message: "Credits must be positive (next-semester credits > 0)." };
  }
  if (targetCPI < 0 || targetCPI > scaleMax || currentCPI < 0 || currentCPI > scaleMax) {
    return { kind: "invalid", message: `CPI values must be between 0 and ${scaleMax}.` };
  }

  if (targetCPI <= currentCPI && currentCredits > 0) {
    return { kind: "already", message: "You've already reached or exceeded this target." };
  }

  const required = (targetCPI * (currentCredits + nextCredits) - currentCPI * currentCredits) / nextCredits;
  if (required > scaleMax) {
    const maxReachable = (currentCPI * currentCredits + scaleMax * nextCredits) / (currentCredits + nextCredits);
    return { kind: "impossible", maxReachableCPI: maxReachable };
  }
  return { kind: "ok", requiredSGPA: Math.max(0, required) };
}

// ──────────────────────────── Custom grading scales ────────────────────────────

export type GradingScale = { id: string; label: string; max: number; bands: Array<{ min: number; letter: string }> };

export const GRADING_SCALES: GradingScale[] = [
  {
    id: "iitk", label: "IITK (10-point)", max: 10,
    bands: [
      { min: 9, letter: "A*" }, { min: 8, letter: "A" }, { min: 7, letter: "B" },
      { min: 6, letter: "C" }, { min: 5, letter: "D" }, { min: 4, letter: "E" }, { min: 0, letter: "F" },
    ],
  },
  {
    id: "iitb", label: "IITB (10-point)", max: 10,
    bands: [
      { min: 9, letter: "AA" }, { min: 8, letter: "AB" }, { min: 7, letter: "BB" },
      { min: 6, letter: "BC" }, { min: 5, letter: "CC" }, { min: 4, letter: "CD" }, { min: 0, letter: "FF" },
    ],
  },
  {
    id: "iitd", label: "IITD (10-point)", max: 10,
    bands: [
      { min: 10, letter: "A" }, { min: 9, letter: "A-" }, { min: 8, letter: "B" },
      { min: 7, letter: "B-" }, { min: 6, letter: "C" }, { min: 5, letter: "C-" }, { min: 4, letter: "D" }, { min: 0, letter: "F" },
    ],
  },
  {
    id: "numeric", label: "Numeric (0–10)", max: 10,
    bands: [{ min: 0, letter: "" }],
  },
];

export function letterFor(scaleId: string, grade: number): string {
  const scale = GRADING_SCALES.find((s) => s.id === scaleId) ?? GRADING_SCALES[0];
  const band = scale.bands.find((b) => grade >= b.min);
  return band?.letter ?? "";
}
