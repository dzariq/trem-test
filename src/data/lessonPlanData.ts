// Lesson Plan Module Data Structures and Mock Data

export interface LessonFlowActivity {
  id: string;
  duration: number; // in minutes
  description: string;
  steps: string[];
  isTeacherLed: boolean;
}

export interface LessonFlow {
  beginning: LessonFlowActivity;
  middle: LessonFlowActivity;
  end: LessonFlowActivity;
}

export interface LessonPlanReflection {
  objectivesAchieved: boolean;
  objectivesNotAchieved: boolean;
  comments: string;
}

export interface LessonPlanApproval {
  preparedBy: string;
  preparedDate: string;
  checkedBy: string | null;
  checkedDate: string | null;
  status: "draft" | "pending_review" | "approved" | "needs_revision";
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface LessonPlan {
  id: string;
  // Basic Information
  title: string;
  weekNumber: number;
  lessonNumber: number; // 1-5
  teacherName: string;
  className: string;
  subject: string;
  topic: string;
  subtopic: string;
  date: string;
  
  // Learning Objectives
  learningObjectives: string[];
  
  // Formula / Vocabulary / Terminology
  vocabulary: string[];
  
  // Previous Learning
  previousLearning: string;
  
  // Planned Lesson Flow
  lessonFlow: LessonFlow;
  
  // Resources
  resources: string;
  attachments: string[];
  
  // Homework
  homework: string;
  
  // Reflection
  reflection: LessonPlanReflection;
  
  // Attendance
  attendance: AttendanceSummary | null;
  
  // Approval
  approval: LessonPlanApproval;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Week {
  id: string;
  weekNumber: number;
  title: string;
  lessonPlans: LessonPlan[];
}

export interface Topic {
  id: string;
  title: string;
  weeks: Week[];
}

export interface SubjectCurriculum {
  subject: string;
  topics: Topic[];
}

// Helper to get lesson plan status
export const getLessonPlanStatus = (lp: LessonPlan): "complete" | "incomplete" | "draft" | "empty" => {
  if (!lp.title) return "empty";
  if (lp.approval.status === "draft") return "draft";
  if (!lp.reflection.comments && lp.approval.status !== "approved") return "incomplete";
  return "complete";
};

// Mock Data
export const mockLessonPlans: SubjectCurriculum[] = [
  {
    subject: "Mathematics",
    topics: [
      {
        id: "topic-1",
        title: "Algebra Basics",
        weeks: [
          {
            id: "week-1",
            weekNumber: 1,
            title: "Introduction to Variables",
            lessonPlans: [
              {
                id: "lp-1-1-1",
                title: "Understanding Variables and Constants",
                weekNumber: 1,
                lessonNumber: 1,
                teacherName: "Ms. Sarah Chen",
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopic: "Variables and Constants",
                date: "2026-01-06",
                learningObjectives: [
                  "Define what a variable is in algebra",
                  "Distinguish between variables and constants",
                  "Identify variables in simple expressions"
                ],
                vocabulary: ["variable", "constant", "expression", "coefficient"],
                previousLearning: "Students have learned basic arithmetic operations and number properties.",
                lessonFlow: {
                  beginning: {
                    id: "b1",
                    duration: 10,
                    description: "Warm-up: Quick mental math review",
                    steps: ["Mental math quiz (5 min)", "Discuss answers and patterns (5 min)"],
                    isTeacherLed: true
                  },
                  middle: {
                    id: "m1",
                    duration: 25,
                    description: "Introduction to variables concept",
                    steps: [
                      "Introduce the concept of variables using real-world examples",
                      "Show how letters can represent unknown values",
                      "Practice identifying variables in expressions",
                      "Pair work: Create simple expressions with variables"
                    ],
                    isTeacherLed: false
                  },
                  end: {
                    id: "e1",
                    duration: 10,
                    description: "Consolidation and exit ticket",
                    steps: ["Review key concepts", "Complete exit ticket with 3 questions"],
                    isTeacherLed: true
                  }
                },
                resources: "Textbook pages 45-48, Variable cards worksheet, Interactive whiteboard presentation",
                attachments: [],
                homework: "Worksheet 3.1: Identifying Variables (10 questions)",
                reflection: {
                  objectivesAchieved: true,
                  objectivesNotAchieved: false,
                  comments: "Students grasped the concept well. Some needed extra support with distinguishing coefficients from constants."
                },
                attendance: { present: 18, absent: 1, late: 1, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Ms. Sarah Chen",
                  preparedDate: "2026-01-05",
                  checkedBy: "Mr. David Wong",
                  checkedDate: "2026-01-05",
                  status: "approved"
                },
                createdAt: "2026-01-04T10:00:00Z",
                updatedAt: "2026-01-06T15:00:00Z"
              },
              {
                id: "lp-1-1-2",
                title: "Writing Algebraic Expressions",
                weekNumber: 1,
                lessonNumber: 2,
                teacherName: "Ms. Sarah Chen",
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopic: "Algebraic Expressions",
                date: "2026-01-07",
                learningObjectives: [
                  "Translate verbal phrases into algebraic expressions",
                  "Write expressions with one variable",
                  "Simplify basic expressions"
                ],
                vocabulary: ["algebraic expression", "term", "like terms", "simplify"],
                previousLearning: "Students can identify variables and constants in expressions.",
                lessonFlow: {
                  beginning: {
                    id: "b2",
                    duration: 8,
                    description: "Review previous lesson concepts",
                    steps: ["Quick quiz on variables (3 min)", "Discuss and correct (5 min)"],
                    isTeacherLed: true
                  },
                  middle: {
                    id: "m2",
                    duration: 30,
                    description: "Teaching algebraic expressions",
                    steps: [
                      "Show how to translate words to expressions",
                      "Practice examples together",
                      "Group activity: Expression translation game"
                    ],
                    isTeacherLed: false
                  },
                  end: {
                    id: "e2",
                    duration: 7,
                    description: "Wrap-up",
                    steps: ["Summary of key points", "Preview next lesson"],
                    isTeacherLed: true
                  }
                },
                resources: "Expression cards, Worksheet 3.2, Projector slides",
                attachments: [],
                homework: "Complete exercises 1-15 on page 52",
                reflection: {
                  objectivesAchieved: true,
                  objectivesNotAchieved: false,
                  comments: "Good participation. The translation game was very effective."
                },
                attendance: { present: 19, absent: 0, late: 1, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Ms. Sarah Chen",
                  preparedDate: "2026-01-06",
                  checkedBy: "Mr. David Wong",
                  checkedDate: "2026-01-06",
                  status: "approved"
                },
                createdAt: "2026-01-05T10:00:00Z",
                updatedAt: "2026-01-07T15:00:00Z"
              },
              {
                id: "lp-1-1-3",
                title: "Evaluating Expressions",
                weekNumber: 1,
                lessonNumber: 3,
                teacherName: "Ms. Sarah Chen",
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopic: "Evaluating Expressions",
                date: "2026-01-08",
                learningObjectives: [
                  "Substitute values for variables",
                  "Evaluate expressions with given values"
                ],
                vocabulary: ["substitute", "evaluate"],
                previousLearning: "Students can write algebraic expressions from verbal phrases.",
                lessonFlow: {
                  beginning: {
                    id: "b3",
                    duration: 10,
                    description: "Warm-up activity",
                    steps: ["Expression writing practice"],
                    isTeacherLed: true
                  },
                  middle: {
                    id: "m3",
                    duration: 25,
                    description: "Substitution and evaluation",
                    steps: [
                      "Demonstrate substitution",
                      "Practice problems",
                      "Partner work"
                    ],
                    isTeacherLed: false
                  },
                  end: {
                    id: "e3",
                    duration: 10,
                    description: "Assessment",
                    steps: ["Quick assessment", "Homework assignment"],
                    isTeacherLed: true
                  }
                },
                resources: "Calculator, Worksheet 3.3",
                attachments: [],
                homework: "None",
                reflection: {
                  objectivesAchieved: false,
                  objectivesNotAchieved: true,
                  comments: ""
                },
                attendance: null,
                approval: {
                  preparedBy: "Ms. Sarah Chen",
                  preparedDate: "2026-01-07",
                  checkedBy: null,
                  checkedDate: null,
                  status: "pending_review"
                },
                createdAt: "2026-01-06T10:00:00Z",
                updatedAt: "2026-01-07T10:00:00Z"
              }
            ]
          },
          {
            id: "week-2",
            weekNumber: 2,
            title: "Solving Simple Equations",
            lessonPlans: [
              {
                id: "lp-1-2-1",
                title: "One-Step Equations",
                weekNumber: 2,
                lessonNumber: 1,
                teacherName: "Ms. Sarah Chen",
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopic: "One-Step Equations",
                date: "2026-01-13",
                learningObjectives: [
                  "Solve one-step equations using addition and subtraction",
                  "Check solutions by substitution"
                ],
                vocabulary: ["equation", "solution", "inverse operation"],
                previousLearning: "Students can evaluate expressions by substituting values.",
                lessonFlow: {
                  beginning: {
                    id: "b4",
                    duration: 10,
                    description: "Review of expressions",
                    steps: ["Quick review"],
                    isTeacherLed: true
                  },
                  middle: {
                    id: "m4",
                    duration: 25,
                    description: "Solving equations",
                    steps: ["Introduce equations", "Practice solving"],
                    isTeacherLed: false
                  },
                  end: {
                    id: "e4",
                    duration: 10,
                    description: "Practice",
                    steps: ["Individual practice"],
                    isTeacherLed: true
                  }
                },
                resources: "Equation balance model, Worksheet",
                attachments: [],
                homework: "Worksheet 4.1",
                reflection: {
                  objectivesAchieved: false,
                  objectivesNotAchieved: false,
                  comments: ""
                },
                attendance: null,
                approval: {
                  preparedBy: "Ms. Sarah Chen",
                  preparedDate: "2026-01-12",
                  checkedBy: null,
                  checkedDate: null,
                  status: "draft"
                },
                createdAt: "2026-01-11T10:00:00Z",
                updatedAt: "2026-01-12T10:00:00Z"
              }
            ]
          }
        ]
      },
      {
        id: "topic-2",
        title: "Linear Equations",
        weeks: [
          {
            id: "week-3",
            weekNumber: 3,
            title: "Introduction to Linear Equations",
            lessonPlans: []
          }
        ]
      }
    ]
  },
  {
    subject: "Science",
    topics: [
      {
        id: "sci-topic-1",
        title: "Forces and Motion",
        weeks: [
          {
            id: "sci-week-1",
            weekNumber: 1,
            title: "Understanding Forces",
            lessonPlans: [
              {
                id: "lp-sci-1-1-1",
                title: "What is a Force?",
                weekNumber: 1,
                lessonNumber: 1,
                teacherName: "Ms. Sarah Chen",
                className: "5A",
                subject: "Science",
                topic: "Forces and Motion",
                subtopic: "Introduction to Forces",
                date: "2026-01-06",
                learningObjectives: [
                  "Define what a force is",
                  "Identify different types of forces in everyday life",
                  "Measure forces using a spring scale"
                ],
                vocabulary: ["force", "push", "pull", "Newton", "spring scale"],
                previousLearning: "Students have basic understanding of movement and energy.",
                lessonFlow: {
                  beginning: {
                    id: "sb1",
                    duration: 10,
                    description: "Demonstration of forces",
                    steps: ["Show pushing and pulling objects", "Discuss observations"],
                    isTeacherLed: true
                  },
                  middle: {
                    id: "sm1",
                    duration: 25,
                    description: "Hands-on exploration",
                    steps: [
                      "Measure forces with spring scales",
                      "Record observations",
                      "Group discussion"
                    ],
                    isTeacherLed: false
                  },
                  end: {
                    id: "se1",
                    duration: 10,
                    description: "Conclusion",
                    steps: ["Review key concepts", "Assign homework"],
                    isTeacherLed: true
                  }
                },
                resources: "Spring scales, Various objects, Worksheet on forces",
                attachments: [],
                homework: "Draw 5 examples of forces at home",
                reflection: {
                  objectivesAchieved: true,
                  objectivesNotAchieved: false,
                  comments: "Students enjoyed the hands-on activity. Will need more time for measurement practice."
                },
                attendance: { present: 20, absent: 0, late: 0, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Ms. Sarah Chen",
                  preparedDate: "2026-01-05",
                  checkedBy: "Dr. Lisa Park",
                  checkedDate: "2026-01-05",
                  status: "approved"
                },
                createdAt: "2026-01-04T08:00:00Z",
                updatedAt: "2026-01-06T16:00:00Z"
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper to create empty lesson plan
export const createEmptyLessonPlan = (
  teacherName: string,
  className: string,
  subject: string,
  topic: string,
  weekNumber: number,
  lessonNumber: number
): LessonPlan => ({
  id: `lp-new-${Date.now()}`,
  title: "",
  weekNumber,
  lessonNumber,
  teacherName,
  className,
  subject,
  topic,
  subtopic: "",
  date: new Date().toISOString().split("T")[0],
  learningObjectives: [],
  vocabulary: [],
  previousLearning: "",
  lessonFlow: {
    beginning: {
      id: `b-${Date.now()}`,
      duration: 10,
      description: "",
      steps: [],
      isTeacherLed: true
    },
    middle: {
      id: `m-${Date.now()}`,
      duration: 25,
      description: "",
      steps: [],
      isTeacherLed: false
    },
    end: {
      id: `e-${Date.now()}`,
      duration: 10,
      description: "",
      steps: [],
      isTeacherLed: true
    }
  },
  resources: "",
  attachments: [],
  homework: "",
  reflection: {
    objectivesAchieved: false,
    objectivesNotAchieved: false,
    comments: ""
  },
  attendance: null,
  approval: {
    preparedBy: teacherName,
    preparedDate: new Date().toISOString().split("T")[0],
    checkedBy: null,
    checkedDate: null,
    status: "draft"
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Get all subjects that have lesson plans
export const getAvailableSubjects = (): string[] => {
  return mockLessonPlans.map(s => s.subject);
};

// Get curriculum for a specific subject
export const getSubjectCurriculum = (subject: string): SubjectCurriculum | undefined => {
  return mockLessonPlans.find(s => s.subject === subject);
};

// Get a specific lesson plan by ID
export const getLessonPlanById = (id: string): LessonPlan | undefined => {
  for (const curriculum of mockLessonPlans) {
    for (const topic of curriculum.topics) {
      for (const week of topic.weeks) {
        const lp = week.lessonPlans.find(p => p.id === id);
        if (lp) return lp;
      }
    }
  }
  return undefined;
};
