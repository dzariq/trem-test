import { normalizeSubtopics } from "@/lib/lessonplan/normalizeSubtopics";

// Lesson Plan Module Data Structures and Mock Data

export interface LessonFlowActivity {
  id: string;
  duration: number; // in minutes
  description: string;
  steps: Array<LessonFlowStep | string>;
  isTeacherLed: boolean;
}

export interface LessonFlowStep {
  title: string;
  duration: number;
  description: string;
}

export interface LessonFlow {
  beginning: LessonFlowActivity;
  middle: LessonFlowActivity;
  end: LessonFlowActivity;
}

export interface LessonPlanReflection {
  // Successes
  objectivesAchieved: string;
  topSuccesses: string;
  // Challenges
  objectivesNotAchieved: string;
  biggestObstacle: string;
  // Lesson delivery
  lessonDelivery: string;
  // Differentiation
  noviceLearners: string;
  intermediateLearners: string;
  advancedLearners: string;
  // Strategies
  strategiesNextLesson: string;
  // Signature
  signatureDate: string;

  // Optional short-form reflections
  notes?: string;
  text?: string;
  updated_at?: string;
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
  teacherNames: string[];
  className: string;
  subject: string;
  topic: string;
  subtopics: string[];
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
  subtopics: string[];
  weeks: Week[];
}

export interface SubjectCurriculum {
  subject: string;
  topics: Topic[];
}

const createLessonFlowActivity = (idSuffix: string): LessonFlowActivity => ({
  id: `section-${idSuffix}-${Date.now()}`,
  duration: 0,
  description: "",
  steps: [],
  isTeacherLed: true,
});

export const createDefaultLessonFlow = (): LessonFlow => ({
  beginning: createLessonFlowActivity("beginning"),
  middle: createLessonFlowActivity("middle"),
  end: createLessonFlowActivity("end"),
});

export const DEFAULT_LESSON_FLOW: LessonFlow = createDefaultLessonFlow();

// Check if reflection section is complete
export const isReflectionComplete = (reflection: LessonPlanReflection): boolean => {
  return (
    reflection.objectivesAchieved.trim() !== "" &&
    reflection.topSuccesses.trim() !== "" &&
    reflection.objectivesNotAchieved.trim() !== "" &&
    reflection.biggestObstacle.trim() !== "" &&
    reflection.noviceLearners.trim() !== "" &&
    reflection.intermediateLearners.trim() !== "" &&
    reflection.advancedLearners.trim() !== "" &&
    reflection.strategiesNextLesson.trim() !== ""
  );
};

// Helper to get lesson plan status
export const getLessonPlanStatus = (lp: LessonPlan): "complete" | "incomplete" | "draft" | "empty" => {
  if (!lp.title) return "empty";
  if (lp.approval.status === "draft") return "draft";
  // Check if reflection is complete - this is the main indicator
  if (!isReflectionComplete(lp.reflection)) return "incomplete";
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
        subtopics: ["Variables and Constants", "Algebraic Expressions", "Evaluating Expressions", "One-Step Equations"],
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
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopics: ["Variables and Constants"],
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
                  objectivesAchieved: "Yes, all objectives achieved. Students can identify variables and constants in expressions.",
                  topSuccesses: "1. Visual cards activity - students were highly engaged. 2. Peer explanations helped struggling students understand.",
                  objectivesNotAchieved: "N/A - All objectives were met.",
                  biggestObstacle: "Some students initially confused coefficients with constants. Root cause: insufficient prior examples.",
                  lessonDelivery: "Used interactive whiteboard and physical manipulatives to promote active participation.",
                  noviceLearners: "Provided extra visual cards and one-on-one support. They were able to attempt the task and made progress.",
                  intermediateLearners: "Assigned core worksheet problems. Most completed on time with good understanding.",
                  advancedLearners: "Given extension problems creating their own expressions. Evidence of mastery in peer teaching.",
                  strategiesNextLesson: "Add more visual examples before independent work. Prepare additional extension tasks for advanced learners.",
                  signatureDate: "Ms. Sarah Chen - 2026-01-06"
                },
                attendance: { present: 18, absent: 1, late: 1, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Teacher",
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
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopics: ["Algebraic Expressions"],
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
                  objectivesAchieved: "Yes, students can now translate verbal phrases to algebraic expressions.",
                  topSuccesses: "1. Translation game was highly effective - 100% participation. 2. Real-world examples resonated well.",
                  objectivesNotAchieved: "N/A - All objectives achieved.",
                  biggestObstacle: "None significant. Some initial hesitation with more complex phrases.",
                  lessonDelivery: "Game-based activity promoted active learning and healthy competition.",
                  noviceLearners: "Given simpler phrases first. Were able to attempt and progress well with scaffolding.",
                  intermediateLearners: "Core game activities at appropriate level. Good engagement throughout.",
                  advancedLearners: "Created their own challenging expressions for peers. Showed strong mastery.",
                  strategiesNextLesson: "Prepare more challenging expressions for advanced students. Continue with game format.",
                  signatureDate: "Ms. Sarah Chen - 2026-01-07"
                },
                attendance: { present: 19, absent: 0, late: 1, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Teacher",
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
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopics: ["Evaluating Expressions"],
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
                  objectivesAchieved: "",
                  topSuccesses: "",
                  objectivesNotAchieved: "",
                  biggestObstacle: "",
                  lessonDelivery: "",
                  noviceLearners: "",
                  intermediateLearners: "",
                  advancedLearners: "",
                  strategiesNextLesson: "",
                  signatureDate: ""
                },
                attendance: null,
                approval: {
                  preparedBy: "Teacher",
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
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Algebra Basics",
                subtopics: ["One-Step Equations"],
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
                  objectivesAchieved: "",
                  topSuccesses: "",
                  objectivesNotAchieved: "",
                  biggestObstacle: "",
                  lessonDelivery: "",
                  noviceLearners: "",
                  intermediateLearners: "",
                  advancedLearners: "",
                  strategiesNextLesson: "",
                  signatureDate: ""
                },
                attendance: null,
                approval: {
                  preparedBy: "Teacher",
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
        subtopics: ["Introduction to Linear Equations", "Graphing Linear Equations", "Slope and Intercept"],
        weeks: [
          {
            id: "week-3",
            weekNumber: 3,
            title: "Introduction to Linear Equations",
            lessonPlans: [
              {
                id: "lp-2-3-1",
                title: "Understanding Linear Equations",
                weekNumber: 3,
                lessonNumber: 1,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Linear Equations",
                subtopics: ["Introduction to Linear Equations"],
                date: "2026-01-20",
                learningObjectives: [
                  "Identify linear equations in one variable",
                  "Differentiate between linear and non-linear equations"
                ],
                vocabulary: ["linear", "equation", "variable", "coefficient"],
                previousLearning: "Students can solve one-step equations.",
                lessonFlow: {
                  beginning: { id: "b5", duration: 10, description: "Review one-step equations", steps: ["Quick quiz"], isTeacherLed: true },
                  middle: { id: "m5", duration: 25, description: "Introduce linear equations", steps: ["Explanation", "Examples", "Practice"], isTeacherLed: false },
                  end: { id: "e5", duration: 10, description: "Consolidation", steps: ["Summary", "Exit ticket"], isTeacherLed: true }
                },
                resources: "Textbook pages 60-65, Worksheet",
                attachments: [],
                homework: "Exercises 1-10 page 66",
                reflection: {
                  objectivesAchieved: "Yes, students can now identify linear equations confidently.",
                  topSuccesses: "1. Visual graphing examples clicked well. 2. Students quickly grasped the linear relationship concept.",
                  objectivesNotAchieved: "N/A - All objectives met.",
                  biggestObstacle: "Minor confusion about constant terms initially.",
                  lessonDelivery: "Visual examples and interactive whiteboard promoted active participation.",
                  noviceLearners: "Given guided notes with examples. Were able to identify equations with support.",
                  intermediateLearners: "Core exercises completed on time. Good understanding demonstrated.",
                  advancedLearners: "Created their own linear equations. Evidence of mastery in explanations.",
                  strategiesNextLesson: "Add more graphing practice problems. Prepare extension graphing challenges.",
                  signatureDate: "Ms. Sarah Chen - 2026-01-20"
                },
                attendance: { present: 19, absent: 1, late: 0, excused: 0, total: 20 },
                approval: { preparedBy: "Teacher", preparedDate: "2026-01-19", checkedBy: "Mr. David Wong", checkedDate: "2026-01-19", status: "approved" },
                createdAt: "2026-01-18T10:00:00Z",
                updatedAt: "2026-01-20T15:00:00Z"
              },
              {
                id: "lp-2-3-2",
                title: "Graphing Linear Equations",
                weekNumber: 3,
                lessonNumber: 2,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Linear Equations",
                subtopics: ["Graphing Linear Equations"],
                date: "2026-01-21",
                learningObjectives: [
                  "Plot points on a coordinate plane",
                  "Graph simple linear equations"
                ],
                vocabulary: ["coordinate", "x-axis", "y-axis", "origin", "plot"],
                previousLearning: "Students can identify linear equations.",
                lessonFlow: {
                  beginning: { id: "b6", duration: 8, description: "Review coordinates", steps: ["Quick review"], isTeacherLed: true },
                  middle: { id: "m6", duration: 30, description: "Graphing practice", steps: ["Demo", "Guided practice", "Independent work"], isTeacherLed: false },
                  end: { id: "e6", duration: 7, description: "Wrap-up", steps: ["Review graphs", "Preview next lesson"], isTeacherLed: true }
                },
                resources: "Graph paper, Rulers, Projector",
                attachments: [],
                homework: "Graph 5 linear equations",
                reflection: {
                  objectivesAchieved: "",
                  topSuccesses: "",
                  objectivesNotAchieved: "",
                  biggestObstacle: "",
                  lessonDelivery: "",
                  noviceLearners: "",
                  intermediateLearners: "",
                  advancedLearners: "",
                  strategiesNextLesson: "",
                  signatureDate: ""
                },
                attendance: null,
                approval: { preparedBy: "Teacher", preparedDate: "2026-01-20", checkedBy: null, checkedDate: null, status: "pending_review" },
                createdAt: "2026-01-19T10:00:00Z",
                updatedAt: "2026-01-20T10:00:00Z"
              }
            ]
          },
          {
            id: "week-4",
            weekNumber: 4,
            title: "Slope and Y-Intercept",
            lessonPlans: [
              {
                id: "lp-2-4-1",
                title: "Understanding Slope",
                weekNumber: 4,
                lessonNumber: 1,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Linear Equations",
                subtopics: ["Slope and Intercept"],
                date: "2026-01-27",
                learningObjectives: [
                  "Calculate slope from two points",
                  "Interpret slope in real-world contexts"
                ],
                vocabulary: ["slope", "rise", "run", "steepness"],
                previousLearning: "Students can graph linear equations.",
                lessonFlow: {
                  beginning: { id: "b7", duration: 10, description: "Review graphing", steps: ["Quick graphing exercise"], isTeacherLed: true },
                  middle: { id: "m7", duration: 25, description: "Introduce slope", steps: ["Definition", "Calculation practice", "Real-world examples"], isTeacherLed: false },
                  end: { id: "e7", duration: 10, description: "Assessment", steps: ["Exit ticket"], isTeacherLed: true }
                },
                resources: "Slope worksheets, Real-world graphs",
                attachments: [],
                homework: "Worksheet 5.1",
                reflection: {
                  objectivesAchieved: "",
                  topSuccesses: "",
                  objectivesNotAchieved: "",
                  biggestObstacle: "",
                  lessonDelivery: "",
                  noviceLearners: "",
                  intermediateLearners: "",
                  advancedLearners: "",
                  strategiesNextLesson: "",
                  signatureDate: ""
                },
                attendance: null,
                approval: { preparedBy: "Teacher", preparedDate: "2026-01-26", checkedBy: null, checkedDate: null, status: "draft" },
                createdAt: "2026-01-25T10:00:00Z",
                updatedAt: "2026-01-26T10:00:00Z"
              }
            ]
          }
        ]
      },
      {
        id: "topic-3",
        title: "Geometry Fundamentals",
        subtopics: ["Points, Lines, and Planes", "Angles", "Triangles", "Quadrilaterals"],
        weeks: [
          {
            id: "week-5",
            weekNumber: 5,
            title: "Introduction to Geometry",
            lessonPlans: [
              {
                id: "lp-3-5-1",
                title: "Points, Lines, and Planes",
                weekNumber: 5,
                lessonNumber: 1,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Geometry Fundamentals",
                subtopics: ["Points, Lines, and Planes"],
                date: "2026-02-03",
                learningObjectives: [
                  "Define point, line, and plane",
                  "Identify these elements in real-world objects"
                ],
                vocabulary: ["point", "line", "plane", "segment", "ray"],
                previousLearning: "Basic shapes knowledge from primary school.",
                lessonFlow: {
                  beginning: { id: "b8", duration: 10, description: "Warm-up", steps: ["Shape recognition game"], isTeacherLed: true },
                  middle: { id: "m8", duration: 25, description: "New concepts", steps: ["Definitions", "Visual examples", "Hands-on activity"], isTeacherLed: false },
                  end: { id: "e8", duration: 10, description: "Practice", steps: ["Worksheet practice"], isTeacherLed: true }
                },
                resources: "Geometry set, Visual aids",
                attachments: [],
                homework: "Draw 3 examples of each concept",
                reflection: {
                  objectivesAchieved: "Yes, 100% achieved. Students can identify basic geometric elements.",
                  topSuccesses: "1. Hands-on exploration kept students curious. 2. Real-world examples of points, lines, and rays resonated.",
                  objectivesNotAchieved: "N/A - All objectives met.",
                  biggestObstacle: "None significant - great introductory lesson.",
                  lessonDelivery: "Interactive exploration and hands-on activities promoted participation.",
                  noviceLearners: "Given guided worksheets with visual supports. All were able to identify basic elements.",
                  intermediateLearners: "Core activities well-paced. Good engagement throughout.",
                  advancedLearners: "Asked to find and draw examples around classroom. Showed strong understanding.",
                  strategiesNextLesson: "Prepare more hands-on activities for next lesson. Continue with exploration approach.",
                  signatureDate: "Ms. Sarah Chen - 2026-02-03"
                },
                attendance: { present: 20, absent: 0, late: 0, excused: 0, total: 20 },
                approval: { preparedBy: "Teacher", preparedDate: "2026-02-02", checkedBy: "Mr. David Wong", checkedDate: "2026-02-02", status: "approved" },
                createdAt: "2026-02-01T10:00:00Z",
                updatedAt: "2026-02-03T15:00:00Z"
              },
              {
                id: "lp-3-5-2",
                title: "Types of Angles",
                weekNumber: 5,
                lessonNumber: 2,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Geometry Fundamentals",
                subtopics: ["Angles"],
                date: "2026-02-04",
                learningObjectives: [
                  "Identify acute, right, obtuse, and straight angles",
                  "Measure angles using a protractor"
                ],
                vocabulary: ["angle", "acute", "right", "obtuse", "straight", "protractor"],
                previousLearning: "Students understand points, lines, and planes.",
                lessonFlow: {
                  beginning: { id: "b9", duration: 8, description: "Review", steps: ["Quick quiz on previous lesson"], isTeacherLed: true },
                  middle: { id: "m9", duration: 30, description: "Angle exploration", steps: ["Intro to angles", "Protractor use", "Measurement practice"], isTeacherLed: false },
                  end: { id: "e9", duration: 7, description: "Summary", steps: ["Review angle types"], isTeacherLed: true }
                },
                resources: "Protractors, Angle worksheets",
                attachments: [],
                homework: "Measure 10 angles at home",
                reflection: {
                  objectivesAchieved: "Partially - students can identify angle types but protractor use needs more practice.",
                  topSuccesses: "1. Angle classification activity was engaging. 2. Peer tutoring pairs worked well together.",
                  objectivesNotAchieved: "Protractor alignment accuracy not fully achieved by all students.",
                  biggestObstacle: "Protractor alignment technique. Root cause: insufficient initial demonstration time.",
                  lessonDelivery: "Hands-on measurement activities promoted active learning.",
                  noviceLearners: "Paired with peer tutors. Were able to identify angle types. Protractor use still developing.",
                  intermediateLearners: "Most completed measurement tasks. Some struggled with acute angle alignment.",
                  advancedLearners: "Helped peers and measured complex angles. Good mastery demonstrated.",
                  strategiesNextLesson: "Add 3 more protractor alignment exercises at start of next lesson.",
                  signatureDate: "Ms. Sarah Chen - 2026-02-04"
                },
                attendance: { present: 18, absent: 2, late: 0, excused: 0, total: 20 },
                approval: { preparedBy: "Teacher", preparedDate: "2026-02-03", checkedBy: "Mr. David Wong", checkedDate: "2026-02-03", status: "approved" },
                createdAt: "2026-02-02T10:00:00Z",
                updatedAt: "2026-02-04T15:00:00Z"
              },
              {
                id: "lp-3-5-3",
                title: "Introduction to Triangles",
                weekNumber: 5,
                lessonNumber: 3,
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Mathematics",
                topic: "Geometry Fundamentals",
                subtopics: ["Triangles"],
                date: "2026-02-05",
                learningObjectives: [
                  "Classify triangles by sides and angles",
                  "Identify properties of different triangle types"
                ],
                vocabulary: ["equilateral", "isosceles", "scalene", "acute triangle", "right triangle", "obtuse triangle"],
                previousLearning: "Students can measure angles.",
                lessonFlow: {
                  beginning: { id: "b10", duration: 10, description: "Angle review", steps: ["Quick angle identification"], isTeacherLed: true },
                  middle: { id: "m10", duration: 25, description: "Triangle classification", steps: ["Types by sides", "Types by angles", "Sorting activity"], isTeacherLed: false },
                  end: { id: "e10", duration: 10, description: "Practice", steps: ["Classification worksheet"], isTeacherLed: true }
                },
                resources: "Triangle cutouts, Classification chart",
                attachments: [],
                homework: "Find and classify 5 triangles at home",
                reflection: {
                  objectivesAchieved: "Yes, students can classify triangles by both sides and angles.",
                  topSuccesses: "1. Sorting activity was very effective. 2. Students made strong connections between types.",
                  objectivesNotAchieved: "N/A - All objectives achieved.",
                  biggestObstacle: "Minor confusion between isoceles and equilateral initially.",
                  lessonDelivery: "Hands-on sorting with triangle cutouts promoted active classification.",
                  noviceLearners: "Given labeled cutouts first. All could sort by end of lesson.",
                  intermediateLearners: "Core sorting activities at appropriate challenge level.",
                  advancedLearners: "Created own triangle examples and taught peers. Strong mastery evident.",
                  strategiesNextLesson: "Prepare quadrilateral cutouts for next lesson. Replicate sorting approach.",
                  signatureDate: "Ms. Sarah Chen - 2026-02-05"
                },
                attendance: { present: 20, absent: 0, late: 0, excused: 0, total: 20 },
                approval: { preparedBy: "Teacher", preparedDate: "2026-02-04", checkedBy: "Mr. David Wong", checkedDate: "2026-02-05", status: "approved" },
                createdAt: "2026-02-03T10:00:00Z",
                updatedAt: "2026-02-05T15:00:00Z"
              }
            ]
          },
          {
            id: "week-6",
            weekNumber: 6,
            title: "Quadrilaterals",
            lessonPlans: []
          }
        ]
      },
      {
        id: "topic-4",
        title: "Fractions and Decimals",
        subtopics: ["Understanding Fractions", "Equivalent Fractions", "Decimal Conversion", "Operations with Fractions"],
        weeks: [
          {
            id: "week-7",
            weekNumber: 7,
            title: "Fraction Basics",
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
        subtopics: ["Introduction to Forces", "Types of Forces", "Newton's Laws", "Friction"],
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
                teacherNames: ["Teacher", "Mr. James Wong", "Ms. Emily Tan"],
                className: "5A",
                subject: "Science",
                topic: "Forces and Motion",
                subtopics: ["Introduction to Forces"],
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
                  objectivesAchieved: "Partially - students can identify forces but measurement accuracy needs more time.",
                  topSuccesses: "1. Hands-on experiments generated enthusiasm. 2. Real-world force examples were relatable.",
                  objectivesNotAchieved: "Force measurement accuracy not fully achieved.",
                  biggestObstacle: "Measurement technique with spring scales. Root cause: rushed instruction due to time.",
                  lessonDelivery: "Experiments and hands-on activities promoted active investigation.",
                  noviceLearners: "Paired with stronger students. Able to identify force types but struggle with measurement.",
                  intermediateLearners: "Most completed experiments. Measurement accuracy varied.",
                  advancedLearners: "Explored additional force types independently. Good understanding shown.",
                  strategiesNextLesson: "Add 5 more minutes for measurement practice at start of next lesson.",
                  signatureDate: "Ms. Sarah Chen - 2026-01-06"
                },
                attendance: { present: 20, absent: 0, late: 0, excused: 0, total: 20 },
                approval: {
                  preparedBy: "Teacher",
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
  teacherNames: string[],
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
  teacherNames,
  className,
  subject,
  topic,
  subtopics: [],
  date: "", // Empty by default - teacher inputs their own date
  learningObjectives: [],
  vocabulary: [],
  previousLearning: "",
  lessonFlow: {
    ...createDefaultLessonFlow(),
  },
  resources: "",
  attachments: [],
  homework: "",
  reflection: {
    objectivesAchieved: "",
    topSuccesses: "",
    objectivesNotAchieved: "",
    biggestObstacle: "",
    lessonDelivery: "",
    noviceLearners: "",
    intermediateLearners: "",
    advancedLearners: "",
    strategiesNextLesson: "",
    signatureDate: ""
  },
  attendance: null,
  approval: {
    preparedBy: teacherNames[0] || "",
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

// Get the previous lesson plan for a given lesson plan
export const getPreviousLessonPlan = (currentLessonPlan: LessonPlan): LessonPlan | undefined => {
  for (const curriculum of mockLessonPlans) {
    if (curriculum.subject !== currentLessonPlan.subject) continue;
    
    // Collect all lesson plans for this subject in order
    const allLessons: LessonPlan[] = [];
    for (const topic of curriculum.topics) {
      for (const week of topic.weeks) {
        allLessons.push(...week.lessonPlans.sort((a, b) => a.lessonNumber - b.lessonNumber));
      }
    }
    
    // Sort by week then lesson number
    allLessons.sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
      return a.lessonNumber - b.lessonNumber;
    });
    
    // Find current lesson's index and return previous
    const currentIndex = allLessons.findIndex(lp => lp.id === currentLessonPlan.id);
    if (currentIndex > 0) {
      return allLessons[currentIndex - 1];
    }
  }
  return undefined;
};

// Get subtopics for a specific topic
export const getSubtopicsForTopic = (subject: string, topicTitle: string): string[] => {
  const curriculum = mockLessonPlans.find(s => s.subject === subject);
  if (!curriculum) return [];
  const topic = curriculum.topics.find(t => t.title === topicTitle);
  return normalizeSubtopics(topic?.subtopics);
};

// Get topic by ID
export const getTopicById = (topicId: string): { topic: Topic; subject: string } | undefined => {
  for (const curriculum of mockLessonPlans) {
    const topic = curriculum.topics.find(t => t.id === topicId);
    if (topic) return { topic, subject: curriculum.subject };
  }
  return undefined;
};
