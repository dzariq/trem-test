import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Users, Target, Award, AlertTriangle, BookOpen, BarChart3, FileText, CheckCircle, XCircle, Lightbulb, Copy, Printer, ArrowRight, ArrowUpRight, ArrowDownRight, Scale, Download, FileSpreadsheet, Check, Calendar, UserCheck, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, classGrades, detailedClassGrades, yearOverYearData, categoryYearOverYear, examComparisonData, ExamData, subjectYearlyData, multiClassTrendData, subjectExamData } from "@/data/teacherMockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, ReferenceDot } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Grade categories with max scores
const gradeCategories = [{
  key: "attitude",
  label: "Attitude",
  max: 10
}, {
  key: "homework",
  label: "Homework",
  max: 10
}, {
  key: "quiz",
  label: "Quiz",
  max: 10
}, {
  key: "exam",
  label: "Exam",
  max: 70
}];

// Import centralized subjects config
import { allSubjects, getShortSubjectName, getTinySubjectCode, subjectGroups } from "@/data/subjectsConfig";
import { SubjectGroupPill } from "@/components/SubjectGroupPill";

// Use centralized subjects list
const subjects = allSubjects;

// Get subjects that are not part of any variant group (standalone subjects)
const groupedSubjectNames = subjectGroups.flatMap(g => g.variants?.map(v => v.name) || []);
const standaloneSubjects = allSubjects.filter(s => !groupedSubjectNames.includes(s));

// Academic years (past 6 years) and exam periods
const academicYears = ["2026", "2025", "2024", "2023", "2022", "2021"];
const examPeriods = [{
  value: "midYear",
  label: "Mid-Year"
}, {
  value: "yearEnd",
  label: "Year-End"
}];

// Use centralized short name function
const shortenSubjectName = getShortSubjectName;
interface StudentGrades {
  attitude: string;
  homework: string;
  quiz: string;
  exam: string;
  comment: string;
  reportComment: string;
  studyRecommendation: string;
}
const calculateTotal = (grades: StudentGrades): number => {
  return (parseInt(grades.attitude) || 0) + (parseInt(grades.homework) || 0) + (parseInt(grades.quiz) || 0) + (parseInt(grades.exam) || 0);
};
const getLetterGrade = (total: number): {
  grade: string;
  color: string;
} => {
  if (total >= 90) return {
    grade: "A*",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300"
  };
  if (total >= 80) return {
    grade: "A",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200"
  };
  if (total >= 70) return {
    grade: "B",
    color: "bg-blue-100 text-blue-700 border-blue-300"
  };
  if (total >= 60) return {
    grade: "C",
    color: "bg-amber-100 text-amber-700 border-amber-300"
  };
  if (total >= 50) return {
    grade: "D",
    color: "bg-orange-100 text-orange-700 border-orange-300"
  };
  return {
    grade: "E",
    color: "bg-red-100 text-red-700 border-red-300"
  };
};
export default function TeacherAcademicPage() {
  const isMobile = useIsMobile();
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([teacherProfile.classes[0]]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedEntrySubject, setSelectedEntrySubject] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const gradeEntryRef = useRef<HTMLDivElement>(null);
  const [studentGrades, setStudentGrades] = useState<Record<string, Record<string, StudentGrades>>>({});
  const [classStudyRecommendation, setClassStudyRecommendation] = useState<Record<string, Record<string, string>>>({}); // class -> subject -> recommendation
  const [selectedYears, setSelectedYears] = useState<string[]>([academicYears[0]]);
  const [selectedYear, setSelectedYear] = useState(academicYears[0]); // For single-select dropdowns
  const [selectedPeriod, setSelectedPeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(["midYear"]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([...subjects]);
  const [bandsSelectedSubject, setBandsSelectedSubject] = useState<string>("Mathematics"); // Single subject for Bands tab
  const [bandsCompareMode, setBandsCompareMode] = useState(false);
  const [bandsCompareClass, setBandsCompareClass] = useState(teacherProfile.classes[1] || teacherProfile.classes[0]);
  const [bandsCompareYear, setBandsCompareYear] = useState(academicYears[0]);
  const [bandsComparePeriod, setBandsComparePeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [bandsCompareSubject, setBandsCompareSubject] = useState<string>("Mathematics");
  const [selectedCategory, setSelectedCategory] = useState<"attitude" | "homework" | "quiz" | "exam">("quiz");

  // Grade Entry category state (Grades, Behavior, Awards)
  const [entryCategory, setEntryCategory] = useState<"grades" | "behavior" | "awards">("grades");
  
  // Behavior grades state
  const [behaviorGrades, setBehaviorGrades] = useState<Record<string, {
    attendance: string;
    punctuality: string;
    cooperation: string;
    selfControl: string;
    responsibility: string;
    initiative: string;
    leadership: string;
    homeroomComment: string;
    responsibilityComment: string;
  }>>({});
  
  // Awards state - now supporting multiple entries per category
  interface AwardEntry {
    id: string;
    organization: string;
    role: string;
  }
  
  interface AchievementEntry {
    id: string;
    event: string;
    award: string;
  }
  
  interface StudentAwardsData {
    sportsHouse: AwardEntry[];
    clubs: AwardEntry[];
    leadership: AwardEntry[];
    events: AwardEntry[];
    achievements: AchievementEntry[];
  }
  
  const [awardsData, setAwardsData] = useState<Record<string, StudentAwardsData>>({});

  // Award dropdown options
  const sportsHouseOptions = ["None", "Basketball", "Football", "Volleyball", "Badminton", "Swimming", "Track & Field", "Tennis"];
  const clubOptions = ["None", "Science Club", "Art Club", "Music Club", "Drama Club", "Chess Club", "Debate Club", "Robotics Club", "Photography Club"];
  const leadershipOptions = ["None", "Prefect Board", "Student Council", "Class Monitor", "House Captain", "Sports Captain", "CCA Leader"];
  const eventsOptions = ["None", "Sports Day", "Science Fair", "Art Exhibition", "Music Concert", "Drama Production", "Math Olympiad", "Spelling Bee"];
  const roleOptions = ["None", "Captain", "Vice-Captain", "Member", "Leader", "Secretary", "Treasurer", "Coordinator"];
  const achievementEventOptions = ["None", "Sports Day", "Academic Competition", "Science Fair", "Art Competition", "Music Festival", "Leadership Camp", "Community Service"];
  const achievementAwardOptions = ["None", "Gold", "Silver", "Bronze", "Champion", "1st Runner-up", "2nd Runner-up", "Merit Award", "Participation"];

  // Comparison tab state
  const [comparisonClass, setComparisonClass] = useState(teacherProfile.classes[0]);
  const [examAClass, setExamAClass] = useState(teacherProfile.classes[0]);
  const [examAYear, setExamAYear] = useState("2026");
  const [examAPeriod, setExamAPeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [examBClass, setExamBClass] = useState(teacherProfile.classes[0]);
  const [examBYear, setExamBYear] = useState("2025");
  const [examBPeriod, setExamBPeriod] = useState<"midYear" | "yearEnd">("yearEnd");
  const [compareSubjects, setCompareSubjects] = useState<string[]>([...subjects]);

  // Trends tab state - like student page
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "4years" | "5years" | "6years">("6years");
  const [trendsSelectedSubjects, setTrendsSelectedSubjects] = useState<string[]>([...subjects]);

  // Pinch-to-zoom state for chart
  const [chartZoom, setChartZoom] = useState(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);

  // View more state for lists
  const [showAllTopPerformers, setShowAllTopPerformers] = useState(false);
  const [showAllAtRisk, setShowAllAtRisk] = useState(false);
  
  // Student performance dialog state
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [performanceDialogTab, setPerformanceDialogTab] = useState<"top" | "middle" | "atRisk">("top");
  
  // PDF Report dialog state
  const [bandsReportDialogOpen, setBandsReportDialogOpen] = useState(false);
  const bandsReportRef = useRef<HTMLDivElement>(null);
  const [overviewReportDialogOpen, setOverviewReportDialogOpen] = useState(false);
  const overviewReportRef = useRef<HTMLDivElement>(null);
  const [trendsReportDialogOpen, setTrendsReportDialogOpen] = useState(false);
  const trendsReportRef = useRef<HTMLDivElement>(null);
  const [comparisonReportDialogOpen, setComparisonReportDialogOpen] = useState(false);
  const comparisonReportRef = useRef<HTMLDivElement>(null);
  const [growthCarouselApi, setGrowthCarouselApi] = useState<any>(null);
  const [growthCarouselSlide, setGrowthCarouselSlide] = useState(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle pinch-to-zoom with 2 fingers, allow single-finger scrolling to pass through
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
    // Single finger touches are allowed to pass through for normal scrolling
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Only intercept 2-finger pinch gestures
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = currentDistance / lastTouchDistance.current;
      setChartZoom(prev => Math.min(3, Math.max(0.5, prev * scale)));
      lastTouchDistance.current = currentDistance;
    }
    // Single finger touches pass through for normal page scrolling
  }, []);
  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
  }, []);
  const resetZoom = useCallback(() => {
    setChartZoom(1);
  }, []);
  
  // Scroll detection for floating save button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 150;
      setIsAtBottom(isNearBottom);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const toggleYear = (year: string) => {
    setSelectedYears(prev => prev.includes(year) ? prev.length > 1 ? prev.filter(y => y !== year) : prev // Keep at least one selected
    : [...prev, year]);
  };
  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.length > 1 ? prev.filter(c => c !== cls) : prev // Keep at least one selected
    : [...prev, cls]);
  };
  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev => prev.includes(period) ? prev.length > 1 ? prev.filter(p => p !== period) : prev // Keep at least one selected
    : [...prev, period]);
  };
  const toggleSubjectFilter = (subject: string) => {
    setSelectedSubjects(prev => prev.includes(subject) ? prev.length > 1 ? prev.filter(s => s !== subject) : prev // Keep at least one selected
    : [...prev, subject]);
  };
  const students = classRosters[selectedClass as keyof typeof classRosters] || [];
  const existingGrades = classGrades[selectedClass as keyof typeof classGrades] || {};
  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };
  const toggleStudent = (studentId: string) => {
    setExpandedStudents(prev => prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]);
  };
  const getStudentSubjectGrades = (studentId: string, subject: string): StudentGrades => {
    return studentGrades[studentId]?.[subject] || {
      attitude: "",
      homework: "",
      quiz: "",
      exam: "",
      comment: "",
      reportComment: "",
      studyRecommendation: ""
    };
  };
  const updateGrade = (studentId: string, subject: string, field: keyof StudentGrades, value: string) => {
    // Validate numeric fields
    if (field !== "comment" && field !== "reportComment") {
      const category = gradeCategories.find(c => c.key === field);
      if (category && value !== "") {
        const num = parseInt(value);
        if (isNaN(num) || num < 0 || num > category.max) return;
      }
    }
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: {
          ...getStudentSubjectGrades(studentId, subject),
          [field]: value
        }
      }
    }));
  };
  
  // Behavior traits configuration
  const behaviorTraits = [
    { key: "attendance", label: "Attendance", bgColor: "bg-rose-50", borderColor: "border-rose-200", textColor: "text-rose-700" },
    { key: "punctuality", label: "Punctuality", bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" },
    { key: "cooperation", label: "Cooperation", bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-700" },
    { key: "selfControl", label: "Self Control", bgColor: "bg-rose-50", borderColor: "border-rose-200", textColor: "text-rose-700" },
    { key: "responsibility", label: "Responsibility", bgColor: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700" },
    { key: "initiative", label: "Initiative", bgColor: "bg-sky-50", borderColor: "border-sky-200", textColor: "text-sky-700" },
    { key: "leadership", label: "Leadership", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", textColor: "text-emerald-700" },
  ];
  
  const gradeOptions = ["A", "B", "C", "D", "E"];
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "B": return "bg-blue-100 text-blue-700 border-blue-300";
      case "C": return "bg-amber-100 text-amber-700 border-amber-300";
      case "D": return "bg-orange-100 text-orange-700 border-orange-300";
      case "E": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };
  
  const getStudentBehavior = (studentId: string) => {
    return behaviorGrades[studentId] || {
      attendance: "",
      punctuality: "",
      cooperation: "",
      selfControl: "",
      responsibility: "",
      initiative: "",
      leadership: "",
      homeroomComment: "",
      responsibilityComment: ""
    };
  };
  
  const updateBehavior = (studentId: string, field: string, value: string) => {
    setBehaviorGrades(prev => ({
      ...prev,
      [studentId]: {
        ...getStudentBehavior(studentId),
        [field]: value
      }
    }));
  };
  
  const getStudentAwards = (studentId: string): StudentAwardsData => {
    return awardsData[studentId] || { 
      sportsHouse: [],
      clubs: [],
      leadership: [],
      events: [],
      achievements: []
    };
  };
  
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const addAwardEntry = (studentId: string, category: keyof Omit<StudentAwardsData, 'achievements'>) => {
    const currentAwards = getStudentAwards(studentId);
    const newEntry: AwardEntry = { id: generateId(), organization: "None", role: "None" };
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        [category]: [...currentAwards[category], newEntry]
      }
    }));
  };
  
  const addAchievementEntry = (studentId: string) => {
    const currentAwards = getStudentAwards(studentId);
    const newEntry: AchievementEntry = { id: generateId(), event: "None", award: "None" };
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        achievements: [...currentAwards.achievements, newEntry]
      }
    }));
  };
  
  const updateAwardEntry = (studentId: string, category: keyof Omit<StudentAwardsData, 'achievements'>, entryId: string, field: 'organization' | 'role', value: string) => {
    const currentAwards = getStudentAwards(studentId);
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        [category]: currentAwards[category].map(entry => 
          entry.id === entryId ? { ...entry, [field]: value } : entry
        )
      }
    }));
  };
  
  const updateAchievementEntry = (studentId: string, entryId: string, field: 'event' | 'award', value: string) => {
    const currentAwards = getStudentAwards(studentId);
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        achievements: currentAwards.achievements.map(entry => 
          entry.id === entryId ? { ...entry, [field]: value } : entry
        )
      }
    }));
  };
  
  const removeAwardEntry = (studentId: string, category: keyof Omit<StudentAwardsData, 'achievements'>, entryId: string) => {
    const currentAwards = getStudentAwards(studentId);
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        [category]: currentAwards[category].filter(entry => entry.id !== entryId)
      }
    }));
  };
  
  const removeAchievementEntry = (studentId: string, entryId: string) => {
    const currentAwards = getStudentAwards(studentId);
    setAwardsData(prev => ({
      ...prev,
      [studentId]: {
        ...currentAwards,
        achievements: currentAwards.achievements.filter(entry => entry.id !== entryId)
      }
    }));
  };
  
  const handleSaveGrades = () => {
    if (!selectedStudent) {
      toast({
        title: "No Student Selected",
        description: "Please select a student to save.",
        variant: "destructive"
      });
      return;
    }
    const categoryLabels = { grades: "Grades", behavior: "Behavior", awards: "Awards" };
    toast({
      title: `${categoryLabels[entryCategory]} Saved`,
      description: `${categoryLabels[entryCategory]} saved for ${students.find(s => s.id === selectedStudent)?.name} in Class ${selectedClass}.`
    });
  };

  // Get detailed grades for class first (needed for filtered calculations)
  const detailedGradesForClass = detailedClassGrades[selectedClass as keyof typeof detailedClassGrades] || {};

  // Calculate class statistics for analysis (filtered by selectedSubjects)
  const filteredStudentScores = useMemo(() => {
    const scores: number[] = [];
    Object.values(detailedGradesForClass).forEach(studentGrades => {
      let studentTotal = 0;
      let subjectCount = 0;
      Object.entries(studentGrades).forEach(([subject, grades]) => {
        if (selectedSubjects.includes(subject)) {
          const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
          studentTotal += total;
          subjectCount++;
        }
      });
      if (subjectCount > 0) {
        scores.push(studentTotal / subjectCount);
      }
    });
    return scores;
  }, [detailedGradesForClass, selectedSubjects]);
  const classAverage = filteredStudentScores.length > 0 ? Math.round(filteredStudentScores.reduce((a, b) => a + b, 0) / filteredStudentScores.length) : 0;
  const highestScore = filteredStudentScores.length > 0 ? Math.round(Math.max(...filteredStudentScores)) : 0;
  const lowestScore = filteredStudentScores.length > 0 ? Math.round(Math.min(...filteredStudentScores)) : 0;
  const passRate = filteredStudentScores.length > 0 ? Math.round(filteredStudentScores.filter(g => g >= 50).length / filteredStudentScores.length * 100) : 0;
  const aGradeRate = filteredStudentScores.length > 0 ? Math.round(filteredStudentScores.filter(g => g >= 80).length / filteredStudentScores.length * 100) : 0;
  const gradeDistribution = [{
    range: "A*",
    count: filteredStudentScores.filter(g => g >= 90).length
  }, {
    range: "A",
    count: filteredStudentScores.filter(g => g >= 80 && g < 90).length
  }, {
    range: "B",
    count: filteredStudentScores.filter(g => g >= 70 && g < 80).length
  }, {
    range: "C",
    count: filteredStudentScores.filter(g => g >= 60 && g < 70).length
  }, {
    range: "D",
    count: filteredStudentScores.filter(g => g >= 50 && g < 60).length
  }, {
    range: "E",
    count: filteredStudentScores.filter(g => g < 50).length
  }];

  // Ranked students with filtered subject scores
  const rankedStudents = useMemo(() => {
    return students.map(s => {
      const studentGrades = detailedGradesForClass[s.id];
      if (!studentGrades) return {
        ...s,
        score: null
      };
      let studentTotal = 0;
      let subjectCount = 0;
      Object.entries(studentGrades).forEach(([subject, grades]) => {
        if (selectedSubjects.includes(subject)) {
          const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
          studentTotal += total;
          subjectCount++;
        }
      });
      return {
        ...s,
        score: subjectCount > 0 ? Math.round(studentTotal / subjectCount) : null
      };
    }).filter(s => s.score !== null).sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [students, detailedGradesForClass, selectedSubjects]);

  // At-risk students (D, E grades: below 60%)
  const atRiskStudents = rankedStudents.filter(s => s.score !== null && s.score < 60);
  
  // Middle performing students (B, C grades: 60-79%)
  const middlePerformers = rankedStudents.filter(s => s.score !== null && s.score >= 60 && s.score < 80);
  
  // Top performers (A*, A grades: 80%+)
  const topPerformers = rankedStudents.filter(s => s.score !== null && s.score >= 80);

  // ===== BANDS TAB: Single subject filter calculations =====
  const bandsFilteredScores = useMemo(() => {
    const scores: { studentId: string; score: number }[] = [];
    const subjectsToInclude = bandsSelectedSubject === "all" ? subjects : [bandsSelectedSubject];
    
    Object.entries(detailedGradesForClass).forEach(([studentId, studentGrades]) => {
      let studentTotal = 0;
      let subjectCount = 0;
      Object.entries(studentGrades).forEach(([subject, grades]) => {
        if (subjectsToInclude.includes(subject)) {
          const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
          studentTotal += total;
          subjectCount++;
        }
      });
      if (subjectCount > 0) {
        scores.push({ studentId, score: Math.round(studentTotal / subjectCount) });
      }
    });
    return scores;
  }, [detailedGradesForClass, bandsSelectedSubject, subjects]);

  const bandsGradeDistribution = useMemo(() => {
    const scores = bandsFilteredScores.map(s => s.score);
    return [{
      range: "A*",
      count: scores.filter(g => g >= 90).length
    }, {
      range: "A",
      count: scores.filter(g => g >= 80 && g < 90).length
    }, {
      range: "B",
      count: scores.filter(g => g >= 70 && g < 80).length
    }, {
      range: "C",
      count: scores.filter(g => g >= 60 && g < 70).length
    }, {
      range: "D",
      count: scores.filter(g => g >= 50 && g < 60).length
    }, {
      range: "E",
      count: scores.filter(g => g < 50).length
    }];
  }, [bandsFilteredScores]);

  const bandsRankedStudents = useMemo(() => {
    return bandsFilteredScores
      .map(({ studentId, score }) => {
        const student = students.find(s => s.id === studentId);
        return student ? { ...student, score } : null;
      })
      .filter((s): s is { id: string; name: string; photo: string | null; mealPlan: boolean; outdoorCCA: boolean; sportsHouse: import("@/data/teacherMockData").SportsHouse; remarks: string; joinDate: string; score: number } => s !== null)
      .sort((a, b) => b.score - a.score);
  }, [bandsFilteredScores, students]);

  const bandsTopPerformers = bandsRankedStudents.filter(s => s.score >= 80);
  const bandsMiddlePerformers = bandsRankedStudents.filter(s => s.score >= 60 && s.score < 80);
  const bandsAtRiskStudents = bandsRankedStudents.filter(s => s.score < 60);

  // ===== BANDS COMPARISON: Calculate comparison data =====
  const bandsCompareGradesForClass = detailedClassGrades[bandsCompareClass as keyof typeof detailedClassGrades] || {};
  const bandsCompareStudents = classRosters[bandsCompareClass as keyof typeof classRosters] || [];

  const bandsCompareFilteredScores = useMemo(() => {
    const scores: { studentId: string; score: number }[] = [];
    const subjectsToInclude = bandsCompareSubject === "all" ? subjects : [bandsCompareSubject];
    
    Object.entries(bandsCompareGradesForClass).forEach(([studentId, studentGrades]) => {
      let studentTotal = 0;
      let subjectCount = 0;
      Object.entries(studentGrades).forEach(([subject, grades]) => {
        if (subjectsToInclude.includes(subject)) {
          const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
          studentTotal += total;
          subjectCount++;
        }
      });
      if (subjectCount > 0) {
        scores.push({ studentId, score: Math.round(studentTotal / subjectCount) });
      }
    });
    return scores;
  }, [bandsCompareGradesForClass, bandsCompareSubject, subjects]);

  const bandsCompareGradeDistribution = useMemo(() => {
    const scores = bandsCompareFilteredScores.map(s => s.score);
    return [{
      range: "A*",
      count: scores.filter(g => g >= 90).length
    }, {
      range: "A",
      count: scores.filter(g => g >= 80 && g < 90).length
    }, {
      range: "B",
      count: scores.filter(g => g >= 70 && g < 80).length
    }, {
      range: "C",
      count: scores.filter(g => g >= 60 && g < 70).length
    }, {
      range: "D",
      count: scores.filter(g => g >= 50 && g < 60).length
    }, {
      range: "E",
      count: scores.filter(g => g < 50).length
    }];
  }, [bandsCompareFilteredScores]);

  const bandsCompareRankedStudents = useMemo(() => {
    return bandsCompareFilteredScores
      .map(({ studentId, score }) => {
        const student = bandsCompareStudents.find(s => s.id === studentId);
        return student ? { ...student, score } : null;
      })
      .filter((s): s is { id: string; name: string; photo: string | null; mealPlan: boolean; outdoorCCA: boolean; sportsHouse: import("@/data/teacherMockData").SportsHouse; remarks: string; joinDate: string; score: number } => s !== null)
      .sort((a, b) => b.score - a.score);
  }, [bandsCompareFilteredScores, bandsCompareStudents]);

  const bandsCompareTopPerformers = bandsCompareRankedStudents.filter(s => s.score >= 80);
  const bandsCompareMiddlePerformers = bandsCompareRankedStudents.filter(s => s.score >= 60 && s.score < 80);
  const bandsCompareAtRiskStudents = bandsCompareRankedStudents.filter(s => s.score < 60);

  // Comparison chart data
  const bandsComparisonChartData = useMemo(() => {
    return bandsGradeDistribution.map((item, index) => ({
      grade: item.range,
      primary: item.count,
      compare: bandsCompareGradeDistribution[index]?.count || 0
    }));
  }, [bandsGradeDistribution, bandsCompareGradeDistribution]);

  // Calculate category averages from detailed grades
  const categoryTotals = {
    attitude: {
      sum: 0,
      count: 0,
      max: 10
    },
    homework: {
      sum: 0,
      count: 0,
      max: 10
    },
    quiz: {
      sum: 0,
      count: 0,
      max: 10
    },
    exam: {
      sum: 0,
      count: 0,
      max: 70
    }
  };
  Object.values(detailedGradesForClass).forEach(studentGrades => {
    Object.values(studentGrades).forEach(subjectGrade => {
      categoryTotals.attitude.sum += subjectGrade.attitude;
      categoryTotals.attitude.count++;
      categoryTotals.homework.sum += subjectGrade.homework;
      categoryTotals.homework.count++;
      categoryTotals.quiz.sum += subjectGrade.quiz;
      categoryTotals.quiz.count++;
      categoryTotals.exam.sum += subjectGrade.exam;
      categoryTotals.exam.count++;
    });
  });
  const categoryAverages = [{
    name: "Attitude",
    average: categoryTotals.attitude.count > 0 ? categoryTotals.attitude.sum / categoryTotals.attitude.count : 0,
    max: 10,
    percentage: categoryTotals.attitude.count > 0 ? categoryTotals.attitude.sum / categoryTotals.attitude.count / 10 * 100 : 0
  }, {
    name: "Homework",
    average: categoryTotals.homework.count > 0 ? categoryTotals.homework.sum / categoryTotals.homework.count : 0,
    max: 10,
    percentage: categoryTotals.homework.count > 0 ? categoryTotals.homework.sum / categoryTotals.homework.count / 10 * 100 : 0
  }, {
    name: "Quiz",
    average: categoryTotals.quiz.count > 0 ? categoryTotals.quiz.sum / categoryTotals.quiz.count : 0,
    max: 10,
    percentage: categoryTotals.quiz.count > 0 ? categoryTotals.quiz.sum / categoryTotals.quiz.count / 10 * 100 : 0
  }, {
    name: "Exam",
    average: categoryTotals.exam.count > 0 ? categoryTotals.exam.sum / categoryTotals.exam.count : 0,
    max: 70,
    percentage: categoryTotals.exam.count > 0 ? categoryTotals.exam.sum / categoryTotals.exam.count / 70 * 100 : 0
  }];
  const weakestCategory = categoryAverages.reduce((min, cat) => cat.percentage < min.percentage ? cat : min, categoryAverages[0]);

  // Calculate category performance by subject (for the selected category)
  const categoryBySubject: Record<string, {
    sum: number;
    count: number;
    max: number;
  }> = {};
  const categoryMax = selectedCategory === "exam" ? 70 : 10;
  Object.values(detailedGradesForClass).forEach(studentGrades => {
    Object.entries(studentGrades).forEach(([subject, grades]) => {
      if (!categoryBySubject[subject]) categoryBySubject[subject] = {
        sum: 0,
        count: 0,
        max: categoryMax
      };
      categoryBySubject[subject].sum += grades[selectedCategory];
      categoryBySubject[subject].count++;
    });
  });
  const categoryBySubjectData = Object.entries(categoryBySubject).map(([subject, data]) => ({
    name: subject.length > 8 ? subject.substring(0, 8) + "..." : subject,
    fullName: subject,
    average: data.count > 0 ? data.sum / data.count : 0,
    percentage: data.count > 0 ? data.sum / data.count / categoryMax * 100 : 0,
    max: categoryMax
  })).sort((a, b) => b.percentage - a.percentage);

  // Calculate subject averages - filtered by selectedSubjects
  const subjectTotals: Record<string, {
    sum: number;
    count: number;
  }> = {};
  Object.values(detailedGradesForClass).forEach(studentGrades => {
    Object.entries(studentGrades).forEach(([subject, grades]) => {
      // Only include selected subjects
      if (!selectedSubjects.includes(subject)) return;
      const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
      if (!subjectTotals[subject]) subjectTotals[subject] = {
        sum: 0,
        count: 0
      };
      subjectTotals[subject].sum += total;
      subjectTotals[subject].count++;
    });
  });
  const subjectAverages = Object.entries(subjectTotals).map(([name, data]) => ({
    name: name.length > 10 ? name.substring(0, 10) + "..." : name,
    fullName: name,
    average: data.count > 0 ? data.sum / data.count : 0
  })).sort((a, b) => b.average - a.average);
  const selectedStudentData = students.find(s => s.id === selectedStudent);

  // Year-over-year trend data with period filtering (like student page)
  const trendData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const years = data.map(d => String(d.year));

    // Create periods array (mid-year and year-end for each year except current)
    const periods: {
      year: string;
      type: "midYear" | "yearEnd";
      label: string;
    }[] = [];
    years.forEach((year, idx) => {
      periods.push({
        year,
        type: "midYear",
        label: `Mid ${year}`
      });
      if (idx < years.length - 1) {
        periods.push({
          year,
          type: "yearEnd",
          label: `End ${year}`
        });
      }
    });

    // Filter based on trendPeriod
    let filteredPeriods = periods;
    if (trendPeriod === "1year") {
      filteredPeriods = periods.slice(-2);
    } else if (trendPeriod === "2years") {
      filteredPeriods = periods.slice(-4);
    } else if (trendPeriod === "3years") {
      filteredPeriods = periods.slice(-6);
    } else if (trendPeriod === "4years") {
      filteredPeriods = periods.slice(-8);
    } else if (trendPeriod === "5years") {
      filteredPeriods = periods.slice(-10);
    } else if (trendPeriod === "6years") {
      filteredPeriods = periods.slice(-12);
    }
    return filteredPeriods.map(p => {
      const yearData = data.find(d => String(d.year) === p.year);
      if (!yearData) return {
        period: p.label,
        Average: 0
      };
      const result: Record<string, number | string | null> = {
        period: p.label
      };
      
      // Add all subjects from yearData (except 'year')
      let totalScore = 0;
      let subjectCount = 0;
      Object.entries(yearData).forEach(([key, value]) => {
        if (key !== 'year' && typeof value === 'number') {
          result[key] = value;
          totalScore += value;
          subjectCount++;
        }
      });

      // Calculate average
      result["Average"] = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;
      return result;
    });
  }, [selectedClass, trendPeriod]);

  // Calculate trend direction for selected subject(s) - uses average of all selected subjects
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return {
      direction: "stable" as const,
      change: 0,
      currentValue: 0
    };
    
    // Calculate average of selected subjects for first and last periods
    const calcAverage = (entry: Record<string, number | string | null>) => {
      let total = 0;
      let count = 0;
      trendsSelectedSubjects.forEach(subj => {
        const val = entry[subj];
        if (typeof val === 'number') {
          total += val;
          count++;
        }
      });
      return count > 0 ? Math.round(total / count) : null;
    };
    
    const firstValue = calcAverage(trendData[0]);
    const lastValue = calcAverage(trendData[trendData.length - 1]);
    
    if (firstValue === null || lastValue === null) return {
      direction: "stable" as const,
      change: 0,
      currentValue: 0
    };
    const change = lastValue - firstValue;
    return {
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "stable" as const,
      change: Math.abs(change),
      currentValue: lastValue
    };
  }, [trendData, trendsSelectedSubjects]);

  // Rising subjects - biggest improvement from first to last period (filtered by trendsSelectedSubjects)
  const risingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    // Get all subject keys from trendData (excluding 'period' and 'Average')
    const firstEntry = trendData[0];
    const subjectNames = Object.keys(firstEntry).filter(k => k !== 'period' && k !== 'Average');
    return subjectNames.filter(name => trendsSelectedSubjects.includes(name)).map(name => {
      const first = (trendData[0]?.[name] as number) ?? 0;
      const last = (trendData[trendData.length - 1]?.[name] as number) ?? 0;
      return {
        name,
        first,
        last,
        improvement: last - first
      };
    }).filter(s => s.improvement > 0).sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, [trendData, trendsSelectedSubjects]);

  // Falling subjects - biggest decline (filtered by trendsSelectedSubjects)
  const fallingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    const firstEntry = trendData[0];
    const subjectNames = Object.keys(firstEntry).filter(k => k !== 'period' && k !== 'Average');
    return subjectNames.filter(name => trendsSelectedSubjects.includes(name)).map(name => {
      const first = (trendData[0]?.[name] as number) ?? 0;
      const last = (trendData[trendData.length - 1]?.[name] as number) ?? 0;
      return {
        name,
        first,
        last,
        decline: first - last
      };
    }).filter(s => s.decline > 0).sort((a, b) => b.decline - a.decline).slice(0, 3);
  }, [trendData, trendsSelectedSubjects]);

  // Radar chart data for subject strengths (filtered by trendsSelectedSubjects) - use tiny codes for compact display
  const radarData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const latest = data[data.length - 1];
    
    // Build radar data from all subjects in the data using tiny codes
    const subjectList: { name: string; subject: string; score: number; fullMark: number }[] = [];
    Object.entries(latest).forEach(([key, value]) => {
      if (key !== 'year' && typeof value === 'number') {
        subjectList.push({
          name: key,
          subject: getTinySubjectCode(key),
          score: value,
          fullMark: 100
        });
      }
    });
    return subjectList.filter(s => trendsSelectedSubjects.includes(s.name));
  }, [selectedClass, trendsSelectedSubjects]);

  // Radar average for color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map(d => d.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [radarData]);

  // Calculate cohort average from all classes in the same year level
  const cohortAverages = useMemo(() => {
    // Determine the year level from selected class (e.g., "5A" -> "5")
    const yearLevel = selectedClass.charAt(0);
    
    // Get all classes in the same year level
    const cohortClasses = Object.keys(subjectYearlyData).filter(cls => cls.charAt(0) === yearLevel);
    
    // Get the latest year data for each class
    const latestDataPerClass = cohortClasses.map(cls => {
      const data = subjectYearlyData[cls as keyof typeof subjectYearlyData];
      return data ? data[data.length - 1] : null;
    }).filter(Boolean) as Record<string, number | string>[];
    
    // Calculate average for each subject across all classes in the cohort
    const subjectTotals: Record<string, { sum: number; count: number }> = {};
    
    latestDataPerClass.forEach(classData => {
      Object.entries(classData).forEach(([key, value]) => {
        if (key !== 'year' && typeof value === 'number') {
          if (!subjectTotals[key]) {
            subjectTotals[key] = { sum: 0, count: 0 };
          }
          subjectTotals[key].sum += value;
          subjectTotals[key].count += 1;
        }
      });
    });
    
    // Convert to averages
    const averages: Record<string, number> = {};
    Object.entries(subjectTotals).forEach(([subject, { sum, count }]) => {
      averages[subject] = Math.round(sum / count);
    });
    
    return averages;
  }, [selectedClass]);

  // Subject vs Cohort Average data
  const subjectVsCohortData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const latest = data[data.length - 1];
    
    // Build from all subjects in latest data
    const allSubjects: { name: string; fullName: string; classScore: number; cohortAvg: number; delta: number }[] = [];
    Object.entries(latest).forEach(([key, value]) => {
      if (key !== 'year' && typeof value === 'number') {
        const shortName = getShortSubjectName(key);
        const subjectCohortAvg = cohortAverages[key] || 70; // Use calculated cohort avg
        allSubjects.push({
          name: shortName.length > 8 ? shortName.substring(0, 8) : shortName,
          fullName: key,
          classScore: value,
          cohortAvg: subjectCohortAvg,
          delta: value - subjectCohortAvg
        });
      }
    });
    return allSubjects.filter(s => selectedSubjects.includes(s.fullName)).sort((a, b) => b.delta - a.delta);
  }, [selectedClass, selectedSubjects, cohortAverages]);

  // Performance Heatmap data (filtered by selectedSubjects)
  const heatmapData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    
    // Get all subject keys from the first entry
    const firstEntry = data[0];
    const subjectKeys = Object.keys(firstEntry).filter(k => k !== 'year');
    
    return subjectKeys.filter(subject => selectedSubjects.includes(subject)).map(subject => ({
      subject: getShortSubjectName(subject).substring(0, 6),
      fullName: subject,
      scores: data.map(yearData => ({
        period: String(yearData.year),
        score: typeof yearData[subject] === 'number' ? yearData[subject] as number : null
      }))
    }));
  }, [selectedClass, selectedSubjects]);

  // Helper function to get heatmap cell color based on score
  const getHeatmapColor = (score: number | null): string => {
    if (score === null) return "hsl(var(--muted))";
    if (score >= 85) return "#16a34a";
    if (score >= 75) return "#22c55e";
    if (score >= 65) return "#84cc16";
    if (score >= 55) return "#eab308";
    if (score >= 45) return "#f97316";
    return "#ef4444";
  };
  return <TeacherAppLayout>
      <AppHeader leftContent={
          <h1 className="text-xl font-semibold text-foreground">Academic</h1>
        } />

      <div className="px-4 mt-4 pb-4">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
            <TabsTrigger value="entry">Grade Entry</TabsTrigger>
            <TabsTrigger value="analysis">Class Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            {/* Class & Subject Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClass} onValueChange={v => {
                setSelectedClass(v);
                setSelectedEntrySubject(null);
                setExpandedStudents([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedEntrySubject || ""} onValueChange={v => {
                setSelectedEntrySubject(v);
                setExpandedStudents([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card">
                  <SelectItem value="Homeroom Behavior" className="font-medium text-purple-600">
                    Homeroom Behavior
                  </SelectItem>
                  <SelectItem value="Awards" className="font-medium text-amber-600">
                    Awards
                  </SelectItem>
                  <div className="h-px bg-border my-1" />
                  {subjects.map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedEntrySubject === "Homeroom Behavior" ? <>
              {/* Behavior Header */}
              <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Homeroom Behavior</p>
                      <p className="text-sm text-muted-foreground">Class {selectedClass} • {students.length} students</p>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-600">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Behavior
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Student List for Behavior Entry */}
              <div className="space-y-2">
                {students.map(student => {
                  const isExpanded = expandedStudents.includes(student.id);
                  const behavior = getStudentBehavior(student.id);
                  const filledCount = Object.entries(behavior).filter(([key, val]) => 
                    key !== 'homeroomComment' && key !== 'responsibilityComment' && val !== ""
                  ).length;
                  const hasData = filledCount > 0;
                  
                  return (
                    <Collapsible key={student.id} open={isExpanded} onOpenChange={() => toggleStudent(student.id)}>
                      <Card className={cn("overflow-hidden transition-colors", isExpanded ? "border-purple-400 shadow-md" : "")}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-purple-600">
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                                  {hasData && !isExpanded && (
                                    <p className="text-xs text-purple-600">{filledCount}/7 traits graded</p>
                                  )}
                                  {!hasData && !isExpanded && (
                                    <p className="text-xs text-amber-500">Not graded</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasData && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-purple-300 text-purple-600">
                                    {filledCount}/7
                                  </Badge>
                                )}
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="p-3 pt-0 space-y-3">
                            {/* Behavioral Traits Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {behaviorTraits.map(trait => {
                                const currentGrade = behavior[trait.key as keyof typeof behavior] as string || "";
                                return (
                                  <div key={trait.key} className={cn("p-2 rounded-lg", trait.bgColor, trait.borderColor, "border")}>
                                    <label className={cn("text-[10px] font-semibold uppercase block mb-1.5", trait.textColor)}>
                                      {trait.label}
                                    </label>
                                    <Select 
                                      value={currentGrade} 
                                      onValueChange={(v) => updateBehavior(student.id, trait.key, v)}
                                    >
                                      <SelectTrigger className={cn("h-9 bg-background/80 text-sm", trait.borderColor)}>
                                        <SelectValue placeholder="Grade">
                                          {currentGrade && (
                                            <Badge className={cn("font-bold text-xs", getGradeColor(currentGrade))}>
                                              {currentGrade}
                                            </Badge>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-card">
                                        {gradeOptions.map(grade => (
                                          <SelectItem key={grade} value={grade}>
                                            <Badge className={cn("font-bold", getGradeColor(grade))}>
                                              {grade}
                                            </Badge>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Comment Sections */}
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-rose-600 mb-1 block">
                                  Homeroom Teacher Comment
                                </label>
                                <Textarea
                                  placeholder="Enter homeroom teacher comment..."
                                  value={behavior.homeroomComment}
                                  onChange={(e) => updateBehavior(student.id, "homeroomComment", e.target.value)}
                                  className="min-h-[60px] text-sm resize-none bg-rose-50/50 dark:bg-rose-950/20 border-rose-200"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-purple-600 mb-1 block">
                                  Responsibility Comment
                                </label>
                                <Textarea
                                  placeholder="Enter responsibility comment..."
                                  value={behavior.responsibilityComment}
                                  onChange={(e) => updateBehavior(student.id, "responsibilityComment", e.target.value)}
                                  className="min-h-[60px] text-sm resize-none bg-purple-50/50 dark:bg-purple-950/20 border-purple-200"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Floating Save Button */}
              <Button 
                className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  toast({
                    title: "Behavior Saved",
                    description: `Homeroom behavior for ${selectedClass} has been saved.`,
                  });
                }}
              >
                <Save className="h-6 w-6" />
              </Button>
            </> : selectedEntrySubject === "Awards" ? <>
              {/* Awards Header */}
              <Card 
                className="border-amber-300 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.5)'
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-900">Awards</p>
                      <p className="text-sm text-amber-800/70">Class {selectedClass} • {students.length} students</p>
                    </div>
                    <Badge className="bg-white/80 border-amber-400 text-amber-700">
                      <Award className="h-3 w-3 mr-1" />
                      Awards
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Student List for Awards Entry */}
              <div className="space-y-2">
                {students.map(student => {
                  const isExpanded = expandedStudents.includes(student.id);
                  const awards = getStudentAwards(student.id);
                  const totalEntries = awards.sportsHouse.length + awards.clubs.length + awards.leadership.length + awards.events.length + awards.achievements.length;
                  const hasData = totalEntries > 0;
                  
                  return (
                    <Collapsible key={student.id} open={isExpanded} onOpenChange={() => toggleStudent(student.id)}>
                      <Card className={cn("overflow-hidden transition-colors", isExpanded ? "border-amber-400 shadow-md" : "")}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-amber-600">
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                                  {hasData && !isExpanded && (
                                    <p className="text-xs text-amber-600">{totalEntries} award(s) added</p>
                                  )}
                                  {!hasData && !isExpanded && (
                                    <p className="text-xs text-muted-foreground">No awards yet</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasData && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-amber-300 text-amber-600">
                                    {totalEntries}
                                  </Badge>
                                )}
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="p-3 pt-0 space-y-3">
                            {/* Sports House */}
                            <div 
                              className="p-2.5 rounded-lg border overflow-hidden"
                              style={{ 
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                                borderColor: 'rgba(251, 191, 36, 0.5)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-amber-900 uppercase">Sports House</label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-amber-900 hover:bg-white/30"
                                  onClick={() => addAwardEntry(student.id, "sportsHouse")}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              {awards.sportsHouse.length === 0 ? (
                                <p className="text-[10px] text-amber-800/70 text-center py-1">No entries</p>
                              ) : (
                                <div className="space-y-2">
                                  {awards.sportsHouse.map(entry => (
                                    <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                                      <Select value={entry.organization} onValueChange={(v) => updateAwardEntry(student.id, "sportsHouse", entry.id, "organization", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{sportsHouseOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Select value={entry.role} onValueChange={(v) => updateAwardEntry(student.id, "sportsHouse", entry.id, "role", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{roleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-white/30" onClick={() => removeAwardEntry(student.id, "sportsHouse", entry.id)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Clubs */}
                            <div 
                              className="p-2.5 rounded-lg border overflow-hidden"
                              style={{ 
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                                borderColor: 'rgba(251, 191, 36, 0.5)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-amber-900 uppercase">Clubs</label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-amber-900 hover:bg-white/30"
                                  onClick={() => addAwardEntry(student.id, "clubs")}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              {awards.clubs.length === 0 ? (
                                <p className="text-[10px] text-amber-800/70 text-center py-1">No entries</p>
                              ) : (
                                <div className="space-y-2">
                                  {awards.clubs.map(entry => (
                                    <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                                      <Select value={entry.organization} onValueChange={(v) => updateAwardEntry(student.id, "clubs", entry.id, "organization", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{clubOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Select value={entry.role} onValueChange={(v) => updateAwardEntry(student.id, "clubs", entry.id, "role", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{roleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-white/30" onClick={() => removeAwardEntry(student.id, "clubs", entry.id)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Leadership */}
                            <div 
                              className="p-2.5 rounded-lg border overflow-hidden"
                              style={{ 
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                                borderColor: 'rgba(251, 191, 36, 0.5)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-amber-900 uppercase">Leadership</label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-amber-900 hover:bg-white/30"
                                  onClick={() => addAwardEntry(student.id, "leadership")}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              {awards.leadership.length === 0 ? (
                                <p className="text-[10px] text-amber-800/70 text-center py-1">No entries</p>
                              ) : (
                                <div className="space-y-2">
                                  {awards.leadership.map(entry => (
                                    <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                                      <Select value={entry.organization} onValueChange={(v) => updateAwardEntry(student.id, "leadership", entry.id, "organization", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{leadershipOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Select value={entry.role} onValueChange={(v) => updateAwardEntry(student.id, "leadership", entry.id, "role", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{roleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-white/30" onClick={() => removeAwardEntry(student.id, "leadership", entry.id)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Achievements */}
                            <div 
                              className="p-2.5 rounded-lg border overflow-hidden"
                              style={{ 
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                                borderColor: 'rgba(251, 191, 36, 0.5)'
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-amber-900 uppercase">Achievements</label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-amber-900 hover:bg-white/30"
                                  onClick={() => addAchievementEntry(student.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              {awards.achievements.length === 0 ? (
                                <p className="text-[10px] text-amber-800/70 text-center py-1">No entries</p>
                              ) : (
                                <div className="space-y-2">
                                  {awards.achievements.map(entry => (
                                    <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                                      <Select value={entry.event} onValueChange={(v) => updateAchievementEntry(student.id, entry.id, "event", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{achievementEventOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Select value={entry.award} onValueChange={(v) => updateAchievementEntry(student.id, entry.id, "award", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white/80 border-amber-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-card">{achievementAwardOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-white/30" onClick={() => removeAchievementEntry(student.id, entry.id)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Floating Save Button */}
              <Button 
                className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0 bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  toast({
                    title: "Awards Saved",
                    description: `Awards for ${selectedClass} have been saved.`,
                  });
                }}
              >
                <Save className="h-6 w-6" />
              </Button>
            </> : selectedEntrySubject ? <>
              {/* Subject Header */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{selectedEntrySubject}</p>
                      <p className="text-sm text-muted-foreground">Class {selectedClass} • {students.length} students</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Grades
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const gradedCount = students.filter(s => {
                    const grades = getStudentSubjectGrades(s.id, selectedEntrySubject);
                    return Object.values(grades).some(v => v !== "" && v !== undefined);
                  }).length;
                  const pendingCount = students.length - gradedCount;
                  const avgScore = students.reduce((sum, s) => {
                    const grades = getStudentSubjectGrades(s.id, selectedEntrySubject);
                    return sum + calculateTotal(grades);
                  }, 0) / (gradedCount || 1);
                  
                  return (
                    <>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                        <p className="text-lg font-bold text-emerald-600">{gradedCount}</p>
                        <p className="text-[10px] text-muted-foreground">Graded</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                        <p className="text-lg font-bold text-blue-600">{students.length}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
                        <p className="text-lg font-bold text-purple-600">{gradedCount > 0 ? Math.round(avgScore) : '-'}</p>
                        <p className="text-[10px] text-muted-foreground">Avg</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Class Study Recommendation - Master Field */}
              <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Users className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-1">
                      Class Study Recommendation
                    </label>
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 whitespace-nowrap">
                      Applies to all
                    </Badge>
                  </div>
                  <Textarea 
                    placeholder="Enter a study recommendation for all students in this subject..." 
                    value={classStudyRecommendation[selectedClass]?.[selectedEntrySubject] || ""} 
                    onChange={e => {
                      const value = e.target.value;
                      setClassStudyRecommendation(prev => ({
                        ...prev,
                        [selectedClass]: {
                          ...prev[selectedClass],
                          [selectedEntrySubject]: value
                        }
                      }));
                      // Also update all students' study recommendation
                      students.forEach(student => {
                        updateGrade(student.id, selectedEntrySubject, "studyRecommendation", value);
                      });
                    }} 
                    className="min-h-[60px] text-sm resize-none border-amber-200 bg-background" 
                  />
                </CardContent>
              </Card>

              {/* Student List for Grade Entry */}
              <div className="space-y-2">
                {students.map(student => {
                  const isExpanded = expandedStudents.includes(student.id);
                  const grades = getStudentSubjectGrades(student.id, selectedEntrySubject);
                  const total = calculateTotal(grades);
                  const { grade: letterGrade, color: gradeColor } = getLetterGrade(total);
                  const hasData = Object.values(grades).some(v => v !== "" && v !== undefined);
                  
                  return (
                    <Collapsible key={student.id} open={isExpanded} onOpenChange={() => toggleStudent(student.id)}>
                      <Card className={cn("overflow-hidden transition-colors", isExpanded ? "border-primary/50 shadow-md" : "")}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-primary">
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                                  {hasData && !isExpanded && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-muted-foreground">Total: {total}</span>
                                      <Badge className={cn("text-[10px] px-1.5 py-0", gradeColor)}>
                                        {letterGrade}
                                      </Badge>
                                    </div>
                                  )}
                                  {!hasData && !isExpanded && (
                                    <p className="text-xs text-amber-500">Not graded</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasData && (
                                  <Badge className={cn("text-xs px-2 py-0.5", gradeColor)}>
                                    {total}
                                  </Badge>
                                )}
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="p-3 pt-0 space-y-3">
                            {/* Score Inputs - 2x2 Grid for Mobile */}
                            <div className="grid grid-cols-2 gap-2">
                              {gradeCategories.map(cat => (
                                <div key={cat.key} className="space-y-1">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase">
                                    {cat.label} ({cat.max})
                                  </label>
                                  <Input 
                                    type="number" 
                                    inputMode="numeric"
                                    min="0" 
                                    max={cat.max} 
                                    placeholder="0" 
                                    value={grades[cat.key as keyof StudentGrades] || ""} 
                                    onChange={e => updateGrade(student.id, selectedEntrySubject, cat.key as keyof StudentGrades, e.target.value)} 
                                    className="text-center h-11 text-base font-medium" 
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Total & Grade Display */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                              <div>
                                <p className="text-xs text-muted-foreground">Total Score</p>
                                <p className="text-2xl font-bold text-foreground">{total}<span className="text-sm text-muted-foreground">/100</span></p>
                              </div>
                              <Badge className={cn("text-xl px-4 py-2 font-bold", gradeColor)}>
                                {letterGrade}
                              </Badge>
                            </div>

                            {/* Comments Section */}
                            <div className="space-y-3">
                              {/* Report Card Comments */}
                              <div>
                                <label className="text-xs font-medium text-emerald-600 mb-1 block">
                                  Report Card Comments
                                </label>
                                <Textarea 
                                  placeholder="Comments visible on report card..." 
                                  value={grades.reportComment} 
                                  onChange={e => updateGrade(student.id, selectedEntrySubject, "reportComment", e.target.value)} 
                                  className="min-h-[70px] text-sm resize-none border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" 
                                />
                              </div>
                              
                              {/* Study Recommendations */}
                              <div>
                                <label className="text-xs font-medium text-amber-600 mb-1 block">
                                  Study Recommendations
                                </label>
                                <Textarea 
                                  placeholder="e.g., Focus on Chapter 5, practice more word problems..." 
                                  value={grades.studyRecommendation} 
                                  onChange={e => updateGrade(student.id, selectedEntrySubject, "studyRecommendation", e.target.value)} 
                                  className="min-h-[70px] text-sm resize-none border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" 
                                />
                              </div>
                              
                              {/* Authentic Comments (Internal) */}
                              <div>
                                <label className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                                  Authentic Comments <span className="text-[10px] text-red-400">(Internal)</span>
                                </label>
                                <Textarea 
                                  placeholder="Internal notes - not visible to parents..." 
                                  value={grades.comment} 
                                  onChange={e => updateGrade(student.id, selectedEntrySubject, "comment", e.target.value)} 
                                  className="min-h-[70px] text-sm resize-none border-red-200 bg-red-50/50 dark:bg-red-950/20" 
                                />
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Floating Save Button */}
              <Button 
                className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0"
                onClick={() => {
                  toast({
                    title: "Grades Saved",
                    description: `${selectedEntrySubject} grades for ${selectedClass} have been saved.`,
                  });
                }}
              >
                <Save className="h-6 w-6" />
              </Button>
            </> : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a subject to start grading</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">All students will appear for quick mark entry</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Sub-tabs for Class Analysis */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs">Bands</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Compare</TabsTrigger>
              </TabsList>

              {/* ==================== OVERVIEW SUB-TAB ==================== */}
              <TabsContent value="overview" className="space-y-4">
                {/* Filters Row - Class and Year selectors */}
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-9 justify-between flex-1">
                        {selectedClasses.length === 1 ? selectedClasses[0] : `${selectedClasses.length} Classes`}
                        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-background z-50" align="start">
                      <div className="space-y-2">
                        {teacherProfile.classes.map(cls => <label key={cls} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded">
                            <Checkbox checked={selectedClasses.includes(cls)} onCheckedChange={() => toggleClass(cls)} />
                            <span className="text-xs">{cls}</span>
                          </label>)}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-9 justify-between flex-1">
                        {selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} Years`}
                        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-background z-50" align="start">
                      <div className="space-y-2">
                        {academicYears.map(year => <label key={year} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded">
                            <Checkbox checked={selectedYears.includes(year)} onCheckedChange={() => toggleYear(year)} />
                            <span className="text-xs">{year}</span>
                          </label>)}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-9 justify-between flex-1">
                        {selectedPeriods.length === 1 ? examPeriods.find(p => p.value === selectedPeriods[0])?.label : `${selectedPeriods.length} Periods`}
                        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-background z-50" align="start">
                      <div className="space-y-2">
                        {examPeriods.map(period => <label key={period.value} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded">
                            <Checkbox checked={selectedPeriods.includes(period.value)} onCheckedChange={() => togglePeriod(period.value)} />
                            <span className="text-xs">{period.label}</span>
                          </label>)}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Selected filters badge */}
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {selectedClasses.map(cls => <Badge key={cls} variant="secondary" className="text-[10px] font-medium">
                      {cls}
                    </Badge>)}
                  {selectedYears.map(year => <Badge key={year} variant="outline" className="text-[10px] font-normal">
                      {year}
                    </Badge>)}
                  {selectedPeriods.map(period => <Badge key={period} variant="outline" className="text-[10px] font-normal">
                      {examPeriods.find(p => p.value === period)?.label}
                    </Badge>)}
                </div>

                {/* Report Button for Overview */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setOverviewReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>

                {/* Subject Selector - Toggle Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Subjects</h4>
                    <div className="flex gap-2">
                      <button
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setSelectedSubjects([...subjects])}
                      >
                        Select All
                      </button>
                      <button
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setSelectedSubjects([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                    {/* Grouped subject pills with dropdowns */}
                    {subjectGroups.map((group) => (
                      <SubjectGroupPill
                        key={group.baseName}
                        baseName={group.baseName}
                        shortName={group.shortName}
                        variants={group.variants || []}
                        selectedSubjects={selectedSubjects}
                        onToggle={toggleSubjectFilter}
                      />
                    ))}
                  </div>
                </div>

                {/* Rising Subjects - Star pattern design like student page */}
                {risingSubjects.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{
                    color: '#d97706'
                  }} /> Rising Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {risingSubjects.map(item => <div key={item.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                    borderColor: 'rgba(251, 191, 36, 0.5)'
                  }}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 40%)'
                    }} />
                          {/* Star pattern background */}
                          <div className="absolute inset-0 pointer-events-none">
                            <svg className="absolute -top-1 -left-1 w-8 h-8 opacity-40" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute top-0 right-0 w-6 h-6 opacity-35" fill="#fde68a" stroke="#fbbf24" strokeWidth="0.5" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute -bottom-2 -right-1 w-7 h-7 opacity-45" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute bottom-2 left-0 w-5 h-5 opacity-30" fill="#fde68a" stroke="#fcd34d" strokeWidth="0.5" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowUpRight className="h-3 w-3" style={{
                        color: '#d97706'
                      }} />
                            <span className="text-sm font-bold" style={{
                        color: '#d97706'
                      }}>+{item.improvement}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}>
                              {item.first}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff'
                      }}>
                              {item.last}%
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* At-Risk Subjects */}
                {fallingSubjects.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" style={{ color: '#dc2626' }} /> At-Risk Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Subjects that need extra attention</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fallingSubjects.slice(0, 3).map(item => <div key={item.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #f87171 100%)',
                    borderColor: 'rgba(248, 113, 113, 0.5)'
                  }}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 40%)'
                    }} />
                          {/* Warning pattern background */}
                          <div className="absolute inset-0 pointer-events-none">
                            <AlertTriangle className="absolute top-1 -left-1 w-7 h-7 opacity-20" style={{ color: '#dc2626' }} />
                            <AlertTriangle className="absolute bottom-1 -right-1 w-6 h-6 opacity-15" style={{ color: '#ef4444' }} />
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowDownRight className="h-3 w-3" style={{ color: '#dc2626' }} />
                            <span className="text-sm font-bold" style={{ color: '#dc2626' }}>-{item.decline}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#fef2f2',
                        color: '#991b1b'
                      }}>
                              {item.first}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff'
                      }}>
                              {item.last}%
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* Subject Performance Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div style={{ height: `${Math.max(176, subjectAverages.length * (isMobile ? 32 : 40))}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectAverages} layout="vertical" margin={{ left: isMobile ? -15 : 0, right: isMobile ? 5 : 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} tick={{
                        fontSize: isMobile ? 8 : 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} />
                        <YAxis type="category" dataKey="name" tick={{
                        fontSize: isMobile ? 8 : 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} width={isMobile ? 55 : 80} />
                        <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} formatter={(value: number) => [`${value.toFixed(1)}%`, "Average"]} />
                        <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                          {subjectAverages.map((_, index) => <Cell key={index} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Average */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}>
                    <BookOpen className="h-5 w-5 mb-1.5" style={{
                    color: '#3b82f6'
                  }} />
                    <span className="text-lg font-bold text-foreground">
                      {classAverage}%
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Average</span>
                    <span className="text-[9px] text-muted-foreground/70">Class Average</span>
                  </div>
                  
                  {/* Best Subject */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.1)'
                }}>
                    <Award className="h-5 w-5 mb-1.5" style={{
                    color: '#f59e0b'
                  }} />
                    <span className={cn(
                      "font-bold text-foreground leading-tight",
                      (subjectAverages[0]?.name || '').length > 8 ? "text-xs" : "text-sm"
                    )}>
                      {subjectAverages[0]?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Best Subject</span>
                    <span className="text-[9px] text-muted-foreground/70">{subjectAverages[0]?.average.toFixed(0) || 0}%</span>
                  </div>
                  
                  {/* Improvement */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)'
                }}>
                    <TrendingUp className="h-5 w-5 mb-1.5" style={{
                    color: '#22c55e'
                  }} />
                    <span className="text-lg font-bold text-foreground">
                      {risingSubjects[0]?.improvement ? `+${risingSubjects[0].improvement}%` : '+0%'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Improvement</span>
                    <span className="text-[9px] text-muted-foreground/70">Top Growth</span>
                  </div>
                  
                  {/* Students */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.1)'
                }}>
                    <Users className="h-5 w-5 mb-1.5" style={{
                    color: '#a855f7'
                  }} />
                    <span className="text-lg font-bold text-foreground">{students.length}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Students</span>
                    <span className="text-[9px] text-muted-foreground/70">In Class</span>
                  </div>
                  
                  {/* Passing */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.1)'
                }}>
                    <Target className="h-5 w-5 mb-1.5" style={{
                    color: '#14b8a6'
                  }} />
                    <span className="text-lg font-bold text-foreground">
                      {Math.round(passRate * students.length / 100)}/{students.length}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Passing</span>
                    <span className="text-[9px] text-muted-foreground/70">{passRate}%</span>
                  </div>
                  
                  {/* Needs Focus */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <AlertTriangle className="h-5 w-5 mb-1.5" style={{
                    color: '#ef4444'
                  }} />
                    <span className={cn(
                      "font-bold text-foreground leading-tight",
                      (subjectAverages[subjectAverages.length - 1]?.name || '').length > 8 ? "text-xs" : "text-sm"
                    )}>
                      {subjectAverages[subjectAverages.length - 1]?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Needs Focus</span>
                    <span className="text-[9px] text-muted-foreground/70">{subjectAverages[subjectAverages.length - 1]?.average.toFixed(0) || 0}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Top Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Award className="h-4 w-4" style={{
                      color: '#22c55e'
                    }} /> Top Subjects
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(0, 3).map((sub, index) => <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.2)'
                    }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#16a34a'
                      }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{
                          backgroundColor: '#22c55e'
                        }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Subjects Needing Attention - Red color */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" style={{
                      color: '#ef4444'
                    }} /> Needs Attention
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(-3).reverse().map((sub, index) => <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{
                      backgroundColor: 'rgba(254, 202, 202, 0.3)',
                      borderColor: 'rgba(248, 113, 113, 0.3)'
                    }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: 'rgba(254, 202, 202, 0.5)',
                        color: '#dc2626'
                      }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{
                          backgroundColor: '#f87171'
                        }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ==================== DISTRIBUTION SUB-TAB ==================== */}
              <TabsContent value="distribution" className="space-y-4">
                {/* Report Button - Standalone */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setBandsReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>

                {/* Comparison Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Compare Mode</span>
                  </div>
                  <button
                    onClick={() => setBandsCompareMode(!bandsCompareMode)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      bandsCompareMode ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-transform duration-200",
                        bandsCompareMode ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Filters Section - Stacked for mobile when comparing */}
                <div className={cn(
                  "space-y-4",
                  bandsCompareMode ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""
                )}>
                  {/* Primary Selection */}
                  <div className={cn(
                    "space-y-3 pb-3 border-b border-border",
                    bandsCompareMode && "p-3 rounded-lg bg-blue-50/50 border border-blue-200"
                  )}>
                    {bandsCompareMode && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-blue-700">Selection A</span>
                      </div>
                    )}
                    {/* Row 1: Class + Year + Exam Period */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {teacherProfile.classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[90px]">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as "midYear" | "yearEnd")}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {examPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Subject Filter */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Subject:</span>
                      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                        {subjectGroups.map((group) => (
                          <SubjectGroupPill
                            key={group.baseName}
                            baseName={group.baseName}
                            shortName={group.shortName}
                            variants={group.variants || []}
                            selectedSubjects={[bandsSelectedSubject]}
                            onToggle={(subjectName) => {
                              setBandsSelectedSubject(subjectName);
                            }}
                            singleSelect={true}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comparison Selection - Only show when compare mode is on */}
                  {bandsCompareMode && (
                    <div className="space-y-3 p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">Selection B</span>
                      </div>
                      {/* Row 1: Class + Year + Exam Period */}
                      <div className="flex items-center gap-2">
                        <Select value={bandsCompareClass} onValueChange={setBandsCompareClass}>
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {teacherProfile.classes.map((cls) => (
                              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={bandsCompareYear} onValueChange={setBandsCompareYear}>
                          <SelectTrigger className="w-[90px]">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {academicYears.map((year) => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={bandsComparePeriod} onValueChange={(v) => setBandsComparePeriod(v as "midYear" | "yearEnd")}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {examPeriods.map((period) => (
                              <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Subject Filter */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Subject:</span>
                        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                          {subjectGroups.map((group) => (
                            <SubjectGroupPill
                              key={group.baseName}
                              baseName={group.baseName}
                              shortName={group.shortName}
                              variants={group.variants || []}
                              selectedSubjects={[bandsCompareSubject]}
                              onToggle={(subjectName) => {
                                setBandsCompareSubject(subjectName);
                              }}
                              singleSelect={true}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grade Distribution - Normal or Comparison View */}
                {!bandsCompareMode ? (
                  /* Normal Grade Distribution Cards */
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Grade Distribution
                      <span className="text-xs text-muted-foreground ml-2">({bandsSelectedSubject})</span>
                    </h4>
                    <div className="grid grid-cols-6 gap-1.5">
                      {bandsGradeDistribution.map(g => {
                        const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                        const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                        return (
                          <div 
                            key={g.range} 
                            className="flex flex-col items-center p-2 rounded-lg border border-border/50" 
                            style={{
                              backgroundColor: `${GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]}15`
                            }}
                          >
                            <span className="text-sm font-bold" style={{
                              color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                            }}>
                              {g.range}
                            </span>
                            <span className="text-lg font-semibold text-foreground">{g.count}</span>
                            <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Comparison View - Mobile Friendly Stacked Charts */
                  <div className="space-y-4">
                    {/* Comparison Bar Chart - Mobile Optimized */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Grade Comparison</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-[10px] text-muted-foreground">{selectedClass} - {bandsSelectedSubject}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] text-muted-foreground">{bandsCompareClass} - {bandsCompareSubject}</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn("h-[200px]", isMobile && "h-[160px]")}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bandsComparisonChartData} barGap={2} margin={{ left: isMobile ? -15 : 5, right: isMobile ? 5 : 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="grade" tick={{ fontSize: isMobile ? 10 : 12, fill: "hsl(var(--foreground))" }} />
                            <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: "hsl(var(--muted-foreground))" }} width={isMobile ? 25 : 30} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                              formatter={(value: number, name: string) => [
                                `${value} students`,
                                name === "primary" ? `${selectedClass} - ${bandsSelectedSubject}` : `${bandsCompareClass} - ${bandsCompareSubject}`
                              ]}
                            />
                            <Bar dataKey="primary" fill="#3b82f6" radius={[4, 4, 0, 0]} name="primary" />
                            <Bar dataKey="compare" fill="#f59e0b" radius={[4, 4, 0, 0]} name="compare" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stacked Comparison Cards for Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Selection A Distribution */}
                      <div className="space-y-2 p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-xs font-semibold text-blue-700">{selectedClass} - {bandsSelectedSubject}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {bandsGradeDistribution.map(g => {
                            const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                            return (
                              <div 
                                key={g.range} 
                                className="flex flex-col items-center p-1.5 rounded-md border border-blue-200/50 bg-background"
                              >
                                <span className="text-xs font-bold" style={{
                                  color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                                }}>
                                  {g.range}
                                </span>
                                <span className="text-sm font-semibold text-foreground">{g.count}</span>
                                <span className="text-[9px] text-muted-foreground">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-blue-200/50">
                          <span>Top: {bandsTopPerformers.length}</span>
                          <span>Middle: {bandsMiddlePerformers.length}</span>
                          <span>At-Risk: {bandsAtRiskStudents.length}</span>
                        </div>
                      </div>

                      {/* Selection B Distribution */}
                      <div className="space-y-2 p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-xs font-semibold text-amber-700">{bandsCompareClass} - {bandsCompareSubject}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {bandsCompareGradeDistribution.map(g => {
                            const total = bandsCompareGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                            return (
                              <div 
                                key={g.range} 
                                className="flex flex-col items-center p-1.5 rounded-md border border-amber-200/50 bg-background"
                              >
                                <span className="text-xs font-bold" style={{
                                  color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                                }}>
                                  {g.range}
                                </span>
                                <span className="text-sm font-semibold text-foreground">{g.count}</span>
                                <span className="text-[9px] text-muted-foreground">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-amber-200/50">
                          <span>Top: {bandsCompareTopPerformers.length}</span>
                          <span>Middle: {bandsCompareMiddlePerformers.length}</span>
                          <span>At-Risk: {bandsCompareAtRiskStudents.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Performance Cards - Only show in non-compare mode */}
                {!bandsCompareMode && (
                <div className="space-y-3">
                  {/* Top Performers */}
                  <Card className="border-amber-200 bg-amber-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                        <Award className="h-4 w-4" />
                        Top Performers ({bandsTopPerformers.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">A*</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">A</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsTopPerformers.slice(0, 3).map((student, index) => (
                        <div key={student.id} className={cn(
                          "flex items-center justify-between p-2 rounded-lg bg-background",
                          index === 0 ? "border border-amber-300" : index === 1 ? "border border-slate-300" : "border border-orange-300"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                            <span className="text-sm font-medium truncate">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsTopPerformers.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                          onClick={() => {
                            setPerformanceDialogTab("top");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsTopPerformers.length - 3} more)
                        </Button>
                      )}
                      {bandsTopPerformers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Middle Performers */}
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <UserCheck className="h-4 w-4" />
                        Middle Performers ({bandsMiddlePerformers.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500 text-white">B</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500 text-white">C</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsMiddlePerformers.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-blue-200">
                          <span className="text-sm font-medium truncate">{student.name}</span>
                          <Badge className="text-xs bg-blue-100 text-blue-700 shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsMiddlePerformers.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => {
                            setPerformanceDialogTab("middle");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsMiddlePerformers.length - 3} more)
                        </Button>
                      )}
                      {bandsMiddlePerformers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* At-Risk Students */}
                  <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        At-Risk Students ({bandsAtRiskStudents.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">D</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">E</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsAtRiskStudents.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-red-200">
                          <span className="text-sm font-medium truncate">{student.name}</span>
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsAtRiskStudents.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={() => {
                            setPerformanceDialogTab("atRisk");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsAtRiskStudents.length - 3} more)
                        </Button>
                      )}
                      {bandsAtRiskStudents.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                )}

                {/* Performance Dialog */}
                <Dialog open={performanceDialogOpen} onOpenChange={setPerformanceDialogOpen}>
                  <DialogContent className="w-[95vw] max-w-lg h-[85vh] rounded-2xl overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Student Performance</DialogTitle>
                    </DialogHeader>
                    
                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                      <button
                        onClick={() => setPerformanceDialogTab("top")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "top" 
                            ? "bg-amber-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>Top</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsTopPerformers.length})</span>
                      </button>
                      <button
                        onClick={() => setPerformanceDialogTab("middle")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "middle" 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          <span>Middle</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsMiddlePerformers.length})</span>
                      </button>
                      <button
                        onClick={() => setPerformanceDialogTab("atRisk")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "atRisk" 
                            ? "bg-red-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>At-Risk</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsAtRiskStudents.length})</span>
                      </button>
                    </div>

                    {/* Student list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {performanceDialogTab === "top" && bandsTopPerformers.map((student, index) => (
                        <div key={student.id} className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          index === 0 ? "bg-amber-50 border border-amber-200" 
                            : index === 1 ? "bg-slate-50 border border-slate-200" 
                            : index === 2 ? "bg-orange-50 border border-orange-200" 
                            : "bg-accent/30 border border-border"
                        )}>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-lg font-bold w-8 text-center",
                              index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-orange-400" : "text-muted-foreground"
                            )}>
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {performanceDialogTab === "middle" && bandsMiddlePerformers.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-8 text-center text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-blue-100 text-blue-700">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {performanceDialogTab === "atRisk" && bandsAtRiskStudents.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-8 text-center text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {/* Empty state */}
                      {performanceDialogTab === "top" && bandsTopPerformers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No top performers</p>
                      )}
                      {performanceDialogTab === "middle" && bandsMiddlePerformers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No middle performers</p>
                      )}
                      {performanceDialogTab === "atRisk" && bandsAtRiskStudents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No at-risk students</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Bands Report Dialog */}
                <Dialog open={bandsReportDialogOpen} onOpenChange={setBandsReportDialogOpen}>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between pr-10">
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Grade Distribution Report
                      </DialogTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            // Generate CSV data for bands
                            const csvRows = [
                              ['Name', 'Score', 'Grade', 'Band'],
                              ...bandsRankedStudents.map(s => {
                                const band = s.score >= 80 ? 'Top' : s.score >= 50 ? 'Middle' : 'At-Risk';
                                const grade = s.score >= 90 ? 'A*' : s.score >= 80 ? 'A' : s.score >= 70 ? 'B' : s.score >= 60 ? 'C' : s.score >= 50 ? 'D' : 'E';
                                return [s.name, s.score.toString(), grade, band];
                              })
                            ];
                            const csvContent = csvRows.map(row => row.join(',')).join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `grade-distribution-${selectedClass}-${bandsSelectedSubject}-${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                          }}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                          if (bandsReportRef.current) {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Grade Distribution Report</title>
                                    <style>
                                      @page { 
                                        size: A4; 
                                        margin: 12mm 15mm;
                                      }
                                      * { 
                                        box-sizing: border-box; 
                                        margin: 0;
                                        padding: 0;
                                      }
                                      body { 
                                        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
                                        padding: 0;
                                        margin: 0;
                                        font-size: 10px;
                                        line-height: 1.3;
                                        color: #1a1a1a;
                                        -webkit-print-color-adjust: exact !important;
                                        print-color-adjust: exact !important;
                                        background: white;
                                      }
                                      
                                      /* Report Header - Compact */
                                      .report-header { 
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 12px;
                                        text-align: center; 
                                        margin-bottom: 12px; 
                                        border-bottom: 2px solid #1a1a1a; 
                                        padding-bottom: 10px; 
                                      }
                                      .report-header img,
                                      .report-header .school-logo {
                                        width: 40px !important;
                                        height: 40px !important;
                                        max-width: 40px !important;
                                        max-height: 40px !important;
                                        object-fit: contain !important;
                                        flex-shrink: 0;
                                      }
                                      .report-header h1 { 
                                        margin: 0 0 2px 0; 
                                        font-size: 16px; 
                                        font-weight: 700;
                                        color: #1a1a1a;
                                      }
                                      .report-header p { 
                                        margin: 0; 
                                        color: #666; 
                                        font-size: 9px; 
                                      }
                                      
                                      /* Section Styling */
                                      .section { 
                                        margin-bottom: 12px; 
                                        page-break-inside: avoid; 
                                      }
                                      .section h3 { 
                                        font-size: 11px; 
                                        font-weight: 600;
                                        margin: 0 0 6px 0; 
                                        padding-bottom: 3px; 
                                        border-bottom: 1px solid #ddd; 
                                        color: #1a1a1a;
                                      }
                                      .section h4 { 
                                        font-size: 10px; 
                                        font-weight: 600;
                                        margin: 0 0 4px 0; 
                                        display: flex;
                                        align-items: center;
                                        gap: 4px;
                                      }
                                      
                                      /* Grade Distribution Grid */
                                      .grade-grid { 
                                        display: grid !important; 
                                        grid-template-columns: repeat(6, 1fr) !important; 
                                        gap: 4px !important; 
                                        margin-bottom: 10px !important; 
                                      }
                                      .grade-card { 
                                        text-align: center !important; 
                                        padding: 6px 2px !important; 
                                        border: 1px solid #ddd !important; 
                                        border-radius: 4px !important; 
                                        background: white !important;
                                      }
                                      .grade-card .grade { 
                                        font-size: 11px !important; 
                                        font-weight: 700 !important; 
                                      }
                                      .grade-card .count { 
                                        font-size: 14px !important; 
                                        font-weight: 700 !important; 
                                        color: #1a1a1a !important;
                                      }
                                      .grade-card .percent { 
                                        font-size: 8px !important; 
                                        color: #666 !important; 
                                      }
                                      
                                      /* Performers Grid */
                                      .performers-grid { 
                                        display: grid !important; 
                                        grid-template-columns: repeat(3, 1fr) !important; 
                                        gap: 8px !important; 
                                        margin-bottom: 10px !important;
                                      }
                                      .performer-box { 
                                        padding: 8px !important; 
                                        border-radius: 6px !important; 
                                        page-break-inside: avoid !important;
                                      }
                                      .performer-box.top { 
                                        background: #fef3c7 !important; 
                                        border: 1px solid #fcd34d !important; 
                                      }
                                      .performer-box.middle { 
                                        background: #dbeafe !important; 
                                        border: 1px solid #93c5fd !important; 
                                      }
                                      .performer-box.risk { 
                                        background: #fee2e2 !important; 
                                        border: 1px solid #fca5a5 !important; 
                                      }
                                      
                                      /* Student Lists */
                                      .student-section { 
                                        page-break-inside: avoid; 
                                        margin-bottom: 8px; 
                                      }
                                      .student-list { 
                                        margin-top: 4px; 
                                      }
                                      .student-row { 
                                        display: flex !important; 
                                        justify-content: space-between !important; 
                                        padding: 2px 6px !important; 
                                        border-bottom: 1px solid #eee !important; 
                                        font-size: 9px !important;
                                      }
                                      .student-row:nth-child(odd) { 
                                        background: #f9f9f9 !important; 
                                      }
                                      
                                      /* Comparison Layout */
                                      .comparison-grid { 
                                        display: grid !important; 
                                        grid-template-columns: 1fr 1fr !important; 
                                        gap: 10px !important; 
                                      }
                                      .comparison-box { 
                                        padding: 8px !important; 
                                        border: 1px solid #ddd !important; 
                                        border-radius: 6px !important; 
                                        page-break-inside: avoid !important;
                                      }
                                      .comparison-box.blue { 
                                        border-color: #3b82f6 !important; 
                                        background: #eff6ff !important; 
                                      }
                                      .comparison-box.amber { 
                                        border-color: #f59e0b !important; 
                                        background: #fffbeb !important; 
                                      }
                                      
                                      /* Stats Box */
                                      .stats-box { 
                                        padding: 8px !important; 
                                        background: #f5f5f5 !important; 
                                        border-radius: 6px !important; 
                                        page-break-inside: avoid !important;
                                        margin-top: 10px !important;
                                      }
                                      .stats-grid { 
                                        display: grid !important; 
                                        grid-template-columns: repeat(4, 1fr) !important; 
                                        gap: 6px !important; 
                                        text-align: center !important; 
                                      }
                                      
                                      /* Tables */
                                      table { 
                                        width: 100% !important; 
                                        border-collapse: collapse !important; 
                                        font-size: 9px !important; 
                                      }
                                      th, td { 
                                        padding: 4px 6px !important; 
                                        border-bottom: 1px solid #ddd !important; 
                                      }
                                      th { 
                                        background: #f5f5f5 !important; 
                                        font-weight: 600 !important; 
                                      }
                                      
                                      /* Footer */
                                      .footer { 
                                        text-align: center !important; 
                                        font-size: 8px !important; 
                                        color: #666 !important; 
                                        margin-top: 12px !important; 
                                        padding-top: 8px !important; 
                                        border-top: 1px solid #ddd !important; 
                                      }
                                      
                                      /* Hide Tailwind/React specific classes that don't print well */
                                      svg { display: none !important; }
                                      .lucide { display: none !important; }
                                      
                                      /* Utility colors for printing */
                                      .text-emerald-600 { color: #059669 !important; }
                                      .text-blue-600 { color: #2563eb !important; }
                                      .text-red-600 { color: #dc2626 !important; }
                                      .text-amber-700 { color: #b45309 !important; }
                                      .text-blue-700 { color: #1d4ed8 !important; }
                                      
                                      @media print { 
                                        body { 
                                          padding: 0 !important; 
                                          margin: 0 !important;
                                        }
                                        .no-print { display: none !important; }
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    ${bandsReportRef.current.innerHTML}
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }
                        }}
                        >
                          <Printer className="h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto" ref={bandsReportRef}>
                      {/* Report Content */}
                      <div className="space-y-4 p-2">
                        {/* Report Header */}
                        <div className="report-header">
                          <img 
                            src={schoolLogo} 
                            alt="School Logo" 
                            className="school-logo"
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>Grade Distribution Report</h1>
                            <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
                              {bandsCompareMode ? "Comparison Report" : `Class ${selectedClass} - ${bandsSelectedSubject}`}
                            </p>
                            <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0 0' }}>
                              Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {' • '}{selectedYear} {selectedPeriod === 'midYear' ? 'Mid-Year' : 'Year-End'} Examination
                            </p>
                          </div>
                        </div>

                        {!bandsCompareMode ? (
                          /* Normal Report */
                          <>
                            <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                              <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>
                                Grade Distribution - {bandsSelectedSubject}
                              </h3>
                              <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                                {bandsGradeDistribution.map(g => {
                                  const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                  const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                  return (
                                    <div key={g.range} className="grade-card" style={{
                                      textAlign: 'center',
                                      padding: '8px 4px',
                                      border: '1px solid #ddd',
                                      borderRadius: '6px',
                                      backgroundColor: '#fff'
                                    }}>
                                      <div className="grade" style={{ fontSize: '12px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>
                                        {g.range}
                                      </div>
                                      <div className="count" style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                                      <div className="percent" style={{ fontSize: '9px', color: '#666' }}>{percentage}%</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Student Lists - All students shown for printing */}
                            <div className="performers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                              <div className="performer-box top" style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', marginBottom: '6px' }}>
                                  Top Performers ({bandsTopPerformers.length})
                                </h4>
                                <div className="student-list">
                                  {bandsTopPerformers.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fcd34d40' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsTopPerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                              
                              <div className="performer-box middle" style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dbeafe', border: '1px solid #93c5fd' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: 600, color: '#1d4ed8', marginBottom: '6px' }}>
                                  Middle Performers ({bandsMiddlePerformers.length})
                                </h4>
                                <div className="student-list">
                                  {bandsMiddlePerformers.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #93c5fd40' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsMiddlePerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                              
                              <div className="performer-box risk" style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>
                                  At-Risk ({bandsAtRiskStudents.length})
                                </h4>
                                <div className="student-list">
                                  {bandsAtRiskStudents.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fca5a540' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsAtRiskStudents.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="stats-box" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px', marginTop: '12px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>Summary Statistics</h4>
                              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>{bandsRankedStudents.length}</div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>Total Students</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>
                                    {bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%
                                  </div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>Passing Rate</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{bandsTopPerformers.length}</div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>Top (A*/A)</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>{bandsMiddlePerformers.length}</div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>Middle (B/C)</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{bandsAtRiskStudents.length}</div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>At-Risk (D/E)</div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Comparison Report */
                          <>
                            <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              {/* Selection A */}
                              <div className="comparison-box blue" style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>
                                    {selectedClass} - {bandsSelectedSubject}
                                  </span>
                                </div>
                                <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '10px' }}>
                                  {bandsGradeDistribution.map(g => {
                                    const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                    const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                    return (
                                      <div key={g.range} className="grade-card" style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                        <div className="grade" style={{ fontSize: '10px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>
                                          {g.range}
                                        </div>
                                        <div className="count" style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                                        <div className="percent" style={{ fontSize: '8px', color: '#666' }}>{percentage}%</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: '1px solid #3b82f640' }}>
                                  <span>Top: {bandsTopPerformers.length}</span>
                                  <span>Middle: {bandsMiddlePerformers.length}</span>
                                  <span>At-Risk: {bandsAtRiskStudents.length}</span>
                                </div>
                                {/* Categorized student lists for Selection A */}
                                <div className="student-section" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #3b82f640' }}>
                                  {/* Top Performers */}
                                  {bandsTopPerformers.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#059669', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Award className="h-3 w-3" /> Top (A*/A): {bandsTopPerformers.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#dcfce7', borderRadius: '4px', padding: '4px' }}>
                                        {bandsTopPerformers.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsTopPerformers.length - 1 ? '1px solid #bbf7d020' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#059669' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Middle Performers */}
                                  {bandsMiddlePerformers.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#2563eb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users className="h-3 w-3" /> Middle (B/C): {bandsMiddlePerformers.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#dbeafe', borderRadius: '4px', padding: '4px' }}>
                                        {bandsMiddlePerformers.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsMiddlePerformers.length - 1 ? '1px solid #bfdbfe20' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#2563eb' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* At-Risk Students */}
                                  {bandsAtRiskStudents.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#dc2626', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertTriangle className="h-3 w-3" /> At-Risk (D/E): {bandsAtRiskStudents.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#fee2e2', borderRadius: '4px', padding: '4px' }}>
                                        {bandsAtRiskStudents.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsAtRiskStudents.length - 1 ? '1px solid #fecaca20' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#dc2626' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Selection B */}
                              <div className="comparison-box amber" style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}>
                                    {bandsCompareClass} - {bandsCompareSubject}
                                  </span>
                                </div>
                                <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '10px' }}>
                                  {bandsCompareGradeDistribution.map(g => {
                                    const total = bandsCompareGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                    const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                    return (
                                      <div key={g.range} className="grade-card" style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                        <div className="grade" style={{ fontSize: '10px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>
                                          {g.range}
                                        </div>
                                        <div className="count" style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                                        <div className="percent" style={{ fontSize: '8px', color: '#666' }}>{percentage}%</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: '1px solid #f59e0b40' }}>
                                  <span>Top: {bandsCompareTopPerformers.length}</span>
                                  <span>Middle: {bandsCompareMiddlePerformers.length}</span>
                                  <span>At-Risk: {bandsCompareAtRiskStudents.length}</span>
                                </div>
                                {/* Categorized student lists for Selection B */}
                                <div className="student-section" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f59e0b40' }}>
                                  {/* Top Performers */}
                                  {bandsCompareTopPerformers.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#059669', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Award className="h-3 w-3" /> Top (A*/A): {bandsCompareTopPerformers.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#dcfce7', borderRadius: '4px', padding: '4px' }}>
                                        {bandsCompareTopPerformers.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsCompareTopPerformers.length - 1 ? '1px solid #bbf7d020' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#059669' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Middle Performers */}
                                  {bandsCompareMiddlePerformers.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#2563eb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users className="h-3 w-3" /> Middle (B/C): {bandsCompareMiddlePerformers.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#dbeafe', borderRadius: '4px', padding: '4px' }}>
                                        {bandsCompareMiddlePerformers.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsCompareMiddlePerformers.length - 1 ? '1px solid #bfdbfe20' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#2563eb' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* At-Risk Students */}
                                  {bandsCompareAtRiskStudents.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#dc2626', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertTriangle className="h-3 w-3" /> At-Risk (D/E): {bandsCompareAtRiskStudents.length}
                                      </div>
                                      <div className="student-list" style={{ backgroundColor: '#fee2e2', borderRadius: '4px', padding: '4px' }}>
                                        {bandsCompareAtRiskStudents.map((s, i) => (
                                          <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: i < bandsCompareAtRiskStudents.length - 1 ? '1px solid #fecaca20' : 'none' }}>
                                            <span>{i + 1}. {s.name}</span>
                                            <span style={{ fontWeight: 600, color: '#dc2626' }}>{s.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Comparison Summary */}
                            <div className="stats-box" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px', marginTop: '12px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>Comparison Summary</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 6px', backgroundColor: '#e5e5e5' }}>Metric</th>
                                    <th style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: '#1d4ed8' }}>{selectedClass}</th>
                                    <th style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: '#b45309' }}>{bandsCompareClass}</th>
                                    <th style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5' }}>Difference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Total Students</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsRankedStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsCompareRankedStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px' }}>{bandsRankedStudents.length - bandsCompareRankedStudents.length}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Top Performers (A*/A)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsTopPerformers.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsCompareTopPerformers.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: bandsTopPerformers.length > bandsCompareTopPerformers.length ? '#059669' : bandsTopPerformers.length < bandsCompareTopPerformers.length ? '#dc2626' : '#1a1a1a' }}>
                                      {bandsTopPerformers.length > bandsCompareTopPerformers.length ? "+" : ""}{bandsTopPerformers.length - bandsCompareTopPerformers.length}
                                    </td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Middle Performers (B/C)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsMiddlePerformers.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsCompareMiddlePerformers.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px' }}>{bandsMiddlePerformers.length - bandsCompareMiddlePerformers.length}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>At-Risk (D/E)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsAtRiskStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsCompareAtRiskStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: bandsAtRiskStudents.length < bandsCompareAtRiskStudents.length ? '#059669' : bandsAtRiskStudents.length > bandsCompareAtRiskStudents.length ? '#dc2626' : '#1a1a1a' }}>
                                      {bandsAtRiskStudents.length > bandsCompareAtRiskStudents.length ? "+" : ""}{bandsAtRiskStudents.length - bandsCompareAtRiskStudents.length}
                                    </td>
                                  </tr>
                                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Passing Rate (≥50%)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                      {bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                      {bandsCompareRankedStudents.length > 0 ? Math.round((bandsCompareRankedStudents.filter(s => s.score >= 50).length / bandsCompareRankedStudents.length) * 100) : 0}%
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: (() => {
                                      const passRateA = bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0;
                                      const passRateB = bandsCompareRankedStudents.length > 0 ? Math.round((bandsCompareRankedStudents.filter(s => s.score >= 50).length / bandsCompareRankedStudents.length) * 100) : 0;
                                      return passRateA > passRateB ? '#059669' : passRateA < passRateB ? '#dc2626' : '#1a1a1a';
                                    })() }}>
                                      {(() => {
                                        const passRateA = bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0;
                                        const passRateB = bandsCompareRankedStudents.length > 0 ? Math.round((bandsCompareRankedStudents.filter(s => s.score >= 50).length / bandsCompareRankedStudents.length) * 100) : 0;
                                        const diff = passRateA - passRateB;
                                        return `${diff > 0 ? '+' : ''}${diff}%`;
                                      })()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {/* Footer */}
                        <div className="footer" style={{ textAlign: 'center', fontSize: '9px', color: '#666', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                          <p style={{ margin: 0 }}>Prepared by: {teacherProfile.name} • {teacherProfile.email}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* ==================== TRENDS SUB-TAB ==================== */}
              <TabsContent value="trends" className="space-y-4">
                {/* Current Score Header - Moomoo Style */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 border border-border/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5 truncate">
                        {trendsSelectedSubjects.length === subjects.length ? `Class ${selectedClass} Average` : `${trendsSelectedSubjects.length} Subject${trendsSelectedSubjects.length > 1 ? 's' : ''} Selected`}
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-foreground">
                          {trendDirection.currentValue ?? classAverage}%
                        </span>
                        {trendDirection.direction !== "stable" && <span className={`flex items-center text-sm font-semibold ${trendDirection.direction === "up" ? "text-green-500" : "text-red-500"}`}>
                            {trendDirection.direction === "up" ? <TrendingUp className="h-4 w-4 mr-0.5" /> : <TrendingDown className="h-4 w-4 mr-0.5" />}
                            {trendDirection.direction === "up" ? "+" : "-"}{trendDirection.change}%
                          </span>}
                      </div>
                    </div>
                    {/* Class Selector */}
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Period Toggle */}
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                    {([{
                    key: "1year",
                    label: "1Y"
                  }, {
                    key: "2years",
                    label: "2Y"
                  }, {
                    key: "3years",
                    label: "3Y"
                  }, {
                    key: "4years",
                    label: "4Y"
                  }, {
                    key: "5years",
                    label: "5Y"
                  }, {
                    key: "6years",
                    label: "6Y"
                  }] as const).map(({
                    key,
                    label
                  }) => <button key={key} onClick={() => setTrendPeriod(key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${trendPeriod === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {label}
                      </button>)}
                  </div>
                </div>

                {/* Report Button for Trends */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setTrendsReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>

                {/* Subject Filter - Standardized Pills with Multi-Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Subjects:</span>
                    <div className="flex gap-2">
                      <button
                        className={`text-sm font-medium transition-colors ${trendsSelectedSubjects.length === subjects.length ? "text-primary" : "text-foreground hover:text-primary"}`}
                        onClick={() => setTrendsSelectedSubjects([...subjects])}
                      >
                        All
                      </button>
                      <button
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setTrendsSelectedSubjects([subjects[0]])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                    {subjectGroups.map((group) => (
                      <SubjectGroupPill
                        key={group.baseName}
                        baseName={group.baseName}
                        shortName={group.shortName}
                        variants={group.variants || []}
                        selectedSubjects={trendsSelectedSubjects}
                        onToggle={(subjectName) => {
                          setTrendsSelectedSubjects(prev => {
                            if (prev.includes(subjectName)) {
                              // Don't allow removing last subject
                              if (prev.length > 1) {
                                return prev.filter(s => s !== subjectName);
                              }
                              return prev;
                            } else {
                              return [...prev, subjectName];
                            }
                          });
                        }}
                        singleSelect={false}
                      />
                    ))}
                  </div>
                </div>

                {/* Moomoo-Style Gradient Area Chart - Scrollable with Pinch-to-Zoom */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">← Swipe • Pinch to zoom →</p>
                    <div className="flex items-center gap-2">
                      {chartZoom !== 1 && <button onClick={resetZoom} className="text-[10px] text-primary underline">
                          Reset zoom
                        </button>}
                      <p className="text-[10px] text-muted-foreground">
                        {chartZoom !== 1 ? `${Math.round(chartZoom * 100)}%` : `${trendData.length} periods`}
                      </p>
                    </div>
                  </div>
                  <div ref={chartContainerRef} className={cn("h-64 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent", isMobile && "h-52")} style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  touchAction: 'pan-x pan-y pinch-zoom'
                }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <div style={{
                    width: Math.max(100, trendData.length / 4 * 100 * chartZoom) + '%',
                    minWidth: isMobile ? '120%' : '100%',
                    height: '100%',
                    transition: 'width 0.1s ease-out'
                  }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{
                        top: 10,
                        right: isMobile ? 10 : 20,
                        left: isMobile ? -15 : 0,
                        bottom: 20
                      }}>
                          <defs>
                            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
                          <XAxis dataKey="period" axisLine={false} tickLine={false} interval={0} height={40} tick={({
                          x,
                          y,
                          payload
                        }) => {
                          const parts = payload.value.split(' ');
                          return <g transform={`translate(${x},${y})`}>
                                  <text x={0} y={0} dy={12} textAnchor="middle" fontSize={isMobile ? 8 : 10} fill="hsl(var(--muted-foreground))">
                                    {parts[0]}
                                  </text>
                                  <text x={0} y={0} dy={24} textAnchor="middle" fontSize={isMobile ? 7 : 9} fill="hsl(var(--muted-foreground))" opacity={0.7}>
                                    {parts[1]}
                                  </text>
                                </g>;
                        }} />
                          <YAxis domain={[30, 100]} tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: "hsl(var(--muted-foreground))"
                        }} axisLine={false} tickLine={false} width={isMobile ? 28 : 35} />
                          <Tooltip contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }} labelStyle={{
                          fontWeight: 600,
                          marginBottom: 4
                        }} />
                          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} label={{
                          value: "Pass",
                          fontSize: 9,
                          fill: "#f59e0b"
                        }} />
                          <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} label={{
                          value: "A",
                          fontSize: 9,
                          fill: "#22c55e"
                        }} />
                          {/* Render Area for the average of selected subjects */}
                          <Area 
                            type="monotone" 
                            dataKey="Average" 
                            stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"} 
                            strokeWidth={2.5} 
                            fill={trendDirection.direction === "up" ? "url(#gradientGreen)" : trendDirection.direction === "down" ? "url(#gradientRed)" : "url(#gradientBlue)"} 
                            dot={{
                              fill: trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6",
                              strokeWidth: 0,
                              r: 5
                            }} 
                            activeDot={{
                              r: 7,
                              strokeWidth: 2,
                              stroke: "#fff"
                            }} 
                            connectNulls 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Rising & Falling Subjects */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Rising Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Rising Subjects
                    </h4>
                    <div className="space-y-2">
                      {risingSubjects.length > 0 ? risingSubjects.map((item, idx) => <div key={idx} className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</span>
                            <span className="text-xs font-bold text-green-600">+{item.improvement}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.first}% → {item.last}%
                          </p>
                        </div>) : <p className="text-xs text-muted-foreground p-2">No improving subjects</p>}
                    </div>
                  </div>

                  {/* Falling Behind */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Needs Focus
                    </h4>
                    <div className="space-y-2">
                      {fallingSubjects.length > 0 ? fallingSubjects.map((item, idx) => <div key={idx} className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</span>
                            <span className="text-xs font-bold text-red-600">-{item.decline}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.first}% → {item.last}%
                          </p>
                        </div>) : <p className="text-xs text-muted-foreground p-2">All subjects stable!</p>}
                    </div>
                  </div>
                </div>

                {/* Dynamic Trend Insights */}
                <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Insight:</span>{" "}
                    {risingSubjects.length > 0 && <>{risingSubjects[0].name} shows great improvement (+{risingSubjects[0].improvement}%). </>}
                    {fallingSubjects.length > 0 && <>Focus more on {fallingSubjects[0].name} which dropped {fallingSubjects[0].decline}%. </>}
                    {risingSubjects.length === 0 && fallingSubjects.length === 0 && <>Performance is stable across all subjects for Class {selectedClass}.</>}
                  </p>
                </div>

                {/* Radar Chart - Subject Strengths Profile */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Strengths Profile
                  </h4>
                  <div className={cn("h-56", isMobile && "h-48")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "70%"}>
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <PolarAngleAxis dataKey="subject" tick={{
                        fontSize: isMobile ? 7 : 9,
                        fill: "hsl(var(--muted-foreground))"
                      }} tickLine={false} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{
                        fontSize: isMobile ? 6 : 8,
                        fill: "hsl(var(--muted-foreground))"
                      }} tickCount={5} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} fill={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} fillOpacity={0.3} strokeWidth={2} />
                        <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: isMobile ? 10 : 12
                      }} formatter={(value: number) => [`${value}%`, "Score"]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Visual snapshot of performance across all subjects
                  </p>
                </div>

                {/* Class vs Cohort Average Horizontal Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Class VS Cohort Average
                  </h4>
                  <div className={cn("h-64", isMobile && "h-56")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectVsCohortData} layout="vertical" barGap={2} margin={{ left: isMobile ? -10 : 0, right: isMobile ? 5 : 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{
                        fontSize: isMobile ? 8 : 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{
                        fontSize: isMobile ? 8 : 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} width={isMobile ? 45 : 60} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} formatter={(value: number, name: string) => [`${value}%`, name === "classScore" ? "Class Score" : "Cohort Average"]} />
                        <Bar 
                          dataKey="classScore" 
                          radius={[0, 4, 4, 0]} 
                          barSize={12}
                          label={({ x, y, width, height, index }) => {
                            const entry = subjectVsCohortData[index];
                            if (!entry) return null;
                            // Calculate dot position based on cohort average
                            const chartWidth = width / (entry.classScore / 100);
                            const dotX = x + (entry.cohortAvg / 100) * chartWidth;
                            const dotY = y + height / 2;
                            return (
                              <circle
                                cx={dotX}
                                cy={dotY}
                                r={5}
                                fill="#1f2937"
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            );
                          }}
                        >
                          {subjectVsCohortData.map((entry, index) => {
                            // Subject colors for visual distinction
                            const subjectColors: Record<string, string> = {
                              "English": "#22c55e",
                              "Math": "#f59e0b",
                              "Malay": "#3b82f6",
                              "Science": "#ef4444",
                              "ICT": "#8b5cf6",
                              "Add Math": "#f97316",
                              "Chemistry": "#06b6d4",
                              "Physics": "#ec4899",
                              "Biology": "#10b981",
                              "Account": "#6366f1",
                              "Econs": "#14b8a6",
                              "Biz Stud": "#a855f7",
                              "Moral": "#84cc16",
                              "Islamic": "#0ea5e9",
                              "Art": "#f43f5e",
                              "Living S": "#facc15",
                              "Chinese": "#64748b",
                            };
                            const fallbackColors = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899", "#10b981", "#6366f1"];
                            const color = subjectColors[entry.name] || fallbackColors[index % fallbackColors.length];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend for dots */}
                  <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      <span>Class Score</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                      <span>Cohort Avg</span>
                    </div>
                  </div>
                  {/* Delta badges */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {subjectVsCohortData.slice(0, 4).map(item => <Badge key={item.name} variant={item.delta >= 0 ? "default" : "destructive"} className="text-[10px] px-2 py-0.5">
                        {item.name}: {item.delta >= 0 ? "+" : ""}{item.delta}%
                      </Badge>)}
                  </div>
                </div>

                {/* Performance Heatmap */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance Heatmap
                  </h4>
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Scores across all years
                  </p>
                  <div className="overflow-x-auto">
                    <div className="min-w-[320px]">
                      {/* Header row with periods */}
                      <div className="flex gap-1 mb-1">
                        <div className="w-16 shrink-0" />
                        {heatmapData[0]?.scores.map(s => <div key={s.period} className="flex-1 text-center text-[9px] font-medium text-muted-foreground px-1">
                            {s.period}
                          </div>)}
                      </div>
                      {/* Subject rows */}
                      {heatmapData.map(row => <div key={row.subject} className="flex gap-1 mb-1">
                          <div className="w-16 shrink-0 text-[10px] font-medium text-foreground truncate pr-1 flex items-center">
                            {row.subject}
                          </div>
                          {row.scores.map((cell, idx) => <div key={idx} className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-semibold text-white transition-all hover:scale-105 cursor-default" style={{
                        backgroundColor: getHeatmapColor(cell.score),
                        opacity: cell.score === null ? 0.3 : 1
                      }} title={`${row.fullName} - ${cell.period}: ${cell.score ?? 'N/A'}%`}>
                              {cell.score ?? "–"}
                            </div>)}
                        </div>)}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-[9px] text-muted-foreground mr-1">Low</span>
                    {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"].map((color, i) => <div key={i} className="w-4 h-3 rounded-sm" style={{
                    backgroundColor: color
                  }} />)}
                    <span className="text-[9px] text-muted-foreground ml-1">High</span>
                  </div>
                </div>
              </TabsContent>

              {/* ==================== COMPARISON SUB-TAB ==================== */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Exam Selectors */}
                <div className="flex items-center gap-2">
                  {/* Exam A - Light Blue Box */}
                  <div className="flex-1 space-y-2 p-3 rounded-xl border" style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderColor: 'rgba(59, 130, 246, 0.25)'
                  }}>
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{
                      color: '#3b82f6'
                    }}>
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: '#3b82f6'
                      }} />
                      Exam A
                    </label>
                    <Select value={examAClass} onValueChange={setExamAClass}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examAYear} onValueChange={setExamAYear}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {academicYears.slice(0, 4).map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examAPeriod} onValueChange={v => setExamAPeriod(v as "midYear" | "yearEnd")}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriods.map(period => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">vs</span>
                  </div>
                  
                  {/* Exam B - Light Amber Box */}
                  <div className="flex-1 space-y-2 p-3 rounded-xl border" style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderColor: 'rgba(245, 158, 11, 0.25)'
                  }}>
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{
                      color: '#d97706'
                    }}>
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: '#f59e0b'
                      }} />
                      Exam B
                    </label>
                    <Select value={examBClass} onValueChange={setExamBClass}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examBYear} onValueChange={setExamBYear}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {academicYears.slice(0, 4).map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examBPeriod} onValueChange={v => setExamBPeriod(v as "midYear" | "yearEnd")}>
                      <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriods.map(period => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Report Button for Comparison */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setComparisonReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>

                {/* Subject Multi-Select */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Subjects</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[38px]">
                    {subjects.map(s => {
                    const isSelected = compareSubjects.includes(s);
                    return <Badge key={s} variant={isSelected ? "default" : "outline"} className={`cursor-pointer text-xs transition-colors ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary/80" : "hover:bg-accent"}`} onClick={() => {
                      if (isSelected) {
                        if (compareSubjects.length > 1) {
                          setCompareSubjects(prev => prev.filter(name => name !== s));
                        }
                      } else {
                        setCompareSubjects(prev => [...prev, s]);
                      }
                    }}>
                          {shortenSubjectName(s)}
                          {isSelected && <Check className="h-3 w-3 ml-1" />}
                        </Badge>;
                  })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setCompareSubjects([...subjects])}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setCompareSubjects([subjects[0]])}>
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Comparison Content */}
                {(() => {
                const examAKey = `${examAYear}-${examAPeriod}`;
                const examBKey = `${examBYear}-${examBPeriod}`;
                const subjectDataA = subjectExamData[examAClass as keyof typeof subjectExamData]?.[examAKey];
                const subjectDataB = subjectExamData[examBClass as keyof typeof subjectExamData]?.[examBKey];
                const getExamLabelForComparison = (cls: string, year: string, period: string) => {
                  const periodLabel = period === "midYear" ? "Mid-Year" : "Year-End";
                  return `${cls} ${periodLabel} ${year}`;
                };
                const examALabel = getExamLabelForComparison(examAClass, examAYear, examAPeriod);
                const examBLabel = getExamLabelForComparison(examBClass, examBYear, examBPeriod);
                if (!subjectDataA || !subjectDataB) {
                  return <Card className="bg-muted/30">
                        <CardContent className="p-8 text-center">
                          <Scale className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">No data available for the selected exam periods</p>
                        </CardContent>
                      </Card>;
                }

                // Build comparison data based on selected subjects
                const comparisonData = compareSubjects.map(subjectName => {
                  const scoreA = subjectDataA[subjectName] ?? 0;
                  const scoreB = subjectDataB[subjectName] ?? 0;
                  const delta = scoreA - scoreB;
                  return {
                    name: subjectName,
                    examA: scoreA,
                    examB: scoreB,
                    delta,
                    improved: delta > 0
                  };
                });
                const avgA = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length) : 0;
                const avgB = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length) : 0;
                return <>
                      {/* Comparison Summary Cards */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-foreground">Exam A</span>
                              <p className="text-[10px] text-muted-foreground">{examALabel}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{avgA}%</p>
                          <p className="text-[10px] text-muted-foreground">Average Score</p>
                        </div>
                        
                        {/* VS Divider */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">vs</span>
                        </div>
                        
                        <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-foreground">Exam B</span>
                              <p className="text-[10px] text-muted-foreground">{examBLabel}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{avgB}%</p>
                          <p className="text-[10px] text-muted-foreground">Average Score</p>
                        </div>
                      </div>

                      {/* Top 5 Growth/Decline Leaders - Swipeable Carousel */}
                      {(() => {
                        const top5Growth = [...comparisonData].filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
                        const top5Decline = [...comparisonData].filter(item => item.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);

                        return (
                          <div className="relative">
                            <Carousel
                              className="w-full"
                              opts={{ align: "start", loop: false }}
                              setApi={(api) => {
                                if (api) {
                                  setGrowthCarouselApi(api);
                                  api.on("select", () => {
                                    setGrowthCarouselSlide(api.selectedScrollSnap());
                                  });
                                }
                              }}
                            >
                              <CarouselContent className="-ml-2">
                                {/* Slide 1: Top Growth Subjects */}
                                <CarouselItem className="pl-2">
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                                    <div className="flex flex-col items-center justify-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div className="text-center">
                                          <h4 className="text-sm font-semibold text-foreground">Top Growth Subjects</h4>
                                          <p className="text-[10px] text-muted-foreground">Best performing subjects</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {top5Growth.length === 0 ? (
                                      <div className="text-center py-4 text-muted-foreground text-sm">
                                        No subjects showed improvement in this period
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {/* Individual Subject Badges */}
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                          {top5Growth.map(item => {
                                            const percentChange = item.examB > 0 ? (item.delta / item.examB * 100).toFixed(0) : '0';
                                            return (
                                              <div key={item.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                                                <span className="text-[10px] font-medium text-foreground">{shortenSubjectName(item.name)}</span>
                                                <span className="text-[10px] font-bold text-emerald-600">+{percentChange}%</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Bar Chart - Before/After Comparison */}
                                        <div className="h-36 -mx-2">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={top5Growth.map(item => ({
                                              name: shortenSubjectName(item.name),
                                              examA: item.examA,
                                              examB: item.examB,
                                              delta: item.delta
                                            }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={2} barCategoryGap="20%">
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} height={30} />
                                              <YAxis hide domain={[0, 100]} />
                                              <Tooltip content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                                      <p className="text-xs font-medium text-foreground">{data.name}</p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-blue-500">A: {data.examA}</span>
                                                        <span className="text-[10px] text-muted-foreground">vs</span>
                                                        <span className="text-[10px] text-amber-500">B: {data.examB}</span>
                                                      </div>
                                                      <p className="text-xs text-emerald-500 font-bold mt-1">+{data.delta} pts</p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} />
                                              <Bar dataKey="examB" fill="hsl(38, 92%, 70%)" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} radius={[4, 4, 0, 0]} name="Exam B" />
                                              <Bar dataKey="examA" fill="hsl(217, 91%, 75%)" stroke="hsl(217, 91%, 50%)" strokeWidth={1.5} radius={[4, 4, 0, 0]} name="Exam A" />
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Legend */}
                                        <div className="flex items-center justify-center gap-4 text-[10px]">
                                          <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-500" />
                                            <span className="text-muted-foreground">Exam B</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-blue-300 border border-blue-500" />
                                            <span className="text-muted-foreground">Exam A</span>
                                          </div>
                                        </div>
                                        
                                        {/* Top 5 Rankings */}
                                        <div className="space-y-2">
                                          {top5Growth.map((item, index) => {
                                            const percentChange = item.examB > 0 ? (item.delta / item.examB * 100).toFixed(1) : '0.0';
                                            const maxDelta = Math.max(...top5Growth.map(t => t.delta));
                                            const barWidth = item.delta / maxDelta * 100;
                                            return (
                                              <div key={item.name} className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : index === 1 ? 'bg-gray-400/20 text-gray-500' : index === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                                  {index + 1}
                                                </div>
                                                <span className="text-xs font-medium text-foreground w-16 truncate">{shortenSubjectName(item.name)}</span>
                                                <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden relative">
                                                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                                                </div>
                                                <div className="flex items-center gap-1 min-w-[60px] justify-end">
                                                  <span className="text-xs font-bold text-emerald-500">+{item.delta}</span>
                                                  <span className="text-[9px] text-muted-foreground">({percentChange}%)</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Summary Footer */}
                                        <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                                          <span className="text-[10px] text-muted-foreground">
                                            Average growth: +{(top5Growth.reduce((sum, t) => sum + t.delta, 0) / top5Growth.length).toFixed(1)} pts
                                          </span>
                                          <span className="text-[10px] text-emerald-500 font-medium">
                                            🏆 {shortenSubjectName(top5Growth[0].name)} leads with +{top5Growth[0].delta} pts
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CarouselItem>
                                
                                {/* Slide 2: Top Declined Subjects */}
                                <CarouselItem className="pl-2">
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                                    <div className="flex flex-col items-center justify-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                          <TrendingDown className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div className="text-center">
                                          <h4 className="text-sm font-semibold text-foreground">Top Declined Subjects</h4>
                                          <p className="text-[10px] text-muted-foreground">Needs attention</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {top5Decline.length === 0 ? (
                                      <div className="text-center py-4 text-muted-foreground text-sm">
                                        No subjects showed decline in this period 🎉
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {/* Individual Subject Badges */}
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                          {top5Decline.map(item => {
                                            const percentChange = item.examB > 0 ? (Math.abs(item.delta) / item.examB * 100).toFixed(0) : '0';
                                            return (
                                              <div key={item.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                                                <ArrowDown className="h-3 w-3 text-red-500" />
                                                <span className="text-[10px] font-medium text-foreground">{shortenSubjectName(item.name)}</span>
                                                <span className="text-[10px] font-bold text-red-600">-{percentChange}%</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Bar Chart - Before/After Comparison */}
                                        <div className="h-36 -mx-2">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={top5Decline.map(item => ({
                                              name: shortenSubjectName(item.name),
                                              examA: item.examA,
                                              examB: item.examB,
                                              delta: item.delta
                                            }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={2} barCategoryGap="20%">
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} height={30} />
                                              <YAxis hide domain={[0, 100]} />
                                              <Tooltip content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                                      <p className="text-xs font-medium text-foreground">{data.name}</p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-blue-500">A: {data.examA}</span>
                                                        <span className="text-[10px] text-muted-foreground">vs</span>
                                                        <span className="text-[10px] text-amber-500">B: {data.examB}</span>
                                                      </div>
                                                      <p className="text-xs text-red-500 font-bold mt-1">{data.delta} pts</p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} />
                                              <Bar dataKey="examB" fill="hsl(38, 92%, 70%)" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} radius={[4, 4, 0, 0]} name="Exam B" />
                                              <Bar dataKey="examA" fill="hsl(217, 91%, 75%)" stroke="hsl(217, 91%, 50%)" strokeWidth={1.5} radius={[4, 4, 0, 0]} name="Exam A" />
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Legend */}
                                        <div className="flex items-center justify-center gap-4 text-[10px]">
                                          <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-500" />
                                            <span className="text-muted-foreground">Exam B</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-blue-300 border border-blue-500" />
                                            <span className="text-muted-foreground">Exam A</span>
                                          </div>
                                        </div>
                                        
                                        {/* Top 5 Rankings */}
                                        <div className="space-y-2">
                                          {top5Decline.map((item, index) => {
                                            const percentChange = item.examB > 0 ? (Math.abs(item.delta) / item.examB * 100).toFixed(1) : '0.0';
                                            const maxDelta = Math.max(...top5Decline.map(t => Math.abs(t.delta)));
                                            const barWidth = Math.abs(item.delta) / maxDelta * 100;
                                            return (
                                              <div key={item.name} className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-red-500/20 text-red-600' : index === 1 ? 'bg-red-400/20 text-red-500' : index === 2 ? 'bg-red-300/20 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                                                  {index + 1}
                                                </div>
                                                <span className="text-xs font-medium text-foreground w-16 truncate">{shortenSubjectName(item.name)}</span>
                                                <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden relative">
                                                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                                                </div>
                                                <div className="flex items-center gap-1 min-w-[60px] justify-end">
                                                  <span className="text-xs font-bold text-red-500">{item.delta}</span>
                                                  <span className="text-[9px] text-muted-foreground">({percentChange}%)</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Summary Footer */}
                                        <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
                                          <span className="text-[10px] text-muted-foreground">
                                            Average decline: {(top5Decline.reduce((sum, t) => sum + t.delta, 0) / top5Decline.length).toFixed(1)} pts
                                          </span>
                                          <span className="text-[10px] text-red-500 font-medium">
                                            ⚠️ {shortenSubjectName(top5Decline[0].name)} needs focus
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CarouselItem>
                              </CarouselContent>
                            </Carousel>
                            
                            {/* Switcher Buttons */}
                            <div className="flex items-center justify-center mt-3">
                              <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
                                <button
                                  onClick={() => growthCarouselApi?.scrollTo(0)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                                    growthCarouselSlide === 0 
                                      ? 'bg-emerald-500 text-white shadow-sm' 
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  <span>Growth</span>
                                </button>
                                <button
                                  onClick={() => growthCarouselApi?.scrollTo(1)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                                    growthCarouselSlide === 1 
                                      ? 'bg-red-500 text-white shadow-sm' 
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Subject Comparison - Moomoo Style */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                        <div className="space-y-3">
                          {comparisonData.map(item => {
                        const percentChange = item.examB > 0 ? (item.delta / item.examB * 100).toFixed(1) : '0.0';
                        return <div key={item.name} className="p-3 rounded-xl bg-accent/30 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-foreground">{shortenSubjectName(item.name)}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={item.delta > 0 ? "default" : item.delta < 0 ? "destructive" : "secondary"} className={`text-xs px-2 py-0.5 ${item.delta > 0 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : item.delta < 0 ? "bg-red-500/20 text-red-600 border-red-500/30" : ""}`}>
                                      {item.delta > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : item.delta < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                      {item.delta > 0 ? "+" : ""}{item.delta}pts ({item.delta >= 0 ? "+" : ""}{percentChange}%)
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Visual Bars */}
                                <div className="space-y-1.5">
                                  {/* Exam B (Previous) - Amber with outline */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground w-16 truncate">{examBLabel.split(' ')[0]}</span>
                                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                      <div className="h-full bg-[hsl(38,92%,70%)] border-2 border-[hsl(38,92%,50%)] rounded-full transition-all duration-500" style={{
                                        width: `${item.examB / 100 * 100}%`
                                      }} />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                        {item.examB}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Exam A (Current) - Blue with outline */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground w-16 truncate">{examALabel.split(' ')[0]}</span>
                                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                      <div className="h-full bg-[hsl(217,91%,75%)] border-2 border-[hsl(217,91%,50%)] rounded-full transition-all duration-500" style={{
                                        width: `${item.examA / 100 * 100}%`
                                      }} />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                        {item.examA}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Delta Line */}
                                {item.delta !== 0 && <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">Change</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs font-bold ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {item.examB} → {item.examA}
                                      </span>
                                      <span className={`text-[10px] ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        ({item.delta > 0 ? "↑" : "↓"} {Math.abs(item.delta)} points)
                                      </span>
                                    </div>
                                  </div>}
                              </div>;
                      })}
                        </div>
                      </div>

                      {/* Comparison Insight */}
                      <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Insight:</span>{" "}
                          {(() => {
                        const improved = comparisonData.filter(d => d.delta > 0).length;
                        const declined = comparisonData.filter(d => d.delta < 0).length;
                        const avgDelta = Math.round(comparisonData.reduce((sum, d) => sum + d.delta, 0) / comparisonData.length);
                        if (avgDelta > 0) {
                          return `Overall improvement of +${avgDelta}% from ${examBLabel} to ${examALabel}. ${improved} subjects improved, ${declined} declined.`;
                        } else if (avgDelta < 0) {
                          return `Overall decline of ${avgDelta}% from ${examBLabel} to ${examALabel}. Focus on ${comparisonData.filter(d => d.delta < 0).map(d => shortenSubjectName(d.name)).join(", ")}.`;
                        }
                        return "Performance remained stable between the two periods.";
                      })()}
                        </p>
                      </div>
                    </>;
              })()}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Overview Report Dialog */}
      <Dialog open={overviewReportDialogOpen} onOpenChange={setOverviewReportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-12">
            <DialogTitle>Overview Report</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Generate CSV data for overview
                  const csvRows = [
                    ['Subject', 'Average', 'Highest', 'Lowest'],
                    ...subjectAverages.map(sub => [
                      sub.fullName,
                      sub.average.toFixed(1),
                      '100',
                      '0'
                    ])
                  ];
                  const csvContent = csvRows.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `overview-report-${selectedClass}-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (overviewReportRef.current) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Overview Report - Class ${selectedClass}</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                font-size: 10px; 
                                line-height: 1.4; 
                                color: #1a1a1a;
                                padding: 10px;
                              }
                              .report-header { 
                                display: flex !important; 
                                align-items: center !important; 
                                gap: 12px !important; 
                                margin-bottom: 15px !important; 
                                padding-bottom: 10px !important; 
                                border-bottom: 2px solid #3b82f6 !important; 
                              }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              .section-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
                              .stats-grid { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 6px !important; text-align: center !important; }
                              .stat-card { padding: 8px 4px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
                              .stat-value { font-size: 14px; font-weight: 700; color: #1a1a1a; }
                              .stat-label { font-size: 8px; color: #666; }
                              .subject-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
                              .subject-item { display: flex; justify-content: space-between; padding: 6px 10px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
                              .grade-grid { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 6px !important; }
                              .grade-card { text-align: center; padding: 8px 4px; border: 1px solid #ddd; border-radius: 6px; background: #fff; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>
                            ${overviewReportRef.current.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={overviewReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header */}
              <div className="report-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #3b82f6' }}>
                <img src={schoolLogo} alt="School Logo" className="school-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'left' }}>
                  <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>Class Overview Report</h1>
                  <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Class {selectedClass} - Academic Performance Overview</p>
                  <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0 0' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' • '}{selectedYear} {selectedPeriod === 'midYear' ? 'Mid-Year' : 'Year-End'} Examination
                  </p>
                </div>
              </div>

              {/* Summary Statistics Cards */}
              <div style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Average */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#dcfce7', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>📖</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>{classAverage}%</div>
                    <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600 }}>Class Average</div>
                    <div style={{ fontSize: '8px', color: '#166534', marginTop: '2px' }}>
                      {classAverage >= 80 ? 'Excellent' : classAverage >= 60 ? 'Above Average' : 'Needs Improvement'}
                    </div>
                  </div>
                  {/* Highest */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>🏆</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>{highestScore}%</div>
                    <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 600 }}>Highest Score</div>
                    <div style={{ fontSize: '8px', color: '#92400e', marginTop: '2px' }}>Top Student</div>
                  </div>
                  {/* Pass Rate */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#ccfbf1', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>📈</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0d9488' }}>{passRate}%</div>
                    <div style={{ fontSize: '10px', color: '#115e59', fontWeight: 600 }}>Pass Rate</div>
                    <div style={{ fontSize: '8px', color: '#115e59', marginTop: '2px' }}>
                      {passRate >= 90 ? 'Excellent' : passRate >= 70 ? 'Good' : 'Needs Focus'}
                    </div>
                  </div>
                  {/* Students */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>👥</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>{students.length}</div>
                    <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 600 }}>Students</div>
                    <div style={{ fontSize: '8px', color: '#1d4ed8', marginTop: '2px' }}>In Class</div>
                  </div>
                  {/* A Grade Rate */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#f3e8ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>🎯</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#9333ea' }}>{aGradeRate}%</div>
                    <div style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 600 }}>A Grade</div>
                    <div style={{ fontSize: '8px', color: '#6b21a8', marginTop: '2px' }}>Excellence Rate</div>
                  </div>
                  {/* Lowest */}
                  <div style={{ padding: '12px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>⚠️</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>{lowestScore}%</div>
                    <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 600 }}>Lowest Score</div>
                    <div style={{ fontSize: '8px', color: '#991b1b', marginTop: '2px' }}>Needs Support</div>
                  </div>
                </div>
              </div>

              {/* Subject Performance */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Subject Performance</h3>
                <div className="subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {subjectAverages.map((sub, idx) => (
                    <div key={sub.fullName} className="subject-item" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '6px 10px', 
                      backgroundColor: idx < 3 ? '#dcfce7' : idx >= subjectAverages.length - 3 ? '#fee2e2' : '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      <span style={{ fontWeight: 500 }}>{idx + 1}. {sub.fullName}</span>
                      <span style={{ fontWeight: 700, color: sub.average >= 80 ? '#22c55e' : sub.average >= 50 ? '#3b82f6' : '#ef4444' }}>{sub.average.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Grade Distribution</h3>
                <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {gradeDistribution.map(g => {
                    const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
                    const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                    return (
                      <div key={g.range} className="grade-card" style={{ textAlign: 'center', padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>{g.range}</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                        <div style={{ fontSize: '9px', color: '#666' }}>{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rising Subjects & At-Risk Subjects - Side by Side */}
              {(risingSubjects.length > 0 || fallingSubjects.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: risingSubjects.length > 0 && fallingSubjects.length > 0 ? 'repeat(2, 1fr)' : '1fr', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                  {/* Rising Subjects */}
                  {risingSubjects.length > 0 && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '1px solid #fde047' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#ca8a04', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⭐ Rising Subjects
                      </h4>
                      <p style={{ fontSize: '8px', color: '#a16207', marginBottom: '8px' }}>Top performing subjects</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {risingSubjects.slice(0, 3).map((item) => (
                          <div 
                            key={item.name}
                            style={{ 
                              padding: '8px 10px', 
                              borderRadius: '6px', 
                              background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                              border: '1px solid rgba(253, 224, 71, 0.6)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ fontSize: '9px', fontWeight: 600, color: '#713f12' }}>{shortenSubjectName(item.name)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a16207' }}>+{item.improvement}%</div>
                              <div style={{ fontSize: '7px', color: '#854d0e' }}>{item.first}%→{item.last}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* At-Risk Subjects */}
                  {fallingSubjects.length > 0 && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠️ At-Risk Subjects
                      </h4>
                      <p style={{ fontSize: '8px', color: '#b91c1c', marginBottom: '8px' }}>Needs extra attention</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {fallingSubjects.slice(0, 3).map((item) => (
                          <div 
                            key={item.name}
                            style={{ 
                              padding: '8px 10px', 
                              borderRadius: '6px', 
                              background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                              border: '1px solid rgba(252, 165, 165, 0.6)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ fontSize: '9px', fontWeight: 600, color: '#991b1b' }}>{shortenSubjectName(item.name)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>-{item.decline}%</div>
                              <div style={{ fontSize: '7px', color: '#b91c1c' }}>{item.first}%→{item.last}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Performers & At-Risk */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>Top Performers ({topPerformers.length})</h4>
                  {topPerformers.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #86efac40' }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                    </div>
                  ))}
                  {topPerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>At-Risk Students ({atRiskStudents.length})</h4>
                  {atRiskStudents.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fca5a540' }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                    </div>
                  ))}
                  {atRiskStudents.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="footer" style={{ textAlign: 'center', fontSize: '8px', color: '#666', marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                <p>This report was generated automatically by the School Management System</p>
                <p>© {new Date().getFullYear()} All Rights Reserved</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trends Report Dialog */}
      <Dialog open={trendsReportDialogOpen} onOpenChange={setTrendsReportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-12">
            <DialogTitle>Trends Report</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Generate CSV data for trends
                  const csvRows = [
                    ['Subject', 'Current Average', 'Change', 'Status'],
                    ...subjectAverages.map(sub => {
                      const rising = risingSubjects.find(r => r.name === sub.fullName);
                      const falling = fallingSubjects.find(f => f.name === sub.fullName);
                      const change = rising ? `+${rising.improvement}%` : falling ? `-${falling.decline}%` : '0%';
                      const status = rising ? 'Rising' : falling ? 'Falling' : 'Stable';
                      return [sub.fullName, sub.average.toFixed(1), change, status];
                    })
                  ];
                  const csvContent = csvRows.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `trends-report-${selectedClass}-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (trendsReportRef.current) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Trends Report - Class ${selectedClass}</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                font-size: 10px; 
                                line-height: 1.4; 
                                color: #1a1a1a;
                                padding: 10px;
                              }
                              .report-header { 
                                display: flex !important; 
                                align-items: center !important; 
                                gap: 12px !important; 
                                margin-bottom: 15px !important; 
                                padding-bottom: 10px !important; 
                                border-bottom: 2px solid #22c55e !important; 
                              }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              .section-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
                              .trend-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                              .trend-card { padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #fff; }
                              .subject-row { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
                              .heatmap-row { display: flex; gap: 4px; margin-bottom: 4px; }
                              .heatmap-cell { width: 40px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; border-radius: 3px; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>
                            ${trendsReportRef.current.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={trendsReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header */}
              <div className="report-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #22c55e' }}>
                <img src={schoolLogo} alt="School Logo" className="school-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'left' }}>
                  <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>Performance Trends Report</h1>
                  <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Class {selectedClass} - Historical Performance Analysis</p>
                  <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0 0' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' • '}Period: {trendPeriod === '1year' ? 'Last 1 Year' : trendPeriod === '2years' ? 'Last 2 Years' : trendPeriod === '3years' ? 'Last 3 Years' : trendPeriod === '4years' ? 'Last 4 Years' : trendPeriod === '5years' ? 'Last 5 Years' : 'Last 6 Years'}
                  </p>
                </div>
              </div>

              {/* Current Performance Summary */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Current Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: trendDirection.direction === 'up' ? '#dcfce7' : trendDirection.direction === 'down' ? '#fee2e2' : '#f3f4f6', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>{trendDirection.currentValue}%</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{trendsSelectedSubjects.length === subjects.length ? 'Class Average' : `${trendsSelectedSubjects.length} Subject${trendsSelectedSubjects.length > 1 ? 's' : ''}`}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#6b7280', marginTop: '4px' }}>
                      {trendDirection.direction === 'up' ? '↑' : trendDirection.direction === 'down' ? '↓' : '→'} {trendDirection.change}%
                    </div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{risingSubjects.length}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>Rising Subjects</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{fallingSubjects.length}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>Needs Focus</div>
                  </div>
                </div>
              </div>

              {/* Performance Trend Chart (SVG for print) */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Performance Trend</h3>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <svg width="100%" height="120" viewBox="0 0 500 120" preserveAspectRatio="xMidYMid meet">
                    {/* Background grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="40" y1="50" x2="480" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    <line x1="40" y1="100" x2="480" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                    {/* Y-axis labels */}
                    <text x="35" y="24" fontSize="8" fill="#6b7280" textAnchor="end">100</text>
                    <text x="35" y="54" fontSize="8" fill="#6b7280" textAnchor="end">80</text>
                    <text x="35" y="84" fontSize="8" fill="#f59e0b" textAnchor="end">50</text>
                    <text x="35" y="104" fontSize="8" fill="#6b7280" textAnchor="end">30</text>
                    {/* Area fill */}
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {/* Draw trend line and area */}
                    {trendData.length > 0 && (
                      <>
                        <path
                          d={`M ${trendData.map((d, i) => {
                            const x = 40 + (i / (trendData.length - 1 || 1)) * 440;
                            const avg = typeof d.Average === 'number' ? d.Average : 0;
                            const y = 100 - ((avg - 30) / 70) * 80;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')} L ${40 + 440} 100 L 40 100 Z`}
                          fill="url(#trendGradient)"
                        />
                        <path
                          d={trendData.map((d, i) => {
                            const x = 40 + (i / (trendData.length - 1 || 1)) * 440;
                            const avg = typeof d.Average === 'number' ? d.Average : 0;
                            const y = 100 - ((avg - 30) / 70) * 80;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'}
                          strokeWidth="2.5"
                        />
                        {/* Data points */}
                        {trendData.map((d, i) => {
                          const x = 40 + (i / (trendData.length - 1 || 1)) * 440;
                          const avg = typeof d.Average === 'number' ? d.Average : 0;
                          const y = 100 - ((avg - 30) / 70) * 80;
                          const periodStr = typeof d.period === 'string' ? d.period : String(d.period);
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="4" fill={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} />
                              <text x={x} y={y - 8} fontSize="8" fill="#374151" textAnchor="middle" fontWeight="600">{avg}%</text>
                              <text x={x} y="115" fontSize="7" fill="#6b7280" textAnchor="middle">{periodStr.split(' ')[0]}</text>
                            </g>
                          );
                        })}
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* Rising Subjects & At-Risk Subjects - Side by Side */}
              {(risingSubjects.length > 0 || fallingSubjects.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: risingSubjects.length > 0 && fallingSubjects.length > 0 ? 'repeat(2, 1fr)' : '1fr', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                  {/* Rising Subjects */}
                  {risingSubjects.length > 0 && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '1px solid #fde047' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#ca8a04', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⭐ Rising Subjects
                      </h4>
                      <p style={{ fontSize: '8px', color: '#a16207', marginBottom: '8px' }}>Top performing subjects</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {risingSubjects.slice(0, 3).map((item) => (
                          <div 
                            key={item.name}
                            style={{ 
                              padding: '8px 10px', 
                              borderRadius: '6px', 
                              background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                              border: '1px solid rgba(253, 224, 71, 0.6)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ fontSize: '9px', fontWeight: 600, color: '#713f12' }}>{shortenSubjectName(item.name)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a16207' }}>+{item.improvement}%</div>
                              <div style={{ fontSize: '7px', color: '#854d0e' }}>{item.first}%→{item.last}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* At-Risk Subjects */}
                  {fallingSubjects.length > 0 && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠️ At-Risk Subjects
                      </h4>
                      <p style={{ fontSize: '8px', color: '#b91c1c', marginBottom: '8px' }}>Needs extra attention</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {fallingSubjects.slice(0, 3).map((item) => (
                          <div 
                            key={item.name}
                            style={{ 
                              padding: '8px 10px', 
                              borderRadius: '6px', 
                              background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                              border: '1px solid rgba(252, 165, 165, 0.6)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ fontSize: '9px', fontWeight: 600, color: '#991b1b' }}>{shortenSubjectName(item.name)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>-{item.decline}%</div>
                              <div style={{ fontSize: '7px', color: '#b91c1c' }}>{item.first}%→{item.last}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Historical Data Table */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Historical Performance Data</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Period</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{item.period}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 600 }}>{item.Average}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Strengths Profile Radar Chart (SVG for print) */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Strengths Profile</h3>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <svg width="240" height="200" viewBox="0 0 240 200" style={{ margin: '0 auto', display: 'block' }}>
                    {/* Radar background circles */}
                    {[100, 80, 60, 40, 20].map((r, i) => (
                      <circle key={i} cx="120" cy="100" r={r * 0.7} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    ))}
                    {/* Axis lines */}
                    {radarData.slice(0, 6).map((_, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const x2 = 120 + 70 * Math.cos(angle);
                      const y2 = 100 + 70 * Math.sin(angle);
                      return <line key={i} x1="120" y1="100" x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth="1" />;
                    })}
                    {/* Radar polygon */}
                    <polygon
                      points={radarData.slice(0, 6).map((d, i) => {
                        const angle = (i * 60 - 90) * (Math.PI / 180);
                        const r = (d.score / 100) * 70;
                        const x = 120 + r * Math.cos(angle);
                        const y = 100 + r * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'}
                      fillOpacity="0.3"
                      stroke={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="2"
                    />
                    {/* Data points and labels */}
                    {radarData.slice(0, 6).map((d, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const r = (d.score / 100) * 70;
                      const x = 120 + r * Math.cos(angle);
                      const y = 100 + r * Math.sin(angle);
                      const labelR = 85;
                      const labelX = 120 + labelR * Math.cos(angle);
                      const labelY = 100 + labelR * Math.sin(angle);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="3" fill={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'} />
                          <text x={labelX} y={labelY} fontSize="8" fill="#374151" textAnchor="middle" dominantBaseline="middle">
                            {d.subject}
                          </text>
                          <text x={x} y={y - 8} fontSize="7" fill="#6b7280" textAnchor="middle">{d.score}%</text>
                        </g>
                      );
                    })}
                  </svg>
                  <p style={{ fontSize: '9px', color: '#666', marginTop: '8px' }}>Visual snapshot of performance across subjects</p>
                </div>
              </div>

              {/* Class vs Cohort Average Bar Chart (SVG for print) */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Class VS Cohort Average</h3>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <svg width="100%" height="160" viewBox="0 0 500 160" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    <line x1="80" y1="20" x2="80" y2="130" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="80" y1="130" x2="480" y2="130" stroke="#e5e7eb" strokeWidth="1" />
                    {/* Y-axis labels */}
                    <text x="75" y="25" fontSize="8" fill="#6b7280" textAnchor="end">100%</text>
                    <text x="75" y="77" fontSize="8" fill="#6b7280" textAnchor="end">50%</text>
                    <text x="75" y="130" fontSize="8" fill="#6b7280" textAnchor="end">0%</text>
                    {/* Bars and dots */}
                    {subjectVsCohortData.slice(0, 6).map((item, i) => {
                      const barWidth = 35;
                      const groupWidth = 60;
                      const x = 90 + i * groupWidth;
                      const classHeight = (item.classScore / 100) * 110;
                      const cohortY = 130 - (item.cohortAvg / 100) * 110;
                      return (
                        <g key={i}>
                          {/* Class bar */}
                          <rect x={x} y={130 - classHeight} width={barWidth} height={classHeight} fill="#3b82f6" rx="2" />
                          <text x={x + barWidth/2} y={125 - classHeight} fontSize="7" fill="#3b82f6" textAnchor="middle" fontWeight="600">{item.classScore}%</text>
                          {/* Cohort dot */}
                          <circle cx={x + barWidth/2} cy={cohortY} r="4" fill="#374151" stroke="#fff" strokeWidth="1" />
                          {/* Subject label */}
                          <text x={x + barWidth/2} y="145" fontSize="8" fill="#374151" textAnchor="middle">{item.name}</text>
                          {/* Delta badge */}
                          <text x={x + barWidth/2} y="155" fontSize="7" fill={item.delta >= 0 ? '#22c55e' : '#ef4444'} textAnchor="middle" fontWeight="600">
                            {item.delta >= 0 ? '+' : ''}{item.delta}%
                          </text>
                        </g>
                      );
                    })}
                    {/* Legend */}
                    <rect x="370" y="10" width="12" height="8" fill="#3b82f6" rx="1" />
                    <text x="385" y="17" fontSize="8" fill="#374151">Class</text>
                    <circle cx="436" cy="14" r="4" fill="#374151" />
                    <text x="445" y="17" fontSize="8" fill="#374151">Cohort</text>
                  </svg>
                </div>
              </div>

              {/* Performance Heatmap */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Performance Heatmap</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '4px 6px', borderBottom: '1px solid #ddd', textAlign: 'left', minWidth: '80px' }}>Subject</th>
                        {heatmapData[0]?.scores.map(s => (
                          <th key={s.period} style={{ padding: '4px 6px', borderBottom: '1px solid #ddd', textAlign: 'center', minWidth: '40px' }}>{s.period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map((row, idx) => (
                        <tr key={row.subject} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee', fontWeight: 500 }}>{row.fullName}</td>
                          {row.scores.map((cell, cellIdx) => (
                            <td 
                              key={cellIdx} 
                              style={{ 
                                padding: '4px 6px', 
                                borderBottom: '1px solid #eee', 
                                textAlign: 'center',
                                fontWeight: 600,
                                color: cell.score ? (cell.score >= 80 ? '#22c55e' : cell.score >= 50 ? '#3b82f6' : '#ef4444') : '#999'
                              }}
                            >
                              {cell.score ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insight */}
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#f3f4f6', border: '1px solid #ddd', marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', color: '#1a1a1a' }}>
                  <strong>Insight:</strong>{' '}
                  {risingSubjects.length > 0 && <>{risingSubjects[0].name} shows great improvement (+{risingSubjects[0].improvement}%). </>}
                  {fallingSubjects.length > 0 && <>Focus more on {fallingSubjects[0].name} which dropped {fallingSubjects[0].decline}%. </>}
                  {risingSubjects.length === 0 && fallingSubjects.length === 0 && <>Performance is stable across all subjects for Class {selectedClass}.</>}
                </p>
              </div>

              {/* Footer */}
              <div className="footer" style={{ textAlign: 'center', fontSize: '8px', color: '#666', marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                <p>This report was generated automatically by the School Management System</p>
                <p>© {new Date().getFullYear()} All Rights Reserved</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Report Dialog */}
      <Dialog open={comparisonReportDialogOpen} onOpenChange={setComparisonReportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-12">
            <DialogTitle>Comparison Report</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Generate CSV data for comparison - we'll build it dynamically
                  const examAKey = `${examAYear}-${examAPeriod}`;
                  const examBKey = `${examBYear}-${examBPeriod}`;
                  const subjectDataA = subjectExamData[examAClass as keyof typeof subjectExamData]?.[examAKey];
                  const subjectDataB = subjectExamData[examBClass as keyof typeof subjectExamData]?.[examBKey];
                  
                  const getExamLabelForCSV = (cls: string, year: string, period: string) => {
                    const periodLabel = period === "midYear" ? "Mid-Year" : "Year-End";
                    return `${cls} ${periodLabel} ${year}`;
                  };
                  
                  const examALabel = getExamLabelForCSV(examAClass, examAYear, examAPeriod);
                  const examBLabel = getExamLabelForCSV(examBClass, examBYear, examBPeriod);
                  
                  if (subjectDataA && subjectDataB) {
                    const compData = compareSubjects.map(subjectName => {
                      const scoreA = subjectDataA[subjectName] ?? 0;
                      const scoreB = subjectDataB[subjectName] ?? 0;
                      const delta = scoreA - scoreB;
                      return { name: subjectName, examA: scoreA, examB: scoreB, delta };
                    });
                    
                    const csvRows = [
                      ['Subject', examALabel, examBLabel, 'Change'],
                      ...compData.map(d => [
                        d.name,
                        d.examA.toString(),
                        d.examB.toString(),
                        (d.delta >= 0 ? '+' : '') + d.delta.toString()
                      ])
                    ];
                    const csvContent = csvRows.map(row => row.join(',')).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `comparison-report-${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (comparisonReportRef.current) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Comparison Report</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                font-size: 10px; 
                                line-height: 1.4; 
                                color: #1a1a1a;
                                padding: 10px;
                              }
                              .report-header { 
                                display: flex !important; 
                                align-items: center !important; 
                                gap: 12px !important; 
                                margin-bottom: 15px !important; 
                                padding-bottom: 10px !important; 
                                border-bottom: 2px solid #8b5cf6 !important; 
                              }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              .section-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
                              .comparison-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                              .comparison-box { padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                              .comparison-box.blue { border-color: #3b82f6; background: #eff6ff; }
                              .comparison-box.red { border-color: #ef4444; background: #fef2f2; }
                              table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
                              th, td { padding: 5px 8px !important; border-bottom: 1px solid #ddd !important; }
                              th { background: #f5f5f5 !important; font-weight: 600 !important; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>
                            ${comparisonReportRef.current.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={comparisonReportRef}>
            {(() => {
              const examAKey = `${examAYear}-${examAPeriod}`;
              const examBKey = `${examBYear}-${examBPeriod}`;
              const subjectDataA = subjectExamData[examAClass as keyof typeof subjectExamData]?.[examAKey];
              const subjectDataB = subjectExamData[examBClass as keyof typeof subjectExamData]?.[examBKey];
              
              const getExamLabelForReport = (cls: string, year: string, period: string) => {
                const periodLabel = period === "midYear" ? "Mid-Year" : "Year-End";
                return `${cls} ${periodLabel} ${year}`;
              };
              
              const examALabel = getExamLabelForReport(examAClass, examAYear, examAPeriod);
              const examBLabel = getExamLabelForReport(examBClass, examBYear, examBPeriod);
              
              if (!subjectDataA || !subjectDataB) {
                return (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No data available for the selected exam periods</p>
                  </div>
                );
              }
              
              const comparisonData = compareSubjects.map(subjectName => {
                const scoreA = subjectDataA[subjectName] ?? 0;
                const scoreB = subjectDataB[subjectName] ?? 0;
                const delta = scoreA - scoreB;
                return { name: subjectName, examA: scoreA, examB: scoreB, delta, improved: delta > 0 };
              });
              
              const avgA = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length) : 0;
              const avgB = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length) : 0;
              const avgDelta = avgA - avgB;
              const improved = comparisonData.filter(d => d.delta > 0).length;
              const declined = comparisonData.filter(d => d.delta < 0).length;
              const unchanged = comparisonData.filter(d => d.delta === 0).length;
              
              return (
                <div className="space-y-4 p-2">
                  {/* Report Header */}
                  <div className="report-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #8b5cf6' }}>
                    <img src={schoolLogo} alt="School Logo" className="school-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left' }}>
                      <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>Exam Comparison Report</h1>
                      <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>{examALabel} vs {examBLabel}</p>
                      <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0 0' }}>
                        Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Summary Comparison */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Summary Comparison</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#1d4ed8' }}>Exam A</span>
                        </div>
                        <p style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>{examALabel}</p>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{avgA}%</div>
                        <p style={{ fontSize: '9px', color: '#666' }}>Average Score</p>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626' }}>Exam B</span>
                        </div>
                        <p style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>{examBLabel}</p>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{avgB}%</div>
                        <p style={{ fontSize: '9px', color: '#666' }}>Average Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Change Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: avgDelta > 0 ? '#dcfce7' : avgDelta < 0 ? '#fee2e2' : '#f3f4f6', border: '1px solid #ddd', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: avgDelta > 0 ? '#22c55e' : avgDelta < 0 ? '#ef4444' : '#6b7280' }}>
                        {avgDelta > 0 ? '+' : ''}{avgDelta}%
                      </div>
                      <div style={{ fontSize: '8px', color: '#666' }}>Overall Change</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{improved}</div>
                      <div style={{ fontSize: '8px', color: '#666' }}>Improved</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{declined}</div>
                      <div style={{ fontSize: '8px', color: '#666' }}>Declined</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#f3f4f6', border: '1px solid #ddd', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#6b7280' }}>{unchanged}</div>
                      <div style={{ fontSize: '8px', color: '#666' }}>Unchanged</div>
                    </div>
                  </div>

                  {/* Subject-by-Subject Comparison */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Subject Comparison</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Subject</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Exam A</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Exam B</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, idx) => (
                          <tr key={item.name} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.examA}%</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.examB}%</td>
                            <td style={{ 
                              padding: '5px 8px', 
                              borderBottom: '1px solid #eee', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              color: item.delta > 0 ? '#22c55e' : item.delta < 0 ? '#ef4444' : '#6b7280'
                            }}>
                              {item.delta > 0 ? '+' : ''}{item.delta}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Insight */}
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#f3f4f6', border: '1px solid #ddd', marginBottom: '12px' }}>
                    <p style={{ fontSize: '10px', color: '#1a1a1a' }}>
                      <strong>Insight:</strong>{' '}
                      {avgDelta > 0 
                        ? `Overall improvement of +${avgDelta}% from ${examBLabel} to ${examALabel}. ${improved} subjects improved, ${declined} declined.`
                        : avgDelta < 0 
                          ? `Overall decline of ${avgDelta}% from ${examBLabel} to ${examALabel}. Focus needed on declining subjects.`
                          : 'Performance remained stable between the two periods.'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="footer" style={{ textAlign: 'center', fontSize: '8px', color: '#666', marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                    <p>This report was generated automatically by the School Management System</p>
                    <p>© {new Date().getFullYear()} All Rights Reserved</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>;
}

// Subject colors for charts
const SUBJECT_COLORS = ["#8b5cf6",
// violet
"#06b6d4",
// cyan
"#10b981",
// emerald
"#f59e0b",
// amber
"#ef4444",
// red
"#ec4899" // pink
];

// Grade colors for charts
const GRADE_COLORS: Record<string, string> = {
  "A*": "#059669",
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#ef4444"
};