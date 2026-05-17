import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Sparkles, RotateCcw, TrendingUp, TrendingDown, Minus, Save, Trash2 } from "lucide-react";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { useSubjectsForSemester } from "@/hooks/use-academic-data";
import { calcSGPA, calcCGPA, fmt, gradeColor } from "@/lib/grade-utils";
import { simulateCpiGoal } from "@/lib/insights";
import { useTargetCpi } from "@/hooks/use-target-cpi";
import { reachProbability } from "@/lib/wrapped";

export const Route = createFileRoute("/dashboard/simulator")({
  head: () => ({ meta: [{ title: "Simulator — GradeFlow AI" }] }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { loading, semesters, cgpa, totalCredits } = useAcademicStats();
  const sgpas = useMemo(() => semesters.map((s) => s.sgpa), [semesters]);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Simulators</h1>
        <p className="text-muted-foreground mt-1">Plan ahead. Test scenarios without touching your real data.</p>
      </div>

      <Tabs defaultValue="goal">
        <TabsList>
          <TabsTrigger value="goal"><Target className="h-4 w-4 mr-2" />CPI Goal</TabsTrigger>
          <TabsTrigger value="whatif"><Sparkles className="h-4 w-4 mr-2" />What If</TabsTrigger>
        </TabsList>
        <TabsContent value="goal" className="mt-6">
          <CpiGoal currentCPI={cgpa} currentCredits={totalCredits} sgpas={sgpas} />
        </TabsContent>
        <TabsContent value="whatif" className="mt-6">
          <WhatIf semesters={semesters} cgpa={cgpa} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ───────────────── CPI Goal ─────────────────

function CpiGoal({
  currentCPI, currentCredits, sgpas,
}: { currentCPI: number; currentCredits: number; sgpas: number[] }) {
  const { target: savedTarget, setTarget: persistTarget, saving } = useTargetCpi();
  const [target, setTarget] = useState<number>(
    savedTarget ?? Math.min(10, Math.ceil(currentCPI + 0.5)),
  );
  const [nextCredits, setNextCredits] = useState<number>(20);

  // Hydrate when saved target arrives.
  useEffect(() => {
    if (savedTarget != null) setTarget(savedTarget);
  }, [savedTarget]);

  const result = useMemo(
    () => simulateCpiGoal({ currentCPI, currentCredits, targetCPI: target, nextCredits }),
    [currentCPI, currentCredits, target, nextCredits],
  );

  const progressPct = Math.max(0, Math.min(100, (currentCPI / Math.max(target, 0.01)) * 100));
  const probability = useMemo(() => {
    if (result.kind !== "ok") return null;
    return reachProbability({ requiredSGPA: result.requiredSGPA, sgpas });
  }, [result, sgpas]);

  const isDirty = savedTarget == null || Math.abs(savedTarget - target) > 0.001;

  return (
    <div className="space-y-4">
      {/* Road to Target — persistent */}
      <Card className="glass p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-semibold">Road to Target CPI</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your saved goal: <span className="font-medium text-foreground">
                {savedTarget == null ? "not set" : savedTarget.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => persistTarget(target)} disabled={saving || !isDirty}
              className="gradient-bg text-primary-foreground border-0">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save goal
            </Button>
            {savedTarget != null && (
              <Button size="sm" variant="ghost" onClick={() => persistTarget(null)} disabled={saving}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between text-sm">
          <span className="tabular-nums font-medium">{fmt(currentCPI)}</span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
          <span className="tabular-nums font-medium">{target.toFixed(2)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full gradient-bg transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass p-6 space-y-4">
        <h3 className="font-semibold">Inputs</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current CPI"><Input value={fmt(currentCPI)} disabled /></Field>
          <Field label="Credits Done"><Input value={String(currentCredits)} disabled /></Field>
          <Field label="Target CPI">
            <Input type="number" step="0.01" min={0} max={10}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))} />
          </Field>
          <Field label="Next Sem Credits">
            <Input type="number" step="0.5" min={0.5} max={40}
              value={nextCredits}
              onChange={(e) => setNextCredits(Number(e.target.value))} />
          </Field>
        </div>
      </Card>

      <Card className="glass p-6 flex items-center justify-center text-center min-h-[220px]">
        {result.kind === "invalid" && (
          <div>
            <div className="text-sm text-warning font-medium">Invalid input</div>
            <p className="mt-2 text-muted-foreground text-sm">{result.message}</p>
          </div>
        )}
        {result.kind === "already" && (
          <div>
            <div className="text-2xl font-display font-semibold text-success">You're already there.</div>
            <p className="mt-2 text-muted-foreground text-sm">{result.message}</p>
          </div>
        )}
        {result.kind === "impossible" && (
          <div>
            <div className="text-sm text-warning font-medium">Target unreachable next semester</div>
            <p className="mt-2 text-muted-foreground text-sm">
              Even with a perfect 10.0, you'd reach <span className="font-semibold text-foreground">{result.maxReachableCPI.toFixed(2)}</span>.
              Try more credits or a softer target.
            </p>
          </div>
        )}
        {result.kind === "ok" && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">You need an SGPA of</div>
            <div className="text-6xl font-display font-bold gradient-text leading-none transition-all">
              {result.requiredSGPA.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              next semester (over {nextCredits} credits) to reach a CPI of {target.toFixed(2)}.
            </p>
            {probability && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                probability.tone === "positive"
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-warning/10 border-warning/30 text-warning"
              }`}>
                {probability.label} · ~{probability.pct}% based on your history
              </div>
            )}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}

// ───────────────── What If ─────────────────

function WhatIf({
  semesters, cgpa,
}: {
  semesters: ReturnType<typeof useAcademicStats>["semesters"];
  cgpa: number;
}) {
  const [semId, setSemId] = useState<string | undefined>(semesters[semesters.length - 1]?.id);
  const subjectsQ = useSubjectsForSemester(semId);
  const real = subjectsQ.data ?? [];
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const simulated = real.map((s) => ({ ...s, grade: overrides[s.id] ?? s.grade }));
  const newSgpa = calcSGPA(simulated);
  const oldSgpa = calcSGPA(real);

  // Recompute CGPA with this semester's simulated SGPA swapped in
  const swapped = semesters.map((s) =>
    s.id === semId ? { sgpa: newSgpa, credits: s.credits } : { sgpa: s.sgpa, credits: s.credits },
  );
  const newCgpa = calcCGPA(swapped);
  const sgpaDelta = newSgpa - oldSgpa;
  const cgpaDelta = newCgpa - cgpa;

  if (semesters.length === 0) {
    return (
      <Card className="glass p-10 text-center text-muted-foreground">
        Add a semester first to simulate grade changes.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass p-5 flex flex-wrap items-center gap-3">
        <Label className="text-sm">Semester</Label>
        <select
          value={semId}
          onChange={(e) => { setSemId(e.target.value); setOverrides({}); }}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>Sem {s.semester_number} — {s.semester_name}</option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={() => setOverrides({})}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Local-only — nothing is saved.</span>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <DeltaCard label="SGPA (this semester)" before={oldSgpa} after={newSgpa} delta={sgpaDelta} />
        <DeltaCard label="CGPA (overall)" before={cgpa} after={newCgpa} delta={cgpaDelta} />
      </div>

      <Card className="glass p-0 overflow-hidden">
        <div className="p-5 border-b font-semibold">Adjust grades</div>
        {real.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No subjects in this semester.</div>
        ) : (
          <div className="divide-y">
            {real.map((s) => {
              const v = overrides[s.id] ?? s.grade;
              return (
                <div key={s.id} className="grid grid-cols-12 gap-3 items-center p-4">
                  <div className="col-span-6 min-w-0">
                    <div className="font-medium truncate">{s.subject_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.course_code || "—"} · {s.credits} cr</div>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="range" min={0} max={10} step={0.5}
                      value={v}
                      onChange={(e) => setOverrides((o) => ({ ...o, [s.id]: Number(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className={`col-span-2 text-right font-semibold tabular-nums ${gradeColor(v)}`}>
                    {fmt(v)}
                    {v !== s.grade && (
                      <div className="text-[10px] text-muted-foreground font-normal">was {fmt(s.grade)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function DeltaCard({ label, before, after, delta }: { label: string; before: number; after: number; delta: number }) {
  const Icon = delta > 0.005 ? TrendingUp : delta < -0.005 ? TrendingDown : Minus;
  const tone = delta > 0.005 ? "text-success" : delta < -0.005 ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="glass p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-3xl font-display font-bold">{fmt(after)}</div>
        <div className="text-sm text-muted-foreground pb-1">was {fmt(before)}</div>
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${tone}`}>
        <Icon className="h-4 w-4" />
        {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
