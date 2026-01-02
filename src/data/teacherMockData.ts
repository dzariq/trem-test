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
  "5B": [
    { id: "STU-021", name: "Abigail Walker", photo: null },
    { id: "STU-022", name: "Sebastian Hall", photo: null },
    { id: "STU-023", name: "Emily Young", photo: null },
    { id: "STU-024", name: "Jack Allen", photo: null },
    { id: "STU-025", name: "Elizabeth King", photo: null },
    { id: "STU-026", name: "Henry Wright", photo: null },
    { id: "STU-027", name: "Sofia Scott", photo: null },
    { id: "STU-028", name: "Owen Green", photo: null },
  ],
  "4A": [
    { id: "STU-031", name: "Grace Adams", photo: null },
    { id: "STU-032", name: "William Baker", photo: null },
    { id: "STU-033", name: "Chloe Carter", photo: null },
    { id: "STU-034", name: "Logan Collins", photo: null },
    { id: "STU-035", name: "Lily Edwards", photo: null },
    { id: "STU-036", name: "Mason Foster", photo: null },
    { id: "STU-037", name: "Zoe Garcia", photo: null },
    { id: "STU-038", name: "Elijah Howard", photo: null },
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

// Teacher Attendance Statistics Data with student details
export interface DailyAttendanceDetail {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  students: { id: string; name: string; status: "present" | "absent" | "late" | "excused" }[];
}

export const teacherAttendanceStats: Record<string, {
  monthly: { month: string; present: number; absent: number; late: number; excused: number }[];
  dailyBreakdown: DailyAttendanceDetail[];
}> = {
  "5A": {
    monthly: [
      { month: "Aug", present: 185, absent: 12, late: 8, excused: 5 },
      { month: "Sep", present: 178, absent: 15, late: 10, excused: 7 },
      { month: "Oct", present: 190, absent: 8, late: 6, excused: 6 },
      { month: "Nov", present: 175, absent: 18, late: 12, excused: 5 },
      { month: "Dec", present: 165, absent: 10, late: 8, excused: 7 },
      { month: "Jan", present: 58, absent: 4, late: 3, excused: 2 },
    ],
    dailyBreakdown: [
      { 
        date: "2026-01-02", present: 18, absent: 2, late: 1, excused: 1,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "present" },
          { id: "STU-002", name: "Liam Smith", status: "present" },
          { id: "STU-003", name: "Olivia Brown", status: "absent" },
          { id: "STU-004", name: "Noah Davis", status: "present" },
          { id: "STU-005", name: "Ava Wilson", status: "late" },
          { id: "STU-006", name: "James Miller", status: "present" },
          { id: "STU-007", name: "Isabella Garcia", status: "present" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-009", name: "Sophia Anderson", status: "present" },
          { id: "STU-010", name: "Lucas Taylor", status: "present" },
          { id: "STU-011", name: "Mia Thomas", status: "present" },
          { id: "STU-012", name: "Ethan Jackson", status: "present" },
          { id: "STU-013", name: "Charlotte White", status: "present" },
          { id: "STU-014", name: "Alexander Harris", status: "present" },
          { id: "STU-015", name: "Amelia Martin", status: "present" },
          { id: "STU-016", name: "Daniel Thompson", status: "present" },
          { id: "STU-017", name: "Harper Robinson", status: "present" },
          { id: "STU-018", name: "Matthew Clark", status: "present" },
          { id: "STU-019", name: "Evelyn Lewis", status: "present" },
          { id: "STU-020", name: "Michael Lee", status: "present" },
          { id: "STU-021", name: "Abigail Walker", status: "absent" },
          { id: "STU-022", name: "Sebastian Hall", status: "present" },
        ]
      },
      { 
        date: "2026-01-01", present: 19, absent: 1, late: 1, excused: 1,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "present" },
          { id: "STU-002", name: "Liam Smith", status: "present" },
          { id: "STU-003", name: "Olivia Brown", status: "present" },
          { id: "STU-004", name: "Noah Davis", status: "absent" },
          { id: "STU-005", name: "Ava Wilson", status: "present" },
          { id: "STU-006", name: "James Miller", status: "late" },
          { id: "STU-007", name: "Isabella Garcia", status: "present" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-009", name: "Sophia Anderson", status: "present" },
          { id: "STU-010", name: "Lucas Taylor", status: "present" },
          { id: "STU-011", name: "Mia Thomas", status: "present" },
          { id: "STU-012", name: "Ethan Jackson", status: "present" },
          { id: "STU-013", name: "Charlotte White", status: "present" },
          { id: "STU-014", name: "Alexander Harris", status: "present" },
          { id: "STU-015", name: "Amelia Martin", status: "present" },
          { id: "STU-016", name: "Daniel Thompson", status: "present" },
          { id: "STU-017", name: "Harper Robinson", status: "present" },
          { id: "STU-018", name: "Matthew Clark", status: "present" },
          { id: "STU-019", name: "Evelyn Lewis", status: "present" },
          { id: "STU-020", name: "Michael Lee", status: "present" },
          { id: "STU-021", name: "Abigail Walker", status: "present" },
          { id: "STU-022", name: "Sebastian Hall", status: "present" },
        ]
      },
      { 
        date: "2025-12-20", present: 20, absent: 0, late: 2, excused: 0,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "present" },
          { id: "STU-002", name: "Liam Smith", status: "late" },
          { id: "STU-003", name: "Olivia Brown", status: "present" },
          { id: "STU-004", name: "Noah Davis", status: "present" },
          { id: "STU-005", name: "Ava Wilson", status: "late" },
          { id: "STU-006", name: "James Miller", status: "present" },
          { id: "STU-007", name: "Isabella Garcia", status: "present" },
          { id: "STU-008", name: "Benjamin Martinez", status: "present" },
          { id: "STU-009", name: "Sophia Anderson", status: "present" },
          { id: "STU-010", name: "Lucas Taylor", status: "present" },
        ]
      },
      { 
        date: "2025-12-19", present: 17, absent: 3, late: 1, excused: 1,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "present" },
          { id: "STU-002", name: "Liam Smith", status: "absent" },
          { id: "STU-003", name: "Olivia Brown", status: "present" },
          { id: "STU-004", name: "Noah Davis", status: "absent" },
          { id: "STU-005", name: "Ava Wilson", status: "present" },
          { id: "STU-006", name: "James Miller", status: "present" },
          { id: "STU-007", name: "Isabella Garcia", status: "late" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-009", name: "Sophia Anderson", status: "present" },
          { id: "STU-010", name: "Lucas Taylor", status: "present" },
          { id: "STU-012", name: "Ethan Jackson", status: "absent" },
        ]
      },
      { 
        date: "2025-12-18", present: 19, absent: 1, late: 0, excused: 2,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "present" },
          { id: "STU-002", name: "Liam Smith", status: "present" },
          { id: "STU-003", name: "Olivia Brown", status: "absent" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-009", name: "Sophia Anderson", status: "excused" },
        ]
      },
      { 
        date: "2025-12-17", present: 18, absent: 2, late: 2, excused: 0,
        students: [
          { id: "STU-001", name: "Emma Johnson", status: "late" },
          { id: "STU-004", name: "Noah Davis", status: "absent" },
          { id: "STU-010", name: "Lucas Taylor", status: "late" },
          { id: "STU-014", name: "Alexander Harris", status: "absent" },
        ]
      },
      { 
        date: "2025-12-16", present: 16, absent: 4, late: 1, excused: 1,
        students: [
          { id: "STU-002", name: "Liam Smith", status: "absent" },
          { id: "STU-003", name: "Olivia Brown", status: "absent" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-010", name: "Lucas Taylor", status: "absent" },
          { id: "STU-012", name: "Ethan Jackson", status: "late" },
          { id: "STU-014", name: "Alexander Harris", status: "absent" },
        ]
      },
      { 
        date: "2025-12-13", present: 21, absent: 0, late: 1, excused: 0,
        students: [
          { id: "STU-011", name: "Mia Thomas", status: "late" },
        ]
      },
      { 
        date: "2025-12-12", present: 19, absent: 2, late: 0, excused: 1,
        students: [
          { id: "STU-003", name: "Olivia Brown", status: "absent" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
          { id: "STU-014", name: "Alexander Harris", status: "absent" },
        ]
      },
      { 
        date: "2025-12-11", present: 18, absent: 1, late: 2, excused: 1,
        students: [
          { id: "STU-002", name: "Liam Smith", status: "late" },
          { id: "STU-005", name: "Ava Wilson", status: "late" },
          { id: "STU-007", name: "Isabella Garcia", status: "absent" },
          { id: "STU-008", name: "Benjamin Martinez", status: "excused" },
        ]
      },
    ],
  },
  "5B": {
    monthly: [
      { month: "Aug", present: 192, absent: 10, late: 5, excused: 3 },
      { month: "Sep", present: 185, absent: 12, late: 8, excused: 5 },
      { month: "Oct", present: 188, absent: 9, late: 7, excused: 6 },
      { month: "Nov", present: 180, absent: 14, late: 10, excused: 6 },
      { month: "Dec", present: 170, absent: 8, late: 6, excused: 6 },
      { month: "Jan", present: 62, absent: 3, late: 2, excused: 1 },
    ],
    dailyBreakdown: [
      { date: "2026-01-02", present: 20, absent: 1, late: 1, excused: 0, students: [] },
      { date: "2026-01-01", present: 19, absent: 2, late: 0, excused: 1, students: [] },
      { date: "2025-12-20", present: 21, absent: 0, late: 1, excused: 0, students: [] },
      { date: "2025-12-19", present: 18, absent: 2, late: 1, excused: 1, students: [] },
      { date: "2025-12-18", present: 20, absent: 0, late: 2, excused: 0, students: [] },
      { date: "2025-12-17", present: 17, absent: 3, late: 1, excused: 1, students: [] },
      { date: "2025-12-16", present: 19, absent: 1, late: 1, excused: 1, students: [] },
      { date: "2025-12-13", present: 22, absent: 0, late: 0, excused: 0, students: [] },
    ],
  },
  "4A": {
    monthly: [
      { month: "Aug", present: 152, absent: 8, late: 4, excused: 4 },
      { month: "Sep", present: 148, absent: 10, late: 6, excused: 4 },
      { month: "Oct", present: 155, absent: 6, late: 5, excused: 2 },
      { month: "Nov", present: 145, absent: 12, late: 8, excused: 3 },
      { month: "Dec", present: 138, absent: 7, late: 5, excused: 2 },
      { month: "Jan", present: 48, absent: 2, late: 2, excused: 0 },
    ],
    dailyBreakdown: [
      { date: "2026-01-02", present: 16, absent: 0, late: 2, excused: 0, students: [] },
      { date: "2026-01-01", present: 15, absent: 1, late: 1, excused: 1, students: [] },
      { date: "2025-12-20", present: 17, absent: 1, late: 0, excused: 0, students: [] },
      { date: "2025-12-19", present: 16, absent: 0, late: 1, excused: 1, students: [] },
      { date: "2025-12-18", present: 14, absent: 2, late: 1, excused: 1, students: [] },
      { date: "2025-12-17", present: 15, absent: 1, late: 2, excused: 0, students: [] },
    ],
  },
};

// Detailed class grades with category breakdown per subject
export const detailedClassGrades: Record<string, Record<string, Record<string, {
  attitude: number;
  homework: number;
  quiz: number;
  exam: number;
}>>> = {
  "5A": {
    // Top Performers (10% = 2 students) - A*/A grades (80%+)
    "STU-001": {
      "Mathematics": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
      "Science": { attitude: 10, homework: 10, quiz: 9, exam: 66 },
      "English": { attitude: 10, homework: 9, quiz: 10, exam: 65 },
      "Arts": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
      "Chinese as a Second Language": { attitude: 10, homework: 10, quiz: 9, exam: 66 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 10, exam: 68 },
    },
    "STU-002": {
      "Mathematics": { attitude: 10, homework: 9, quiz: 10, exam: 65 },
      "Science": { attitude: 10, homework: 10, quiz: 9, exam: 64 },
      "English": { attitude: 9, homework: 10, quiz: 9, exam: 63 },
      "Arts": { attitude: 10, homework: 10, quiz: 10, exam: 66 },
      "Chinese as a Second Language": { attitude: 10, homework: 9, quiz: 10, exam: 64 },
      "Physical Education": { attitude: 10, homework: 10, quiz: 10, exam: 67 },
    },
    // Middle Performers (75% = 15 students) - B/C grades (60-79%)
    "STU-003": {
      "Mathematics": { attitude: 8, homework: 8, quiz: 8, exam: 52 },
      "Science": { attitude: 8, homework: 7, quiz: 8, exam: 50 },
      "English": { attitude: 7, homework: 8, quiz: 7, exam: 48 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 54 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 8, exam: 50 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 55 },
    },
    "STU-004": {
      "Mathematics": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
      "Science": { attitude: 7, homework: 8, quiz: 7, exam: 46 },
      "English": { attitude: 8, homework: 7, quiz: 7, exam: 45 },
      "Arts": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
      "Chinese as a Second Language": { attitude: 7, homework: 7, quiz: 7, exam: 46 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 8, exam: 52 },
    },
    "STU-005": {
      "Mathematics": { attitude: 9, homework: 8, quiz: 8, exam: 54 },
      "Science": { attitude: 8, homework: 8, quiz: 8, exam: 52 },
      "English": { attitude: 8, homework: 7, quiz: 8, exam: 50 },
      "Arts": { attitude: 9, homework: 9, quiz: 8, exam: 56 },
      "Chinese as a Second Language": { attitude: 8, homework: 8, quiz: 8, exam: 52 },
      "Physical Education": { attitude: 9, homework: 9, quiz: 9, exam: 58 },
    },
    "STU-006": {
      "Mathematics": { attitude: 7, homework: 7, quiz: 7, exam: 46 },
      "Science": { attitude: 7, homework: 6, quiz: 7, exam: 44 },
      "English": { attitude: 7, homework: 7, quiz: 6, exam: 43 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 7, exam: 45 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
    },
    "STU-007": {
      "Mathematics": { attitude: 8, homework: 8, quiz: 8, exam: 50 },
      "Science": { attitude: 8, homework: 7, quiz: 8, exam: 48 },
      "English": { attitude: 7, homework: 8, quiz: 7, exam: 46 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 52 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 8, exam: 48 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 54 },
    },
    "STU-008": {
      "Mathematics": { attitude: 7, homework: 6, quiz: 7, exam: 44 },
      "Science": { attitude: 7, homework: 7, quiz: 6, exam: 42 },
      "English": { attitude: 6, homework: 6, quiz: 7, exam: 40 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 46 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 42 },
      "Physical Education": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
    },
    "STU-009": {
      "Mathematics": { attitude: 8, homework: 8, quiz: 7, exam: 49 },
      "Science": { attitude: 8, homework: 7, quiz: 8, exam: 47 },
      "English": { attitude: 7, homework: 7, quiz: 7, exam: 45 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 51 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 7, exam: 47 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 53 },
    },
    "STU-010": {
      "Mathematics": { attitude: 7, homework: 7, quiz: 8, exam: 48 },
      "Science": { attitude: 8, homework: 7, quiz: 7, exam: 46 },
      "English": { attitude: 7, homework: 6, quiz: 7, exam: 43 },
      "Arts": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
      "Chinese as a Second Language": { attitude: 7, homework: 7, quiz: 7, exam: 45 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 8, exam: 52 },
    },
    "STU-011": {
      "Mathematics": { attitude: 8, homework: 7, quiz: 7, exam: 47 },
      "Science": { attitude: 7, homework: 7, quiz: 7, exam: 45 },
      "English": { attitude: 7, homework: 7, quiz: 6, exam: 42 },
      "Arts": { attitude: 8, homework: 8, quiz: 7, exam: 49 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 7, exam: 44 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
    },
    "STU-012": {
      "Mathematics": { attitude: 9, homework: 8, quiz: 8, exam: 53 },
      "Science": { attitude: 8, homework: 8, quiz: 8, exam: 51 },
      "English": { attitude: 8, homework: 8, quiz: 8, exam: 49 },
      "Arts": { attitude: 9, homework: 9, quiz: 8, exam: 55 },
      "Chinese as a Second Language": { attitude: 8, homework: 8, quiz: 8, exam: 51 },
      "Physical Education": { attitude: 9, homework: 9, quiz: 9, exam: 57 },
    },
    "STU-013": {
      "Mathematics": { attitude: 7, homework: 6, quiz: 7, exam: 45 },
      "Science": { attitude: 7, homework: 7, quiz: 6, exam: 43 },
      "English": { attitude: 6, homework: 6, quiz: 6, exam: 40 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 47 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 43 },
      "Physical Education": { attitude: 8, homework: 7, quiz: 7, exam: 49 },
    },
    "STU-014": {
      "Mathematics": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
      "Science": { attitude: 8, homework: 7, quiz: 8, exam: 48 },
      "English": { attitude: 7, homework: 7, quiz: 7, exam: 46 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 52 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 54 },
    },
    "STU-015": {
      "Mathematics": { attitude: 7, homework: 7, quiz: 6, exam: 44 },
      "Science": { attitude: 7, homework: 6, quiz: 7, exam: 42 },
      "English": { attitude: 6, homework: 6, quiz: 6, exam: 39 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 46 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 6, exam: 42 },
      "Physical Education": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
    },
    "STU-016": {
      "Mathematics": { attitude: 8, homework: 7, quiz: 8, exam: 51 },
      "Science": { attitude: 8, homework: 8, quiz: 7, exam: 49 },
      "English": { attitude: 7, homework: 7, quiz: 7, exam: 47 },
      "Arts": { attitude: 9, homework: 8, quiz: 8, exam: 53 },
      "Chinese as a Second Language": { attitude: 8, homework: 7, quiz: 8, exam: 49 },
      "Physical Education": { attitude: 9, homework: 8, quiz: 8, exam: 55 },
    },
    "STU-017": {
      "Mathematics": { attitude: 7, homework: 7, quiz: 7, exam: 46 },
      "Science": { attitude: 7, homework: 6, quiz: 7, exam: 44 },
      "English": { attitude: 6, homework: 7, quiz: 6, exam: 41 },
      "Arts": { attitude: 8, homework: 7, quiz: 7, exam: 48 },
      "Chinese as a Second Language": { attitude: 7, homework: 6, quiz: 7, exam: 44 },
      "Physical Education": { attitude: 8, homework: 8, quiz: 7, exam: 50 },
    },
    // At-Risk Students (15% = 3 students) - D/E grades (<60%)
    "STU-018": {
      "Mathematics": { attitude: 4, homework: 3, quiz: 4, exam: 28 },
      "Science": { attitude: 4, homework: 4, quiz: 3, exam: 26 },
      "English": { attitude: 3, homework: 3, quiz: 3, exam: 24 },
      "Arts": { attitude: 5, homework: 4, quiz: 4, exam: 30 },
      "Chinese as a Second Language": { attitude: 4, homework: 3, quiz: 4, exam: 27 },
      "Physical Education": { attitude: 5, homework: 5, quiz: 4, exam: 32 },
    },
    "STU-019": {
      "Mathematics": { attitude: 3, homework: 2, quiz: 3, exam: 22 },
      "Science": { attitude: 3, homework: 3, quiz: 2, exam: 20 },
      "English": { attitude: 2, homework: 2, quiz: 2, exam: 18 },
      "Arts": { attitude: 4, homework: 3, quiz: 3, exam: 24 },
      "Chinese as a Second Language": { attitude: 3, homework: 2, quiz: 3, exam: 21 },
      "Physical Education": { attitude: 4, homework: 4, quiz: 3, exam: 26 },
    },
    "STU-020": {
      "Mathematics": { attitude: 5, homework: 4, quiz: 4, exam: 32 },
      "Science": { attitude: 4, homework: 4, quiz: 4, exam: 30 },
      "English": { attitude: 4, homework: 3, quiz: 4, exam: 28 },
      "Arts": { attitude: 5, homework: 5, quiz: 4, exam: 34 },
      "Chinese as a Second Language": { attitude: 4, homework: 4, quiz: 4, exam: 30 },
      "Physical Education": { attitude: 6, homework: 5, quiz: 5, exam: 38 },
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
  pendingGrades: [
    { class: "5A", subject: "Mathematics", count: 5 },
    { class: "5A", subject: "Science", count: 3 },
    { class: "5B", subject: "Mathematics", count: 4 },
    { class: "4A", subject: "English", count: 3 },
  ]
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

// Year-over-year exam performance data for trend analysis
export const yearOverYearData: Record<string, {
  year: string;
  midYear: number;
  yearEnd: number;
}[]> = {
  "5A": [
    { year: "2021", midYear: 68, yearEnd: 71 },
    { year: "2022", midYear: 70, yearEnd: 73 },
    { year: "2023", midYear: 72, yearEnd: 75 },
    { year: "2024", midYear: 74, yearEnd: 78 },
    { year: "2025", midYear: 76, yearEnd: 80 },
    { year: "2026", midYear: 77, yearEnd: 0 },
  ],
  "5B": [
    { year: "2021", midYear: 72, yearEnd: 74 },
    { year: "2022", midYear: 74, yearEnd: 76 },
    { year: "2023", midYear: 75, yearEnd: 78 },
    { year: "2024", midYear: 78, yearEnd: 81 },
    { year: "2025", midYear: 80, yearEnd: 83 },
    { year: "2026", midYear: 82, yearEnd: 0 },
  ],
  "4A": [
    { year: "2021", midYear: 65, yearEnd: 68 },
    { year: "2022", midYear: 68, yearEnd: 70 },
    { year: "2023", midYear: 70, yearEnd: 73 },
    { year: "2024", midYear: 73, yearEnd: 76 },
    { year: "2025", midYear: 75, yearEnd: 78 },
    { year: "2026", midYear: 78, yearEnd: 0 },
  ],
};

// Category-wise year-over-year data
export const categoryYearOverYear: Record<string, {
  year: string;
  attitude: number;
  homework: number;
  quiz: number;
  exam: number;
}[]> = {
  "5A": [
    { year: "2021", attitude: 7.2, homework: 6.8, quiz: 6.5, exam: 48 },
    { year: "2022", attitude: 7.5, homework: 7.0, quiz: 6.8, exam: 50 },
    { year: "2023", attitude: 7.8, homework: 7.3, quiz: 7.0, exam: 52 },
    { year: "2024", attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 53 },
    { year: "2025", attitude: 8.2, homework: 7.7, quiz: 7.4, exam: 54 },
    { year: "2026", attitude: 8.3, homework: 7.7, quiz: 7.5, exam: 53 },
  ],
  "5B": [
    { year: "2021", attitude: 7.5, homework: 7.0, quiz: 6.8, exam: 50 },
    { year: "2022", attitude: 7.8, homework: 7.3, quiz: 7.0, exam: 52 },
    { year: "2023", attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 54 },
    { year: "2024", attitude: 8.2, homework: 7.8, quiz: 7.5, exam: 56 },
    { year: "2025", attitude: 8.5, homework: 8.0, quiz: 7.8, exam: 58 },
    { year: "2026", attitude: 8.6, homework: 8.1, quiz: 7.9, exam: 59 },
  ],
  "4A": [
    { year: "2021", attitude: 6.8, homework: 6.5, quiz: 6.2, exam: 45 },
    { year: "2022", attitude: 7.0, homework: 6.8, quiz: 6.5, exam: 47 },
    { year: "2023", attitude: 7.3, homework: 7.0, quiz: 6.8, exam: 49 },
    { year: "2024", attitude: 7.5, homework: 7.3, quiz: 7.0, exam: 51 },
    { year: "2025", attitude: 7.8, homework: 7.5, quiz: 7.2, exam: 53 },
    { year: "2026", attitude: 8.0, homework: 7.6, quiz: 7.3, exam: 54 },
  ],
};

// Exam-specific data for comparison between different exam periods
export interface ExamData {
  average: number;
  passRate: number;
  aRate: number;
  highest: number;
  lowest: number;
  attitude: number;
  homework: number;
  quiz: number;
  exam: number;
}

export const examComparisonData: Record<string, Record<string, ExamData>> = {
  "5A": {
    "2026-midYear": { average: 77, passRate: 90, aRate: 40, highest: 97, lowest: 51, attitude: 8.3, homework: 7.7, quiz: 7.5, exam: 53 },
    "2025-yearEnd": { average: 80, passRate: 92, aRate: 45, highest: 98, lowest: 55, attitude: 8.2, homework: 7.7, quiz: 7.4, exam: 54 },
    "2025-midYear": { average: 76, passRate: 88, aRate: 38, highest: 96, lowest: 48, attitude: 8.2, homework: 7.7, quiz: 7.4, exam: 54 },
    "2024-yearEnd": { average: 78, passRate: 90, aRate: 42, highest: 97, lowest: 52, attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 53 },
    "2024-midYear": { average: 74, passRate: 86, aRate: 35, highest: 95, lowest: 45, attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 53 },
    "2023-yearEnd": { average: 75, passRate: 87, aRate: 36, highest: 94, lowest: 46, attitude: 7.8, homework: 7.3, quiz: 7.0, exam: 52 },
    "2023-midYear": { average: 72, passRate: 84, aRate: 32, highest: 93, lowest: 42, attitude: 7.8, homework: 7.3, quiz: 7.0, exam: 52 },
  },
  "5B": {
    "2026-midYear": { average: 82, passRate: 93, aRate: 48, highest: 99, lowest: 59, attitude: 8.6, homework: 8.1, quiz: 7.9, exam: 59 },
    "2025-yearEnd": { average: 83, passRate: 94, aRate: 50, highest: 99, lowest: 60, attitude: 8.5, homework: 8.0, quiz: 7.8, exam: 58 },
    "2025-midYear": { average: 80, passRate: 91, aRate: 45, highest: 98, lowest: 56, attitude: 8.5, homework: 8.0, quiz: 7.8, exam: 58 },
    "2024-yearEnd": { average: 81, passRate: 92, aRate: 47, highest: 98, lowest: 58, attitude: 8.2, homework: 7.8, quiz: 7.5, exam: 56 },
    "2024-midYear": { average: 78, passRate: 89, aRate: 42, highest: 97, lowest: 54, attitude: 8.2, homework: 7.8, quiz: 7.5, exam: 56 },
    "2023-yearEnd": { average: 78, passRate: 88, aRate: 40, highest: 96, lowest: 52, attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 54 },
    "2023-midYear": { average: 75, passRate: 85, aRate: 36, highest: 95, lowest: 48, attitude: 8.0, homework: 7.5, quiz: 7.2, exam: 54 },
  },
  "4A": {
    "2026-midYear": { average: 78, passRate: 88, aRate: 38, highest: 93, lowest: 67, attitude: 8.0, homework: 7.6, quiz: 7.3, exam: 54 },
    "2025-yearEnd": { average: 78, passRate: 89, aRate: 40, highest: 94, lowest: 65, attitude: 7.8, homework: 7.5, quiz: 7.2, exam: 53 },
    "2025-midYear": { average: 75, passRate: 85, aRate: 35, highest: 92, lowest: 62, attitude: 7.8, homework: 7.5, quiz: 7.2, exam: 53 },
    "2024-yearEnd": { average: 76, passRate: 86, aRate: 36, highest: 91, lowest: 60, attitude: 7.5, homework: 7.3, quiz: 7.0, exam: 51 },
    "2024-midYear": { average: 73, passRate: 83, aRate: 32, highest: 90, lowest: 58, attitude: 7.5, homework: 7.3, quiz: 7.0, exam: 51 },
    "2023-yearEnd": { average: 73, passRate: 82, aRate: 30, highest: 89, lowest: 55, attitude: 7.3, homework: 7.0, quiz: 6.8, exam: 49 },
    "2023-midYear": { average: 70, passRate: 80, aRate: 28, highest: 88, lowest: 52, attitude: 7.3, homework: 7.0, quiz: 6.8, exam: 49 },
  },
};

// Subject-wise yearly performance data per class for trend analysis
export const subjectYearlyData: Record<string, {
  year: string;
  Mathematics: number;
  Science: number;
  English: number;
  Arts: number;
  "Chinese as a Second Language": number;
  "Physical Education": number;
}[]> = {
  "5A": [
    { year: "2021", Mathematics: 65, Science: 68, English: 70, Arts: 75, "Chinese as a Second Language": 72, "Physical Education": 82 },
    { year: "2022", Mathematics: 68, Science: 70, English: 72, Arts: 78, "Chinese as a Second Language": 70, "Physical Education": 84 },
    { year: "2023", Mathematics: 72, Science: 74, English: 75, Arts: 80, "Chinese as a Second Language": 68, "Physical Education": 86 },
    { year: "2024", Mathematics: 75, Science: 77, English: 78, Arts: 76, "Chinese as a Second Language": 65, "Physical Education": 88 },
    { year: "2025", Mathematics: 78, Science: 80, English: 80, Arts: 74, "Chinese as a Second Language": 62, "Physical Education": 90 },
    { year: "2026", Mathematics: 80, Science: 82, English: 82, Arts: 72, "Chinese as a Second Language": 60, "Physical Education": 91 },
  ],
  "5B": [
    { year: "2021", Mathematics: 70, Science: 72, English: 74, Arts: 78, "Chinese as a Second Language": 68, "Physical Education": 85 },
    { year: "2022", Mathematics: 73, Science: 75, English: 76, Arts: 80, "Chinese as a Second Language": 71, "Physical Education": 87 },
    { year: "2023", Mathematics: 76, Science: 78, English: 79, Arts: 82, "Chinese as a Second Language": 74, "Physical Education": 89 },
    { year: "2024", Mathematics: 79, Science: 81, English: 82, Arts: 85, "Chinese as a Second Language": 77, "Physical Education": 91 },
    { year: "2025", Mathematics: 82, Science: 84, English: 85, Arts: 87, "Chinese as a Second Language": 80, "Physical Education": 93 },
    { year: "2026", Mathematics: 85, Science: 86, English: 87, Arts: 89, "Chinese as a Second Language": 83, "Physical Education": 94 },
  ],
  "4A": [
    { year: "2021", Mathematics: 60, Science: 62, English: 65, Arts: 72, "Chinese as a Second Language": 58, "Physical Education": 80 },
    { year: "2022", Mathematics: 63, Science: 65, English: 68, Arts: 75, "Chinese as a Second Language": 61, "Physical Education": 82 },
    { year: "2023", Mathematics: 67, Science: 69, English: 71, Arts: 78, "Chinese as a Second Language": 64, "Physical Education": 84 },
    { year: "2024", Mathematics: 70, Science: 72, English: 74, Arts: 80, "Chinese as a Second Language": 68, "Physical Education": 86 },
    { year: "2025", Mathematics: 73, Science: 75, English: 77, Arts: 82, "Chinese as a Second Language": 71, "Physical Education": 88 },
    { year: "2026", Mathematics: 76, Science: 78, English: 80, Arts: 84, "Chinese as a Second Language": 74, "Physical Education": 90 },
  ],
};

// Multi-class comparison data for cross-class analysis
export const multiClassTrendData = [
  { year: "2021", "5A": 68, "5B": 72, "4A": 65 },
  { year: "2022", "5A": 70, "5B": 74, "4A": 68 },
  { year: "2023", "5A": 72, "5B": 75, "4A": 70 },
  { year: "2024", "5A": 74, "5B": 78, "4A": 73 },
  { year: "2025", "5A": 76, "5B": 80, "4A": 75 },
  { year: "2026", "5A": 77, "5B": 82, "4A": 78 },
];

// Subject-level exam comparison data per class for subject comparison
export const subjectExamData: Record<string, Record<string, Record<string, number>>> = {
  "5A": {
    "2026-midYear": {
      "Mathematics": 80,
      "Science": 82,
      "English": 78,
      "Arts": 72,
      "Chinese as a Second Language": 65,
      "Physical Education": 88
    },
    "2025-yearEnd": {
      "Mathematics": 78,
      "Science": 80,
      "English": 76,
      "Arts": 74,
      "Chinese as a Second Language": 68,
      "Physical Education": 86
    },
    "2025-midYear": {
      "Mathematics": 75,
      "Science": 77,
      "English": 74,
      "Arts": 76,
      "Chinese as a Second Language": 70,
      "Physical Education": 84
    },
    "2024-yearEnd": {
      "Mathematics": 73,
      "Science": 75,
      "English": 72,
      "Arts": 78,
      "Chinese as a Second Language": 72,
      "Physical Education": 82
    },
    "2024-midYear": {
      "Mathematics": 70,
      "Science": 72,
      "English": 70,
      "Arts": 80,
      "Chinese as a Second Language": 74,
      "Physical Education": 80
    }
  },
  "5B": {
    "2026-midYear": {
      "Mathematics": 85,
      "Science": 86,
      "English": 84,
      "Arts": 88,
      "Chinese as a Second Language": 80,
      "Physical Education": 92
    },
    "2025-yearEnd": {
      "Mathematics": 82,
      "Science": 84,
      "English": 82,
      "Arts": 86,
      "Chinese as a Second Language": 78,
      "Physical Education": 90
    },
    "2025-midYear": {
      "Mathematics": 79,
      "Science": 81,
      "English": 80,
      "Arts": 84,
      "Chinese as a Second Language": 75,
      "Physical Education": 88
    },
    "2024-yearEnd": {
      "Mathematics": 76,
      "Science": 78,
      "English": 77,
      "Arts": 82,
      "Chinese as a Second Language": 72,
      "Physical Education": 86
    },
    "2024-midYear": {
      "Mathematics": 73,
      "Science": 75,
      "English": 74,
      "Arts": 80,
      "Chinese as a Second Language": 69,
      "Physical Education": 84
    }
  },
  "4A": {
    "2026-midYear": {
      "Mathematics": 76,
      "Science": 78,
      "English": 80,
      "Arts": 84,
      "Chinese as a Second Language": 74,
      "Physical Education": 90
    },
    "2025-yearEnd": {
      "Mathematics": 73,
      "Science": 75,
      "English": 77,
      "Arts": 82,
      "Chinese as a Second Language": 71,
      "Physical Education": 88
    },
    "2025-midYear": {
      "Mathematics": 70,
      "Science": 72,
      "English": 74,
      "Arts": 80,
      "Chinese as a Second Language": 68,
      "Physical Education": 86
    },
    "2024-yearEnd": {
      "Mathematics": 67,
      "Science": 69,
      "English": 71,
      "Arts": 78,
      "Chinese as a Second Language": 65,
      "Physical Education": 84
    },
    "2024-midYear": {
      "Mathematics": 64,
      "Science": 66,
      "English": 68,
      "Arts": 76,
      "Chinese as a Second Language": 62,
      "Physical Education": 82
    }
  }
};
