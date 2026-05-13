import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { toast } from "sonner";
import { Download, FileText, Check } from "lucide-react";
import { useAutosave } from "@/hooks/use-autosave";
import { SaveIndicator } from "@/components/SaveIndicator";
import { profileSchema, friendlyDbError } from "@/lib/validation";
import { useTheme, THEME_PRESETS, type ThemePreset } from "@/hooks/use-theme";
import { GRADING_SCALES } from "@/lib/insights";
import { exportTranscriptPDF } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";

const GRADING_KEY = "gf-grading-scale";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — GradeFlow AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const stats = useAcademicStats();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [scaleId, setScaleId] = useState<string>("numeric");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScaleId(localStorage.getItem(GRADING_KEY) ?? "numeric");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setHydrated(true);
      });
  }, [user]);

  const status = useAutosave(
    fullName,
    async (value) => {
      const parsed = profileSchema.safeParse({ full_name: value });
      if (!parsed.success) {
        setNameError(parsed.error.issues[0]?.message ?? "Invalid");
        throw new Error("validation");
      }
      setNameError(null);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name })
        .eq("id", user!.id);
      if (error) {
        toast.error(friendlyDbError(error));
        throw error;
      }
    },
    { delay: 800, enabled: hydrated && !!user },
  );

  const exportJSON = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      user: { id: user!.id, email: user!.email, full_name: fullName },
      cgpa: stats.cgpa,
      total_credits: stats.totalCredits,
      semesters: stats.semesters.map((s) => ({
        number: s.semester_number,
        name: s.semester_name,
        sgpa: s.sgpa,
        credits: s.credits,
        subjects: stats.subjects
          .filter((x) => x.semester_id === s.id)
          .map((x) => ({ code: x.course_code, name: x.subject_name, credits: x.credits, grade: x.grade })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradeflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const exportPDF = () => {
    if (stats.semesterCount === 0) {
      toast.error("Add a semester first.");
      return;
    }
    try {
      exportTranscriptPDF({
        studentName: fullName || user?.email || "Student",
        semesters: stats.semesters.map((s) => ({
          id: s.id, semester_number: s.semester_number, semester_name: s.semester_name, created_at: s.created_at,
        })),
        subjects: stats.subjects,
      });
      toast.success("Transcript PDF generated");
    } catch (e) {
      toast.error("PDF export failed");
    }
  };

  const updateScale = (id: string) => {
    setScaleId(id);
    try { localStorage.setItem(GRADING_KEY, id); } catch {}
    toast.success("Grading scale updated");
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, theme, and data.</p>
      </div>

      <Card className="glass p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Profile</h2>
          <SaveIndicator status={status} />
        </div>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              maxLength={100} aria-invalid={!!nameError} />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            <p className="text-xs text-muted-foreground">Changes save automatically as you type.</p>
          </div>
        </div>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick a preset. Persists across sessions.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setTheme(p.id as ThemePreset)}
              className={cn(
                "rounded-xl border p-3 text-left transition hover:border-primary/60",
                theme === p.id ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{p.label}</div>
                {theme === p.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.hint}</div>
              <ThemePreview id={p.id as ThemePreset} />
            </button>
          ))}
        </div>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Grading System</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Display letter grades in the UI. Calculations stay on the 10-point numeric scale to keep your data portable.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {GRADING_SCALES.map((s) => (
            <button
              key={s.id}
              onClick={() => updateScale(s.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition hover:border-primary/60",
                scaleId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{s.label}</div>
                {scaleId === s.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {s.bands.filter((b) => b.letter).slice(0, 4).map((b) => `${b.letter}≥${b.min}`).join(" · ") || "Numeric only"}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Export</h2>
        <p className="text-sm text-muted-foreground mt-2">Download your transcript or full data backup.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={exportPDF} className="gradient-bg text-primary-foreground border-0">
            <FileText className="h-4 w-4 mr-2" /> Transcript PDF
          </Button>
          <Button onClick={exportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" /> JSON backup
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ThemePreview({ id }: { id: ThemePreset }) {
  const swatches: Record<ThemePreset, string[]> = {
    light: ["#fafbfc", "#e8ecf1", "#7c3aed"],
    dark: ["#1a1a2e", "#2a2a4a", "#a78bfa"],
    amoled: ["#000000", "#0d0d0d", "#a78bfa"],
    iitk: ["#0c2340", "#1a4a6e", "#5cbdb9"],
    cyberpunk: ["#1a0a2e", "#3d0a47", "#ff2bd4"],
  };
  return (
    <div className="mt-3 flex gap-1.5">
      {swatches[id].map((c, i) => (
        <div key={i} className="h-3 flex-1 rounded-full" style={{ background: c }} />
      ))}
    </div>
  );
}
