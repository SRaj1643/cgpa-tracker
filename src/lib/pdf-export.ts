import jsPDF from "jspdf";
import type { SemesterRow, SubjectRow } from "@/hooks/use-academic-data";
import { calcSGPA, calcTotalCredits, calcCGPA } from "@/lib/grade-utils";

type Args = {
  studentName: string;
  semesters: SemesterRow[];
  subjects: SubjectRow[];
};

export function exportTranscriptPDF({ studentName, semesters, subjects }: Args): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Academic Transcript", margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Student: ${studentName || "—"}`, margin, y);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, y, { align: "right" });
  y += 18;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  // Per semester
  const perSem = semesters
    .slice()
    .sort((a, b) => a.semester_number - b.semester_number)
    .map((s) => {
      const subs = subjects.filter((x) => x.semester_id === s.id);
      return { sem: s, subs, sgpa: calcSGPA(subs), credits: calcTotalCredits(subs) };
    });

  const cgpa = calcCGPA(perSem.map((p) => ({ sgpa: p.sgpa, credits: p.credits })));
  const totalCredits = perSem.reduce((a, p) => a + p.credits, 0);

  // Summary
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`CGPA: ${cgpa.toFixed(2)}   ·   Total Credits: ${totalCredits}   ·   Semesters: ${perSem.length}`, margin, y);
  y += 24;

  for (const { sem, subs, sgpa, credits } of perSem) {
    ensureSpace(80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(`Semester ${sem.semester_number} — ${sem.semester_name}`, margin, y);
    doc.text(`SGPA ${sgpa.toFixed(2)}  ·  ${credits} cr`, pageW - margin, y, { align: "right" });
    y += 14;

    // Table header
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Code", margin, y);
    doc.text("Subject", margin + 80, y);
    doc.text("Cr", pageW - margin - 110, y, { align: "right" });
    doc.text("Grade", pageW - margin - 60, y, { align: "right" });
    doc.text("Pts", pageW - margin, y, { align: "right" });
    y += 6;
    doc.setDrawColor(235);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.setFontSize(10);
    if (subs.length === 0) {
      doc.setTextColor(150);
      doc.text("No subjects recorded.", margin, y);
      y += 16;
    } else {
      for (const sub of subs) {
        ensureSpace(16);
        const name = sub.subject_name.length > 48 ? sub.subject_name.slice(0, 45) + "…" : sub.subject_name;
        doc.text(sub.course_code || "—", margin, y);
        doc.text(name, margin + 80, y);
        doc.text(String(sub.credits), pageW - margin - 110, y, { align: "right" });
        doc.text(sub.grade.toFixed(2), pageW - margin - 60, y, { align: "right" });
        doc.text((sub.credits * sub.grade).toFixed(2), pageW - margin, y, { align: "right" });
        y += 14;
      }
    }
    y += 10;
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`GradeFlow AI · Page ${i} of ${pages}`, pageW / 2, pageH - 20, { align: "center" });
  }

  doc.save(`gradeflow-transcript-${new Date().toISOString().slice(0, 10)}.pdf`);
}
