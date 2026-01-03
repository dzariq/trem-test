import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Star, BookOpen, MessageSquare, Trophy, Award, BookMarked, Target } from "lucide-react";
import collinzLogo from "@/assets/collinz-school-logo.png";
import schoolBadge from "@/assets/school-badge.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";

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

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${studentName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              background: #fff;
              color: #1a1a1a;
              line-height: 1.5;
            }
            
            @page {
              size: A4;
              margin: 12mm;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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
          <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 py-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
          {/* Portrait container wrapper */}
          <div className="flex justify-center">
            <div ref={reportRef} className="bg-white rounded-lg shadow-lg" style={{ width: 'min(100%, 210mm)', padding: '12px', fontSize: '10px' }}>
            
            {/* Header with both logos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
              <img src={collinzLogo} alt="Collinz School" style={{ height: '40px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Academic Report</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{examType} {year}</div>
              </div>
              <img src={cambridgeLogo} alt="Cambridge Assessment" style={{ height: '35px', objectFit: 'contain' }} />
            </div>

            {/* Student Info Row with Attitude & Behaviour - Side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '8px', marginBottom: '10px' }}>
              {/* Student Name, Class, Overall Average & Attendance */}
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>{studentName}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', background: '#f0fdf4', padding: '3px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>Y10I</div>
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
                        <div style={{ fontSize: '6px', color: '#16a34a', background: 'rgba(220, 252, 231, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600' }}>P: {attendance.present}</div>
                        <div style={{ fontSize: '6px', color: '#dc2626', background: 'rgba(254, 226, 226, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600' }}>A: {attendance.absent}</div>
                        <div style={{ fontSize: '6px', color: '#ca8a04', background: 'rgba(254, 243, 199, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600' }}>L: {attendance.late}</div>
                        <div style={{ fontSize: '6px', color: '#7c3aed', background: 'rgba(237, 233, 254, 0.8)', padding: '2px 5px', borderRadius: '10px', fontWeight: '600' }}>E: {attendance.excused}</div>
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
                          bottom: '-4px',
                          fontSize: '36px',
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
                    const yearEndScore = subject.yearEndScore !== undefined ? subject.yearEndScore : (subject.score !== null ? Math.min(100, Math.max(0, subject.score + Math.floor(Math.random() * 15) - 5)) : null);
                    const getGradeFromScore = (score: number | null): string => {
                      if (score === null) return 'C';
                      if (score >= 90) return 'A*';
                      if (score >= 80) return 'A';
                      if (score >= 70) return 'B';
                      if (score >= 60) return 'C';
                      if (score >= 50) return 'D';
                      return 'E';
                    };
                    const derivedYearEndGrade = subject.yearEndGrade || getGradeFromScore(yearEndScore);
                    const derivedYearEndGradeColor = gradeColors[derivedYearEndGrade] || gradeColors["C"];
                    const midYearBgColor = gradeCardBgColors[subject.grade] || 'white';
                    const yearEndBgColor = gradeCardBgColors[derivedYearEndGrade] || 'white';
                    const rowAltBg = index % 2 === 0 ? 'white' : '#f9fafb';
                    
                    return (
                      <tr key={subject.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 8px', fontWeight: '600', color: '#1a1a1a', fontSize: '8px', background: rowAltBg }}>{subject.name}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', position: 'relative', background: midYearBgColor, overflow: 'hidden' }}>
                          {/* Watermark Grade */}
                          <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '30px',
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
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '30px',
                            fontWeight: '900',
                            opacity: 0.15,
                            color: derivedYearEndGradeColor.bg,
                            pointerEvents: 'none',
                            lineHeight: 1
                          }}>
                            {derivedYearEndGrade}
                          </span>
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a1a' }}>{yearEndScore !== null ? `${yearEndScore}%` : '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '7px', color: '#374151', lineHeight: '1.4', background: rowAltBg }}>{subject.teacherComment || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Learning Tips - Separate Table */}
            {displayedSubjects.some(s => s.classStudyRecommendation || s.studyRecommendation) && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBookMarked /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Learning Tips</h3>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                  <thead>
                    <tr style={{ background: '#065f46', color: 'white' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: '600', fontSize: '8px', width: '120px', borderRadius: '4px 0 0 0' }}>Subject</th>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: '600', fontSize: '8px', borderRadius: '0 4px 0 0' }}>Learning Tips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSubjects
                      .filter(s => s.classStudyRecommendation || s.studyRecommendation)
                      .map((subject, index) => (
                        <tr key={subject.name} style={{ background: index % 2 === 0 ? '#fffbeb' : '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
                          <td style={{ padding: '5px 8px', fontWeight: '600', color: '#1a1a1a', fontSize: '8px' }}>{subject.name}</td>
                          <td style={{ padding: '5px 8px', fontSize: '7px', color: '#374151', lineHeight: '1.4' }}>
                            {subject.classStudyRecommendation || '-'}
                            {subject.studyRecommendation && (
                              <div style={{ marginTop: '4px' }}>
                                <span style={{ 
                                  display: 'inline-block',
                                  background: '#065f46', 
                                  color: 'white', 
                                  padding: '1px 6px', 
                                  borderRadius: '8px', 
                                  fontSize: '6px', 
                                  fontWeight: '600',
                                  marginRight: '4px'
                                }}>Individual Tips</span>
                                <span>{subject.studyRecommendation}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Homeroom Comment */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                <span style={{ color: '#065f46' }}><IconMessage /></span>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Homeroom Teacher's Comment</h3>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px' }}>
                <p style={{ fontSize: '10px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>{homeroomComment}</p>
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconTrophy /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Academic Achievements</h3>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {achievements.map((achievement, index) => (
                    <div key={index} style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#ca8a04' }}><IconAward /></span>
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #d1d5db' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #374151', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{headOfSchoolName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Head of School</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #374151', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{principalName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Senior Principal</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #374151', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{deputyPrincipalName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Deputy Principal</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
