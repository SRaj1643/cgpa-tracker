import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, TrendingUp, GraduationCap, BookOpen, Plus, Sparkles, Flame, Award,
  ArrowRight, Calculator, Lock, Target, Activity,
} from "lucide-react";
import { fmt, gradeColor } from "@/lib/grade-utils";
import { generateInsights, computeAchievements } from "@/lib/insights";
import { academicHealth, timeGreeting, dailyLine } from "@/lib/academic-health";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Cell, PieChart, Pie,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — GradeFlow AI" }] }),
  component: DashboardHome,
});

function StatCard({
  icon: Icon, label, value, hint, accent = "primary",
}: {
  icon: any; label: string; value: string; hint?: string;
  accent?: "primary" | "success" | "warning" | "glow";
}) {
  const colors: Record<string, string> = {
    primary: "from-primary/30 to-primary/0 text-primary",
    success: "from-success/30 to-success/0 text-success",
    warning: "from-warning/30 to-warning/0 text-warning",
    glow: "from-primary-glow/30 to-primary-glow/0 text-primary-glow",
  };
  return (
    <Card className="relative overflow-hidden glass border-border/50 p-4 sm:p-5 transition hover:shadow-elegant hover:-translate-y-0.5">
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${colors[accent]} blur-2xl opacity-50`} />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</div>
          <div className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold font-display tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
        <div className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center ${colors[accent].split(" ").pop()}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}

function HealthPill({ tone, label }: { tone: "positive" | "warning" | "neutral"; label: string }) {
  const toneCls =
    tone === "positive"
      ? "bg-success/15 text-success border-success/30"
      : tone === "warning"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-secondary text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneCls}`}>
      <Activity className="h-3 w-3" />
      {label}
    </span>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  const { loading, semesters, totalCredits, cgpa, currentSGPA, semesterCount, subjects } = useAcademicStats();

  // All hooks must run before any early return.
  const greeting = useMemo(() => timeGreeting(), []);
  const motivational = useMemo(() => dailyLine(user?.id), [user?.id]);
  const insights = useMemo(() => generateInsights(semesters, cgpa), [semesters, cgpa]);
  const achievements = useMemo(
    () => computeAchievements({ semesters, cgpa, totalCredits }),
    [semesters, cgpa, totalCredits],
  );
  const health = useMemo(() => academicHealth(semesters), [semesters]);

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata?.full_name as string | undefined) || user?.email || "";
    return meta.split(/[ @]/)[0] || "there";
  }, [user]);

  const trendData = useMemo(
    () =>
      semesters.map((s) => ({
        name: `Sem ${s.semester_number}`,
        SGPA: Number(s.sgpa.toFixed(2)),
        Credits: s.credits,
      })),
    [semesters],
  );

  const distData = useMemo(() => {
    const buckets = { "A+ (9-10)": 0, "A (8-9)": 0, "B (7-8)": 0, "C (6-7)": 0, "Below 6": 0 };
    subjects.forEach((s) => {
      if (s.grade >= 9) buckets["A+ (9-10)"]++;
      else if (s.grade >= 8) buckets["A (8-9)"]++;
      else if (s.grade >= 7) buckets["B (7-8)"]++;
      else if (s.grade >= 6) buckets["C (6-7)"]++;
      else if (s.grade > 0) buckets["Below 6"]++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [subjects]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = semesters.length - 1; i >= 0; i--) {
      if (semesters[i].sgpa >= 8) s++; else break;
    }
    return s;
  }, [semesters]);

  const nextGoal = useMemo(() => {
    if (semesterCount === 0) return null;
    const nextRound = Math.min(10, Math.ceil((cgpa + 0.5) * 2) / 2);
    if (nextRound <= cgpa) return null;
    const delta = nextRound - cgpa;
    return { target: nextRound, delta };
  }, [cgpa, semesterCount]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const isEmpty = semesterCount === 0;
  const pieColors = ["oklch(0.7 0.2 280)", "oklch(0.78 0.18 220)", "oklch(0.72 0.16 155)", "oklch(0.82 0.16 75)", "oklch(0.65 0.22 27)"];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero: greeting + CPI + health */}
      <Card className="relative overflow-hidden glass border-border/50 p-5 sm:p-7">
        <div aria-hidden className="absolute inset-0 opacity-60 mesh-bg" />
        <div className="relative flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-muted-foreground">{greeting},</div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mt-0.5 truncate">
              {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
              {motivational}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <HealthPill tone={health.tone} label={health.label} />
              {!isEmpty && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {health.message}
                </span>
              )}
            </div>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CGPA</div>
                <div className="text-5xl sm:text-6xl font-display font-bold gradient-text leading-none tabular-nums">
                  {fmt(cgpa)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">over {totalCredits} credits</div>
              </div>
            </div>
          )}
        </div>

        {!isEmpty && health.tone !== "positive" && (
          <p className="relative mt-3 text-xs text-muted-foreground sm:hidden">{health.message}</p>
        )}

        <div className="relative mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm" className="gradient-bg text-primary-foreground border-0 shadow-elegant">
            <Link to="/dashboard/semesters"><Plus className="h-4 w-4 mr-1.5" />Add semester</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/simulator"><Calculator className="h-4 w-4 mr-1.5" />Simulate</Link>
          </Button>
        </div>
      </Card>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Trophy} label="CGPA" value={fmt(cgpa)} hint={isEmpty ? "Add data to begin" : "Cumulative"} accent="primary" />
        <StatCard icon={TrendingUp} label="Current SGPA" value={fmt(currentSGPA)} hint={isEmpty ? "—" : "Latest sem"} accent="success" />
        <StatCard icon={GraduationCap} label="Credits" value={String(totalCredits)} hint="Total earned" accent="glow" />
        <StatCard icon={BookOpen} label="Semesters" value={String(semesterCount)} hint={`${subjects.length} subjects`} accent="warning" />
      </div>

      {isEmpty ? (
        <Card className="glass p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h3 className="mt-5 text-xl font-semibold">Welcome to GradeFlow!</h3>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Add your first semester to see your CGPA, charts, and insights light up.
          </p>
          <Button asChild className="mt-6 gradient-bg text-primary-foreground border-0">
            <Link to="/dashboard/semesters">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Next goal */}
          {nextGoal && (
            <Card className="glass p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Next milestone: {nextGoal.target.toFixed(1)} CGPA</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You're {nextGoal.delta.toFixed(2)} away. One strong semester can close the gap.
                </p>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full gradient-bg transition-all duration-500"
                    style={{ width: `${Math.min(100, (cgpa / nextGoal.target) * 100)}%` }}
                  />
                </div>
              </div>
              <Button asChild size="sm" variant="ghost" className="self-start sm:self-auto">
                <Link to="/dashboard/simulator">Plan it <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            <Card className="glass p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">GPA Progression</h3>
                  <p className="text-xs text-muted-foreground">Your SGPA across semesters</p>
                </div>
              </div>
              <div className="h-56 sm:h-72 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="sgpa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.7 0.2 280)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.7 0.2 280)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 264 / 0.15)" />
                    <XAxis dataKey="name" stroke="oklch(0.5 0.02 264)" fontSize={11} tickMargin={6} />
                    <YAxis domain={[0, 10]} stroke="oklch(0.5 0.02 264)" fontSize={11} width={32} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="SGPA" stroke="oklch(0.7 0.2 280)" strokeWidth={2.5} fill="url(#sgpa)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="glass p-5 sm:p-6">
              <h3 className="font-semibold text-base sm:text-lg">Grade Distribution</h3>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
              <div className="h-44 sm:h-56 mt-2">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={distData} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3}>
                      {distData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {distData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            <Card className="glass p-5 sm:p-6 lg:col-span-2">
              <h3 className="font-semibold text-base sm:text-lg">Credits per Semester</h3>
              <div className="h-44 sm:h-56 mt-3 -mx-2">
                <ResponsiveContainer>
                  <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 264 / 0.15)" />
                    <XAxis dataKey="name" stroke="oklch(0.5 0.02 264)" fontSize={11} tickMargin={6} />
                    <YAxis stroke="oklch(0.5 0.02 264)" fontSize={11} width={32} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px" }} />
                    <Bar dataKey="Credits" fill="oklch(0.78 0.18 220)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="glass p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Excellence Streak</div>
                    <div className="text-2xl font-bold font-display tabular-nums">{streak}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Consecutive semesters with SGPA ≥ 8.0</p>
              </Card>

              <Card className="glass p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold">Insights</div>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {insights.length === 0 && (
                    <li className="text-xs text-muted-foreground">Add a few semesters to unlock trend insights.</li>
                  )}
                  {insights.map((ins, i) => (
                    <li key={i} className="text-sm leading-relaxed flex gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        ins.tone === "positive" ? "bg-success" : ins.tone === "warning" ? "bg-warning" : "bg-primary"
                      }`} />
                      <span className="text-muted-foreground">{ins.text}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="glass p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold">Achievements</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {achievements.map((a) => (
                    <span
                      key={a.id}
                      title={a.hint}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition ${
                        a.earned
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-secondary/40 border-border text-muted-foreground opacity-60"
                      }`}
                    >
                      {!a.earned && <Lock className="h-3 w-3" />}
                      {a.label}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card className="glass p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base sm:text-lg">Recent Semesters</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/semesters">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {semesters.slice(-3).reverse().map((s) => (
                <Link
                  key={s.id}
                  to="/dashboard/semesters/$id" params={{ id: s.id }}
                  className="rounded-xl border bg-secondary/30 p-4 hover:bg-secondary/60 hover:border-primary/40 transition group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Semester {s.semester_number}</div>
                    <div className={`text-xs font-medium tabular-nums ${gradeColor(s.sgpa)}`}>{fmt(s.sgpa)}</div>
                  </div>
                  <div className="mt-1 font-semibold truncate group-hover:text-primary transition">{s.semester_name}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{s.subjectCount} subjects</span>
                    <span>{s.credits} credits</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
