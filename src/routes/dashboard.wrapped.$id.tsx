import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Trophy, Flame, TrendingUp, Award } from "lucide-react";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { fmt } from "@/lib/grade-utils";
import { buildWrapped, type WrappedSubject } from "@/lib/wrapped";
import { ShareCard } from "@/components/ShareCard";

export const Route = createFileRoute("/dashboard/wrapped/$id")({
  head: () => ({ meta: [{ title: "Semester Wrapped — GradeFlow AI" }] }),
  component: WrappedPage,
});

function WrappedPage() {
  const { id } = useParams({ from: "/dashboard/wrapped/$id" });
  const { loading, semesters, subjects } = useAcademicStats();

  const recap = useMemo(() => {
    if (loading || semesters.length === 0) return null;
    const subjectsBySem: Record<string, WrappedSubject[]> = {};
    for (const s of subjects) {
      (subjectsBySem[s.semester_id] ||= []).push(s as WrappedSubject);
    }
    return buildWrapped({ semesters, subjectsBySem, semesterId: id });
  }, [loading, semesters, subjects, id]);

  if (loading) return <Skeleton className="h-96" />;

  if (!recap) {
    return (
      <Card className="glass p-10 text-center">
        <p className="text-muted-foreground">Semester not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>
      </Card>
    );
  }

  const { semester, best, toughest, sgpaDelta, isPersonalBest, topPercentile, improvementStreakBefore } = recap;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" />Dashboard</Link>
          </Button>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight truncate">
            Sem {semester.semester_number} Wrapped
          </h1>
          <p className="text-muted-foreground mt-1">{semester.semester_name}</p>
        </div>
      </div>

      {/* Highlights grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Highlight icon={Trophy} label="SGPA" value={fmt(semester.sgpa)}
          hint={isPersonalBest ? "Personal best ✨" : `Top ${topPercentile}% of your sems`} />
        <Highlight icon={TrendingUp} label="Change" value={sgpaDelta == null ? "—" : `${sgpaDelta >= 0 ? "+" : ""}${sgpaDelta.toFixed(2)}`}
          hint={sgpaDelta == null ? "First semester" : "vs previous sem"} />
        <Highlight icon={Sparkles} label="Best subject" value={best ? fmt(best.grade) : "—"}
          hint={best?.subject_name ?? "No graded subjects"} />
        <Highlight icon={Award} label="Toughest" value={toughest ? fmt(toughest.grade) : "—"}
          hint={toughest?.subject_name ?? "—"} />
      </div>

      {improvementStreakBefore >= 2 && (
        <Card className="glass p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <span className="font-semibold">{improvementStreakBefore}-semester improvement streak.</span>{" "}
            <span className="text-muted-foreground">You've kept the line trending up.</span>
          </div>
        </Card>
      )}

      <ShareCard
        fileName={`gradeflow-sem${semester.semester_number}-wrapped`}
        label="Shareable card · 1080 × 1350"
      >
        <WrappedShareCard recap={recap} />
      </ShareCard>
    </div>
  );
}

function Highlight({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <Card className="glass p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold tabular-nums leading-tight">{value}</div>
          <div className="text-xs text-muted-foreground truncate">{hint}</div>
        </div>
      </div>
    </Card>
  );
}

function WrappedShareCard({ recap }: { recap: NonNullable<ReturnType<typeof buildWrapped>> }) {
  const { semester, best, sgpaDelta, isPersonalBest, topPercentile } = recap;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(160deg, oklch(0.22 0.08 280) 0%, oklch(0.18 0.1 260) 50%, oklch(0.14 0.05 250) 100%)",
        color: "white",
        padding: "80px 72px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.7, letterSpacing: 4, textTransform: "uppercase" }}>
        Semester Wrapped
      </div>
      <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16, letterSpacing: -1 }}>
        Sem {semester.semester_number}
      </div>
      <div style={{ fontSize: 36, opacity: 0.75, marginTop: 4 }}>{semester.semester_name}</div>

      <div style={{ marginTop: 96 }}>
        <div style={{ fontSize: 28, opacity: 0.65, letterSpacing: 2, textTransform: "uppercase" }}>SGPA</div>
        <div
          style={{
            fontSize: 280,
            fontWeight: 800,
            lineHeight: 1,
            marginTop: 8,
            background: "linear-gradient(135deg, #c4b5fd 0%, #f0abfc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {semester.sgpa.toFixed(2)}
        </div>
        {sgpaDelta != null && (
          <div style={{ fontSize: 40, marginTop: 16, color: sgpaDelta >= 0 ? "#86efac" : "#fda4af" }}>
            {sgpaDelta >= 0 ? "▲" : "▼"} {Math.abs(sgpaDelta).toFixed(2)} vs last sem
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 64 }}>
        {isPersonalBest && (
          <div style={{ fontSize: 36, fontWeight: 600, marginBottom: 24 }}>🏆 Personal best</div>
        )}
        {best && (
          <div style={{ fontSize: 32, opacity: 0.85 }}>
            ⭐ Best subject: <strong>{best.subject_name}</strong> ({best.grade.toFixed(1)})
          </div>
        )}
        <div style={{ fontSize: 28, opacity: 0.65, marginTop: 24 }}>
          Top {topPercentile}% of your semesters · {semester.credits} credits
        </div>
        <div style={{ fontSize: 24, opacity: 0.5, marginTop: 48, letterSpacing: 2 }}>GRADEFLOW</div>
      </div>
    </div>
  );
}
