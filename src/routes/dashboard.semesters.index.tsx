import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, BookOpen, ChevronRight, Trash2, Pencil, Loader2 } from "lucide-react";
import { useAcademicStats } from "@/hooks/use-academic-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fmt, gradeColor } from "@/lib/grade-utils";

export const Route = createFileRoute("/dashboard/semesters/")({
  head: () => ({ meta: [{ title: "Semesters — GradeFlow AI" }] }),
  component: SemestersPage,
});

function SemestersPage() {
  const { loading, semesters } = useAcademicStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground mt-1">Manage your academic terms.</p>
        </div>
        <SemesterDialog />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : semesters.length === 0 ? (
        <Card className="glass p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="mt-4 font-semibold text-lg">No semesters yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add your first semester to begin tracking.</p>
          <div className="mt-6 inline-block"><SemesterDialog /></div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesters.map((s) => (
            <Card key={s.id} className="glass p-5 group hover:shadow-elegant hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Semester {s.semester_number}</div>
                  <div className="mt-1 font-semibold truncate">{s.semester_name}</div>
                </div>
                <div className={`text-2xl font-bold font-display ${gradeColor(s.sgpa)}`}>{fmt(s.sgpa)}</div>
              </div>
              <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
                <div><span className="text-foreground font-medium">{s.subjectCount}</span> subjects</div>
                <div><span className="text-foreground font-medium">{s.credits}</span> credits</div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Button asChild size="sm" className="flex-1 gradient-bg text-primary-foreground border-0">
                  <Link to="/dashboard/semesters/$id" params={{ id: s.id }}>
                    Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <SemesterDialog editing={s} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                <DeleteSemester id={s.id} name={s.semester_name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SemesterDialog({
  editing, trigger,
}: {
  editing?: { id: string; semester_number: number; semester_name: string };
  trigger?: React.ReactNode;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [num, setNum] = useState(editing?.semester_number ?? 1);
  const [name, setName] = useState(editing?.semester_name ?? "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name required"); return; }
    if (num < 1 || num > 20) { toast.error("Semester number must be 1-20"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("semesters")
        .update({ semester_number: num, semester_name: name.trim() })
        .eq("id", editing.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Semester updated");
    } else {
      const { error } = await supabase
        .from("semesters")
        .insert({ user_id: user!.id, semester_number: num, semester_name: name.trim() });
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Semester added");
    }
    qc.invalidateQueries({ queryKey: ["semesters"] });
    qc.invalidateQueries({ queryKey: ["subjects-all"] });
    setOpen(false);
    if (!editing) { setNum(num + 1); setName(""); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gradient-bg text-primary-foreground border-0 shadow-elegant">
            <Plus className="h-4 w-4 mr-2" />Add semester
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit semester" : "Add a semester"}</DialogTitle>
          <DialogDescription>Give your term a number and name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="num">Number</Label>
              <Input id="num" type="number" min={1} max={20} value={num} onChange={(e) => setNum(Number(e.target.value))} required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Autumn 2024" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="gradient-bg text-primary-foreground border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Add semester"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSemester({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient();
  const onDelete = async () => {
    const { error } = await supabase.from("semesters").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Semester deleted");
    qc.invalidateQueries({ queryKey: ["semesters"] });
    qc.invalidateQueries({ queryKey: ["subjects-all"] });
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the semester and all its subjects. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
