import { useCallback, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Star, BookOpen, MessageSquare, Trophy, Award, BookMarked, Target, Loader2 } from "lucide-react";
import collinzLogo from "@/assets/collinz-school-logo.png";
import schoolBadge from "@/assets/school-badge.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";
import { exportElementToPdf } from "@/lib/pdf/exportToPdf";
import { exportSectionBasedPdf } from "@/lib/pdf/exportSectionBasedPdf";
import { toast } from "@/hooks/use-toast";

// SVG Icon components for print compatibility
const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const IconMessage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconBookMarked = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <polyline points="10 2 10 10 13 7 16 10 16 2" />
  </svg>
);

const IconAward = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

// Book with Apple icon for Attitude & Behaviour
const IconBookApple = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Book */}
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H16v16H6.5a2.5 2.5 0 0 1 0-5H16" />
    {/* Apple */}
    <path d="M19 8c1 0 2 1 2 2.5S20 13 19 14c-.5.5-1.5 1-2 1s-1.5-.5-2-1c-1-1-1-2.5-1-2.5s1-2.5 2-2.5c.5 0 1 .2 1.5.5.5-.3 1-.5 1.5-.5z" />
    <path d="M19 5c0-1-1-2-2-2" />
  </svg>
);

interface Subject {
  name: string;
  score: number | null;
  grade: string;
  teacherComment: string;
  yearEndScore?: number | null;
  yearEndGrade?: string;
  classStudyRecommendation?: string;
  studyRecommendation?: string;
}

interface BehaviorItem {
  category: string;
  grade: string;
}

interface ReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentClass: string;
  examType: string;
  year: string;
  subjects: Subject[];
  behavior: BehaviorItem[];
  homeroomComment: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalDays: number;
    percentage: number;
  };
  achievements: string[];
  schoolName?: string;
  principalName?: string;
  headOfSchoolName?: string;
  deputyPrincipalName?: string;
}

const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  "A*": { bg: "#22c55e", text: "#ffffff", border: "#16a34a" },
  "A": { bg: "#059669", text: "#ffffff", border: "#047857" },
  "B": { bg: "#3b82f6", text: "#ffffff", border: "#2563eb" },
  "C": { bg: "#eab308", text: "#000000", border: "#ca8a04" },
  "D": { bg: "#f97316", text: "#ffffff", border: "#ea580c" },
  "E": { bg: "#ef4444", text: "#ffffff", border: "#dc2626" },
};

// More visible background colors for grade-based card coloring
const gradeCardBgColors: Record<string, string> = {
  "A*": "rgba(34, 197, 94, 0.20)",
  "A": "rgba(5, 150, 105, 0.18)",
  "B": "rgba(59, 130, 246, 0.18)",
  "C": "rgba(234, 179, 8, 0.18)",
  "D": "rgba(249, 115, 22, 0.18)",
  "E": "rgba(239, 68, 68, 0.18)",
};

const behaviorGradeColors: Record<string, { bg: string; text: string; cardBg: string }> = {
  "A": { bg: "#dcfce7", text: "#16a34a", cardBg: "#dcfce7" },
  "B": { bg: "#dbeafe", text: "#2563eb", cardBg: "#dbeafe" },
  "C": { bg: "#fef3c7", text: "#ca8a04", cardBg: "#fef3c7" },
  "D": { bg: "#fee2e2", text: "#dc2626", cardBg: "#fee2e2" },
};

const behaviorDescriptions: Record<string, Record<string, string>> = {
  "A": {
    "Initiative to Assist": "Always helps others",
    "Homework Submission": "Always on time",
    "Passion to Learn": "Highly enthusiastic",
    "Communication Skills": "Excellent communicator",
    "Participation": "Very active",
    "Leadership Skills": "Strong leader",
    "Punctuality": "Always punctual",
    "Self-Discipline": "Highly disciplined"
  },
  "B": {
    "Initiative to Assist": "Often helps others",
    "Homework Submission": "Usually on time",
    "Passion to Learn": "Shows good interest",
    "Communication Skills": "Good communicator",
    "Participation": "Participates well",
    "Leadership Skills": "Shows leadership",
    "Punctuality": "Usually punctual",
    "Self-Discipline": "Well disciplined"
  },
  "C": {
    "Initiative to Assist": "Sometimes helps",
    "Homework Submission": "Sometimes late",
    "Passion to Learn": "Moderate interest",
    "Communication Skills": "Adequate skills",
    "Participation": "Some participation",
    "Leadership Skills": "Developing skills",
    "Punctuality": "Sometimes late",
    "Self-Discipline": "Needs improvement"
  },
  "D": {
    "Initiative to Assist": "Rarely helps",
    "Homework Submission": "Often late",
    "Passion to Learn": "Limited interest",
    "Communication Skills": "Needs improvement",
    "Participation": "Low participation",
    "Leadership Skills": "Needs development",
    "Punctuality": "Often late",
    "Self-Discipline": "Needs attention"
  }
};

export function ReportCardDialog({
  open,
  onOpenChange,
  studentName,
  studentClass,
  examType,
  year,
  subjects,
  behavior,
  homeroomComment,
  attendance,
  achievements,
  schoolName = "Collinz International School",
  principalName = "Ms Sophie Lai",
  headOfSchoolName = "Ms Tan Jie Wei",
  deputyPrincipalName = "Ms Danita Subramaniam",
}: ReportCardDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const waitForPdfLayout = useCallback(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      ),
    []
  );

  const handleExportPdf = async () => {
    if (!reportRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await waitForPdfLayout();
      const safeName = studentName.trim().replace(/\s+/g, "_");
      const safeYear = year ? year.trim().replace(/\s+/g, "_") : "year";
      const safePeriod = examType.trim().replace(/\s+/g, "_");
      const result = await exportSectionBasedPdf({
        element: reportRef.current,
        filename: `ReportCard_${safeName || "student"}_${safeYear}_${safePeriod}`,
        sectionsPerPage: 3,
        scale: 2,
      });
      if (result?.savedToDevice) {
        toast.success("Saved to Downloads");
      }
    } catch (error) {
      console.error("[ReportCardDialog] PDF export failed", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Calculate overall average
  const validScores = subjects.filter(s => s.score !== null).map(s => s.score as number);
  const overallAverage = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) 
    : 0;

  // Sort by score (highest first) and limit to 13 subjects
  const displayedSubjects = [...subjects]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 13);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
          <DialogTitle className="text-sm sm:text-base">Report Card Preview</DialogTitle>
          <Button onClick={handleExportPdf} disabled={isExportingPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 py-2">
            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            <span className="hidden sm:inline">{isExportingPdf ? "Generating..." : "Download PDF"}</span>
            <span className="sm:hidden">{isExportingPdf ? "Generating..." : "PDF"}</span>
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
          {/* Portrait container wrapper */}
          <div className="flex justify-center">
            <div
              ref={reportRef}
              className={`bg-white rounded-lg shadow-lg ${isExportingPdf ? "pdf-export-root pdf-exporting" : ""}`}
              style={{
                width: isExportingPdf ? "210mm" : "min(100%, 210mm)",
                padding: "12px",
                fontSize: "10px",
              }}
            >
            
            {/* === PDF SECTION 1: Header + Student Info + Behaviour === */}
            <div className="pdf-section" data-section="header-info">
            {/* Header with both logos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
              <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Academic Report</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                  {examType}{year ? ` ${year}` : ""}
                </div>
              </div>
              <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
            </div>

            {/* Student Info Row with Attitude & Behaviour - Side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '8px', marginBottom: '10px' }}>
              {/* Student Name, Class, Overall Average & Attendance */}
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>{studentName}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', background: '#f0fdf4', padding: '3px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    {studentClass}
                  </div>
                </div>
                
                {/* Overall Average & Attendance inside the name box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                  {/* Overall Average */}
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: '#065f46', padding: '4px 8px' }}>
                      <div style={{ fontSize: '7px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Average</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '8px 8px' }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#065f46' }}>{overallAverage}%</div>
                    </div>
                  </div>
                  {/* Attendance */}
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ background: '#065f46', padding: '4px 8px' }}>
                      <div style={{ fontSize: '7px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</div>
                    </div>
                    <div style={{ background: 'white', padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#065f46' }}>{attendance.percentage}%</span>
                        <div style={{ fontSize: '9px', color: '#374151', fontWeight: '600', background: '#f9fafb', padding: '3px 8px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                          {attendance.present}/{attendance.totalDays} days
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ fontSize: '6px', color: '#16a34a', background: 'rgba(220, 252, 231, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          {attendance.present}
                        </div>
                        <div style={{ fontSize: '6px', color: '#dc2626', background: 'rgba(254, 226, 226, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          {attendance.absent}
                        </div>
                        <div style={{ fontSize: '6px', color: '#ca8a04', background: 'rgba(254, 243, 199, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {attendance.late}
                        </div>
                        <div style={{ fontSize: '6px', color: '#7c3aed', background: 'rgba(237, 233, 254, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                          {attendance.excused}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            {/* Attitude & Behaviour - Card Style */}
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBookApple /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Attitude & Behaviour</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {behavior.slice(0, 8).map((item) => {
                    const behaviorColor = behaviorGradeColors[item.grade] || behaviorGradeColors["C"];
                    const description = behaviorDescriptions[item.grade]?.[item.category] || "Good progress";
                    return (
                      <div key={item.category} style={{ 
                        position: 'relative',
                        background: behaviorColor.cardBg, 
                        borderRadius: '8px', 
                        padding: '8px',
                        overflow: 'hidden',
                        minHeight: '48px',
                        border: '1px solid #d1d5db'
                      }}>
                        {/* Watermark Grade */}
                        <div style={{
                          position: 'absolute',
                          right: '4px',
                          bottom: '-12px',
                          fontSize: '50px',
                          fontWeight: '800',
                          color: behaviorColor.text,
                          opacity: 0.2,
                          lineHeight: 1
                        }}>
                          {item.grade}
                        </div>
                        {/* Content */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ 
                            fontSize: '7px', 
                            fontWeight: '700', 
                            color: behaviorColor.text, 
                            textTransform: 'uppercase',
                            marginBottom: '2px'
                          }}>
                            {item.category}
                          </div>
                          <div style={{ 
                            fontSize: '6px', 
                            color: behaviorColor.text,
                            opacity: 0.8
                          }}>
                            {description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>{/* end pdf-section header-info */}

            {/* === PDF SECTION 2: Academic Grades === */}
            <div className="pdf-section" data-section="academic-grades">
            {/* Academic Grades - Table Layout */}
            <div style={{ marginBottom: '12px' }}>
              {/* Header with Grading Key */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#065f46' }}><IconBook /></span>
                  Academic Grades
                </h3>
                {/* Compact Grading Key Legend */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {Object.entries(gradeColors).map(([grade, colors]) => (
                    <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ 
                        width: '14px', 
                        height: '14px', 
                        borderRadius: '3px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '700', 
                        fontSize: '7px',
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}>
                        {grade}
                      </span>
                      <span style={{ fontSize: '6px', color: '#6b7280' }}>{grade === "A*" ? "90+" : grade === "A" ? "80+" : grade === "B" ? "70+" : grade === "C" ? "60+" : grade === "D" ? "50+" : "<50"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Grades Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                <thead>
                  <tr style={{ background: '#065f46', color: 'white' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', fontSize: '8px', borderRadius: '4px 0 0 0' }}>Subject</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '600', fontSize: '8px', width: '70px' }}>Mid-Year</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '600', fontSize: '8px', width: '70px' }}>Year-End</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', fontSize: '8px', borderRadius: '0 4px 0 0' }}>Teacher Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubjects.map((subject, index) => {
                    const midYearGradeColor = gradeColors[subject.grade] || gradeColors["C"];
                    const yearEndScore = subject.yearEndScore ?? null;
                    const getGradeFromScore = (score: number | null): string | null => {
                      if (score === null) return null;
                      if (score >= 90) return 'A*';
                      if (score >= 80) return 'A';
                      if (score >= 70) return 'B';
                      if (score >= 60) return 'C';
                      if (score >= 50) return 'D';
                      return 'E';
                    };
                    const derivedYearEndGrade = subject.yearEndGrade || getGradeFromScore(yearEndScore);
                    const derivedYearEndGradeColor = derivedYearEndGrade
                      ? gradeColors[derivedYearEndGrade] || gradeColors["C"]
                      : { bg: "#e5e7eb", text: "#9ca3af" };
                    const midYearBgColor = gradeCardBgColors[subject.grade] || 'white';
                    const yearEndBgColor = derivedYearEndGrade
                      ? gradeCardBgColors[derivedYearEndGrade] || 'white'
                      : 'white';
                    const rowAltBg = index % 2 === 0 ? 'white' : '#f9fafb';
                    
                    return (
                      <tr key={subject.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 8px', fontWeight: '600', color: '#1a1a1a', fontSize: '11px', background: rowAltBg }}>{subject.name}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', position: 'relative', background: midYearBgColor, overflow: 'hidden' }}>
                          {/* Watermark Grade */}
                          <span style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '42px',
                            fontWeight: '900',
                            opacity: 0.15,
                            color: midYearGradeColor.bg,
                            pointerEvents: 'none',
                            lineHeight: 1
                          }}>
                            {subject.grade}
                          </span>
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a1a' }}>{subject.score !== null ? `${subject.score}%` : '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', position: 'relative', background: yearEndBgColor, overflow: 'hidden' }}>
                          {/* Watermark Grade */}
                          <span style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '42px',
                            fontWeight: '900',
                            opacity: 0.15,
                            color: derivedYearEndGradeColor.bg,
                            pointerEvents: 'none',
                            lineHeight: 1
                          }}>
                            {derivedYearEndGrade || "-"}
                          </span>
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a1a' }}>{yearEndScore !== null ? `${yearEndScore}%` : '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '10px', color: '#374151', lineHeight: '1.5', background: rowAltBg }}>{subject.teacherComment || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>{/* end pdf-section academic-grades */}

            {/* === PDF SECTION 3: Subject Performance === */}
            <div className="pdf-section" data-section="subject-performance">
            {/* Subject Performance Chart - Static for Print */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Subject Performance</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {displayedSubjects.map((subject, index) => {
                  const barColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
                  const barColor = barColors[index % barColors.length];
                  const score = subject.score ?? 0;
                  const goal = Math.min((subject.score ?? 70) + 5, 100);
                  return (
                    <div key={subject.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '70px', fontSize: '8px', fontWeight: '500', color: '#374151', textAlign: 'right', flexShrink: 0 }}>
                        {subject.name.length > 12 ? subject.name.slice(0, 12) + '...' : subject.name}
                      </div>
                      <div style={{ flex: 1, height: '14px', background: '#f3f4f6', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        {/* Score bar */}
                        <div style={{ 
                          width: `${score}%`, 
                          height: '100%', 
                          background: barColor,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                        {/* Goal marker */}
                        <div style={{
                          position: 'absolute',
                          left: `${goal}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '8px',
                          height: '8px',
                          background: '#1a1a1a',
                          borderRadius: '50%',
                          border: '1.5px solid white'
                        }} />
                      </div>
                      <div style={{ width: '35px', fontSize: '9px', fontWeight: '600', color: '#1a1a1a', textAlign: 'right', flexShrink: 0 }}>
                        {score}%
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '20px', height: '8px', background: '#3b82f6', borderRadius: '2px' }} />
                  <span style={{ fontSize: '7px', color: '#6b7280' }}>Score</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#1a1a1a', borderRadius: '50%', border: '1px solid #d1d5db' }} />
                  <span style={{ fontSize: '7px', color: '#6b7280' }}>Goal</span>
                </div>
              </div>
            </div>
            </div>{/* end pdf-section subject-performance */}

            {/* === PDF SECTION 4: Study Recommendations === */}
            {displayedSubjects.some(s => (s.studyRecommendation || s.classStudyRecommendation)) && (
              <div className="pdf-section" data-section="study-recommendations" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBookMarked /></span>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#065f46' }}>Study Recommendations</h3>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#065f46', color: 'white' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '600', fontSize: '11px', width: '120px', borderRadius: '4px 0 0 0' }}>Subject</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '600', fontSize: '11px' }}>Class Recommendation (Applies to all)</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '600', fontSize: '11px', borderRadius: '0 4px 0 0' }}>Teacher’s Note for Your Child</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSubjects
                      .filter(s => (s.studyRecommendation || s.classStudyRecommendation))
                      .map((subject, index) => (
                        <tr key={subject.name} style={{ background: index % 2 === 0 ? '#fffbeb' : '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
                          <td style={{ padding: '6px 10px', fontWeight: '600', color: '#1a1a1a', fontSize: '11px' }}>{subject.name}</td>
                          <td style={{ padding: '6px 10px', fontSize: '10px', color: '#374151', lineHeight: '1.5' }}>
                            {subject.classStudyRecommendation?.trim() || "-"}
                          </td>
                          <td style={{ padding: '6px 10px', fontSize: '10px', color: '#374151', lineHeight: '1.5' }}>
                            {subject.studyRecommendation?.trim() || "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* === PDF SECTION 5: Homeroom Comment + Achievements + Signatures === */}
            <div className="pdf-section" data-section="homeroom-footer">
            {/* Homeroom Comment */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                <span style={{ color: '#065f46' }}><IconMessage /></span>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#065f46' }}>Homeroom Teacher's Comment</h3>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>{homeroomComment}</p>
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconTrophy /></span>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#065f46' }}>Academic Achievements</h3>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {achievements.map((achievement, index) => (
                    <div key={index} style={{ 
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)', 
                      border: '1px solid #fcd34d', 
                      padding: '14px 18px', 
                      borderRadius: '10px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                      <span style={{ color: '#78350f' }}>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px', paddingTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '35px', marginBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <svg width="80" height="30" viewBox="0 0 80 30" style={{ opacity: 0.85 }}>
                    <path d="M5 20 Q15 5, 25 15 T45 12 Q55 8, 65 18 Q70 22, 75 15" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M20 22 Q30 25, 40 20" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ borderTop: '1px solid #374151', paddingTop: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{headOfSchoolName}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Head of School</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '35px', marginBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <svg width="80" height="30" viewBox="0 0 80 30" style={{ opacity: 0.85 }}>
                    <path d="M10 18 Q20 8, 30 20 Q40 28, 50 15 Q60 5, 70 18" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M25 10 L35 8 M55 20 Q60 22, 65 18" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ borderTop: '1px solid #374151', paddingTop: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{principalName}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Senior Principal</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '35px', marginBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <svg width="80" height="30" viewBox="0 0 80 30" style={{ opacity: 0.85 }}>
                    <path d="M8 15 Q18 5, 28 18 T48 10 Q58 8, 68 20" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M15 20 Q25 24, 35 18 M60 15 L70 12" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ borderTop: '1px solid #374151', paddingTop: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{deputyPrincipalName}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Deputy Principal</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>
            </div>{/* end pdf-section homeroom-footer */}
          </div>{/* end reportRef */}
          </div>{/* end flex justify-center */}
        </div>{/* end flex-1 overflow */}
      </DialogContent>
    </Dialog>
  );
}
