// Mock data for teacher portal

export const teacherProfile = {
  id: "TCH-2024-001",
  name: "Ms. Sarah Chen",
  email: "sarah.chen@school.edu",
  phone: "+1 234 567 8901",
  subjects: ["Mathematics (Y7)", "Mathematics (Y10)", "Science (Y1)"],
  classes: ["5A", "5B", "4A"]
};

export const classRosters = {
  "5A": [
    { id: "STU-001", name: "Emma Johnson", photo: null },
    { id: "STU-002", name: "Liam Smith", photo: null },
    { id: "STU-003", name: "Olivia Brown", photo: null },
    { id: "STU-004", name: "Noah Davis", photo: null },
    { id: "STU-005", name: "Ava Wilson", photo: null },
    { id: "STU-006", name: "James Miller", photo: null },
    { id: "STU-007", name: "Isabella Garcia", photo: null },
    { id: "STU-008", name: "Benjamin Martinez", photo: null },
    { id: "STU-009", name: "Sophia Anderson", photo: null },
    { id: "STU-010", name: "Lucas Taylor", photo: null },
  ],
  "5B": [
    { id: "STU-011", name: "Mia Thomas", photo: null },
    { id: "STU-012", name: "Ethan Jackson", photo: null },
    { id: "STU-013", name: "Charlotte White", photo: null },
    { id: "STU-014", name: "Alexander Harris", photo: null },
    { id: "STU-015", name: "Amelia Martin", photo: null },
    { id: "STU-016", name: "Daniel Thompson", photo: null },
    { id: "STU-017", name: "Harper Robinson", photo: null },
    { id: "STU-018", name: "Matthew Clark", photo: null },
    { id: "STU-019", name: "Evelyn Lewis", photo: null },
    { id: "STU-020", name: "Michael Lee", photo: null },
  ],
  "4A": [
    { id: "STU-021", name: "Abigail Walker", photo: null },
    { id: "STU-022", name: "Sebastian Hall", photo: null },
    { id: "STU-023", name: "Emily Young", photo: null },
    { id: "STU-024", name: "Jack Allen", photo: null },
    { id: "STU-025", name: "Elizabeth King", photo: null },
    { id: "STU-026", name: "Henry Wright", photo: null },
    { id: "STU-027", name: "Sofia Scott", photo: null },
    { id: "STU-028", name: "Owen Green", photo: null },
  ]
};

export const classAttendanceRecords: Record<string, Record<string, Record<string, "present" | "absent" | "late" | "excused">>> = {
  "5A": {
    "2026-01-01": {
      "STU-001": "present",
      "STU-002": "present",
      "STU-003": "absent",
      "STU-004": "present",
      "STU-005": "late",
      "STU-006": "present",
      "STU-007": "present",
      "STU-008": "excused",
      "STU-009": "present",
      "STU-010": "present",
    }
  }
};

// Detailed class grades with category breakdown per subject
export const detailedClassGrades: Record<string, Record<string, Record<string, {
  attitude: number;
  homework: number;
  quiz: number;
  exam: number;
}>>> = {
  "5A": {
    "STU-001": {
      "Mathematics": { attitude: 9, homework: 8, quiz: 9, exam: 62 },
      "Science": { attitude: 10, homework: 9, quiz: 8, exam: 58 },
      "English": { attitude: 8, homework: 7, quiz: 8, exam: 55 },
      "Arts": { attitude: 10, homework: 10, quiz: 9, exam: 60 },
      "Chinese as a Second Language": { attitude: 9, homework: 8, quiz: 8, exam: 56 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 10, exam: 65 },
    },
    "STU-002": {
      "Mathematics": { attitude: 7, homework: 6, quiz: 7, exam: 48 },
      "Science": { attitude: 8, homework: 7, quiz: 6, exam: 45 },
      "English": { attitude: 6, homework: 5, quiz: 6, exam: 42 },
      "Arts": { attitude: 9, homework: 8, quiz: 7, exam: 50 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 44 },
      "Physical Education": { attitude: 8, homework: 9, quiz: 8, exam: 55 },
    },
    "STU-003": {
      "Mathematics": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
      "Science": { attitude: 10, homework: 10, quiz: 9, exam: 65 },
      "English": { attitude: 9, homework: 9, quiz: 9, exam: 60 },
      "Arts": { attitude: 10, homework: 10, quiz: 10, exam: 67 },
      "Chinese as a Second Language": { attitude: 10, homework: 9, quiz: 10, exam: 64 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
    },
    "STU-004": {
      "Mathematics": { attitude: 6, homework: 5, quiz: 5, exam: 35 },
      "Science": { attitude: 5, homework: 4, quiz: 5, exam: 32 },
      "English": { attitude: 5, homework: 4, quiz: 4, exam: 30 },
      "Arts": { attitude: 7, homework: 6, quiz: 6, exam: 40 },
      "Chinese as a Second Language": { attitude: 6, homework: 5, quiz: 5, exam: 34 },
      "Physical Education": { attitude: 8, homework: 7, quiz: 7, exam: 45 },
    },
    "STU-005": {
      "Mathematics": { attitude: 8, homework: 8, quiz: 8, exam: 55 },
      "Science": { attitude: 9, homework: 8, quiz: 7, exam: 52 },
      "English": { attitude: 7, homework: 7, quiz: 7, exam: 48 },
      "Arts": { attitude: 9, homework: 9, quiz: 8, exam: 56 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 7, exam: 50 },
      "Physical Education": { attitude: 9, homework: 9, quiz: 9, exam: 58 },
    },
    "STU-006": {
      "Mathematics": { attitude: 7, homework: 7, quiz: 6, exam: 50 },
      "Science": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
      "English": { attitude: 6, homework: 6, quiz: 6, exam: 45 },
      "Arts": { attitude: 8, homework: 8, quiz: 7, exam: 52 },
      "Chinese as a Second Language": { attitude: 7, homework: 7, quiz: 6, exam: 47 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 54 },
    },
    "STU-007": {
      "Mathematics": { attitude: 9, homework: 9, quiz: 9, exam: 63 },
      "Science": { attitude: 10, homework: 9, quiz: 8, exam: 60 },
      "English": { attitude: 8, homework: 8, quiz: 8, exam: 58 },
      "Arts": { attitude: 10, homework: 9, quiz: 9, exam: 62 },
      "Chinese as a Second Language": { attitude: 9, homework: 8, quiz: 9, exam: 59 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 9, exam: 65 },
    },
    "STU-008": {
      "Mathematics": { attitude: 7, homework: 6, quiz: 7, exam: 52 },
      "Science": { attitude: 8, homework: 7, quiz: 6, exam: 49 },
      "English": { attitude: 7, homework: 6, quiz: 7, exam: 47 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 51 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 48 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 56 },
    },
    "STU-009": {
      "Mathematics": { attitude: 9, homework: 8, quiz: 8, exam: 58 },
      "Science": { attitude: 9, homework: 9, quiz: 8, exam: 56 },
      "English": { attitude: 8, homework: 8, quiz: 7, exam: 52 },
      "Arts": { attitude: 9, homework: 9, quiz: 8, exam: 58 },
      "Chinese as a Second Language": { attitude: 8, homework: 8, quiz: 8, exam: 54 },
      "Physical Education": { attitude: 10, homework: 9, quiz: 9, exam: 62 },
    },
    "STU-010": {
      "Mathematics": { attitude: 8, homework: 7, quiz: 7, exam: 54 },
      "Science": { attitude: 8, homework: 8, quiz: 7, exam: 52 },
      "English": { attitude: 7, homework: 7, quiz: 6, exam: 49 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 55 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 7, exam: 51 },
      "Physical Education": { attitude: 9, homework: 9, quiz: 8, exam: 58 },
    },
  },
  "5B": {
    "STU-011": {
      "Mathematics": { attitude: 9, homework: 9, quiz: 8, exam: 60 },
      "Science": { attitude: 9, homework: 8, quiz: 9, exam: 58 },
      "English": { attitude: 8, homework: 8, quiz: 8, exam: 55 },
      "Arts": { attitude: 10, homework: 9, quiz: 9, exam: 62 },
      "Chinese as a Second Language": { attitude: 9, homework: 8, quiz: 8, exam: 57 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 9, exam: 64 },
    },
    "STU-012": {
      "Mathematics": { attitude: 6, homework: 5, quiz: 6, exam: 42 },
      "Science": { attitude: 7, homework: 6, quiz: 5, exam: 40 },
      "English": { attitude: 5, homework: 5, quiz: 5, exam: 38 },
      "Arts": { attitude: 8, homework: 7, quiz: 6, exam: 45 },
      "Chinese as a Second Language": { attitude: 6, homework: 5, quiz: 5, exam: 40 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
    },
    "STU-013": {
      "Mathematics": { attitude: 10, homework: 10, quiz: 10, exam: 69 },
      "Science": { attitude: 10, homework: 10, quiz: 10, exam: 67 },
      "English": { attitude: 10, homework: 9, quiz: 10, exam: 65 },
      "Arts": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
      "Chinese as a Second Language": { attitude: 10, homework: 10, quiz: 9, exam: 66 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 10, exam: 70 },
    },
  },
  "4A": {
    "STU-021": {
      "Mathematics": { attitude: 9, homework: 8, quiz: 8, exam: 58 },
      "Science": { attitude: 9, homework: 9, quiz: 8, exam: 56 },
      "English": { attitude: 8, homework: 8, quiz: 7, exam: 52 },
      "Arts": { attitude: 10, homework: 9, quiz: 9, exam: 60 },
      "Chinese as a Second Language": { attitude: 9, homework: 8, quiz: 8, exam: 55 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 9, exam: 63 },
    },
    "STU-022": {
      "Mathematics": { attitude: 7, homework: 6, quiz: 6, exam: 48 },
      "Science": { attitude: 7, homework: 6, quiz: 6, exam: 45 },
      "English": { attitude: 6, homework: 5, quiz: 5, exam: 42 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 50 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 44 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 7, exam: 52 },
    },
  },
};

// Legacy class grades for overall scores
export const classGrades: Record<string, Record<string, { midYear: number | null; yearEnd: number | null }>> = {
  "5A": {
    "STU-001": { midYear: 85, yearEnd: null },
    "STU-002": { midYear: 68, yearEnd: null },
    "STU-003": { midYear: 97, yearEnd: null },
    "STU-004": { midYear: 51, yearEnd: null },
    "STU-005": { midYear: 79, yearEnd: null },
    "STU-006": { midYear: 70, yearEnd: null },
    "STU-007": { midYear: 90, yearEnd: null },
    "STU-008": { midYear: 72, yearEnd: null },
    "STU-009": { midYear: 83, yearEnd: null },
    "STU-010": { midYear: 76, yearEnd: null },
  },
  "5B": {
    "STU-011": { midYear: 88, yearEnd: null },
    "STU-012": { midYear: 59, yearEnd: null },
    "STU-013": { midYear: 99, yearEnd: null },
    "STU-014": { midYear: 84, yearEnd: null },
    "STU-015": { midYear: 77, yearEnd: null },
    "STU-016": { midYear: 89, yearEnd: null },
    "STU-017": { midYear: 91, yearEnd: null },
    "STU-018": { midYear: 65, yearEnd: null },
    "STU-019": { midYear: 83, yearEnd: null },
    "STU-020": { midYear: 80, yearEnd: null },
  },
  "4A": {
    "STU-021": { midYear: 87, yearEnd: null },
    "STU-022": { midYear: 67, yearEnd: null },
    "STU-023": { midYear: 93, yearEnd: null },
    "STU-024": { midYear: 81, yearEnd: null },
    "STU-025": { midYear: 89, yearEnd: null },
    "STU-026": { midYear: 74, yearEnd: null },
    "STU-027": { midYear: 86, yearEnd: null },
    "STU-028": { midYear: 78, yearEnd: null },
  }
};

export const teacherQuickStats = {
  todayAttendance: {
    present: 24,
    absent: 2,
    late: 1,
    total: 27
  },
  pendingGrades: 15
};

export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  type: "grade" | "report" | "meeting" | "submission" | "event";
  class?: string;
}

export const teacherDeadlines: Deadline[] = [
  {
    id: "DL-001",
    title: "Mid-Year Grades Submission",
    description: "Submit all mid-year exam grades for Class 5A",
    dueDate: "2026-01-10",
    type: "grade",
    class: "5A"
  },
  {
    id: "DL-002",
    title: "Progress Reports Due",
    description: "Complete progress reports for Class 5B students",
    dueDate: "2026-01-15",
    type: "report",
    class: "5B"
  },
  {
    id: "DL-003",
    title: "Parent-Teacher Meeting",
    description: "Prepare student portfolios for PTM",
    dueDate: "2026-01-20",
    type: "meeting"
  },
  {
    id: "DL-004",
    title: "Science Fair Project Review",
    description: "Review and approve science fair project proposals",
    dueDate: "2026-01-25",
    type: "submission"
  },
  {
    id: "DL-005",
    title: "Term 2 Lesson Plans",
    description: "Submit Term 2 lesson plans to HOD",
    dueDate: "2026-01-28",
    type: "submission"
  },
  {
    id: "DL-006",
    title: "Sports Day Registration",
    description: "Finalize student registration for Sports Day events",
    dueDate: "2026-02-05",
    type: "event"
  }
];
