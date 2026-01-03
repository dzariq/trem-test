import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import collinzLogo from "@/assets/collinz-school-logo.png";
import schoolBadge from "@/assets/school-badge.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";

interface Subject {
  name: string;
  score: number | null;
  grade: string;
  teacherComment: string;
}

interface SubjectComparison {
  name: string;
  midYear: { score: number | null; grade: string };
  yearEnd: { score: number | null; grade: string };
  teacherComment: string;
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
  subjectsComparison?: SubjectComparison[];
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
  "A*": { bg: "#059669", text: "#ffffff", border: "#047857" },
  "A": { bg: "#22c55e", text: "#ffffff", border: "#16a34a" },
  "B": { bg: "#3b82f6", text: "#ffffff", border: "#2563eb" },
  "C": { bg: "#eab308", text: "#000000", border: "#ca8a04" },
  "D": { bg: "#f97316", text: "#ffffff", border: "#ea580c" },
  "E": { bg: "#ef4444", text: "#ffffff", border: "#dc2626" },
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
  subjectsComparison,
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #065f46', paddingBottom: '10px', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
              <img src={collinzLogo} alt="Collinz School" style={{ height: '40px', objectFit: 'contain' }} />
              <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', color: 'white', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', fontWeight: '600', opacity: 0.9, letterSpacing: '0.5px' }}>ACADEMIC REPORT</div>
                <div style={{ fontSize: '11px', fontWeight: '700' }}>{examType} {year}</div>
              </div>
              <img src={cambridgeLogo} alt="Cambridge Assessment" style={{ height: '35px', objectFit: 'contain' }} />
            </div>

            {/* Student Info Row with Attitude & Behaviour - Side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {/* Student Name, Class, Overall Average & Attendance - Green & Gold Gradient with Pattern */}
              <div style={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #dcfce7 0%, #fef9c3 50%, #fde68a 100%)', 
                border: '1px solid #bbf7d0', 
                borderRadius: '12px', 
                padding: '10px',
                overflow: 'hidden'
              }}>
                {/* School Badge Watermark with gradient fade */}
                <div style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '-20px',
                  width: '160px',
                  height: '160px',
                  pointerEvents: 'none',
                  maskImage: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
                  WebkitMaskImage: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)'
                }}>
                  <img 
                    src={schoolBadge} 
                    alt="" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: 0.25
                    }} 
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>{studentName}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>Y10I</div>
                  </div>
                  
                  {/* Overall Average & Attendance inside the name box */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                    {/* Overall Average - Liquid Glass Style */}
                    <div style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', padding: '4px 8px' }}>
                        <div style={{ fontSize: '7px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Average</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '8px 8px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#065f46' }}>{overallAverage}%</div>
                      </div>
                    </div>
                    {/* Attendance - Liquid Glass Style */}
                    <div style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.4)' }}>
                      <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', padding: '4px 8px' }}>
                        <div style={{ fontSize: '7px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: attendance.percentage >= 90 ? '#16a34a' : attendance.percentage >= 75 ? '#ca8a04' : '#dc2626' }}>{attendance.percentage}%</span>
                          <div style={{ fontSize: '9px', color: '#374151', fontWeight: '600', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.5)' }}>
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
              </div>
              
            {/* Attitude & Behaviour - Card Style */}
              <div style={{ borderRadius: '12px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px' }}>⭐</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#065f46' }}>Attitude & Behaviour</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
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
                        minHeight: '48px'
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

            {/* Academic Grades Table with Grading Key */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #d1fae5' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📚 Academic Grades
                  </h3>
                  {/* Compact Grading Key Legend */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {Object.entries(gradeColors).map(([grade, colors]) => (
                      <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '3px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '700', 
                          fontSize: '8px',
                          backgroundColor: colors.bg,
                          color: colors.text
                        }}>
                          {grade}
                        </span>
                        <span style={{ fontSize: '7px', color: '#6b7280' }}>{grade === "A*" ? "90+" : grade === "A" ? "80+" : grade === "B" ? "70+" : grade === "C" ? "60+" : grade === "D" ? "50+" : "<50"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              {subjectsComparison && subjectsComparison.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', borderRadius: '6px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}>
                      <th rowSpan={2} style={{ color: 'white', padding: '6px 4px', textAlign: 'left', fontWeight: '600', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Subject</th>
                      <th colSpan={2} style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '600', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>MID-YEAR</th>
                      <th colSpan={2} style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '600' }}>YEAR-END</th>
                    </tr>
                    <tr style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}>
                      <th style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '500', fontSize: '7px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>MARK%</th>
                      <th style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '500', fontSize: '7px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>GRADE</th>
                      <th style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '500', fontSize: '7px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>MARK%</th>
                      <th style={{ color: 'white', padding: '4px', textAlign: 'center', fontWeight: '500', fontSize: '7px' }}>GRADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsComparison.slice(0, 13).map((subject, index) => {
                      const midGradeColor = gradeColors[subject.midYear.grade] || gradeColors["C"];
                      const yearGradeColor = gradeColors[subject.yearEnd.grade] || gradeColors["C"];
                      return (
                        <tr key={subject.name} style={{ background: index % 2 === 0 ? '#fef9c3' : 'white' }}>
                          <td style={{ padding: '5px 4px', borderBottom: '1px solid #e5e7eb', fontWeight: '500', borderRight: '1px solid #e5e7eb' }}>
                            {subject.name}
                          </td>
                          <td style={{ padding: '5px 4px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600', borderRight: '1px solid #f3f4f6' }}>
                            {subject.midYear.score !== null ? subject.midYear.score : '-'}
                          </td>
                          <td style={{ padding: '5px 4px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              minWidth: '24px', 
                              padding: '2px 6px', 
                              borderRadius: '3px', 
                              fontWeight: '600', 
                              fontSize: '9px',
                              backgroundColor: midGradeColor.bg,
                              color: midGradeColor.text
                            }}>
                              {subject.midYear.grade || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '5px 4px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600', borderRight: '1px solid #f3f4f6' }}>
                            {subject.yearEnd.score !== null ? subject.yearEnd.score : '-'}
                          </td>
                          <td style={{ padding: '5px 4px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              minWidth: '24px', 
                              padding: '2px 6px', 
                              borderRadius: '3px', 
                              fontWeight: '600', 
                              fontSize: '9px',
                              backgroundColor: yearGradeColor.bg,
                              color: yearGradeColor.text
                            }}>
                              {subject.yearEnd.grade || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}>
                      <th style={{ color: 'white', padding: '8px 6px', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                      <th style={{ color: 'white', padding: '8px 6px', textAlign: 'center', fontWeight: '600', width: '60px' }}>Score</th>
                      <th style={{ color: 'white', padding: '8px 6px', textAlign: 'center', fontWeight: '600', width: '50px' }}>Grade</th>
                      <th style={{ color: 'white', padding: '8px 6px', textAlign: 'left', fontWeight: '600' }}>Teacher&apos;s Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSubjects.map((subject, index) => {
                      const gradeColor = gradeColors[subject.grade] || gradeColors["C"];
                      const getRowBg = (grade: string) => {
                        if (grade === "A*" || grade === "A") return 'rgba(220, 252, 231, 0.5)';
                        if (grade === "B") return 'rgba(219, 234, 254, 0.4)';
                        if (grade === "C") return 'rgba(254, 243, 199, 0.4)';
                        if (grade === "D") return 'rgba(254, 215, 170, 0.4)';
                        if (grade === "E") return 'rgba(254, 226, 226, 0.4)';
                        return index % 2 === 0 ? 'white' : '#f9fafb';
                      };
                      return (
                        <tr key={subject.name} style={{ position: 'relative', background: getRowBg(subject.grade) }}>
                          <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                            <span style={{ position: 'relative', zIndex: 1 }}>{subject.name}</span>
                          </td>
                          <td style={{ position: 'relative', padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600', overflow: 'hidden' }}>
                            <span style={{ 
                              position: 'absolute', 
                              left: '50%', 
                              bottom: '-10px', 
                              transform: 'translateX(-50%)',
                              fontSize: '42px', 
                              fontWeight: '900', 
                              color: gradeColor.bg, 
                              opacity: 0.35,
                              pointerEvents: 'none',
                              lineHeight: 1
                            }}>
                              {subject.grade}
                            </span>
                            <span style={{ position: 'relative', zIndex: 1 }}>{subject.score !== null ? `${subject.score}%` : 'Pending'}</span>
                          </td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              minWidth: '30px', 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontWeight: '600', 
                              fontSize: '10px',
                              backgroundColor: gradeColor.bg,
                              color: gradeColor.text
                            }}>
                              {subject.grade}
                            </span>
                          </td>
                          <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', fontSize: '9px', color: '#6b7280' }}>{subject.teacherComment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              </div>
            </div>

            {/* Homeroom Comment */}
            <div style={{ position: 'relative', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', marginBottom: '12px', overflow: 'hidden' }}>
              {/* Chat bubble pattern at right corner */}
              <div style={{ 
                position: 'absolute', 
                right: '8px', 
                bottom: '6px', 
                fontSize: '32px', 
                opacity: 0.1, 
                pointerEvents: 'none',
                display: 'flex',
                gap: '4px'
              }}>
                <span>💬</span>
                <span style={{ fontSize: '20px', marginTop: '8px' }}>💬</span>
              </div>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>💬 Homeroom Teacher&apos;s Comment</h4>
              <p style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.5', position: 'relative', zIndex: 1 }}>{homeroomComment}</p>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ position: 'relative', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)', borderRadius: '10px', padding: '12px', marginBottom: '12px', overflow: 'hidden' }}>
                {/* Trophy pattern at right corner */}
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  bottom: '10px', 
                  fontSize: '48px', 
                  opacity: 0.2, 
                  pointerEvents: 'none',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-end'
                }}>
                  <span>🏆</span>
                  <span style={{ fontSize: '32px' }}>🏆</span>
                </div>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '8px', position: 'relative', zIndex: 1 }}>🏆 Academic Achievements</h4>
                <div style={{ display: 'grid', gap: '4px', position: 'relative', zIndex: 1 }}>
                  {achievements.map((achievement, index) => (
                    <div key={index} style={{ background: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⭐</span>
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{headOfSchoolName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Head of School</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{principalName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Senior Principal</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '30px', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#1a1a1a' }}>{deputyPrincipalName}</div>
                <div style={{ fontSize: '9px', color: '#6b7280' }}>Deputy Principal</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
