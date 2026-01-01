// Mock data for teacher portal

export const teacherProfile = {
  id: "TCH-2024-001",
  name: "Ms. Sarah Chen",
  email: "sarah.chen@school.edu",
  phone: "+1 234 567 8901",
  subjects: ["Mathematics", "Science"],
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

export const classGrades: Record<string, Record<string, { midYear: number | null; yearEnd: number | null }>> = {
  "5A": {
    "STU-001": { midYear: 85, yearEnd: null },
    "STU-002": { midYear: 78, yearEnd: null },
    "STU-003": { midYear: 92, yearEnd: null },
    "STU-004": { midYear: 88, yearEnd: null },
    "STU-005": { midYear: 75, yearEnd: null },
    "STU-006": { midYear: 82, yearEnd: null },
    "STU-007": { midYear: 90, yearEnd: null },
    "STU-008": { midYear: 79, yearEnd: null },
    "STU-009": { midYear: 86, yearEnd: null },
    "STU-010": { midYear: 81, yearEnd: null },
  },
  "5B": {
    "STU-011": { midYear: 88, yearEnd: null },
    "STU-012": { midYear: 72, yearEnd: null },
    "STU-013": { midYear: 95, yearEnd: null },
    "STU-014": { midYear: 84, yearEnd: null },
    "STU-015": { midYear: 77, yearEnd: null },
    "STU-016": { midYear: 89, yearEnd: null },
    "STU-017": { midYear: 91, yearEnd: null },
    "STU-018": { midYear: 68, yearEnd: null },
    "STU-019": { midYear: 83, yearEnd: null },
    "STU-020": { midYear: 80, yearEnd: null },
  },
  "4A": {
    "STU-021": { midYear: 87, yearEnd: null },
    "STU-022": { midYear: 76, yearEnd: null },
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
  pendingGrades: 15,
  upcomingDeadlines: 3
};
