import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, ChevronDown, Trophy, BookOpen, GraduationCap } from "lucide-react";
import { useAcademicStats, useAllSubjects } from "@/hooks/use-academic-data";
import { fmt, gradeColor } from "@/lib/grade-utils";
import { Button as B } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/timeline")({
  head: () => ({ meta: [{ title: "Timeline — GradeFlow AI" }] }),
  component: TimelinePage,
});

function TimelinePage() {
  const { loading, semesters } = useAcademicStats();
  const allSubjects = useAllSubjects();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  if (semesters.length === 0) {
    return (
      <Card className="glass p-12 text-center">
        <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="mt-4 font-semibold text-lg">No semesters yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Add one to start your timeline.</p>
        <B asChild className="mt-6 gradient-bg text-primary-foreground border-0">
          <Link to="/dashboard/semesters">Add semester</Link>
        </B>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Timeline</h1>
        <p className="text-muted-foreground mt-1">Your academic journey, semester by semester.</p>
      </div>

      <div className="relative">
        <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
        <ol className="space-y-4">
          {semesters.map((s) => {
            const subs = (allSubjects.data ?? []).filter((x) => x.semester_id === s.id);
            const isOpen = expanded.has(s.id);
            const top = subs.slice().sort((a, b) => b.grade - a.grade)[0];
            return (
              <li key={s.id} className="relative pl-12 sm:pl-16">
                <div className={`absolute left-2 sm:left-4 top-5 h-5 w-5 rounded-full bg-background border-2 ${s.sgpa >= 8 ? "border-success" : s.sgpa >= 6 ? "border-primary" : "border-warning"} flex items-center justify-center shadow-glow`}>
                  <div className={`h-2 w-2 rounded-full ${s.sgpa >= 8 ? "bg-success" : s.sgpa >= 6 ? "bg-primary" : "bg-warning"}`} />
                </div>
                <Card className="glass p-5 hover:shadow-elegant transition">
                  <button onClick={() => toggle(s.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Semester {s.semester_number}</div>
                        <div className="mt-0.5 font-semibold truncate">{s.semester_name}</div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3" />{s.subjectCount} subjects</span>
                          <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3 w-3" />{s.credits} credits</span>
                          {top && <span className="inline-flex items-center gap-1.5"><Trophy className="h-3 w-3" />Top: {top.subject_name} ({fmt(top.grade)})</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-3xl font-display font-bold ${gradeColor(s.sgpa)}`}>{fmt(s.sgpa)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SGPA</div>
                      </div>
                    </div>
                    <div className="mt-3 inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                      {isOpen ? "Hide subjects" : "Show subjects"}
                    </div>
                  </button>
                  {isOpen && subs.length > 0 && (
                    <div className="mt-4 border-t pt-4 grid sm:grid-cols-2 gap-2">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-sm rounded-md bg-secondary/40 px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{sub.subject_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{sub.course_code || "—"} · {sub.credits} cr</div>
                          </div>
                          <div className={`font-semibold tabular-nums ${gradeColor(sub.grade)}`}>{fmt(sub.grade)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOpen && subs.length === 0 && (
                    <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">No subjects recorded.</div>
                  )}
                  <div className="mt-4">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/dashboard/semesters/$id" params={{ id: s.id }}>Open semester →</Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
