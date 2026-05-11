import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { calcSGPA, calcTotalCredits, calcCGPA } from "@/lib/grade-utils";

export type SemesterRow = {
  id: string;
  semester_number: number;
  semester_name: string;
  created_at: string;
};

export type SubjectRow = {
  id: string;
  semester_id: string;
  subject_name: string;
  course_code: string | null;
  credits: number;
  grade: number;
};

export function useSemesters() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["semesters", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SemesterRow[]> => {
      const { data, error } = await supabase
        .from("semesters")
        .select("id,semester_number,semester_name,created_at")
        .order("semester_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllSubjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects-all", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SubjectRow[]> => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,semester_id,subject_name,course_code,credits,grade")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d) => ({
        ...d,
        credits: Number(d.credits),
        grade: Number(d.grade),
      }));
    },
  });
}

export function useSubjectsForSemester(semesterId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects", semesterId, user?.id],
    enabled: !!user && !!semesterId,
    queryFn: async (): Promise<SubjectRow[]> => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,semester_id,subject_name,course_code,credits,grade")
        .eq("semester_id", semesterId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d) => ({
        ...d,
        credits: Number(d.credits),
        grade: Number(d.grade),
      }));
    },
  });
}

export function useAcademicStats() {
  const semesters = useSemesters();
  const subjects = useAllSubjects();
  const loading = semesters.isLoading || subjects.isLoading;

  const perSemester = (semesters.data ?? []).map((s) => {
    const subs = (subjects.data ?? []).filter((x) => x.semester_id === s.id);
    return {
      ...s,
      sgpa: calcSGPA(subs),
      credits: calcTotalCredits(subs),
      subjectCount: subs.length,
    };
  });

  const totalCredits = perSemester.reduce((acc, s) => acc + s.credits, 0);
  const cgpa = calcCGPA(perSemester.map((s) => ({ sgpa: s.sgpa, credits: s.credits })));
  const currentSGPA = perSemester.length ? perSemester[perSemester.length - 1].sgpa : 0;

  return {
    loading,
    semesters: perSemester,
    subjects: subjects.data ?? [],
    totalCredits,
    cgpa,
    currentSGPA,
    semesterCount: perSemester.length,
  };
}
