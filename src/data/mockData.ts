// Mock data for the parent portal

export const announcements = [
  {
    id: 1,
    title: "School Sports Day 2026",
    snippet: "Join us for our annual Sports Day event on January 15th. Students will participate in various athletic activities.",
    content: `We are excited to announce our annual School Sports Day 2026! This is one of the most anticipated events of the year where students showcase their athletic abilities and team spirit.

**Event Details:**
- Date: January 15th, 2026
- Time: 8:00 AM - 4:00 PM
- Venue: School Field

**Activities Include:**
- Track and Field Events (100m, 200m, 400m, Relay)
- Team Sports (Football, Basketball, Volleyball)
- Fun Games for all age groups
- House Competition

**What to Bring:**
- Sports attire and comfortable shoes
- Water bottle
- Sunscreen and hat
- Packed lunch (optional - canteen will be open)

Parents are warmly invited to attend and cheer for their children. Please ensure your child arrives by 7:30 AM for the opening ceremony.

For any queries, please contact the PE Department.`,
    date: "2026-01-05",
    category: "Event",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop",
    attachments: [
      { name: "Sports Day Schedule.pdf", url: "/documents/student-handbook.pdf" },
      { name: "Participation Form.pdf", url: "/documents/student-handbook.pdf" }
    ]
  },
  {
    id: 2,
    title: "Parent-Teacher Conference",
    snippet: "Schedule your one-on-one meeting with teachers. Available slots from Jan 20-22.",
    content: `Dear Parents/Guardians,

We cordially invite you to our upcoming Parent-Teacher Conference. This is an excellent opportunity to discuss your child's academic progress, behavior, and overall development with their teachers.

**Conference Schedule:**
- Dates: January 20-22, 2026
- Time: 9:00 AM - 5:00 PM (by appointment)
- Location: Respective classrooms

**How to Book Your Slot:**
1. Log in to the parent portal
2. Navigate to Calendar > Appointments
3. Select your preferred date and time
4. Confirm your booking

Each session will be approximately 15 minutes. If you require more time, please inform the class teacher in advance.

**What to Expect:**
- Review of academic performance
- Discussion on homework and assignments
- Social and emotional development updates
- Recommendations for improvement
- Goal setting for the next semester

We look forward to meeting you and working together for your child's success.

Best regards,
The School Administration`,
    date: "2026-01-03",
    category: "Academic",
    image: null,
    attachments: [
      { name: "Conference Guidelines.pdf", url: "/documents/student-handbook.pdf" }
    ]
  },
  {
    id: 3,
    title: "New Canteen Menu",
    snippet: "We've updated our canteen menu with healthier options. Check out the new selections!",
    content: `Good news! Our school canteen has undergone a menu revamp to provide healthier and more nutritious meal options for our students.

**New Menu Highlights:**

**Breakfast (7:00 AM - 9:00 AM)**
- Whole grain sandwiches
- Fresh fruit cups
- Low-sugar cereals with milk
- Freshly squeezed juices

**Lunch (11:30 AM - 1:30 PM)**
- Grilled chicken/fish with vegetables
- Brown rice and whole wheat options
- Fresh salad bar
- Soup of the day

**Snacks**
- Fresh fruits
- Yogurt parfaits
- Nuts and dried fruits
- Whole grain crackers

**Important Notes:**
- All meals are prepared fresh daily
- Vegetarian and halal options available
- Allergy information available at the counter
- Meal pre-ordering available through the app

We encourage parents to review the attached menu and discuss healthy eating choices with your children.`,
    date: "2026-01-02",
    category: "General",
    image: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=200&fit=crop",
    attachments: [
      { name: "Full Menu & Prices.pdf", url: "/documents/student-handbook.pdf" }
    ]
  },
  {
    id: 4,
    title: "Science Fair Registration",
    snippet: "Register your child for the upcoming Science Fair. Deadline: January 25th.",
    content: `Calling all young scientists! The annual Science Fair is back, and we're looking for innovative projects from our talented students.

**Event Information:**
- Registration Deadline: January 25th, 2026
- Fair Date: January 28th, 2026
- Time: 10:00 AM - 2:00 PM
- Venue: Assembly Hall

**Categories:**
1. Life Sciences
2. Physical Sciences
3. Engineering & Technology
4. Environmental Science
5. Mathematics & Computer Science

**Project Requirements:**
- Original work by the student
- Display board (maximum 120cm x 90cm)
- Written report (500-1000 words)
- 5-minute presentation

**Prizes:**
- Gold, Silver, and Bronze medals for each category
- Special awards for innovation and presentation
- Top projects will represent the school at the Regional Science Fair

Parents are encouraged to guide but not complete projects for their children. This is an opportunity for students to explore and learn.

Register now to secure your spot!`,
    date: "2025-12-28",
    category: "Academic",
    image: null,
    attachments: [
      { name: "Registration Form.pdf", url: "/documents/student-handbook.pdf" },
      { name: "Project Guidelines.pdf", url: "/documents/student-handbook.pdf" },
      { name: "Judging Criteria.pdf", url: "/documents/student-handbook.pdf" }
    ]
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
    { month: "Jan", present: 18, absent: 2, late: 1, excused: 1 }
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
    // Subject 1 - A*
    { 
      name: "English (First Language)", 
      teacherComment: "Emma shows excellent reading comprehension and creative writing skills. Keep up the great work!",
      scores: {
        "2022": { midYear: 88, yearEnd: 90, attitude: 92, homework: 94, quiz: 86, exam: 88 },
        "2023": { midYear: 90, yearEnd: 92, attitude: 94, homework: 95, quiz: 88, exam: 90 },
        "2024": { midYear: 92, yearEnd: 94, attitude: 95, homework: 96, quiz: 90, exam: 92 },
        "2025": { midYear: 95, yearEnd: null, attitude: 96, homework: 97, quiz: 93, exam: 95 }
      }
    },
    // Subject 2 - A
    { 
      name: "Mathematics", 
      teacherComment: "Strong problem-solving skills. Excellent work in algebra and geometry.",
      scores: {
        "2022": { midYear: 82, yearEnd: 84, attitude: 86, homework: 85, quiz: 80, exam: 82 },
        "2023": { midYear: 84, yearEnd: 86, attitude: 88, homework: 87, quiz: 82, exam: 84 },
        "2024": { midYear: 86, yearEnd: 88, attitude: 90, homework: 89, quiz: 84, exam: 86 },
        "2025": { midYear: 88, yearEnd: null, attitude: 90, homework: 91, quiz: 86, exam: 88 }
      }
    },
    // Subject 3 - B
    { 
      name: "Science", 
      teacherComment: "Good understanding of scientific concepts. Shows enthusiasm in lab work.",
      scores: {
        "2022": { midYear: 72, yearEnd: 74, attitude: 78, homework: 76, quiz: 70, exam: 72 },
        "2023": { midYear: 74, yearEnd: 76, attitude: 80, homework: 78, quiz: 72, exam: 74 },
        "2024": { midYear: 76, yearEnd: 78, attitude: 82, homework: 80, quiz: 74, exam: 76 },
        "2025": { midYear: 78, yearEnd: null, attitude: 84, homework: 82, quiz: 76, exam: 78 }
      }
    },
    // Subject 4 - A*
    { 
      name: "Geography", 
      teacherComment: "Outstanding map reading skills. Excellent understanding of climate patterns.",
      scores: {
        "2022": { midYear: 90, yearEnd: 92, attitude: 94, homework: 93, quiz: 88, exam: 90 },
        "2023": { midYear: 92, yearEnd: 94, attitude: 95, homework: 94, quiz: 90, exam: 92 },
        "2024": { midYear: 93, yearEnd: 95, attitude: 96, homework: 95, quiz: 91, exam: 93 },
        "2025": { midYear: 95, yearEnd: null, attitude: 97, homework: 96, quiz: 93, exam: 95 }
      }
    },
    // Subject 5 - C
    { 
      name: "History", 
      teacherComment: "Needs to improve essay writing. Good participation in class discussions.",
      scores: {
        "2022": { midYear: 60, yearEnd: 62, attitude: 68, homework: 65, quiz: 58, exam: 60 },
        "2023": { midYear: 62, yearEnd: 64, attitude: 70, homework: 67, quiz: 60, exam: 62 },
        "2024": { midYear: 64, yearEnd: 66, attitude: 72, homework: 69, quiz: 62, exam: 64 },
        "2025": { midYear: 66, yearEnd: null, attitude: 74, homework: 71, quiz: 64, exam: 66 }
      }
    },
    // Subject 6 - B
    { 
      name: "Art", 
      teacherComment: "Creative and expressive. Shows good artistic potential.",
      scores: {
        "2022": { midYear: 74, yearEnd: 76, attitude: 82, homework: 80, quiz: 72, exam: 74 },
        "2023": { midYear: 76, yearEnd: 78, attitude: 84, homework: 82, quiz: 74, exam: 76 },
        "2024": { midYear: 78, yearEnd: 80, attitude: 86, homework: 84, quiz: 76, exam: 78 },
        "2025": { midYear: 79, yearEnd: null, attitude: 88, homework: 86, quiz: 77, exam: 79 }
      }
    },
    // Subject 7 - D
    { 
      name: "Physics", 
      teacherComment: "Struggles with complex concepts. Requires additional support and practice.",
      scores: {
        "2022": { midYear: 48, yearEnd: 50, attitude: 58, homework: 55, quiz: 46, exam: 48 },
        "2023": { midYear: 50, yearEnd: 52, attitude: 60, homework: 57, quiz: 48, exam: 50 },
        "2024": { midYear: 52, yearEnd: 54, attitude: 62, homework: 59, quiz: 50, exam: 52 },
        "2025": { midYear: 54, yearEnd: null, attitude: 64, homework: 61, quiz: 52, exam: 54 }
      }
    },
    // Subject 8 - A
    { 
      name: "Malay (First Language)", 
      teacherComment: "Excellent command of Bahasa Malaysia. Outstanding essay writing skills.",
      scores: {
        "2022": { midYear: 80, yearEnd: 82, attitude: 86, homework: 84, quiz: 78, exam: 80 },
        "2023": { midYear: 82, yearEnd: 84, attitude: 88, homework: 86, quiz: 80, exam: 82 },
        "2024": { midYear: 84, yearEnd: 86, attitude: 90, homework: 88, quiz: 82, exam: 84 },
        "2025": { midYear: 85, yearEnd: null, attitude: 92, homework: 90, quiz: 83, exam: 85 }
      }
    },
    // Subject 9 - E
    { 
      name: "Chemistry", 
      teacherComment: "Significant improvement needed. Struggles with equations and formulas.",
      scores: {
        "2022": { midYear: 38, yearEnd: 40, attitude: 52, homework: 48, quiz: 36, exam: 38 },
        "2023": { midYear: 40, yearEnd: 42, attitude: 54, homework: 50, quiz: 38, exam: 40 },
        "2024": { midYear: 42, yearEnd: 44, attitude: 56, homework: 52, quiz: 40, exam: 42 },
        "2025": { midYear: 45, yearEnd: null, attitude: 58, homework: 54, quiz: 43, exam: 45 }
      }
    },
    // Subject 10 - C
    { 
      name: "ICT", 
      teacherComment: "Shows interest in programming. Needs to focus more on practical assignments.",
      scores: {
        "2022": { midYear: 62, yearEnd: 64, attitude: 72, homework: 68, quiz: 60, exam: 62 },
        "2023": { midYear: 64, yearEnd: 66, attitude: 74, homework: 70, quiz: 62, exam: 64 },
        "2024": { midYear: 66, yearEnd: 68, attitude: 76, homework: 72, quiz: 64, exam: 66 },
        "2025": { midYear: 68, yearEnd: null, attitude: 78, homework: 74, quiz: 66, exam: 68 }
      }
    },
    // Subject 11 - B
    { 
      name: "Biology", 
      teacherComment: "Good understanding of biological concepts. Strong lab work skills.",
      scores: {
        "2022": { midYear: 70, yearEnd: 72, attitude: 78, homework: 75, quiz: 68, exam: 70 },
        "2023": { midYear: 72, yearEnd: 74, attitude: 80, homework: 77, quiz: 70, exam: 72 },
        "2024": { midYear: 74, yearEnd: 76, attitude: 82, homework: 79, quiz: 72, exam: 74 },
        "2025": { midYear: 75, yearEnd: null, attitude: 84, homework: 81, quiz: 73, exam: 75 }
      }
    },
    // Subject 12 - A
    { 
      name: "Islamic Studies", 
      teacherComment: "Excellent understanding of Islamic principles. Active participation in class.",
      scores: {
        "2022": { midYear: 82, yearEnd: 84, attitude: 90, homework: 88, quiz: 80, exam: 82 },
        "2023": { midYear: 84, yearEnd: 86, attitude: 92, homework: 90, quiz: 82, exam: 84 },
        "2024": { midYear: 86, yearEnd: 88, attitude: 94, homework: 92, quiz: 84, exam: 86 },
        "2025": { midYear: 87, yearEnd: null, attitude: 95, homework: 93, quiz: 85, exam: 87 }
      }
    },
    // Subject 13 - D
    { 
      name: "Additional Mathematics", 
      teacherComment: "Finds advanced concepts challenging. Needs consistent practice.",
      scores: {
        "2022": { midYear: 50, yearEnd: 52, attitude: 60, homework: 56, quiz: 48, exam: 50 },
        "2023": { midYear: 52, yearEnd: 54, attitude: 62, homework: 58, quiz: 50, exam: 52 },
        "2024": { midYear: 54, yearEnd: 56, attitude: 64, homework: 60, quiz: 52, exam: 54 },
        "2025": { midYear: 55, yearEnd: null, attitude: 66, homework: 62, quiz: 53, exam: 55 }
      }
    }
  ],
  behavior: [
    { category: "Initiative to Assist", grade: "B" },
    { category: "Homework Submission", grade: "C" },
    { category: "Passion to Learn", grade: "B" },
    { category: "Communication Skills", grade: "C" },
    { category: "Participation", grade: "C" },
    { category: "Leadership Skills", grade: "C" },
    { category: "Punctuality", grade: "D" },
    { category: "Self-Discipline", grade: "B" }
  ],
  behaviorComments: {
    homeroomComment: "Emma is a wonderful student who always shows kindness to her classmates. She has made excellent progress this semester and continues to be a positive influence in the classroom.",
    responsibilityComment: "Emma consistently completes her assigned duties and takes ownership of her responsibilities. She is reliable and can be counted on to help others."
  },
  awards: {
    sportsHouse: { organization: "Basketball", role: "Captain" },
    club: { organization: "Science Club", role: "Member" },
    studentLeadership: { organization: "Prefect Board", role: "Vice-Captain" },
    events: { organization: "Sports Day", role: "Coordinator" },
    achievements: { event: "Science Fair", award: "Gold" }
  },
  coCurriculum: [
    { activity: "Basketball Team", achievement: "1st Place - Inter-School Tournament" },
    { activity: "Science Club", achievement: "Gold Award - Science Fair" },
    { activity: "Debate Club", achievement: "Best Speaker - Regional Competition" }
  ],
  averageScore: 85,
  bestSubject: "Geography",
  improvement: "+5%"
};

// Class averages for comparison - now per subject
export const classAverages = {
  "2022": { 
    midYear: 68, yearEnd: 72, attitude: 72, homework: 70, quiz: 66, exam: 68,
    bySubject: {
      "English (First Language)": 72, "English (Second Language)": 68, 
      "Malay (First Language)": 74, "Malay (Foreign Language)": 52,
      "Chinese (Foreign Language)": 70, "Chinese (Second Language)": 72, "Chinese (Beginner)": 42,
      "Science": 70, "Biology": 72, "Chemistry": 48, "Physics": 45,
      "Mathematics": 55, "Additional Mathematics": 68,
      "Business Studies": 70, "Accounting": 75, "Economics": 68,
      "Global Perspectives": 72, "History": 48, "Geography": 70,
      "ICT": 66, "Living Skills & Arts": 68, "Art": 75, "Music": 55, "Moral": 72, "Islamic Studies": 78
    }
  },
  "2023": { 
    midYear: 72, yearEnd: 75, attitude: 76, homework: 74, quiz: 70, exam: 72,
    bySubject: {
      "English (First Language)": 76, "English (Second Language)": 72, 
      "Malay (First Language)": 78, "Malay (Foreign Language)": 55,
      "Chinese (Foreign Language)": 74, "Chinese (Second Language)": 76, "Chinese (Beginner)": 45,
      "Science": 74, "Biology": 76, "Chemistry": 50, "Physics": 48,
      "Mathematics": 58, "Additional Mathematics": 72,
      "Business Studies": 74, "Accounting": 78, "Economics": 72,
      "Global Perspectives": 76, "History": 50, "Geography": 74,
      "ICT": 70, "Living Skills & Arts": 72, "Art": 78, "Music": 58, "Moral": 75, "Islamic Studies": 82
    }
  },
  "2024": { 
    midYear: 74, yearEnd: 77, attitude: 78, homework: 76, quiz: 73, exam: 74,
    bySubject: {
      "English (First Language)": 78, "English (Second Language)": 74, 
      "Malay (First Language)": 80, "Malay (Foreign Language)": 58,
      "Chinese (Foreign Language)": 76, "Chinese (Second Language)": 78, "Chinese (Beginner)": 48,
      "Science": 80, "Biology": 80, "Chemistry": 52, "Physics": 50,
      "Mathematics": 60, "Additional Mathematics": 76,
      "Business Studies": 78, "Accounting": 82, "Economics": 76,
      "Global Perspectives": 80, "History": 52, "Geography": 78,
      "ICT": 74, "Living Skills & Arts": 75, "Art": 82, "Music": 60, "Moral": 78, "Islamic Studies": 86
    }
  },
  "2025": { 
    midYear: 76, yearEnd: null, attitude: 80, homework: 78, quiz: 75, exam: 76,
    bySubject: {
      "English (First Language)": 82, "English (Second Language)": 78, 
      "Malay (First Language)": 84, "Malay (Foreign Language)": 60,
      "Chinese (Foreign Language)": 78, "Chinese (Second Language)": 80, "Chinese (Beginner)": 50,
      "Science": 84, "Biology": 84, "Chemistry": 55, "Physics": 52,
      "Mathematics": 62, "Additional Mathematics": 80,
      "Business Studies": 82, "Accounting": 86, "Economics": 80,
      "Global Perspectives": 84, "History": 55, "Geography": 82,
      "ICT": 78, "Living Skills & Arts": 76, "Art": 88, "Music": 62, "Moral": 80, "Islamic Studies": 90
    }
  }
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
