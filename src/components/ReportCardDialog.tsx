import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";

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
  schoolName = "Collinz Excellence School",
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
              margin: 15mm;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
            }
            
            .report-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px solid #065f46;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            
            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            
            .school-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            
            .school-info h1 {
              font-size: 20px;
              font-weight: 700;
              color: #065f46;
              margin-bottom: 4px;
            }
            
            .school-info p {
              font-size: 11px;
              color: #6b7280;
              font-style: italic;
            }
            
            .exam-badge {
              background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              text-align: center;
            }
            
            .exam-badge h2 {
              font-size: 14px;
              font-weight: 600;
            }
            
            .exam-badge p {
              font-size: 11px;
              opacity: 0.9;
            }
            
            .student-info {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .student-name {
              font-size: 18px;
              font-weight: 700;
              color: #065f46;
            }
            
            .student-class {
              font-size: 13px;
              color: #6b7280;
            }
            
            .attendance-box {
              text-align: center;
              background: white;
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid #d1fae5;
            }
            
            .attendance-box .value {
              font-size: 24px;
              font-weight: 700;
              color: #065f46;
            }
            
            .attendance-box .label {
              font-size: 10px;
              color: #6b7280;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #065f46;
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 2px solid #d1fae5;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .grades-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            
            .grades-table th {
              background: #065f46;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
            }
            
            .grades-table th:first-child {
              border-radius: 8px 0 0 0;
            }
            
            .grades-table th:last-child {
              border-radius: 0 8px 0 0;
            }
            
            .grades-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .grades-table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .grades-table tr:last-child td:first-child {
              border-radius: 0 0 0 8px;
            }
            
            .grades-table tr:last-child td:last-child {
              border-radius: 0 0 8px 0;
            }
            
            .grade-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 36px;
              padding: 4px 10px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 11px;
            }
            
            .score-cell {
              text-align: center;
              font-weight: 600;
            }
            
            .behavior-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            
            .behavior-item {
              background: #f9fafb;
              border-radius: 8px;
              padding: 12px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            
            .behavior-item .category {
              font-size: 10px;
              color: #6b7280;
              margin-bottom: 6px;
            }
            
            .behavior-item .grade {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              font-weight: 700;
              font-size: 14px;
            }
            
            .comment-box {
              background: #fef3c7;
              border: 1px solid #fcd34d;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }
            
            .comment-box h4 {
              font-size: 12px;
              font-weight: 600;
              color: #92400e;
              margin-bottom: 8px;
            }
            
            .comment-box p {
              font-size: 12px;
              color: #78350f;
              line-height: 1.6;
            }
            
            .achievements-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }
            
            .achievements-box h4 {
              font-size: 12px;
              font-weight: 600;
              color: #92400e;
              margin-bottom: 10px;
            }
            
            .achievement-item {
              background: white;
              padding: 8px 12px;
              border-radius: 6px;
              margin-bottom: 6px;
              font-size: 11px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .signatures {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              border-bottom: 1px solid #1a1a1a;
              height: 40px;
              margin-bottom: 8px;
            }
            
            .signature-name {
              font-size: 11px;
              font-weight: 600;
              color: #1a1a1a;
            }
            
            .signature-title {
              font-size: 10px;
              color: #6b7280;
            }
            
            .grading-key {
              margin-top: 20px;
              padding: 12px;
              background: #f9fafb;
              border-radius: 8px;
              font-size: 9px;
            }
            
            .grading-key-title {
              font-weight: 600;
              margin-bottom: 6px;
              color: #374151;
            }
            
            .grading-key-items {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            
            .grading-key-item {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            
            .key-badge {
              width: 20px;
              height: 20px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 9px;
            }
            
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
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
          <div ref={reportRef} className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '210mm', padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #065f46', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={schoolLogo} alt="School Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>{schoolName}</h1>
                  <p style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>Sowing Seeds of Excellence</p>
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', color: 'white', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600' }}>ACADEMIC REPORT</h2>
                <p style={{ fontSize: '11px', opacity: 0.9 }}>{examType} {year}</p>
              </div>
            </div>

            {/* Student Info */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#065f46' }}>{studentName}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Class: {studentClass}</div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>{overallAverage}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Overall Average</div>
                </div>
                <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>{attendance.percentage}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Attendance</div>
                </div>
              </div>
            </div>

            {/* Academic Grades Table */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #d1fae5' }}>
                📚 Academic Grades
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#065f46', color: 'white', padding: '10px 8px', textAlign: 'left', fontWeight: '600', borderRadius: '8px 0 0 0' }}>Subject</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '10px 8px', textAlign: 'center', fontWeight: '600' }}>Score</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '10px 8px', textAlign: 'center', fontWeight: '600' }}>Grade</th>
                    <th style={{ background: '#065f46', color: 'white', padding: '10px 8px', textAlign: 'left', fontWeight: '600', borderRadius: '0 8px 0 0' }}>Teacher's Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => {
                    const gradeColor = gradeColors[subject.grade] || gradeColors["C"];
                    return (
                      <tr key={subject.name} style={{ background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>{subject.name}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600' }}>
                          {subject.score !== null ? `${subject.score}%` : 'Pending'}
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            minWidth: '36px', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontWeight: '600', 
                            fontSize: '11px',
                            backgroundColor: gradeColor.bg,
                            color: gradeColor.text
                          }}>
                            {subject.grade}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '10px', color: '#6b7280' }}>{subject.teacherComment}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Attitude & Behaviour */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', marginBottom: '12px', paddingBottom: '6px', borderBottom: '2px solid #d1fae5' }}>
                ⭐ Attitude & Behaviour
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {behavior.map((item) => {
                  const behaviorColor = behaviorGradeColors[item.grade] || behaviorGradeColors["C"];
                  return (
                    <div key={item.category} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>{item.category}</div>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        fontWeight: '700', 
                        fontSize: '14px',
                        backgroundColor: behaviorColor.bg,
                        color: behaviorColor.text
                      }}>
                        {item.grade}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Homeroom Comment */}
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>💬 Homeroom Teacher's Comment</h4>
              <p style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6' }}>{homeroomComment}</p>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '10px' }}>🏆 Academic Achievements</h4>
                {achievements.map((achievement, index) => (
                  <div key={index} style={{ background: 'white', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⭐</span>
                    {achievement}
                  </div>
                ))}
              </div>
            )}

            {/* Grading Key */}
            <div style={{ marginTop: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '9px' }}>
              <div style={{ fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Academic Grading Key:</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(gradeColors).map(([grade, colors]) => (
                  <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '600', 
                      fontSize: '9px',
                      backgroundColor: colors.bg,
                      color: colors.text
                    }}>
                      {grade}
                    </span>
                    <span>{grade === "A*" ? "90-100%" : grade === "A" ? "80-89%" : grade === "B" ? "70-79%" : grade === "C" ? "60-69%" : grade === "D" ? "50-59%" : "0-49%"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '40px', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a1a' }}>{headOfSchoolName}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Head of School</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '40px', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a1a' }}>{principalName}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Senior Principal</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #1a1a1a', height: '40px', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a1a' }}>{deputyPrincipalName}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Deputy Principal</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', color: '#9ca3af', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
