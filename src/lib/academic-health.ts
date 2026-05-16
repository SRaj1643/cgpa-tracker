/**
 * Deterministic academic health + greeting helpers.
 * Pure functions only. No randomness at call time — seeded by date/user
 * so a user sees the same message all day, but a fresh one tomorrow.
 */

import type { SemStat } from "./insights";

// ──────────────────────────── Greeting ────────────────────────────

export function timeGreeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const LINES = [
  "Small wins, stacked daily, beat heroic all-nighters.",
  "Consistency is the quiet superpower of high CGPAs.",
  "Every semester is a new draft — refine, don't restart.",
  "Hard semesters build the transcript stories you'll tell later.",
  "Track it, see it, change it. That's the whole loop.",
  "Your future self is reading your current grades. Make it proud.",
  "Knowledge compounds. So does showing up.",
  "Strong note-taking today, stronger answers tomorrow.",
  "Pace > panic. Always.",
  "Discipline is choosing what you want most over what you want now.",
  "One focused hour beats four distracted ones.",
  "Aim for clarity in concepts, not just marks on paper.",
  "Tiny daily progress is still progress — and it's the only kind that lasts.",
  "Master the basics; the advanced stuff gets easier.",
];

/** Deterministic per-day-per-user motivational line. */
export function dailyLine(userId: string | undefined, d: Date = new Date()): string {
  const seed = `${userId ?? "anon"}:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return LINES[Math.abs(h) % LINES.length];
}

// ──────────────────────────── Academic Health ────────────────────────────

export type HealthStatus =
  | "stable_growth"
  | "strong_consistency"
  | "recovery_phase"
  | "improving"
  | "high_credit_stress"
  | "getting_started";

export type HealthResult = {
  status: HealthStatus;
  label: string;
  message: string;
  tone: "positive" | "warning" | "neutral";
};

const HEALTH_LABELS: Record<HealthStatus, { label: string; tone: HealthResult["tone"] }> = {
  stable_growth: { label: "Stable Growth", tone: "positive" },
  strong_consistency: { label: "Strong Consistency", tone: "positive" },
  recovery_phase: { label: "Recovery Phase", tone: "warning" },
  improving: { label: "Improving Performance", tone: "positive" },
  high_credit_stress: { label: "High Credit Stress", tone: "warning" },
  getting_started: { label: "Getting Started", tone: "neutral" },
};

/**
 * Pure rule-based health classification. No randomness.
 * Priority order matters — first matching rule wins.
 */
export function academicHealth(semesters: SemStat[]): HealthResult {
  if (semesters.length === 0) {
    return {
      status: "getting_started",
      ...HEALTH_LABELS.getting_started,
      message: "Add your first semester to unlock insights.",
    };
  }

  const sgpas = semesters.map((s) => s.sgpa);
  const latest = sgpas[sgpas.length - 1];
  const prev = sgpas.length >= 2 ? sgpas[sgpas.length - 2] : null;
  const avg = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
  const last = semesters[semesters.length - 1];

  // High credit stress: heavy load + drop
  if (last.credits >= 24 && prev !== null && latest < prev - 0.3) {
    return {
      status: "high_credit_stress",
      ...HEALTH_LABELS.high_credit_stress,
      message: `Heavy semester (${last.credits} credits). A small dip is normal — protect your sleep.`,
    };
  }

  // Recovery: latest is rebounding after a clear low
  const min = Math.min(...sgpas);
  if (sgpas.length >= 3 && latest > min + 0.4 && min < avg) {
    return {
      status: "recovery_phase",
      ...HEALTH_LABELS.recovery_phase,
      message: `You bounced back ${(latest - min).toFixed(1)} points from your low. Keep the rhythm.`,
    };
  }

  // Strong consistency: all sems within ±0.3 and avg ≥ 8
  const spread = Math.max(...sgpas) - Math.min(...sgpas);
  if (sgpas.length >= 3 && spread <= 0.4 && avg >= 8) {
    return {
      status: "strong_consistency",
      ...HEALTH_LABELS.strong_consistency,
      message: `Rock-steady SGPA around ${avg.toFixed(2)}. That's hard to do — respect.`,
    };
  }

  // Improving: latest > prev > one before (or just clear upward 2-step)
  if (sgpas.length >= 2 && prev !== null && latest > prev + 0.2) {
    return {
      status: "improving",
      ...HEALTH_LABELS.improving,
      message: `SGPA up ${(latest - prev).toFixed(2)} from last semester. Momentum is yours.`,
    };
  }

  // Default: stable growth
  return {
    status: "stable_growth",
    ...HEALTH_LABELS.stable_growth,
    message: `Steady at ${avg.toFixed(2)} average. Consider a stretch goal next term.`,
  };
}

// ──────────────────────────── Goal progress ────────────────────────────

/**
 * % progress from 0 → targetCPI. Clamped 0–100.
 * If target is below current CPI, returns 100.
 */
export function goalProgress(currentCPI: number, targetCPI: number): number {
  if (!Number.isFinite(currentCPI) || !Number.isFinite(targetCPI) || targetCPI <= 0) return 0;
  if (currentCPI >= targetCPI) return 100;
  return Math.max(0, Math.min(100, (currentCPI / targetCPI) * 100));
}
