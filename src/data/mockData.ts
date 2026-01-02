// Mock data for the parent portal

export const announcements = [
  {
    id: 1,
    title: "School Sports Day 2026",
    snippet: "Join us for our annual Sports Day event on January 15th. Students will participate in various athletic activities.",
    date: "2026-01-05",
    category: "Event",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop"
  },
  {
    id: 2,
    title: "Parent-Teacher Conference",
    snippet: "Schedule your one-on-one meeting with teachers. Available slots from Jan 20-22.",
    date: "2026-01-03",
    category: "Academic",
    image: null
  },
  {
    id: 3,
    title: "New Canteen Menu",
    snippet: "We've updated our canteen menu with healthier options. Check out the new selections!",
    date: "2026-01-02",
    category: "General",
    image: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=200&fit=crop"
  },
  {
    id: 4,
    title: "Science Fair Registration",
    snippet: "Register your child for the upcoming Science Fair. Deadline: January 25th.",
    date: "2025-12-28",
    category: "Academic",
    image: null
  }
];

export const upcomingEvents = [
  {
    id: 1,
    title: "Sports Day",
    date: "2026-01-15",
    time: "8:00 AM - 4:00 PM",
    location: "School Field",
    category: "sports"
  },
  {
    id: 2,
    title: "Parent-Teacher Conference",
    date: "2026-01-20",
    time: "9:00 AM - 5:00 PM",
    location: "Main Building",
    category: "meeting"
  },
  {
    id: 3,
    title: "Science Fair",
    date: "2026-01-28",
    time: "10:00 AM - 2:00 PM",
    location: "Assembly Hall",
    category: "academic"
  },
  {
    id: 4,
    title: "Art Exhibition",
    date: "2026-02-05",
    time: "11:00 AM - 3:00 PM",
    location: "Art Room",
    category: "arts"
  },
  {
    id: 5,
    title: "Mid-Year Exam",
    date: "2026-02-10",
    time: "8:00 AM - 12:00 PM",
    location: "Exam Hall",
    category: "academic"
  }
];

export const attendanceData = {
  monthly: [
    { month: "Aug", present: 20, absent: 1, late: 1, excused: 0 },
    { month: "Sep", present: 18, absent: 2, late: 1, excused: 1 },
    { month: "Oct", present: 19, absent: 1, late: 2, excused: 0 },
    { month: "Nov", present: 17, absent: 2, late: 2, excused: 1 },
    { month: "Dec", present: 14, absent: 1, late: 0, excused: 1 },
    { month: "Jan", present: 1, absent: 0, late: 0, excused: 0 }
  ],
  currentMonth: {
    present: 89,
    absent: 7,
    late: 3,
    excused: 1
  },
  dailyBreakdown: [
    { date: "2026-01-01", status: "present", reason: null },
    { date: "2025-12-31", status: "excused", reason: "Holiday" },
    { date: "2025-12-30", status: "present", reason: null },
    { date: "2025-12-29", status: "present", reason: null },
    { date: "2025-12-28", status: "absent", reason: "MC" },
    { date: "2025-12-27", status: "present", reason: null },
    { date: "2025-12-26", status: "late", reason: "Traffic" },
    { date: "2025-12-25", status: "excused", reason: "Holiday" },
    { date: "2025-12-24", status: "present", reason: null },
    { date: "2025-12-23", status: "present", reason: null },
    { date: "2025-12-22", status: "present", reason: null },
    { date: "2025-12-21", status: "present", reason: null },
    { date: "2025-12-20", status: "present", reason: null },
    { date: "2025-12-19", status: "present", reason: null },
    { date: "2025-12-18", status: "late", reason: "Doctor appointment" },
    { date: "2025-12-17", status: "present", reason: null },
    { date: "2025-12-16", status: "present", reason: null },
    { date: "2025-12-15", status: "present", reason: null }
  ]
};

export const academicData = {
  subjects: [
    { 
      name: "English", 
      teacherComment: "Emma shows excellent reading comprehension and creative writing skills. Keep up the great work!",
      scores: {
        "2022": { midYear: 70, yearEnd: 72, attitude: 74, homework: 76, quiz: 68, exam: 70 },
        "2023": { midYear: 74, yearEnd: 78, attitude: 78, homework: 80, quiz: 72, exam: 74 },
        "2024": { midYear: 78, yearEnd: 82, attitude: 82, homework: 85, quiz: 76, exam: 78 },
        "2025": { midYear: 85, yearEnd: null, attitude: 88, homework: 90, quiz: 82, exam: 85 }
      }
    },
    { 
      name: "Mathematics", 
      teacherComment: "Good progress in problem-solving. Would benefit from more practice with algebraic expressions.",
      scores: {
        "2022": { midYear: 62, yearEnd: 66, attitude: 70, homework: 65, quiz: 60, exam: 62 },
        "2023": { midYear: 68, yearEnd: 72, attitude: 75, homework: 70, quiz: 65, exam: 68 },
        "2024": { midYear: 72, yearEnd: 75, attitude: 78, homework: 75, quiz: 70, exam: 72 },
        "2025": { midYear: 80, yearEnd: null, attitude: 85, homework: 82, quiz: 78, exam: 80 }
      }
    },
    { 
      name: "Science", 
      teacherComment: "Outstanding performance! Emma demonstrates strong analytical skills and enthusiasm for experiments.",
      scores: {
        "2022": { midYear: 76, yearEnd: 78, attitude: 82, homework: 80, quiz: 74, exam: 76 },
        "2023": { midYear: 80, yearEnd: 84, attitude: 88, homework: 85, quiz: 78, exam: 80 },
        "2024": { midYear: 85, yearEnd: 88, attitude: 90, homework: 88, quiz: 84, exam: 85 },
        "2025": { midYear: 90, yearEnd: null, attitude: 92, homework: 94, quiz: 88, exam: 90 }
      }
    },
    { 
      name: "History", 
      teacherComment: "Shows good understanding of historical events. Could improve on essay structure and analysis.",
      scores: {
        "2022": { midYear: 60, yearEnd: 64, attitude: 66, homework: 62, quiz: 58, exam: 60 },
        "2023": { midYear: 66, yearEnd: 70, attitude: 72, homework: 68, quiz: 64, exam: 66 },
        "2024": { midYear: 70, yearEnd: 78, attitude: 75, homework: 72, quiz: 68, exam: 70 },
        "2025": { midYear: 72, yearEnd: null, attitude: 74, homework: 70, quiz: 68, exam: 72 }
      }
    },
    { 
      name: "Geography", 
      teacherComment: "Good map reading skills. Needs to work on understanding climate patterns and geographical processes.",
      scores: {
        "2022": { midYear: 65, yearEnd: 69, attitude: 70, homework: 68, quiz: 64, exam: 65 },
        "2023": { midYear: 71, yearEnd: 75, attitude: 76, homework: 74, quiz: 70, exam: 71 },
        "2024": { midYear: 75, yearEnd: 78, attitude: 80, homework: 78, quiz: 74, exam: 75 },
        "2025": { midYear: 82, yearEnd: null, attitude: 85, homework: 86, quiz: 80, exam: 82 }
      }
    },
    { 
      name: "Art", 
      teacherComment: "Exceptional creativity and artistic talent! Emma's work is always inspiring and thoughtfully composed.",
      scores: {
        "2022": { midYear: 84, yearEnd: 86, attitude: 88, homework: 86, quiz: 82, exam: 84 },
        "2023": { midYear: 88, yearEnd: 90, attitude: 92, homework: 90, quiz: 85, exam: 88 },
        "2024": { midYear: 90, yearEnd: 92, attitude: 94, homework: 92, quiz: 88, exam: 90 },
        "2025": { midYear: 95, yearEnd: null, attitude: 96, homework: 95, quiz: 92, exam: 95 }
      }
    },
    { 
      name: "Music", 
      teacherComment: "Shows interest in music theory. Practice more on rhythm and timing to improve performance.",
      scores: {
        "2022": { midYear: 58, yearEnd: 60, attitude: 62, homework: 55, quiz: 54, exam: 58 },
        "2023": { midYear: 62, yearEnd: 65, attitude: 68, homework: 60, quiz: 58, exam: 62 },
        "2024": { midYear: 65, yearEnd: 72, attitude: 70, homework: 65, quiz: 62, exam: 65 },
        "2025": { midYear: 65, yearEnd: null, attitude: 68, homework: 62, quiz: 60, exam: 65 }
      }
    },
    { 
      name: "Physical Education", 
      teacherComment: "Participates well in team sports. Should focus on improving endurance and flexibility.",
      scores: {
        "2022": { midYear: 50, yearEnd: 53, attitude: 55, homework: 50, quiz: 48, exam: 50 },
        "2023": { midYear: 55, yearEnd: 58, attitude: 60, homework: 55, quiz: 52, exam: 55 },
        "2024": { midYear: 58, yearEnd: 62, attitude: 65, homework: 60, quiz: 55, exam: 58 },
        "2025": { midYear: 65, yearEnd: null, attitude: 68, homework: 62, quiz: 60, exam: 65 }
      }
    },
    { 
      name: "Mandarin", 
      teacherComment: "Good pronunciation and character recognition. Continue practicing writing strokes.",
      scores: {
        "2022": { midYear: 68, yearEnd: 70, attitude: 72, homework: 70, quiz: 66, exam: 68 },
        "2023": { midYear: 72, yearEnd: 76, attitude: 78, homework: 75, quiz: 70, exam: 72 },
        "2024": { midYear: 76, yearEnd: 82, attitude: 82, homework: 78, quiz: 74, exam: 76 },
        "2025": { midYear: 78, yearEnd: null, attitude: 80, homework: 76, quiz: 74, exam: 78 }
      }
    },
    { 
      name: "Computer Studies", 
      teacherComment: "Excellent understanding of programming concepts. Shows great potential in coding projects.",
      scores: {
        "2022": { midYear: 72, yearEnd: 76, attitude: 80, homework: 75, quiz: 70, exam: 72 },
        "2023": { midYear: 78, yearEnd: 82, attitude: 85, homework: 80, quiz: 76, exam: 78 },
        "2024": { midYear: 82, yearEnd: 86, attitude: 88, homework: 85, quiz: 80, exam: 82 },
        "2025": { midYear: 88, yearEnd: null, attitude: 90, homework: 88, quiz: 85, exam: 88 }
      }
    },
    { 
      name: "French", 
      teacherComment: "Struggling with grammar and vocabulary. Recommend extra tutoring sessions and daily practice.",
      scores: {
        "2022": { midYear: 30, yearEnd: 33, attitude: 40, homework: 35, quiz: 28, exam: 30 },
        "2023": { midYear: 35, yearEnd: 38, attitude: 45, homework: 40, quiz: 32, exam: 35 },
        "2024": { midYear: 38, yearEnd: 42, attitude: 48, homework: 42, quiz: 35, exam: 38 },
        "2025": { midYear: 45, yearEnd: null, attitude: 50, homework: 48, quiz: 42, exam: 45 }
      }
    },
    { 
      name: "Chemistry", 
      teacherComment: "Needs significant improvement in understanding chemical equations. Extra help sessions available.",
      scores: {
        "2022": { midYear: 28, yearEnd: 30, attitude: 36, homework: 32, quiz: 26, exam: 28 },
        "2023": { midYear: 32, yearEnd: 36, attitude: 42, homework: 38, quiz: 30, exam: 32 },
        "2024": { midYear: 36, yearEnd: 40, attitude: 45, homework: 40, quiz: 34, exam: 36 },
        "2025": { midYear: 42, yearEnd: null, attitude: 48, homework: 45, quiz: 40, exam: 42 }
      }
    },
    { 
      name: "Physics", 
      teacherComment: "Finds concepts challenging. Would benefit from visual learning aids and one-on-one support.",
      scores: {
        "2022": { midYear: 24, yearEnd: 26, attitude: 32, homework: 30, quiz: 22, exam: 24 },
        "2023": { midYear: 28, yearEnd: 32, attitude: 38, homework: 35, quiz: 26, exam: 28 },
        "2024": { midYear: 32, yearEnd: 36, attitude: 42, homework: 38, quiz: 30, exam: 32 },
        "2025": { midYear: 38, yearEnd: null, attitude: 45, homework: 42, quiz: 36, exam: 38 }
      }
    }
  ],
  behavior: [
    { category: "Punctuality", grade: "A", description: "Consistently on time" },
    { category: "Participation", grade: "A", description: "Actively participates in class" },
    { category: "Teamwork", grade: "B", description: "Works well with peers" },
    { category: "Discipline", grade: "A", description: "Follows school rules" },
    { category: "Homework", grade: "C", description: "Frequently late submissions" }
  ],
  coCurriculum: [
    { activity: "Basketball Team", achievement: "1st Place - Inter-School Tournament" },
    { activity: "Science Club", achievement: "Gold Award - Science Fair" },
    { activity: "Debate Club", achievement: "Best Speaker - Regional Competition" }
  ],
  averageScore: 85,
  bestSubject: "Science",
  improvement: "+5%"
};

// Class averages for comparison
export const classAverages = {
  "2022": { midYear: 68, yearEnd: 72, attitude: 72, homework: 70, quiz: 66, exam: 68 },
  "2023": { midYear: 72, yearEnd: 75, attitude: 76, homework: 74, quiz: 70, exam: 72 },
  "2024": { midYear: 74, yearEnd: 77, attitude: 78, homework: 76, quiz: 73, exam: 74 },
  "2025": { midYear: 76, yearEnd: null, attitude: 80, homework: 78, quiz: 75, exam: 76 }
};

import type { CalendarEvent } from "@/types/calendarTags";

export const calendarEvents: CalendarEvent[] = [
  { 
    id: 1, 
    title: "Sports Day", 
    date: "2026-01-15", 
    time: "8:00 AM", 
    tags: ["external-event", "family-event", "preschool", "primary-school", "secondary-school"], 
    location: "School Field" 
  },
  { 
    id: 2, 
    title: "Parent-Teacher Conference", 
    date: "2026-01-20", 
    time: "9:00 AM", 
    tags: ["parent-teacher-conference", "primary-school"], 
    location: "Classroom" 
  },
  { 
    id: 3, 
    title: "Mid-Year Exam Starts", 
    date: "2026-01-25", 
    time: "8:30 AM", 
    tags: ["mid-year-exam", "primary-school", "secondary-school"], 
    location: "Exam Hall" 
  },
  { 
    id: 4, 
    title: "Chinese New Year", 
    date: "2026-01-29", 
    time: "All Day", 
    tags: ["public-holiday"], 
    location: "" 
  },
  { 
    id: 5, 
    title: "Science Fair", 
    date: "2026-01-28", 
    time: "10:00 AM", 
    tags: ["special-event-major", "family-event", "primary-school", "secondary-school"], 
    location: "Assembly Hall" 
  },
  { 
    id: 6, 
    title: "Art Exhibition", 
    date: "2026-02-05", 
    time: "2:00 PM", 
    tags: ["internal-event", "preschool", "primary-school"], 
    location: "Art Room" 
  },
  { 
    id: 7, 
    title: "Swimming Carnival", 
    date: "2026-02-12", 
    time: "9:00 AM", 
    tags: ["external-event", "family-event", "primary-school", "secondary-school"], 
    location: "Swimming Pool" 
  },
  { 
    id: 8, 
    title: "Teacher Meeting", 
    date: "2026-01-22", 
    time: "2:00 PM", 
    tags: ["teacher-meeting"], 
    location: "Staff Room" 
  },
  { 
    id: 9, 
    title: "Admin Meeting", 
    date: "2026-01-23", 
    time: "10:00 AM", 
    tags: ["admin-meeting"], 
    location: "Conference Room" 
  },
  { 
    id: 10, 
    title: "Staff Team Building", 
    date: "2026-02-15", 
    time: "9:00 AM", 
    tags: ["staff-team-building"], 
    location: "Outdoor Camp" 
  },
  { 
    id: 11, 
    title: "Grades Due (Primary)", 
    date: "2026-02-01", 
    time: "5:00 PM", 
    tags: ["teacher-due-date-primary", "primary-school"], 
    location: "" 
  },
  { 
    id: 12, 
    title: "Term Break", 
    date: "2026-03-15", 
    time: "All Day", 
    tags: ["school-holiday-term-break", "preschool", "primary-school", "secondary-school"], 
    location: "" 
  },
  { 
    id: 13, 
    title: "Open Day", 
    date: "2026-02-20", 
    time: "9:00 AM", 
    tags: ["open-day", "family-event", "preschool", "primary-school", "secondary-school"], 
    location: "Main Campus" 
  },
  { 
    id: 14, 
    title: "Cambridge IGCSE Exam", 
    date: "2026-05-01", 
    time: "8:00 AM", 
    tags: ["cambridge-igcse", "secondary-school"], 
    location: "Exam Hall" 
  },
  { 
    id: 15, 
    title: "Back to School Day", 
    date: "2026-01-06", 
    time: "7:30 AM", 
    tags: ["back-to-school", "preschool", "primary-school", "secondary-school"], 
    location: "School Campus" 
  },
  { 
    id: 16, 
    title: "Parent Workshop: Digital Safety", 
    date: "2026-02-25", 
    time: "6:00 PM", 
    tags: ["parent-enrichment-workshop", "family-event"], 
    location: "Auditorium" 
  },
  { 
    id: 17, 
    title: "Student Extra Math Classes", 
    date: "2026-01-18", 
    time: "3:30 PM", 
    tags: ["student-extra-classes", "secondary-school"], 
    location: "Room 201" 
  },
  { 
    id: 18, 
    title: "Board of Governors Meeting", 
    date: "2026-02-10", 
    time: "10:00 AM", 
    tags: ["bog-meeting"], 
    location: "Boardroom" 
  },
  { 
    id: 19, 
    title: "Field Trip: Science Museum", 
    date: "2026-03-01", 
    time: "8:00 AM", 
    tags: ["field-trip", "primary-school"], 
    location: "Science Museum" 
  },
  { 
    id: 20, 
    title: "Student Enrichment: Coding Workshop", 
    date: "2026-03-05", 
    time: "2:00 PM", 
    tags: ["student-enrichment-workshop", "primary-school", "secondary-school"], 
    location: "Computer Lab" 
  }
];

export const ccaActivities = [
  { 
    id: 1, 
    name: "Basketball", 
    day: "Monday", 
    time: "3:30 PM - 5:00 PM", 
    venue: "Gymnasium", 
    coach: "Mr. Johnson", 
    category: "Sports",
    description: "Learn basketball fundamentals, teamwork, and competitive play. Open to all skill levels.",
    maxCapacity: 25,
    currentEnrollment: 22,
    requirements: "Sports attire, basketball shoes, water bottle",
    upcomingSession: "2026-01-06",
    operationalNotes: "Equipment check needed before session. 3 basketballs need replacement. Contact Mr. Ahmad for gym key if arriving early."
  },
  { 
    id: 2, 
    name: "Art Club", 
    day: "Tuesday", 
    time: "3:30 PM - 5:00 PM", 
    venue: "Art Room", 
    coach: "Ms. Chen", 
    category: "Arts",
    description: "Explore various art techniques including painting, drawing, and sculpture. Materials provided.",
    maxCapacity: 20,
    currentEnrollment: 18,
    requirements: "Apron or old clothes",
    upcomingSession: "2026-01-07",
    operationalNotes: "New paint supplies arriving Jan 5. Parent volunteer Mrs. Lim helping next 2 sessions. Display boards needed for Feb exhibition."
  },
  { 
    id: 3, 
    name: "Robotics Club", 
    day: "Wednesday", 
    time: "3:30 PM - 5:30 PM", 
    venue: "STEM Lab", 
    coach: "Mr. Patel", 
    category: "Academic",
    description: "Build and program robots using LEGO Mindstorms and Arduino. Prepare for competitions.",
    maxCapacity: 15,
    currentEnrollment: 15,
    requirements: "Laptop (optional), notebook",
    upcomingSession: "2026-01-08",
    operationalNotes: "Competition registration deadline Jan 15. Need to order 2 more Arduino kits. Lab AC scheduled for maintenance Jan 10."
  },
  { 
    id: 4, 
    name: "Swimming", 
    day: "Thursday", 
    time: "3:30 PM - 5:00 PM", 
    venue: "Swimming Pool", 
    coach: "Ms. Williams", 
    category: "Sports",
    description: "Swimming lessons for beginners to advanced. Focus on stroke technique and water safety.",
    maxCapacity: 20,
    currentEnrollment: 16,
    requirements: "Swimsuit, goggles, towel, swim cap",
    upcomingSession: "2026-01-09",
    operationalNotes: "Pool cleaning scheduled Jan 8 - session moved to 4PM. Lifeguard Mr. Ravi on leave Jan 9, backup is Mr. Samy."
  },
  { 
    id: 5, 
    name: "Drama Club", 
    day: "Friday", 
    time: "3:30 PM - 5:00 PM", 
    venue: "Auditorium", 
    coach: "Mr. Lee", 
    category: "Arts",
    description: "Theater arts including acting, stage production, and public speaking. Annual play production.",
    maxCapacity: 30,
    currentEnrollment: 24,
    requirements: "Comfortable clothing",
    upcomingSession: "2026-01-10",
    operationalNotes: "Script printing in progress. Costume fitting Jan 12. Stage lighting needs repair - reported to maintenance."
  },
  { 
    id: 6, 
    name: "Debate Club", 
    day: "Monday", 
    time: "4:00 PM - 5:30 PM", 
    venue: "Library", 
    coach: "Ms. Brown", 
    category: "Academic",
    description: "Develop critical thinking and public speaking skills through structured debates and discussions.",
    maxCapacity: 16,
    currentEnrollment: 12,
    requirements: "Notebook, pen",
    upcomingSession: "2026-01-06",
    operationalNotes: "Inter-school competition prep starts Jan 13. Reserve library meeting room for practice sessions."
  },
  { 
    id: 7, 
    name: "Badminton", 
    day: "Wednesday", 
    time: "3:30 PM - 5:00 PM", 
    venue: "Sports Hall", 
    coach: "Mr. Tan", 
    category: "Sports",
    description: "Badminton training for all levels. Singles and doubles play, tournament preparation.",
    maxCapacity: 24,
    currentEnrollment: 20,
    requirements: "Sports attire, badminton racket (available for loan)",
    upcomingSession: "2026-01-08",
    operationalNotes: "6 new shuttlecocks ordered. Net on court 2 needs tightening. Sports hall shared with volleyball on alternate weeks."
  }
];

export const tickets = [
  {
    id: "TKT-001",
    type: "Question",
    subject: "Homework Policy Clarification",
    description: "I would like to understand the homework policy for Grade 5 students.",
    category: "Academic",
    status: "Resolved",
    dateSubmitted: "2025-12-20",
    replies: [
      { from: "School", message: "Thank you for your inquiry. Grade 5 students receive homework assignments 3-4 times per week...", date: "2025-12-21" }
    ]
  },
  {
    id: "TKT-002",
    type: "Suggestion",
    subject: "Extended Library Hours",
    description: "Could the library be open until 6 PM on weekdays?",
    category: "Facilities",
    status: "In Progress",
    dateSubmitted: "2025-12-28",
    replies: []
  },
  {
    id: "TKT-003",
    type: "Praise",
    subject: "Excellent Science Teacher",
    description: "Ms. Sarah has been incredibly helpful and inspiring to my child.",
    category: "Teacher",
    status: "Open",
    dateSubmitted: "2026-01-01",
    replies: []
  }
];

export const studentProfile = {
  id: "STU-2024-001",
  name: "Emma Johnson",
  grade: "Grade 5",
  class: "5A",
  photo: null
};

export const students = [
  {
    id: "GL-2025-001",
    name: "Emma Johnson",
    grade: "Grade 5",
    class: "5A",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "History", "Art"]
  },
  {
    id: "GL-2025-002",
    name: "Lucas Johnson",
    grade: "Grade 3",
    class: "3B",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "Music", "Physical Education"]
  },
  {
    id: "GL-2025-003",
    name: "Sophia Johnson",
    grade: "Grade 1",
    class: "1A",
    photo: null,
    subjects: ["English", "Mathematics", "Art", "Music"]
  },
  {
    id: "GL-2025-004",
    name: "Oliver Johnson",
    grade: "Grade 4",
    class: "4B",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "Geography", "Music"]
  },
  {
    id: "GL-2025-005",
    name: "Mia Johnson",
    grade: "Grade 2",
    class: "2A",
    photo: null,
    subjects: ["English", "Mathematics", "Art", "Physical Education"]
  }
];

export const parentProfile = {
  name: "Michael Johnson",
  email: "michael.johnson@email.com",
  phone: "+1 234 567 8900",
  students: students
};
