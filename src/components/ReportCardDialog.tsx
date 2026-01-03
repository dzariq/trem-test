import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import collinzLogo from "@/assets/collinz-school-logo.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";

interface Subject {
  name: string;
  score: number | null;
  grade: string;
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
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-12">
          <DialogTitle>Report Card Preview</DialogTitle>
          <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div ref={reportRef} className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '210mm', padding: '16px', fontSize: '11px' }}>
            
            {/* Header with both logos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #065f46', paddingBottom: '12px', marginBottom: '12px' }}>
              <img src={collinzLogo} alt="Collinz School" style={{ height: '60px', objectFit: 'contain' }} />
              <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', color: 'white', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>ACADEMIC REPORT</div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>{examType} {year}</div>
              </div>
              <img src={cambridgeLogo} alt="Cambridge Assessment" style={{ height: '50px', objectFit: 'contain' }} />
            </div>

            {/* Student Info Row with Attitude & Behaviour side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '12px' }}>
              {/* Student Name, Class, Overall Average & Attendance - Green & Gold Gradient with Pattern */}
              <div style={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #dcfce7 0%, #fef9c3 50%, #fde68a 100%)', 
                border: '1px solid #bbf7d0', 
                borderRadius: '12px', 
                padding: '14px',
                overflow: 'hidden'
              }}>
                {/* Star Pattern Background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.15,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23065f46' d='M20 2l2.5 7.5H30l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h7.5z'/%3E%3C/svg%3E")`,
                  backgroundSize: '40px 40px'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#065f46', marginBottom: '2px' }}>{studentName}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>Class: {studentClass}</div>
                  
                  {/* Overall Average & Attendance inside the name box */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.85)', padding: '8px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#065f46' }}>{overallAverage}%</div>
                      <div style={{ fontSize: '9px', color: '#6b7280' }}>Overall Average</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: attendance.percentage >= 90 ? '#16a34a' : attendance.percentage >= 75 ? '#ca8a04' : '#dc2626' }}>{attendance.percentage}%</span>
                          <span style={{ fontSize: '9px', color: '#6b7280', marginLeft: '4px' }}>Attendance</span>
                        </div>
                        <div style={{ fontSize: '9px', color: '#374151', fontWeight: '500' }}>
                          {attendance.present}/{attendance.totalDays} days
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '7px', color: '#16a34a', background: '#dcfce7', padding: '2px 5px', borderRadius: '4px' }}>
                          Present: {attendance.present}
                        </div>
                        <div style={{ fontSize: '7px', color: '#dc2626', background: '#fee2e2', padding: '2px 5px', borderRadius: '4px' }}>
                          Absent: {attendance.absent}
                        </div>
                        <div style={{ fontSize: '7px', color: '#ca8a04', background: '#fef3c7', padding: '2px 5px', borderRadius: '4px' }}>
                          Late: {attendance.late}
                        </div>
                        <div style={{ fontSize: '7px', color: '#2563eb', background: '#dbeafe', padding: '2px 5px', borderRadius: '4px' }}>
                          Excused: {attendance.excused}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
            <div style={{ position: 'relative', marginBottom: '16px', overflow: 'hidden' }}>
              {/* Stars Pattern Background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.06,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath fill='%23065f46' d='M25 5l3.5 10.5H39l-8.5 6.5 3.5 10.5-9-7-9 7 3.5-10.5L11 15.5h10.5z'/%3E%3C/svg%3E")`,
                backgroundSize: '50px 50px',
                pointerEvents: 'none'
              }} />
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#065f46', color: 'white', padding: '8px 6px', textAlign: 'left', fontWeight: '600', borderRadius: '6px 0 0 0' }}>Subject</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '8px 6px', textAlign: 'center', fontWeight: '600', width: '60px' }}>Score</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '8px 6px', textAlign: 'center', fontWeight: '600', width: '50px' }}>Grade</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '8px 6px', textAlign: 'left', fontWeight: '600', borderRadius: '0 6px 0 0' }}>Teacher's Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubjects.map((subject, index) => {
                    const gradeColor = gradeColors[subject.grade] || gradeColors["C"];
                    return (
                      <tr key={subject.name} style={{ background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>{subject.name}</td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600' }}>
                          {subject.score !== null ? `${subject.score}%` : 'Pending'}
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
              </div>
            </div>

            {/* Homeroom Comment */}
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>💬 Homeroom Teacher's Comment</h4>
              <p style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.5' }}>{homeroomComment}</p>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>🏆 Academic Achievements</h4>
                <div style={{ display: 'grid', gap: '4px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
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
      </DialogContent>
    </Dialog>
  );
}
