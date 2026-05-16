# Evolution Plan — GradeFlow Academic Companion

This is a large brief (17 sections). To keep things stable, shippable, and reviewable, I'll deliver in 4 focused batches. Each batch is self-contained, production-safe, and verified before moving on. You approve, I ship the batch, we review, then next.

I'll **reuse** what already exists (autosave, drafts, simulator, insights, timeline, PDF export, achievements, theme system) and extend — not rebuild.

---

## Batch 1 — Mobile-first shell + Dashboard command center
The foundation everything else sits on. Highest user-visible impact.

- **Bottom navigation (mobile)**: floating glass tab bar — Dashboard, Semesters, Analytics, Simulator, Profile. Safe-area insets, active spring animation, hides on scroll-down.
- **Adaptive header**: compact sticky mobile header with contextual page title; desktop sidebar untouched.
- **Responsive audit pass**: kill horizontal overflow on all routes, tighten card padding on mobile, larger tap targets (min 44px), readable type scale.
- **Dashboard redesign (Command Center)**:
  - Time-aware greeting + dynamic motivational line (deterministic, seeded by day+user, no AI calls)
  - Hero CPI card with academic health status pill (Stable Growth / Recovery / Strong Consistency / High Credit Stress / Improving)
  - SGPA trend sparkline, recent semester summary, "next goal" card linking to CPI Goal
  - Skeletons + fade-in transitions
- **Page transitions**: subtle fade/slide between routes, respects `prefers-reduced-motion`.

## Batch 2 — Engagement loop: Goal Tracker + Semester Wrapped + Shareable Cards
The retention + virality batch.

- **Road to Target CPI** (upgrade existing simulator goal):
  - Persist target CPI per user (1 new column, no new tables needed beyond existing profile/settings)
  - Visual progress bar + % on-track + "one strong semester can…" copy
  - Probability indicator (deterministic, based on historical SGPA variance)
- **Semester Wrapped**: per-semester recap modal/route — best subject, toughest course, SGPA delta, credits, streaks, improvement highlight. Mobile story-card layout.
- **Shareable cards**: canvas-based image export (html-to-image, already lightweight) — CPI milestone, comeback, streak. Gradient themes, 1080×1350 IG-ready.
- **Achievement surface**: existing achievements get a dedicated profile section with unlock animations.

## Batch 3 — Insights depth + Health engine + Streaks
Make the app feel smart without backend AI cost.

- **Academic Health Engine**: pure client-side rules on existing data → status + 1-line explanation. Memoized.
- **Performance Insights v2**: extend `src/lib/insights.ts` with rules for credit-load correlation, consistency trend, recovery detection, subject-type patterns (if course_code prefix available).
- **Streaks**: consecutive semesters above threshold, improvement streaks. Stored derived, computed client-side, cached in React Query.
- **Weekly summary email opt-in toggle in settings** (UI only this batch — actual send wired in batch 4 if you want it).

## Batch 4 — Scalability + reliability hardening
Invisible but critical for "thousands of users".

- **DB indexes**: `subjects(user_id, semester_id)`, `semesters(user_id, semester_number)` composite indexes via migration.
- **Server-side aggregates**: a SQL view or RPC for CGPA/credits totals (one round-trip instead of fetching all subjects on dashboard).
- **Query tuning**: React Query `staleTime` per query class, prefetch on hover for semester detail, suspense boundaries.
- **Bundle**: lazy-load heavy routes (Simulator, Timeline, Wrapped), code-split recharts.
- **Reliability**: confirm error boundary covers every route, retry with backoff on transient failures, sentry-style local error capture already exists — extend.
- **A11y + reduced-motion final pass.**

---

## What I will NOT do (per your constraints)
- No realtime, no chat, no public feed, no multiplayer.
- No new AI API calls. All "intelligence" is deterministic rule-based.
- No schema churn beyond: 1 column for target CPI, 2 indexes, optional 1 view.
- No redesign of working flows (semesters CRUD, auth, settings stay as-is).

---

## Technical notes
- Stack stays: TanStack Start + React 19 + Tailwind v4 + shadcn + Supabase.
- New deps (small): `html-to-image` for share cards (~15kb gzipped). Everything else uses what's installed.
- All new computation is `useMemo`'d and runs on already-fetched data — zero extra DB reads for insights/health/streaks/wrapped.
- Mobile bottom nav only renders `<lg` breakpoint; desktop sidebar unchanged.

---

**Approve to start Batch 1**, or tell me to reorder / drop / merge batches. I'd recommend shipping in this order because each batch unlocks the next emotionally (shell → dashboard → engagement → smarts → scale).
