import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, BookPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubjectsForSemester, type SubjectRow } from "@/hooks/use-academic-data";
import { calcSGPA, calcTotalCredits, fmt, gradeColor, gradeLetter } from "@/lib/grade-utils";
import { subjectSchema, friendlyDbError, normalizeCourseCode } from "@/lib/validation";
import { useDraft } from "@/hooks/use-draft";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/semesters/$id")({
  head: () => ({ meta: [{ title: "Semester — GradeFlow AI" }] }),
  component: SemesterDetail,
});

function SemesterDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const semQ = useQuery({
    queryKey: ["semester", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semesters")
        .select("id,semester_number,semester_name")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const subjectsQ = useSubjectsForSemester(id);
  const subjects = subjectsQ.data ?? [];
  const sgpa = calcSGPA(subjects);
  const totalCredits = calcTotalCredits(subjects);

  if (semQ.isLoading || subjectsQ.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32" /><Skeleton className="h-72" /></div>;
  }

  if (!semQ.data) {
    return (
      <Card className="glass p-10 text-center">
        <h2 className="font-semibold text-lg">Semester not found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => navigate({ to: "/dashboard/semesters" })}>
          Go back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
          <Link to="/dashboard/semesters"><ArrowLeft className="h-4 w-4 mr-2" />All semesters</Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Semester {semQ.data.semester_number}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">{semQ.data.semester_name}</h1>
          </div>
          <SubjectDialog semesterId={id} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">SGPA</div>
          <div className={`mt-2 text-3xl font-bold font-display ${gradeColor(sgpa)}`}>{fmt(sgpa)}</div>
        </Card>
        <Card className="glass p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Credits</div>
          <div className="mt-2 text-3xl font-bold font-display">{totalCredits}</div>
        </Card>
        <Card className="glass p-5 col-span-2 lg:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Subjects</div>
          <div className="mt-2 text-3xl font-bold font-display">{subjects.length}</div>
        </Card>
      </div>

      <Card className="glass p-0 overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold">Subjects</h3>
          <SubjectDialog semesterId={id} compact />
        </div>
        {subjects.length === 0 ? (
          <div className="p-12 text-center">
            <BookPlus className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No subjects yet. Add one to start computing SGPA.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.course_code || "—"}</TableCell>
                  <TableCell className="font-medium">{s.subject_name}</TableCell>
                  <TableCell className="text-right">{s.credits}</TableCell>
                  <TableCell className={`text-right font-semibold ${gradeColor(s.grade)}`}>
                    {fmt(s.grade)} <span className="text-xs text-muted-foreground ml-1">{gradeLetter(s.grade)}</span>
                  </TableCell>
                  <TableCell className="text-right">{fmt(s.credits * s.grade)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <SubjectDialog semesterId={id} editing={s} trigger={<Button size="icon" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>} />
                      <DeleteSubject id={s.id} name={s.subject_name} semesterId={id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function SubjectDialog({
  semesterId, editing, trigger, compact,
}: {
  semesterId: string;
  editing?: SubjectRow;
  trigger?: React.ReactNode;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editing?.subject_name ?? "");
  const [code, setCode] = useState(editing?.course_code ?? "");
  const [credits, setCredits] = useState<number>(editing?.credits ?? 3);
  const [grade, setGrade] = useState<number>(editing?.grade ?? 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draft recovery — only for the "new subject" form. Editing existing rows
  // should never restore a stale draft on top of fresh server data.
  const draftKey = useMemo(
    () => (editing || !user ? null : `gf:draft:subject:${user.id}:${semesterId}`),
    [editing, user, semesterId],
  );
  const draftValue = useMemo(() => ({ name, code, credits, grade }), [name, code, credits, grade]);
  const { storedDraft, clear: clearDraft } = useDraft(draftKey, draftValue, { enabled: open });

  // When the new-subject dialog opens and a draft exists, offer to restore.
  useEffect(() => {
    if (!open || editing || !storedDraft) return;
    const hasContent =
      (storedDraft.name && storedDraft.name.trim()) ||
      (storedDraft.code && storedDraft.code.trim()) ||
      (storedDraft.grade && storedDraft.grade > 0);
    if (!hasContent) return;
    toast("Unsaved draft found", {
      description: "Restore your previous entry?",
      action: {
        label: "Restore",
        onClick: () => {
          setName(storedDraft.name ?? "");
          setCode(storedDraft.code ?? "");
          setCredits(storedDraft.credits ?? 3);
          setGrade(storedDraft.grade ?? 0);
        },
      },
      cancel: { label: "Discard", onClick: () => clearDraft() },
      duration: 8000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = subjectSchema.safeParse({
      subject_name: name,
      course_code: code || null,
      credits,
      grade,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? "_";
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const payload = parsed.data;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("subjects").update({
          subject_name: payload.subject_name,
          course_code: payload.course_code,
          credits: payload.credits,
          grade: payload.grade,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Subject updated");
      } else {
        const { error } = await supabase.from("subjects").insert({
          user_id: user!.id,
          semester_id: semesterId,
          subject_name: payload.subject_name,
          course_code: payload.course_code,
          credits: payload.credits,
          grade: payload.grade,
        });
        if (error) throw error;
        toast.success("Subject added");
        clearDraft();
        setName(""); setCode(""); setCredits(3); setGrade(0);
      }
      qc.invalidateQueries({ queryKey: ["subjects", semesterId] });
      qc.invalidateQueries({ queryKey: ["subjects-all"] });
      setOpen(false);
    } catch (err) {
      const msg = friendlyDbError(err as { code?: string; message?: string });
      if (msg.toLowerCase().includes("course code")) {
        setErrors({ course_code: msg });
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size={compact ? "sm" : "default"} className="gradient-bg text-primary-foreground border-0 shadow-elegant">
            <Plus className="h-4 w-4 mr-2" />Add subject
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit subject" : "Add a subject"}</DialogTitle>
          <DialogDescription>Grades are out of 10. Points = credits × grade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onBlur={(e) => setCode(normalizeCourseCode(e.target.value) ?? "")}
                placeholder="CS101"
                maxLength={20}
                aria-invalid={!!errors.course_code}
              />
              {errors.course_code && <p className="text-xs text-destructive">{errors.course_code}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="sname">Subject Name</Label>
              <Input
                id="sname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Data Structures"
                required
                maxLength={120}
                aria-invalid={!!errors.subject_name}
              />
              {errors.subject_name && <p className="text-xs text-destructive">{errors.subject_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                step="0.5"
                min={0.5}
                max={30}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                required
                aria-invalid={!!errors.credits}
              />
              {errors.credits && <p className="text-xs text-destructive">{errors.credits}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (out of 10)</Label>
              <Input
                id="grade"
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                required
                aria-invalid={!!errors.grade}
              />
              {errors.grade && <p className="text-xs text-destructive">{errors.grade}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="gradient-bg text-primary-foreground border-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Add subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSubject({ id, name, semesterId }: { id: string; name: string; semesterId: string }) {
  const qc = useQueryClient();
  const onDelete = async () => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { toast.error(friendlyDbError(error)); return; }
    toast.success("Subject deleted");
    qc.invalidateQueries({ queryKey: ["subjects", semesterId] });
    qc.invalidateQueries({ queryKey: ["subjects-all"] });
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>This will recompute your SGPA and CGPA.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
