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

const behaviorGradeColors: Record<string, { bg: string; text: string }> = {
  "A": { bg: "#dcfce7", text: "#16a34a" },
  "B": { bg: "#dbeafe", text: "#2563eb" },
  "C": { bg: "#fef3c7", text: "#ca8a04" },
  "D": { bg: "#fee2e2", text: "#dc2626" },
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

            {/* Grading Key - Now at top */}
            <div style={{ marginBottom: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: '600', marginBottom: '6px', color: '#065f46', fontSize: '10px' }}>Academic Grading Key:</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(gradeColors).map(([grade, colors]) => (
                  <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '700', 
                      fontSize: '10px',
                      backgroundColor: colors.bg,
                      color: colors.text
                    }}>
                      {grade}
                    </span>
                    <span style={{ fontSize: '9px', color: '#374151' }}>{grade === "A*" ? "90-100%" : grade === "A" ? "80-89%" : grade === "B" ? "70-79%" : grade === "C" ? "60-69%" : grade === "D" ? "50-59%" : "0-49%"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Info Row with Attitude & Behaviour */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {/* Student Name & Class */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46', marginBottom: '2px' }}>{studentName}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Class: {studentClass}</div>
              </div>
              
              {/* Attitude & Behaviour - Compact */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#065f46', marginBottom: '6px' }}>⭐ Attitude & Behaviour</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {behavior.slice(0, 4).map((item) => {
                    const behaviorColor = behaviorGradeColors[item.grade] || behaviorGradeColors["C"];
                    return (
                      <div key={item.category} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.category}</div>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          fontWeight: '700', 
                          fontSize: '11px',
                          backgroundColor: behaviorColor.bg,
                          color: behaviorColor.text
                        }}>
                          {item.grade}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {behavior.length > 4 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                    {behavior.slice(4).map((item) => {
                      const behaviorColor = behaviorGradeColors[item.grade] || behaviorGradeColors["C"];
                      return (
                        <div key={item.category} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.category}</div>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            fontWeight: '700', 
                            fontSize: '11px',
                            backgroundColor: behaviorColor.bg,
                            color: behaviorColor.text
                          }}>
                            {item.grade}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Overall Average & Attendance Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#065f46' }}>{overallAverage}%</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Overall Average</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#065f46' }}>{attendance.percentage}%</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Attendance</div>
              </div>
            </div>

            {/* Academic Grades Table */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #d1fae5' }}>
                📚 Academic Grades
              </h3>
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
                  {subjects.map((subject, index) => {
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
