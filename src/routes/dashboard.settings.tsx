import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useAutosave } from "@/hooks/use-autosave";
import { SaveIndicator } from "@/components/SaveIndicator";
import { profileSchema, friendlyDbError } from "@/lib/validation";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — GradeFlow AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const stats = useAcademicStats();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  const exportData = () => {
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
          .map((x) => ({
            code: x.course_code,
            name: x.subject_name,
            credits: x.credits,
            grade: x.grade,
          })),
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, theme, and data.</p>
      </div>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Profile</h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </div>
          <Button type="submit" disabled={saving} className="gradient-bg text-primary-foreground border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Appearance</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Theme</div>
            <div className="text-sm text-muted-foreground">Switch between dark and light.</div>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Grading System</h2>
        <p className="text-sm text-muted-foreground mt-2">
          GradeFlow uses a <span className="text-foreground font-medium">10-point system</span> by default.
          Grades are entered out of 10 and grade points are computed as <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">credits × grade</code>.
          SGPA = total grade points ÷ total credits.
        </p>
      </Card>

      <Card className="glass p-6">
        <h2 className="font-semibold text-lg">Export</h2>
        <p className="text-sm text-muted-foreground mt-2">Download all your academic data as JSON.</p>
        <Button onClick={exportData} variant="outline" className="mt-4">
          <Download className="h-4 w-4 mr-2" /> Export data
        </Button>
      </Card>
    </div>
  );
}
