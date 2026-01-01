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
    { name: "English", midYearLast: 78, yearEndLast: 82, midYearCurrent: 85, yearEndCurrent: null },
    { name: "Mathematics", midYearLast: 72, yearEndLast: 75, midYearCurrent: 80, yearEndCurrent: null },
    { name: "Science", midYearLast: 85, yearEndLast: 88, midYearCurrent: 90, yearEndCurrent: null },
    { name: "History", midYearLast: 70, yearEndLast: 74, midYearCurrent: 78, yearEndCurrent: null },
    { name: "Geography", midYearLast: 75, yearEndLast: 78, midYearCurrent: 82, yearEndCurrent: null }
  ],
  behavior: [
    { category: "Punctuality", grade: "A", description: "Consistently on time" },
    { category: "Participation", grade: "A", description: "Actively participates in class" },
    { category: "Teamwork", grade: "B", description: "Works well with peers" },
    { category: "Discipline", grade: "A", description: "Follows school rules" }
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

export const calendarEvents = [
  { id: 1, title: "Sports Day", date: "2026-01-15", time: "8:00 AM", tag: "Event", location: "School Field" },
  { id: 2, title: "Parent-Teacher Meeting", date: "2026-01-20", time: "9:00 AM", tag: "Meeting", location: "Classroom" },
  { id: 3, title: "Mid-Year Exam Starts", date: "2026-01-25", time: "8:30 AM", tag: "Exam", location: "Exam Hall" },
  { id: 4, title: "Chinese New Year", date: "2026-01-29", time: "All Day", tag: "Holiday", location: "" },
  { id: 5, title: "Science Fair", date: "2026-01-28", time: "10:00 AM", tag: "Event", location: "Assembly Hall" },
  { id: 6, title: "Art Exhibition", date: "2026-02-05", time: "2:00 PM", tag: "Event", location: "Art Room" },
  { id: 7, title: "Swimming Carnival", date: "2026-02-12", time: "9:00 AM", tag: "Event", location: "Swimming Pool" }
];

export const ccaActivities = [
  { id: 1, name: "Basketball", day: "Monday", time: "3:30 PM - 5:00 PM", venue: "Gymnasium", coach: "Mr. Johnson", category: "Sports" },
  { id: 2, name: "Art Club", day: "Tuesday", time: "3:30 PM - 5:00 PM", venue: "Art Room", coach: "Ms. Chen", category: "Arts" },
  { id: 3, name: "Robotics Club", day: "Wednesday", time: "3:30 PM - 5:30 PM", venue: "STEM Lab", coach: "Mr. Patel", category: "Academic" },
  { id: 4, name: "Swimming", day: "Thursday", time: "3:30 PM - 5:00 PM", venue: "Swimming Pool", coach: "Ms. Williams", category: "Sports" },
  { id: 5, name: "Drama Club", day: "Friday", time: "3:30 PM - 5:00 PM", venue: "Auditorium", coach: "Mr. Lee", category: "Arts" },
  { id: 6, name: "Debate Club", day: "Monday", time: "4:00 PM - 5:30 PM", venue: "Library", coach: "Ms. Brown", category: "Academic" },
  { id: 7, name: "Badminton", day: "Wednesday", time: "3:30 PM - 5:00 PM", venue: "Sports Hall", coach: "Mr. Tan", category: "Sports" }
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
    id: "STU-2024-001",
    name: "Emma Johnson",
    grade: "Grade 5",
    class: "5A",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "History", "Art"]
  },
  {
    id: "STU-2024-002",
    name: "Lucas Johnson",
    grade: "Grade 3",
    class: "3B",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "Music", "Physical Education"]
  },
  {
    id: "STU-2024-003",
    name: "Sophia Johnson",
    grade: "Grade 1",
    class: "1A",
    photo: null,
    subjects: ["English", "Mathematics", "Art", "Music"]
  },
  {
    id: "STU-2024-004",
    name: "Oliver Johnson",
    grade: "Grade 4",
    class: "4B",
    photo: null,
    subjects: ["English", "Mathematics", "Science", "Geography", "Music"]
  },
  {
    id: "STU-2024-005",
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
