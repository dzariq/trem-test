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
    // Languages - English
    { 
      name: "English (First Language)", 
      teacherComment: "Emma shows excellent reading comprehension and creative writing skills. Keep up the great work!",
      scores: {
        "2022": { midYear: 70, yearEnd: 72, attitude: 74, homework: 76, quiz: 68, exam: 70 },
        "2023": { midYear: 74, yearEnd: 78, attitude: 78, homework: 80, quiz: 72, exam: 74 },
        "2024": { midYear: 78, yearEnd: 82, attitude: 82, homework: 85, quiz: 76, exam: 78 },
        "2025": { midYear: 85, yearEnd: null, attitude: 88, homework: 90, quiz: 82, exam: 85 }
      }
    },
    { 
      name: "English (Second Language)", 
      teacherComment: "Good progress in language acquisition. Continue building vocabulary.",
      scores: {
        "2022": { midYear: 65, yearEnd: 68, attitude: 70, homework: 72, quiz: 64, exam: 66 },
        "2023": { midYear: 70, yearEnd: 74, attitude: 74, homework: 76, quiz: 68, exam: 70 },
        "2024": { midYear: 74, yearEnd: 78, attitude: 78, homework: 80, quiz: 72, exam: 74 },
        "2025": { midYear: 80, yearEnd: null, attitude: 82, homework: 85, quiz: 78, exam: 80 }
      }
    },
    // Languages - Malay
    { 
      name: "Malay (First Language)", 
      teacherComment: "Excellent command of Bahasa Malaysia. Outstanding essay writing skills.",
      scores: {
        "2022": { midYear: 72, yearEnd: 75, attitude: 78, homework: 76, quiz: 70, exam: 72 },
        "2023": { midYear: 76, yearEnd: 80, attitude: 82, homework: 80, quiz: 74, exam: 76 },
        "2024": { midYear: 80, yearEnd: 84, attitude: 85, homework: 83, quiz: 78, exam: 80 },
        "2025": { midYear: 85, yearEnd: null, attitude: 88, homework: 86, quiz: 82, exam: 85 }
      }
    },
    { 
      name: "Malay (Foreign Language)", 
      teacherComment: "Shows good understanding of Bahasa Malaysia. Could improve on essay structure.",
      scores: {
        "2022": { midYear: 60, yearEnd: 64, attitude: 66, homework: 62, quiz: 58, exam: 60 },
        "2023": { midYear: 66, yearEnd: 70, attitude: 72, homework: 68, quiz: 64, exam: 66 },
        "2024": { midYear: 70, yearEnd: 78, attitude: 75, homework: 72, quiz: 68, exam: 70 },
        "2025": { midYear: 72, yearEnd: null, attitude: 74, homework: 70, quiz: 68, exam: 72 }
      }
    },
    // Languages - Chinese
    { 
      name: "Chinese (Foreign Language)", 
      teacherComment: "Good pronunciation and character recognition. Continue practicing writing strokes.",
      scores: {
        "2022": { midYear: 68, yearEnd: 70, attitude: 72, homework: 70, quiz: 66, exam: 68 },
        "2023": { midYear: 72, yearEnd: 76, attitude: 78, homework: 75, quiz: 70, exam: 72 },
        "2024": { midYear: 76, yearEnd: 82, attitude: 82, homework: 78, quiz: 74, exam: 76 },
        "2025": { midYear: 78, yearEnd: null, attitude: 80, homework: 76, quiz: 74, exam: 78 }
      }
    },
    { 
      name: "Chinese (Second Language)", 
      teacherComment: "Strong foundation in Chinese language. Excellent reading comprehension.",
      scores: {
        "2022": { midYear: 70, yearEnd: 73, attitude: 75, homework: 73, quiz: 68, exam: 70 },
        "2023": { midYear: 74, yearEnd: 78, attitude: 80, homework: 77, quiz: 72, exam: 74 },
        "2024": { midYear: 78, yearEnd: 84, attitude: 84, homework: 80, quiz: 76, exam: 78 },
        "2025": { midYear: 82, yearEnd: null, attitude: 85, homework: 82, quiz: 78, exam: 82 }
      }
    },
    { 
      name: "Chinese (Beginner)", 
      teacherComment: "Making good progress for a beginner. Keep practicing characters daily.",
      scores: {
        "2022": { midYear: 55, yearEnd: 58, attitude: 65, homework: 60, quiz: 52, exam: 55 },
        "2023": { midYear: 60, yearEnd: 65, attitude: 70, homework: 65, quiz: 58, exam: 60 },
        "2024": { midYear: 65, yearEnd: 70, attitude: 72, homework: 68, quiz: 62, exam: 65 },
        "2025": { midYear: 70, yearEnd: null, attitude: 75, homework: 72, quiz: 68, exam: 70 }
      }
    },
    // Sciences
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
      name: "Biology", 
      teacherComment: "Excellent understanding of biological concepts. Strong lab work skills.",
      scores: {
        "2022": { midYear: 74, yearEnd: 77, attitude: 80, homework: 78, quiz: 72, exam: 74 },
        "2023": { midYear: 78, yearEnd: 82, attitude: 85, homework: 82, quiz: 76, exam: 78 },
        "2024": { midYear: 82, yearEnd: 86, attitude: 88, homework: 85, quiz: 80, exam: 82 },
        "2025": { midYear: 88, yearEnd: null, attitude: 90, homework: 88, quiz: 85, exam: 88 }
      }
    },
    { 
      name: "Chemistry", 
      teacherComment: "Good understanding of chemical equations. Keep practicing balancing equations.",
      scores: {
        "2022": { midYear: 62, yearEnd: 65, attitude: 68, homework: 65, quiz: 60, exam: 62 },
        "2023": { midYear: 66, yearEnd: 70, attitude: 72, homework: 68, quiz: 64, exam: 66 },
        "2024": { midYear: 70, yearEnd: 74, attitude: 76, homework: 72, quiz: 68, exam: 70 },
        "2025": { midYear: 75, yearEnd: null, attitude: 78, homework: 76, quiz: 72, exam: 75 }
      }
    },
    { 
      name: "Physics", 
      teacherComment: "Finds concepts challenging. Would benefit from visual learning aids.",
      scores: {
        "2022": { midYear: 58, yearEnd: 62, attitude: 65, homework: 62, quiz: 56, exam: 58 },
        "2023": { midYear: 62, yearEnd: 66, attitude: 70, homework: 66, quiz: 60, exam: 62 },
        "2024": { midYear: 66, yearEnd: 70, attitude: 72, homework: 68, quiz: 64, exam: 66 },
        "2025": { midYear: 72, yearEnd: null, attitude: 75, homework: 72, quiz: 68, exam: 72 }
      }
    },
    // Mathematics
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
      name: "Additional Mathematics", 
      teacherComment: "Strong analytical skills in advanced math. Excellent problem-solving abilities.",
      scores: {
        "2022": { midYear: 65, yearEnd: 68, attitude: 72, homework: 68, quiz: 62, exam: 65 },
        "2023": { midYear: 70, yearEnd: 74, attitude: 77, homework: 72, quiz: 68, exam: 70 },
        "2024": { midYear: 74, yearEnd: 78, attitude: 80, homework: 76, quiz: 72, exam: 74 },
        "2025": { midYear: 82, yearEnd: null, attitude: 86, homework: 84, quiz: 80, exam: 82 }
      }
    },
    // Technology
    { 
      name: "ICT", 
      teacherComment: "Excellent understanding of programming concepts. Shows great potential in coding projects.",
      scores: {
        "2022": { midYear: 72, yearEnd: 76, attitude: 80, homework: 75, quiz: 70, exam: 72 },
        "2023": { midYear: 78, yearEnd: 82, attitude: 85, homework: 80, quiz: 76, exam: 78 },
        "2024": { midYear: 82, yearEnd: 86, attitude: 88, homework: 85, quiz: 80, exam: 82 },
        "2025": { midYear: 88, yearEnd: null, attitude: 90, homework: 88, quiz: 85, exam: 88 }
      }
    },
    // Business & Commerce
    { 
      name: "Business Studies", 
      teacherComment: "Good understanding of business concepts. Strong analytical skills.",
      scores: {
        "2022": { midYear: 70, yearEnd: 73, attitude: 75, homework: 72, quiz: 68, exam: 70 },
        "2023": { midYear: 74, yearEnd: 78, attitude: 80, homework: 76, quiz: 72, exam: 74 },
        "2024": { midYear: 78, yearEnd: 82, attitude: 84, homework: 80, quiz: 76, exam: 78 },
        "2025": { midYear: 84, yearEnd: null, attitude: 87, homework: 85, quiz: 82, exam: 84 }
      }
    },
    { 
      name: "Accounting", 
      teacherComment: "Excellent with numbers and financial statements. Very accurate work.",
      scores: {
        "2022": { midYear: 75, yearEnd: 78, attitude: 80, homework: 78, quiz: 73, exam: 75 },
        "2023": { midYear: 80, yearEnd: 84, attitude: 85, homework: 82, quiz: 78, exam: 80 },
        "2024": { midYear: 84, yearEnd: 88, attitude: 90, homework: 86, quiz: 82, exam: 84 },
        "2025": { midYear: 90, yearEnd: null, attitude: 92, homework: 90, quiz: 88, exam: 90 }
      }
    },
    { 
      name: "Economics", 
      teacherComment: "Strong grasp of economic principles. Good analytical thinking.",
      scores: {
        "2022": { midYear: 68, yearEnd: 72, attitude: 74, homework: 70, quiz: 66, exam: 68 },
        "2023": { midYear: 72, yearEnd: 76, attitude: 78, homework: 74, quiz: 70, exam: 72 },
        "2024": { midYear: 76, yearEnd: 80, attitude: 82, homework: 78, quiz: 74, exam: 76 },
        "2025": { midYear: 82, yearEnd: null, attitude: 85, homework: 83, quiz: 80, exam: 82 }
      }
    },
    // Humanities
    { 
      name: "Global Perspectives", 
      teacherComment: "Excellent critical thinking and research skills. Strong presentation abilities.",
      scores: {
        "2022": { midYear: 72, yearEnd: 75, attitude: 78, homework: 74, quiz: 70, exam: 72 },
        "2023": { midYear: 76, yearEnd: 80, attitude: 82, homework: 78, quiz: 74, exam: 76 },
        "2024": { midYear: 80, yearEnd: 84, attitude: 86, homework: 82, quiz: 78, exam: 80 },
        "2025": { midYear: 86, yearEnd: null, attitude: 88, homework: 86, quiz: 84, exam: 86 }
      }
    },
    { 
      name: "History", 
      teacherComment: "Shows good understanding of historical events. Could improve on essay structure and analysis.",
      scores: {
        "2022": { midYear: 65, yearEnd: 69, attitude: 70, homework: 68, quiz: 64, exam: 65 },
        "2023": { midYear: 71, yearEnd: 75, attitude: 76, homework: 74, quiz: 70, exam: 71 },
        "2024": { midYear: 75, yearEnd: 78, attitude: 80, homework: 78, quiz: 74, exam: 75 },
        "2025": { midYear: 82, yearEnd: null, attitude: 85, homework: 86, quiz: 80, exam: 82 }
      }
    },
    { 
      name: "Geography", 
      teacherComment: "Good map reading skills. Needs to work on understanding climate patterns.",
      scores: {
        "2022": { midYear: 84, yearEnd: 86, attitude: 88, homework: 86, quiz: 82, exam: 84 },
        "2023": { midYear: 88, yearEnd: 90, attitude: 92, homework: 90, quiz: 85, exam: 88 },
        "2024": { midYear: 90, yearEnd: 92, attitude: 94, homework: 92, quiz: 88, exam: 90 },
        "2025": { midYear: 95, yearEnd: null, attitude: 96, homework: 95, quiz: 92, exam: 95 }
      }
    },
    // Arts & Skills
    { 
      name: "Living Skills & Arts", 
      teacherComment: "Exceptional creativity and artistic talent! Emma's work is always inspiring.",
      scores: {
        "2022": { midYear: 78, yearEnd: 80, attitude: 82, homework: 78, quiz: 76, exam: 78 },
        "2023": { midYear: 82, yearEnd: 85, attitude: 88, homework: 82, quiz: 80, exam: 82 },
        "2024": { midYear: 85, yearEnd: 88, attitude: 90, homework: 86, quiz: 84, exam: 85 },
        "2025": { midYear: 90, yearEnd: null, attitude: 92, homework: 90, quiz: 88, exam: 90 }
      }
    },
    { 
      name: "Music", 
      teacherComment: "Shows interest in music theory. Practice more on rhythm and timing.",
      scores: {
        "2022": { midYear: 68, yearEnd: 70, attitude: 72, homework: 68, quiz: 66, exam: 68 },
        "2023": { midYear: 72, yearEnd: 75, attitude: 78, homework: 72, quiz: 70, exam: 72 },
        "2024": { midYear: 75, yearEnd: 78, attitude: 80, homework: 76, quiz: 74, exam: 75 },
        "2025": { midYear: 80, yearEnd: null, attitude: 82, homework: 80, quiz: 78, exam: 80 }
      }
    },
    // Values
    { 
      name: "Moral", 
      teacherComment: "Demonstrates good moral values and participates well in class discussions.",
      scores: {
        "2022": { midYear: 75, yearEnd: 78, attitude: 80, homework: 76, quiz: 74, exam: 75 },
        "2023": { midYear: 78, yearEnd: 82, attitude: 85, homework: 80, quiz: 76, exam: 78 },
        "2024": { midYear: 82, yearEnd: 86, attitude: 88, homework: 84, quiz: 80, exam: 82 },
        "2025": { midYear: 88, yearEnd: null, attitude: 90, homework: 88, quiz: 86, exam: 88 }
      }
    },
    { 
      name: "Islamic Studies", 
      teacherComment: "Good understanding of Islamic principles and values. Active participation in class.",
      scores: {
        "2022": { midYear: 80, yearEnd: 83, attitude: 85, homework: 82, quiz: 78, exam: 80 },
        "2023": { midYear: 84, yearEnd: 88, attitude: 90, homework: 86, quiz: 82, exam: 84 },
        "2024": { midYear: 88, yearEnd: 90, attitude: 92, homework: 88, quiz: 86, exam: 88 },
        "2025": { midYear: 92, yearEnd: null, attitude: 94, homework: 92, quiz: 90, exam: 92 }
      }
    }
  ],
  behavior: [
    { category: "Attendance", grade: "A" },
    { category: "Punctuality", grade: "B" },
    { category: "Cooperation", grade: "A" },
    { category: "Self Control", grade: "C" },
    { category: "Responsibility", grade: "A" },
    { category: "Initiative", grade: "B" },
    { category: "Leadership", grade: "A" }
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
      "Malay (First Language)": 74, "Malay (Foreign Language)": 65,
      "Chinese (Foreign Language)": 70, "Chinese (Second Language)": 72, "Chinese (Beginner)": 58,
      "Science": 70, "Biology": 72, "Chemistry": 65, "Physics": 62,
      "Mathematics": 65, "Additional Mathematics": 68,
      "ICT": 66, "Business Studies": 70, "Accounting": 75, "Economics": 68,
      "Global Perspectives": 72, "History": 62, "Geography": 70,
      "Living Skills & Arts": 68, "Music": 60, "Moral": 72, "Islamic Studies": 78
    }
  },
  "2023": { 
    midYear: 72, yearEnd: 75, attitude: 76, homework: 74, quiz: 70, exam: 72,
    bySubject: {
      "English (First Language)": 76, "English (Second Language)": 72, 
      "Malay (First Language)": 78, "Malay (Foreign Language)": 68,
      "Chinese (Foreign Language)": 74, "Chinese (Second Language)": 76, "Chinese (Beginner)": 62,
      "Science": 74, "Biology": 76, "Chemistry": 68, "Physics": 65,
      "Mathematics": 70, "Additional Mathematics": 72,
      "ICT": 70, "Business Studies": 74, "Accounting": 78, "Economics": 72,
      "Global Perspectives": 76, "History": 66, "Geography": 74,
      "Living Skills & Arts": 72, "Music": 64, "Moral": 75, "Islamic Studies": 82
    }
  },
  "2024": { 
    midYear: 74, yearEnd: 77, attitude: 78, homework: 76, quiz: 73, exam: 74,
    bySubject: {
      "English (First Language)": 78, "English (Second Language)": 74, 
      "Malay (First Language)": 80, "Malay (Foreign Language)": 72,
      "Chinese (Foreign Language)": 76, "Chinese (Second Language)": 78, "Chinese (Beginner)": 66,
      "Science": 80, "Biology": 80, "Chemistry": 72, "Physics": 68,
      "Mathematics": 74, "Additional Mathematics": 76,
      "ICT": 74, "Business Studies": 78, "Accounting": 82, "Economics": 76,
      "Global Perspectives": 80, "History": 70, "Geography": 78,
      "Living Skills & Arts": 75, "Music": 68, "Moral": 78, "Islamic Studies": 86
    }
  },
  "2025": { 
    midYear: 76, yearEnd: null, attitude: 80, homework: 78, quiz: 75, exam: 76,
    bySubject: {
      "English (First Language)": 82, "English (Second Language)": 78, 
      "Malay (First Language)": 84, "Malay (Foreign Language)": 74,
      "Chinese (Foreign Language)": 78, "Chinese (Second Language)": 80, "Chinese (Beginner)": 70,
      "Science": 84, "Biology": 84, "Chemistry": 76, "Physics": 72,
      "Mathematics": 78, "Additional Mathematics": 80,
      "ICT": 78, "Business Studies": 82, "Accounting": 86, "Economics": 80,
      "Global Perspectives": 84, "History": 72, "Geography": 82,
      "Living Skills & Arts": 76, "Music": 70, "Moral": 80, "Islamic Studies": 90
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
