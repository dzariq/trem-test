// Box Plot Mock Data - 6 Years of Assessment Records
// This provides historical student score data for box & whisker analysis

import { classRosters } from "./teacherMockData";
import { allSubjects } from "./subjectsConfig";

export interface AssessmentRecord {
  student_id: string;
  student_name: string;
  academic_year: string; // "2021", "2022", etc.
  subject: string;
  exam_type: "Mid-Year" | "Year-End";
  score_numeric: number; // 0-100 (normalized)
  class_id: string;
  year_group: string; // "Year 5", "Year 4", etc.
}

// Helper to generate realistic score with progression over years
function generateScore(baseScore: number, yearOffset: number, variance: number = 15): number {
  // Students generally improve over time, with some variance
  const progression = yearOffset * 2; // 2 points per year improvement on average
  const randomVariance = (Math.random() - 0.5) * variance * 2;
  const score = Math.round(baseScore + progression + randomVariance);
  return Math.max(0, Math.min(100, score));
}

// Generate 6 years of data for all students
function generateAssessmentRecords(): AssessmentRecord[] {
  const records: AssessmentRecord[] = [];
  const academicYears = ["2021", "2022", "2023", "2024", "2025", "2026"];
  const examTypes: ("Mid-Year" | "Year-End")[] = ["Mid-Year", "Year-End"];
  
  // Map classes to year groups
  const classYearGroups: Record<string, string> = {
    "5A": "Year 5",
    "5B": "Year 5",
    "4A": "Year 4",
  };

  // Generate for each class
  Object.entries(classRosters).forEach(([classId, students]) => {
    const yearGroup = classYearGroups[classId] || "Year 5";
    
    students.forEach((student) => {
      // Each student has a base performance level (some are stronger, some weaker)
      const studentBaseLevel = 40 + Math.random() * 40; // Base between 40-80
      
      academicYears.forEach((year, yearIndex) => {
        examTypes.forEach((examType) => {
          // Generate scores for each subject
          allSubjects.forEach((subject) => {
            // Subject-specific variance (some students are better at certain subjects)
            const subjectModifier = (Math.random() - 0.5) * 20;
            
            // Year-End exams typically have slightly different scores than Mid-Year
            const examModifier = examType === "Year-End" ? Math.random() * 5 : 0;
            
            const score = generateScore(
              studentBaseLevel + subjectModifier + examModifier,
              yearIndex,
              15
            );
            
            records.push({
              student_id: student.id,
              student_name: student.name,
              academic_year: year,
              subject,
              exam_type: examType,
              score_numeric: score,
              class_id: classId,
              year_group: yearGroup,
            });
          });
        });
      });
    });
  });

  return records;
}

// Pre-generate the data
export const assessmentRecords: AssessmentRecord[] = generateAssessmentRecords();

// Helper to get all unique students
export function getAllStudents(): { id: string; name: string; class_id: string; year_group: string }[] {
  const studentMap = new Map<string, { id: string; name: string; class_id: string; year_group: string }>();
  
  assessmentRecords.forEach(record => {
    if (!studentMap.has(record.student_id)) {
      studentMap.set(record.student_id, {
        id: record.student_id,
        name: record.student_name,
        class_id: record.class_id,
        year_group: record.year_group,
      });
    }
  });
  
  return Array.from(studentMap.values());
}

// Helper to get unique academic years with data
export function getAvailableYears(): string[] {
  const years = new Set<string>();
  assessmentRecords.forEach(record => years.add(record.academic_year));
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
}
