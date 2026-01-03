import { useState, useMemo, useRef, useCallback } from "react";
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
import { Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Users, Target, Award, AlertTriangle, BookOpen, BarChart3, FileText, CheckCircle, XCircle, Lightbulb, Copy, Printer, ArrowRight, ArrowUpRight, ArrowDownRight, Scale, Download, FileSpreadsheet, Check, Calendar, UserCheck, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, classGrades, detailedClassGrades, yearOverYearData, categoryYearOverYear, examComparisonData, ExamData, subjectYearlyData, multiClassTrendData, subjectExamData } from "@/data/teacherMockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
import { allSubjects, getShortSubjectName, subjectGroups } from "@/data/subjectsConfig";
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
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([teacherProfile.classes[0]]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [studentGrades, setStudentGrades] = useState<Record<string, Record<string, StudentGrades>>>({});
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
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

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
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = currentDistance / lastTouchDistance.current;
      setChartZoom(prev => Math.min(3, Math.max(0.5, prev * scale)));
      lastTouchDistance.current = currentDistance;
    }
  }, []);
  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
  }, []);
  const resetZoom = useCallback(() => {
    setChartZoom(1);
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
  const getStudentSubjectGrades = (studentId: string, subject: string): StudentGrades => {
    return studentGrades[studentId]?.[subject] || {
      attitude: "",
      homework: "",
      quiz: "",
      exam: "",
      comment: "",
      reportComment: ""
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
      .filter((s): s is { id: string; name: string; photo: null; score: number } => s !== null)
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
      .filter((s): s is { id: string; name: string; photo: null; score: number } => s !== null)
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

  // Calculate trend direction for selected subject(s)
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return {
      direction: "stable" as const,
      change: 0,
      currentValue: 0
    };
    const key = subjectFilter === "all" ? "Average" : subjectFilter;
    const firstValue = trendData[0]?.[key] as number | null;
    const lastValue = trendData[trendData.length - 1]?.[key] as number | null;
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
  }, [trendData, subjectFilter]);

  // Rising subjects - biggest improvement from first to last period (filtered by selectedSubjects)
  const risingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    // Get all subject keys from trendData (excluding 'period' and 'Average')
    const firstEntry = trendData[0];
    const subjectNames = Object.keys(firstEntry).filter(k => k !== 'period' && k !== 'Average');
    return subjectNames.filter(name => selectedSubjects.includes(name)).map(name => {
      const first = (trendData[0]?.[name] as number) ?? 0;
      const last = (trendData[trendData.length - 1]?.[name] as number) ?? 0;
      return {
        name,
        first,
        last,
        improvement: last - first
      };
    }).filter(s => s.improvement > 0).sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, [trendData, selectedSubjects]);

  // Falling subjects - biggest decline (filtered by selectedSubjects)
  const fallingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    const firstEntry = trendData[0];
    const subjectNames = Object.keys(firstEntry).filter(k => k !== 'period' && k !== 'Average');
    return subjectNames.filter(name => selectedSubjects.includes(name)).map(name => {
      const first = (trendData[0]?.[name] as number) ?? 0;
      const last = (trendData[trendData.length - 1]?.[name] as number) ?? 0;
      return {
        name,
        first,
        last,
        decline: first - last
      };
    }).filter(s => s.decline > 0).sort((a, b) => b.decline - a.decline).slice(0, 3);
  }, [trendData, selectedSubjects]);

  // Radar chart data for subject strengths (filtered by selectedSubjects)
  const radarData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const latest = data[data.length - 1];
    
    // Build radar data from all subjects in the data
    const allSubjects: { name: string; subject: string; score: number; fullMark: number }[] = [];
    Object.entries(latest).forEach(([key, value]) => {
      if (key !== 'year' && typeof value === 'number') {
        // Create short name
        const shortName = getShortSubjectName(key);
        allSubjects.push({
          name: key,
          subject: shortName.length > 8 ? shortName.substring(0, 8) : shortName,
          score: value,
          fullMark: 100
        });
      }
    });
    return allSubjects.filter(s => selectedSubjects.includes(s.name));
  }, [selectedClass, selectedSubjects]);

  // Radar average for color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map(d => d.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [radarData]);

  // Subject vs School Average data
  const subjectVsSchoolData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const latest = data[data.length - 1];
    const schoolAvg = 72; // Mock school average
    
    // Build from all subjects in latest data
    const allSubjects: { name: string; fullName: string; classScore: number; schoolAvg: number; delta: number }[] = [];
    Object.entries(latest).forEach(([key, value]) => {
      if (key !== 'year' && typeof value === 'number') {
        const shortName = getShortSubjectName(key);
        allSubjects.push({
          name: shortName.length > 8 ? shortName.substring(0, 8) : shortName,
          fullName: key,
          classScore: value,
          schoolAvg,
          delta: value - schoolAvg
        });
      }
    });
    return allSubjects.filter(s => selectedSubjects.includes(s.fullName)).sort((a, b) => b.delta - a.delta);
  }, [selectedClass, selectedSubjects]);

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
      <AppHeader showBack leftContent={<div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-12 w-auto -my-2 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>} />

      <div className="px-4 mt-4 pb-4">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
            <TabsTrigger value="entry">Grade Entry</TabsTrigger>
            <TabsTrigger value="analysis">Class Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            {/* Class & Student Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClass} onValueChange={v => {
              setSelectedClass(v);
              setSelectedStudent(null);
            }}>
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedStudent || ""} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && selectedStudentData ? <>
                {/* Student Header */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <p className="font-semibold text-foreground">{selectedStudentData.name}</p>
                    <p className="text-sm text-muted-foreground">Class {selectedClass}</p>
                  </CardContent>
                </Card>

                {/* Category Selector */}
                <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                  {[
                    { key: "grades", label: "Grades", icon: BookOpen },
                    { key: "behavior", label: "Behavior", icon: UserCheck },
                    { key: "awards", label: "Awards", icon: Award }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setEntryCategory(key as "grades" | "behavior" | "awards")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                        entryCategory === key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Grades Entry */}
                {entryCategory === "grades" && (
                  <div className="space-y-3">
                    {subjects.map(subject => {
                      const isExpanded = expandedSubjects.includes(subject);
                      const grades = getStudentSubjectGrades(selectedStudent, subject);
                      const total = calculateTotal(grades);
                      const { grade: letterGrade, color: gradeColor } = getLetterGrade(total);
                      const hasData = Object.values(grades).some(v => v !== "");
                      return (
                        <Collapsible key={subject} open={isExpanded} onOpenChange={() => toggleSubject(subject)}>
                          <Card className={cn("overflow-hidden transition-colors", isExpanded ? "border-primary/50" : "")}>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-sm font-semibold text-primary">
                                      {subject}
                                    </CardTitle>
                                    {hasData && !isExpanded && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                          Total: {total}
                                        </span>
                                        <Badge className={cn("text-xs px-2 py-0", gradeColor)}>
                                          {letterGrade}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="p-3 pt-0 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  {gradeCategories.map(cat => (
                                    <div key={cat.key} className="space-y-1">
                                      <label className="text-xs font-medium text-muted-foreground uppercase">
                                        {cat.label} ({cat.max})
                                      </label>
                                      <Input 
                                        type="number" 
                                        min="0" 
                                        max={cat.max} 
                                        placeholder="0" 
                                        value={grades[cat.key as keyof StudentGrades] || ""} 
                                        onChange={e => updateGrade(selectedStudent, subject, cat.key as keyof StudentGrades, e.target.value)} 
                                        className="text-center h-10" 
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total</p>
                                      <p className="text-xl font-bold text-foreground">{total}</p>
                                    </div>
                                  </div>
                                  <Badge className={cn("text-lg px-4 py-1 font-bold", gradeColor)}>
                                    {letterGrade}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <Textarea 
                                    placeholder="Performance comment (e.g., Outstanding performance in Arts)" 
                                    value={grades.comment} 
                                    onChange={e => updateGrade(selectedStudent, subject, "comment", e.target.value)} 
                                    className={cn("min-h-[60px] text-sm resize-none", total >= 80 ? "border-emerald-200 bg-emerald-50/50" : total < 50 ? "border-red-200 bg-red-50/50" : "")} 
                                  />
                                  <Textarea 
                                    placeholder="Report card comments..." 
                                    value={grades.reportComment} 
                                    onChange={e => updateGrade(selectedStudent, subject, "reportComment", e.target.value)} 
                                    className="min-h-[60px] text-sm resize-none" 
                                  />
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}

                {/* Behavior Entry */}
                {entryCategory === "behavior" && (
                  <div className="space-y-4">
                    {/* Behavioral Traits Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {behaviorTraits.map(trait => {
                        const behavior = getStudentBehavior(selectedStudent);
                        const currentGrade = behavior[trait.key as keyof typeof behavior] as string || "";
                        return (
                          <Card key={trait.key} className={cn("overflow-hidden", trait.bgColor, trait.borderColor)}>
                            <CardContent className="p-3">
                              <label className={cn("text-xs font-semibold uppercase block mb-2", trait.textColor)}>
                                {trait.label}
                              </label>
                              <Select 
                                value={currentGrade} 
                                onValueChange={(v) => updateBehavior(selectedStudent, trait.key, v)}
                              >
                                <SelectTrigger className={cn("h-10 bg-background/80", trait.borderColor)}>
                                  <SelectValue placeholder="Grade">
                                    {currentGrade && (
                                      <Badge className={cn("font-bold", getGradeColor(currentGrade))}>
                                        {currentGrade}
                                      </Badge>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {gradeOptions.map(grade => (
                                    <SelectItem key={grade} value={grade}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={cn("font-bold", getGradeColor(grade))}>
                                          {grade}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Comment Sections */}
                    <Card className="bg-rose-50 border-rose-200">
                      <CardContent className="p-3">
                        <label className="text-xs font-semibold uppercase block mb-2 text-rose-700">
                          Homeroom Teacher Comment
                        </label>
                        <Textarea
                          placeholder="Enter homeroom teacher comment..."
                          value={getStudentBehavior(selectedStudent).homeroomComment}
                          onChange={(e) => updateBehavior(selectedStudent, "homeroomComment", e.target.value)}
                          className="min-h-[80px] text-sm resize-none bg-background/80 border-rose-200"
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-3">
                        <label className="text-xs font-semibold uppercase block mb-2 text-purple-700">
                          Responsibility Comment
                        </label>
                        <Textarea
                          placeholder="Enter responsibility comment..."
                          value={getStudentBehavior(selectedStudent).responsibilityComment}
                          onChange={(e) => updateBehavior(selectedStudent, "responsibilityComment", e.target.value)}
                          className="min-h-[80px] text-sm resize-none bg-background/80 border-purple-200"
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Awards Entry */}
                {entryCategory === "awards" && (
                  <div className="space-y-3">
                    {/* Sports House */}
                    <Card className="bg-amber-50 border-amber-200 overflow-hidden">
                      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)' }}>
                        <CardTitle className="text-sm font-semibold text-amber-800">Sports House</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => addAwardEntry(selectedStudent, "sportsHouse")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {getStudentAwards(selectedStudent).sportsHouse.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No entries. Click "Add" to add one.</p>
                        ) : (
                          getStudentAwards(selectedStudent).sportsHouse.map((entry, index) => (
                            <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Organization</label>
                                <Select 
                                  value={entry.organization} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "sportsHouse", entry.id, "organization", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {sportsHouseOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Role</label>
                                <Select 
                                  value={entry.role} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "sportsHouse", entry.id, "role", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {roleOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-500 hover:bg-red-100"
                                onClick={() => removeAwardEntry(selectedStudent, "sportsHouse", entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Club */}
                    <Card className="bg-amber-50 border-amber-200 overflow-hidden">
                      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)' }}>
                        <CardTitle className="text-sm font-semibold text-amber-800">Club</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => addAwardEntry(selectedStudent, "clubs")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {getStudentAwards(selectedStudent).clubs.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No entries. Click "Add" to add one.</p>
                        ) : (
                          getStudentAwards(selectedStudent).clubs.map((entry, index) => (
                            <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Organization</label>
                                <Select 
                                  value={entry.organization} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "clubs", entry.id, "organization", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {clubOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Role</label>
                                <Select 
                                  value={entry.role} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "clubs", entry.id, "role", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {roleOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-500 hover:bg-red-100"
                                onClick={() => removeAwardEntry(selectedStudent, "clubs", entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Student Leadership */}
                    <Card className="bg-amber-50 border-amber-200 overflow-hidden">
                      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)' }}>
                        <CardTitle className="text-sm font-semibold text-amber-800">Student Leadership</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => addAwardEntry(selectedStudent, "leadership")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {getStudentAwards(selectedStudent).leadership.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No entries. Click "Add" to add one.</p>
                        ) : (
                          getStudentAwards(selectedStudent).leadership.map((entry, index) => (
                            <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Organization</label>
                                <Select 
                                  value={entry.organization} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "leadership", entry.id, "organization", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {leadershipOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Role</label>
                                <Select 
                                  value={entry.role} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "leadership", entry.id, "role", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {roleOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-500 hover:bg-red-100"
                                onClick={() => removeAwardEntry(selectedStudent, "leadership", entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Events */}
                    <Card className="bg-amber-50 border-amber-200 overflow-hidden">
                      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)' }}>
                        <CardTitle className="text-sm font-semibold text-amber-800">Events</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => addAwardEntry(selectedStudent, "events")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {getStudentAwards(selectedStudent).events.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No entries. Click "Add" to add one.</p>
                        ) : (
                          getStudentAwards(selectedStudent).events.map((entry, index) => (
                            <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Event</label>
                                <Select 
                                  value={entry.organization} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "events", entry.id, "organization", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {eventsOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Role</label>
                                <Select 
                                  value={entry.role} 
                                  onValueChange={(v) => updateAwardEntry(selectedStudent, "events", entry.id, "role", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {roleOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-500 hover:bg-red-100"
                                onClick={() => removeAwardEntry(selectedStudent, "events", entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Achievements */}
                    <Card className="bg-amber-50 border-amber-200 overflow-hidden">
                      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)' }}>
                        <CardTitle className="text-sm font-semibold text-amber-800">Achievements</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-800 hover:bg-amber-200/50"
                          onClick={() => addAchievementEntry(selectedStudent)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {getStudentAwards(selectedStudent).achievements.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No entries. Click "Add" to add one.</p>
                        ) : (
                          getStudentAwards(selectedStudent).achievements.map((entry, index) => (
                            <div key={entry.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Event</label>
                                <Select 
                                  value={entry.event} 
                                  onValueChange={(v) => updateAchievementEntry(selectedStudent, entry.id, "event", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {achievementEventOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-amber-700 font-medium">Award</label>
                                <Select 
                                  value={entry.award} 
                                  onValueChange={(v) => updateAchievementEntry(selectedStudent, entry.id, "award", v)}
                                >
                                  <SelectTrigger className="bg-background/80 border-amber-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {achievementAwardOptions.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-red-500 hover:bg-red-100"
                                onClick={() => removeAchievementEntry(selectedStudent, entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Button className="w-full" size="lg" onClick={handleSaveGrades}>
                  <Save className="h-4 w-4 mr-2" />
                  {entryCategory === "grades" && "Save All Grades"}
                  {entryCategory === "behavior" && "Save Behavior"}
                  {entryCategory === "awards" && "Save Awards"}
                </Button>
              </> : <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Select a student to enter data</p>
                </CardContent>
              </Card>}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Sub-tabs for Class Analysis */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs">Bands</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
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

                {/* Subject Performance Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div style={{ height: `${Math.max(176, subjectAverages.length * 40)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectAverages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} />
                        <YAxis type="category" dataKey="name" tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} width={80} />
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
                {/* Comparison Mode Toggle + Download Button */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Compare Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setBandsReportDialogOpen(true)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span className="text-xs">Report</span>
                    </Button>
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
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bandsComparisonChartData} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="grade" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
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
                              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>{bandsRankedStudents.length}</div>
                                  <div style={{ fontSize: '9px', color: '#666' }}>Total Students</div>
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
                                {/* Full student list for Selection A */}
                                <div className="student-section" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #3b82f640' }}>
                                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#1d4ed8', marginBottom: '4px' }}>All Students:</div>
                                  <div className="student-list">
                                    {bandsRankedStudents.map((s, i) => (
                                      <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: '1px solid #3b82f620' }}>
                                        <span>{i + 1}. {s.name}</span>
                                        <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                      </div>
                                    ))}
                                  </div>
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
                                {/* Full student list for Selection B */}
                                <div className="student-section" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f59e0b40' }}>
                                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#b45309', marginBottom: '4px' }}>All Students:</div>
                                  <div className="student-list">
                                    {bandsCompareRankedStudents.map((s, i) => (
                                      <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '8px', borderBottom: '1px solid #f59e0b20' }}>
                                        <span>{i + 1}. {s.name}</span>
                                        <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                      </div>
                                    ))}
                                  </div>
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
                                  <tr>
                                    <td style={{ padding: '4px 6px' }}>At-Risk (D/E)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsAtRiskStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsCompareAtRiskStudents.length}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: bandsAtRiskStudents.length < bandsCompareAtRiskStudents.length ? '#059669' : bandsAtRiskStudents.length > bandsCompareAtRiskStudents.length ? '#dc2626' : '#1a1a1a' }}>
                                      {bandsAtRiskStudents.length > bandsCompareAtRiskStudents.length ? "+" : ""}{bandsAtRiskStudents.length - bandsCompareAtRiskStudents.length}
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
                        {subjectFilter === "all" ? `Class ${selectedClass} Average` : subjectFilter}
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
                    key: "all",
                    label: "All"
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

                {/* Subject Filter - Standardized Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Subjects:</span>
                    <div className="flex gap-2">
                      <button
                        className={`text-sm font-medium transition-colors ${subjectFilter === "all" ? "text-primary" : "text-foreground hover:text-primary"}`}
                        onClick={() => setSubjectFilter("all")}
                      >
                        All
                      </button>
                      <button
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setSubjectFilter(subjects[0] || "all")}
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
                        selectedSubjects={subjectFilter === "all" ? [] : [subjectFilter]}
                        onToggle={(subjectName) => {
                          if (subjectFilter === subjectName) {
                            setSubjectFilter("all");
                          } else {
                            setSubjectFilter(subjectName);
                          }
                        }}
                        singleSelect={true}
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
                  <div ref={chartContainerRef} className="h-64 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  touchAction: 'pan-x pinch-zoom'
                }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <div style={{
                    width: Math.max(100, trendData.length / 4 * 100 * chartZoom) + '%',
                    minWidth: '100%',
                    height: '100%',
                    transition: 'width 0.1s ease-out'
                  }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{
                        top: 10,
                        right: 20,
                        left: 0,
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
                                  <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
                                    {parts[0]}
                                  </text>
                                  <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.7}>
                                    {parts[1]}
                                  </text>
                                </g>;
                        }} />
                          <YAxis domain={[30, 100]} tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))"
                        }} axisLine={false} tickLine={false} width={35} />
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
                          {subjectFilter === "all" ? <Area type="monotone" dataKey="Average" stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"} strokeWidth={2.5} fill={trendDirection.direction === "up" ? "url(#gradientGreen)" : trendDirection.direction === "down" ? "url(#gradientRed)" : "url(#gradientBlue)"} dot={{
                          fill: trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6",
                          strokeWidth: 0,
                          r: 5
                        }} activeDot={{
                          r: 7,
                          strokeWidth: 2,
                          stroke: "#fff"
                        }} connectNulls /> : <Area type="monotone" dataKey={subjectFilter} stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"} strokeWidth={2.5} fill={trendDirection.direction === "up" ? "url(#gradientGreen)" : trendDirection.direction === "down" ? "url(#gradientRed)" : "url(#gradientBlue)"} dot={{
                          fill: trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6",
                          strokeWidth: 0,
                          r: 5
                        }} activeDot={{
                          r: 7,
                          strokeWidth: 2,
                          stroke: "#fff"
                        }} connectNulls />}
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
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <PolarAngleAxis dataKey="subject" tick={{
                        fontSize: 9,
                        fill: "hsl(var(--muted-foreground))"
                      }} tickLine={false} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))"
                      }} tickCount={5} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} fill={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} fillOpacity={0.3} strokeWidth={2} />
                        <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12
                      }} formatter={(value: number) => [`${value}%`, "Score"]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Visual snapshot of performance across all subjects
                  </p>
                </div>

                {/* Subject vs School Average Horizontal Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    vs School Average
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectVsSchoolData} layout="vertical" barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))"
                      }} width={60} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} formatter={(value: number, name: string) => [`${value}%`, name === "classScore" ? "Class Score" : "School Average"]} />
                        <Legend wrapperStyle={{
                        fontSize: 10
                      }} formatter={value => value === "classScore" ? "Class Score" : "School Avg"} />
                        <Bar dataKey="classScore" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="schoolAvg" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={10} opacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Delta badges */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {subjectVsSchoolData.slice(0, 4).map(item => <Badge key={item.name} variant={item.delta >= 0 ? "default" : "destructive"} className="text-[10px] px-2 py-0.5">
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
                <div className="grid grid-cols-2 gap-4">
                  {/* Exam A - Light Blue Box */}
                  <div className="space-y-3 p-3 rounded-xl border" style={{
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
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examAYear} onValueChange={setExamAYear}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {academicYears.slice(0, 4).map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examAPeriod} onValueChange={v => setExamAPeriod(v as "midYear" | "yearEnd")}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriods.map(period => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Exam B - Light Red Box */}
                  <div className="space-y-3 p-3 rounded-xl border" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.25)'
                }}>
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{
                    color: '#ef4444'
                  }}>
                      <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor: '#ef4444'
                    }} />
                      Exam B
                    </label>
                    <Select value={examBClass} onValueChange={setExamBClass}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {teacherProfile.classes.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examBYear} onValueChange={setExamBYear}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {academicYears.slice(0, 4).map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={examBPeriod} onValueChange={v => setExamBPeriod(v as "midYear" | "yearEnd")}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/30">
                          <p className="text-xs text-muted-foreground mb-1">{examALabel}</p>
                          <p className="text-xl font-bold text-foreground">{avgA}%</p>
                          <p className="text-xs text-muted-foreground">Average</p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/30">
                          <p className="text-xs text-muted-foreground mb-1">{examBLabel}</p>
                          <p className="text-xl font-bold text-foreground">{avgB}%</p>
                          <p className="text-xs text-muted-foreground">Average</p>
                        </div>
                      </div>

                      {/* Top 5 Growth Leaders - Moomoo Style */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">Top Growth Leaders</h4>
                              <p className="text-[10px] text-muted-foreground">Best performing subjects</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            Top 5
                          </Badge>
                        </div>
                        
                        {/* Top 5 Growth Chart */}
                        {(() => {
                      const top5Growth = [...comparisonData].sort((a, b) => b.delta - a.delta).slice(0, 5).filter(item => item.delta > 0);
                      if (top5Growth.length === 0) {
                        return <div className="text-center py-4 text-muted-foreground text-sm">
                                No subjects showed improvement in this period
                              </div>;
                      }
                      const maxDelta = Math.max(...top5Growth.map(t => t.delta));
                      return <div className="space-y-3">
                              {/* Mini Area Chart */}
                              <div className="h-32 -mx-2">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={top5Growth.map(item => ({
                              name: shortenSubjectName(item.name),
                              growth: item.delta,
                              percentChange: item.examB > 0 ? item.delta / item.examB * 100 : 0,
                              from: item.examB,
                              to: item.examA
                            }))} margin={{
                              top: 10,
                              right: 10,
                              left: 10,
                              bottom: 0
                            }}>
                                    <defs>
                                      <linearGradient id="growthGradientTeacher" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.05} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                                fontSize: 9,
                                fill: 'hsl(var(--muted-foreground))'
                              }} interval={0} height={30} />
                                    <YAxis hide />
                                    <Area type="monotone" dataKey="growth" stroke="hsl(142, 76%, 46%)" strokeWidth={2} fill="url(#growthGradientTeacher)" dot={{
                                r: 4,
                                fill: "hsl(142, 76%, 46%)",
                                strokeWidth: 2,
                                stroke: "hsl(var(--background))"
                              }} activeDot={{
                                r: 6,
                                fill: "hsl(142, 76%, 46%)",
                                strokeWidth: 2,
                                stroke: "hsl(var(--background))"
                              }} />
                                    <Tooltip content={({
                                active,
                                payload
                              }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                              <p className="text-xs font-medium text-foreground">{data.name}</p>
                                              <p className="text-xs text-emerald-500 font-bold">+{data.growth} pts</p>
                                              <p className="text-[10px] text-muted-foreground">{data.from} → {data.to}</p>
                                            </div>;
                                }
                                return null;
                              }} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Top 5 Rankings */}
                              <div className="space-y-2">
                                {top5Growth.map((item, index) => {
                            const percentChange = item.examB > 0 ? (item.delta / item.examB * 100).toFixed(1) : '0.0';
                            const barWidth = item.delta / maxDelta * 100;
                            return <div key={item.name} className="flex items-center gap-2">
                                      {/* Rank Badge */}
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : index === 1 ? 'bg-gray-400/20 text-gray-500' : index === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                        {index + 1}
                                      </div>
                                      
                                      {/* Subject Name */}
                                      <span className="text-xs font-medium text-foreground w-16 truncate">
                                        {shortenSubjectName(item.name)}
                                      </span>
                                      
                                      {/* Growth Bar */}
                                      <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden relative">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{
                                  width: `${barWidth}%`
                                }} />
                                      </div>
                                      
                                      {/* Growth Stats */}
                                      <div className="flex items-center gap-1 min-w-[60px] justify-end">
                                        <span className="text-xs font-bold text-emerald-500">+{item.delta}</span>
                                        <span className="text-[9px] text-muted-foreground">({percentChange}%)</span>
                                      </div>
                                    </div>;
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
                            </div>;
                    })()}
                      </div>

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
                                  {/* Exam B (Previous) - Blue */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground w-16 truncate">{examBLabel.split(' ')[0]}</span>
                                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{
                                  width: `${item.examB / 100 * 100}%`
                                }} />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                        {item.examB}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Exam A (Current) - Orange */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground w-16 truncate">{examALabel.split(' ')[0]}</span>
                                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                      <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{
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

              {/* Summary Statistics */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Summary Statistics</h3>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#eff6ff' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{classAverage}%</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>Average</div>
                  </div>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fef3c7' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{highestScore}%</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>Highest</div>
                  </div>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fee2e2' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{lowestScore}%</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>Lowest</div>
                  </div>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#dcfce7' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{passRate}%</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>Pass Rate</div>
                  </div>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f3e8ff' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>{students.length}</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>Students</div>
                  </div>
                  <div className="stat-card" style={{ padding: '8px 4px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#ecfdf5' }}>
                    <div className="stat-value" style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{aGradeRate}%</div>
                    <div className="stat-label" style={{ fontSize: '8px', color: '#666' }}>A Grade</div>
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
                    {' • '}Period: {trendPeriod === '1year' ? 'Last 1 Year' : trendPeriod === '2years' ? 'Last 2 Years' : trendPeriod === '3years' ? 'Last 3 Years' : 'All Years'}
                  </p>
                </div>
              </div>

              {/* Current Performance Summary */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>Current Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: trendDirection.direction === 'up' ? '#dcfce7' : trendDirection.direction === 'down' ? '#fee2e2' : '#f3f4f6', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>{trendDirection.currentValue}%</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{subjectFilter === 'all' ? 'Class Average' : subjectFilter}</div>
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

              {/* Rising & Falling Subjects */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>Rising Subjects</h4>
                  {risingSubjects.length > 0 ? risingSubjects.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '9px', borderBottom: '1px solid #86efac40' }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 600, color: '#22c55e' }}>+{item.improvement}% ({item.first}% → {item.last}%)</span>
                    </div>
                  )) : <p style={{ fontSize: '9px', color: '#666' }}>No improving subjects</p>}
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>Needs Focus</h4>
                  {fallingSubjects.length > 0 ? fallingSubjects.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '9px', borderBottom: '1px solid #fca5a540' }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{item.decline}% ({item.first}% → {item.last}%)</span>
                    </div>
                  )) : <p style={{ fontSize: '9px', color: '#666' }}>All subjects stable</p>}
                </div>
              </div>

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