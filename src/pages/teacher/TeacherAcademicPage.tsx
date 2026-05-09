import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
import { Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Users, Target, Award, AlertTriangle, BookOpen, BarChart3, FileText, CheckCircle, XCircle, Lightbulb, Copy, Printer, ArrowRight, ArrowUpRight, ArrowDownRight, Scale, Download, FileSpreadsheet, Check, Calendar, UserCheck, Plus, X, ArrowUp, ArrowDown, Search, Loader2, Lock, Info } from "lucide-react";
import { useGradeEntry } from "@/hooks/useGradeEntry";
import { useClassAnalysis } from "@/hooks/useClassAnalysis";
import { useClassAnalysisData } from "@/hooks/useClassAnalysisData";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import collinzLogo from "@/assets/collinz-school-logo.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";
import { teacherProfile, classRosters, classGrades } from "@/data/teacherMockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, ReferenceDot } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, stripCampusPrefix } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoxPlotStats, calculateStudentBoxPlotData, calculateSubjectBoxPlotData, generateInsights, Insight, getAvailableYears } from "@/utils/boxPlotCalculations";
import { BoxPlotChart } from "@/components/BoxPlotChart";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { allSubjects, getShortSubjectName, getTinySubjectCode, getSubjectColor, subjectGroups } from "@/data/subjectsConfig";
import { SubjectGroupPill } from "@/components/SubjectGroupPill";
import { SubjectPerformanceChart } from "@/components/SubjectPerformanceChart";
import { exportElementToPdf } from "@/lib/pdf/exportToPdf";
import { saveAndShareBlob } from "@/lib/export/nativeDownload";

// SVG icons for print compatibility (inline SVGs render properly in print)
const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconTarget = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="-1 -1 26 26"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconBarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const IconScale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

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

// Use centralized subjects list
const subjects = allSubjects;

// Get subjects that are not part of any variant group (standalone subjects)
const groupedSubjectNames = subjectGroups.flatMap(g => g.variants?.map(v => v.name) || []);
const standaloneSubjects = allSubjects.filter(s => !groupedSubjectNames.includes(s));

// Academic years (past 6 years)
const academicYears = ["2026", "2025", "2024", "2023", "2022", "2021"];

// Selection colors for multiple comparisons
const SELECTION_COLORS = [
  { id: "A", bg: "bg-blue-50/50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700", hex: "#3b82f6", bgHex: "rgba(59, 130, 246, 0.08)", borderHex: "rgba(59, 130, 246, 0.25)" },
  { id: "B", bg: "bg-amber-50/50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", hex: "#f59e0b", bgHex: "rgba(245, 158, 11, 0.08)", borderHex: "rgba(245, 158, 11, 0.25)" },
  { id: "C", bg: "bg-emerald-50/50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", hex: "#10b981", bgHex: "rgba(16, 185, 129, 0.08)", borderHex: "rgba(16, 185, 129, 0.25)" },
  { id: "D", bg: "bg-purple-50/50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700", hex: "#8b5cf6", bgHex: "rgba(139, 92, 246, 0.08)", borderHex: "rgba(139, 92, 246, 0.25)" },
  { id: "E", bg: "bg-rose-50/50", border: "border-rose-200", dot: "bg-rose-500", text: "text-rose-700", hex: "#f43f5e", bgHex: "rgba(244, 63, 94, 0.08)", borderHex: "rgba(244, 63, 94, 0.25)" },
  { id: "F", bg: "bg-cyan-50/50", border: "border-cyan-200", dot: "bg-cyan-500", text: "text-cyan-700", hex: "#06b6d4", bgHex: "rgba(6, 182, 212, 0.08)", borderHex: "rgba(6, 182, 212, 0.25)" },
];

const getSelectionColor = (index: number) => SELECTION_COLORS[index % SELECTION_COLORS.length];
const getNextSelectionId = (existingIds: string[]) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < letters.length; i++) {
    if (!existingIds.includes(letters[i])) return letters[i];
  }
  return `${letters.length + 1}`;
};

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
const formatSavedAt = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return `${day} ${month}, ${hour12}:${minutes}${period}`;
};
export default function TeacherAcademicPage() {
  const isMobile = useIsMobile();
  const teacherScope = useTeacherScope();
  
  // Grade Entry hook (Supabase integration)
  const gradeEntry = useGradeEntry();
  
  // Class Analysis hook (Supabase integration for Overview tab)
  const classAnalysis = useClassAnalysis();
  
  // Shared academic filters hook (provides year levels, classes, students from DB)
  const allowedClasses = useMemo(
    () =>
      teacherScope.isTeacher
        ? teacherScope.allowedClassYears.map((cls) => cls.class_name)
        : undefined,
    [teacherScope.allowedClassYears, teacherScope.isTeacher]
  );
  const academicFilters = useAcademicFilters({ allowedClasses });
  
  // ======================================================================
  // CLASS ANALYSIS: Use classAnalysis hook for UNIFIED state across all tabs
  // This ensures Overview, Bands, Trends, Compare, BoxPlot all use SAME class/period selection
  // ======================================================================
  
  // Derived values for convenience (from classAnalysis hook)
  const selectedClass = classAnalysis.selectedClass;
  const setSelectedClass = classAnalysis.setSelectedClass;
  
  // Legacy state that was previously separate - now consolidated:
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const gradeEntryRef = useRef<HTMLDivElement>(null);
  const [studentGrades, setStudentGrades] = useState<Record<string, Record<string, StudentGrades>>>({});
  const [classStudyRecommendation, setClassStudyRecommendationLocal] = useState<Record<string, Record<string, string>>>({}); // class -> subject -> recommendation
  const [selectedYears, setSelectedYears] = useState<string[]>([academicYears[0]]);
  const [selectedYear, setSelectedYear] = useState(academicYears[0]); // For single-select dropdowns
  const [selectedPeriod, setSelectedPeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(["midYear"]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([...subjects]);
  // bandsSelectedSubject is now driven by classAnalysis.bandsSelectedSubjectId
  const [bandsCompareMode, setBandsCompareMode] = useState(false);
  
  // Get bandsSelectedSubject name from hook's subject ID
  const bandsSelectedSubject = useMemo(() => {
    if (!classAnalysis.bandsSelectedSubjectId) return "";
    const subject = classAnalysis.subjects.find(s => s.id === classAnalysis.bandsSelectedSubjectId);
    return subject?.name || "";
  }, [classAnalysis.bandsSelectedSubjectId, classAnalysis.subjects]);
  
  const setBandsSelectedSubject = useCallback((subjectName: string) => {
    const subject = classAnalysis.subjects.find(s => s.name === subjectName);
    if (subject) {
      classAnalysis.setBandsSelectedSubjectId(subject.id);
    }
  }, [classAnalysis]);

  // Dynamic bands selections (Selection A is the main one, B, C, D... are additional)
  interface BandsSelection {
    id: string;
    className: string;
    year: string;
    period: "midYear" | "yearEnd";
    subject: string;
  }
  // Initialize with first class from classAnalysis once loaded
  const [bandsAdditionalSelections, setBandsAdditionalSelections] = useState<BandsSelection[]>([]);
  
  // Sync selectedClasses with classAnalysis.classes when available
  useEffect(() => {
    if (classAnalysis.classes.length > 0 && selectedClasses.length === 0) {
      setSelectedClasses([classAnalysis.classes[0]]);
    }
  }, [classAnalysis.classes, selectedClasses.length]);
  
  // Initialize bandsAdditionalSelections when classes are loaded
  useEffect(() => {
    if (classAnalysis.classes.length > 1 && bandsAdditionalSelections.length === 0) {
      setBandsAdditionalSelections([
        { id: "B", className: classAnalysis.classes[1], year: academicYears[0], period: "midYear", subject: bandsSelectedSubject || "Mathematics" }
      ]);
    }
  }, [classAnalysis.classes, bandsAdditionalSelections.length, bandsSelectedSubject]);
  const [selectedCategory, setSelectedCategory] = useState<"attitude" | "homework" | "quiz" | "exam">("quiz");

  // Grade Entry category state (Grades, Behavior, Awards)
  const [entryCategory, setEntryCategory] = useState<"grades" | "behavior" | "awards">("grades");
  
  // For Behavior and Awards tabs (still use local state for subject selection)
  const [selectedEntrySubject, setSelectedEntrySubject] = useState<string | null>(null);
  
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

  // Comparison tab state - dynamic exam selections
  // Initialize with classAnalysis.selectedClass instead of mock data
  interface ExamSelection {
    id: string;
    className: string;
    periodId: string;
  }
  const [examSelections, setExamSelections] = useState<ExamSelection[]>([]);
  const [compareSubjects, setCompareSubjects] = useState<string[]>([]);

  const compareSubjectOptions = useMemo(
    () => classAnalysis.subjects.map((subject) => subject.name),
    [classAnalysis.subjects]
  );

  useEffect(() => {
    if (compareSubjectOptions.length === 0) return;
    setCompareSubjects((prev) => {
      if (prev.length === 0) return compareSubjectOptions;
      const filtered = prev.filter((name) => compareSubjectOptions.includes(name));
      return filtered.length > 0 ? filtered : compareSubjectOptions;
    });
  }, [compareSubjectOptions]);
  
  // Initialize examSelections when classAnalysis periods load
  useEffect(() => {
    if (
      classAnalysis.classes.length > 0 &&
      classAnalysis.academicPeriodsForYear.length > 0 &&
      examSelections.length === 0
    ) {
      const defaultClass =
        classAnalysis.selectedClass || classAnalysis.classes[0];
      const [firstPeriod, secondPeriod] = classAnalysis.academicPeriodsForYear;
      setExamSelections([
        { id: "A", className: defaultClass, periodId: firstPeriod.id },
        {
          id: "B",
          className: defaultClass,
          periodId: secondPeriod?.id || firstPeriod.id,
        },
      ]);
    }
  }, [
    classAnalysis.classes,
    classAnalysis.selectedClass,
    classAnalysis.academicPeriodsForYear,
    examSelections.length,
  ]);

  useEffect(() => {
    if (!classAnalysis.selectedClass) return;
    setExamSelections((prev) =>
      prev.map((exam) => ({
        ...exam,
        className: classAnalysis.selectedClass as string,
      }))
    );
  }, [classAnalysis.selectedClass]);

  // Backward compatibility getters for exam A and B (used in comparison logic)
  const defaultClassName = classAnalysis.selectedClass || classAnalysis.classes[0] || "";
  const examAClass = examSelections[0]?.className || defaultClassName;
  const examAPeriodId = examSelections[0]?.periodId || "";
  const examBClass = examSelections[1]?.className || defaultClassName;
  const examBPeriodId = examSelections[1]?.periodId || "";

  // Trends tab state - like student page
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "4years" | "5years" | "6years">("6years");
  const [trendsSelectedSubjects, setTrendsSelectedSubjects] = useState<string[]>([...subjects]);
  const [chartViewMode, setChartViewMode] = useState<"single" | "multiple">("single");

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
  const [boxPlotReportDialogOpen, setBoxPlotReportDialogOpen] = useState(false);
  const boxPlotReportRef = useRef<HTMLDivElement>(null);
  const handleReportPdfExport = useCallback(
    async (reportRef: React.RefObject<HTMLDivElement>, filename: string) => {
      if (!reportRef.current) {
        toast({
          title: "Export unavailable",
          description: "Report content is not ready yet.",
        });
        return;
      }
      try {
        const result = await exportElementToPdf({
          element: reportRef.current,
          filename,
        });
        if (result.savedToDevice) {
          toast({ title: "Saved to Downloads" });
        }
      } catch (error) {
        console.error("[TeacherAcademicPage] PDF export failed", error);
        toast({
          title: "Export failed. Please try again.",
        });
      }
    },
    []
  );
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [growthCarouselApi, setGrowthCarouselApi] = useState<any>(null);
  const [growthCarouselSlide, setGrowthCarouselSlide] = useState(0);
  const [analysisSubTab, setAnalysisSubTab] = useState<"overview" | "distribution" | "trends" | "comparison" | "boxplot">("overview");
  
  // Box & Whisker state
  const [boxPlotViewMode, setBoxPlotViewMode] = useState<"student" | "subject">("student");
  const [boxPlotStartYear, setBoxPlotStartYear] = useState<string>("2021");
  const [boxPlotEndYear, setBoxPlotEndYear] = useState<string>("2026");
  // Mode A: Student filters - will be synced with classAnalysis.classes
  const [boxPlotGrade, setBoxPlotGrade] = useState<string>("");
  const [boxPlotClass, setBoxPlotClass] = useState<string>("");
  const [boxPlotStudentId, setBoxPlotStudentId] = useState<string>("");
  const [boxPlotStudentSubjects, setBoxPlotStudentSubjects] = useState<string[]>([]); // multiple subjects
  const [boxPlotStudentExamType, setBoxPlotStudentExamType] = useState<string>("all"); // optional - "all" means all
  // Mode B: Subject filters
  const [boxPlotSubjects, setBoxPlotSubjects] = useState<string[]>(["Mathematics"]); // multiple subjects
  const [boxPlotStudentSubjectSearch, setBoxPlotStudentSubjectSearch] = useState("");
  const [boxPlotSubjectSearch, setBoxPlotSubjectSearch] = useState("");
  // Enhanced cohort scope with multi-select
  const [boxPlotCohortType, setBoxPlotCohortType] = useState<"classes" | "yearGroups" | "school">("classes");
  const [boxPlotSelectedClasses, setBoxPlotSelectedClasses] = useState<string[]>([]);
  const [boxPlotSelectedYearGroups, setBoxPlotSelectedYearGroups] = useState<string[]>([]);
  const [boxPlotCohortPopoverOpen, setBoxPlotCohortPopoverOpen] = useState(false);
  const [boxPlotSubjectExamType, setBoxPlotSubjectExamType] = useState<string>("all"); // optional
  
  // Riskers chart toggle (high/low performers)
  const [boxPlotRiskView, setBoxPlotRiskView] = useState<"high" | "low">("high");
  
  // Whiskers Analysis year filter
  const [whiskersAnalysisYear, setWhiskersAnalysisYear] = useState<string>("all");
  const [whiskersExpanded, setWhiskersExpanded] = useState(false);

  const studentSelectedClassYearId = useMemo(() => {
    if (!boxPlotClass) return null;
    const classYear = teacherScope.allowedClassYears.find(
      (cls) => cls.class_name === boxPlotClass
    );
    return classYear?.id ?? null;
  }, [boxPlotClass, teacherScope.allowedClassYears]);

  // Box Plot student-mode data should be fetched using the student selector class,
  // not the global overview class selection.
  const boxPlotStudentClassId =
    boxPlotViewMode === "student" && studentSelectedClassYearId ? boxPlotClass : null;
  const boxPlotStudentAnalysis = useClassAnalysisData({
    classId: boxPlotStudentClassId,
    examPeriodIds: classAnalysis.academicPeriods.map((period) => period.id),
  });
  
  // Available classes from real data (academicFilters hook)
  const allAvailableClasses = useMemo(() => academicFilters.classes, [academicFilters.classes]);
  
  // Available year levels from real data (academicFilters hook)
  const allAvailableYearLevels = useMemo(() => academicFilters.yearLevels, [academicFilters.yearLevels]);
  
  // Derive year groups from available year levels (for display as "Year X" format)
  const allAvailableYearGroups = useMemo(() => {
    return allAvailableYearLevels.map(yl => {
      // Extract number from year level: "Y11" -> "11"
      const match = yl.match(/(\d+)/);
      return match ? `Year ${match[1]}` : yl;
    });
  }, [allAvailableYearLevels]);
  
  // Map classes by year group using academicFilters
  const classesByYearGroup: Record<string, string[]> = useMemo(() => {
    const groups: Record<string, string[]> = {};
    allAvailableYearLevels.forEach(yl => {
      const match = yl.match(/(\d+)/);
      const yearGroup = match ? `Year ${match[1]}` : yl;
      groups[yearGroup] = academicFilters.getClassesForYearLevel(yl);
    });
    return groups;
  }, [allAvailableYearLevels, academicFilters]);
  
  // Get classes for the selected boxPlotGrade (year level)
  const boxPlotClassesForGrade = useMemo(() => {
    if (!boxPlotGrade) return allAvailableClasses;
    // boxPlotGrade can be "Y11" or "11" - normalize
    const yearLevel = allAvailableYearLevels.find(yl => {
      const match = yl.match(/(\d+)/);
      return match && match[1] === boxPlotGrade.replace(/\D/g, '');
    });
    if (yearLevel) {
      return academicFilters.getClassesForYearLevel(yearLevel);
    }
    return allAvailableClasses;
  }, [boxPlotGrade, allAvailableYearLevels, allAvailableClasses, academicFilters]);
  
  // Get students for the selected boxPlotClass
  const boxPlotStudentsForClass = useMemo(() => {
    if (!boxPlotClass) return [];
    return academicFilters.getStudentsForClass(boxPlotClass);
  }, [boxPlotClass, academicFilters]);

  useEffect(() => {
    if (!boxPlotClass) return;
    setBoxPlotStudentId("");
    setBoxPlotStudentSubjects([]);
    setBoxPlotStudentSubjectSearch("");
  }, [boxPlotClass]);
  
  // Initialize boxplot selections when academic filters load
  useEffect(() => {
    if (allAvailableClasses.length > 0 && !boxPlotClass) {
      const firstClass = classAnalysis.selectedClass || allAvailableClasses[0];
      setBoxPlotClass(firstClass);
      setBoxPlotSelectedClasses([firstClass]);
      
      // Extract year from first class and find matching year level
      const match = firstClass.match(/^Y?(\d+)/);
      if (match) {
        const yearNum = match[1];
        // Set boxPlotGrade to the year number
        setBoxPlotGrade(yearNum);
        setBoxPlotSelectedYearGroups([`Year ${yearNum}`]);
      }
    }
  }, [allAvailableClasses, classAnalysis.selectedClass, boxPlotClass]);
  
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
    const scrollEl = document.querySelector('[data-app-scroll="true"]') as HTMLElement | null;
    const target: HTMLElement | Window = scrollEl ?? window;

    const getMetrics = () => {
      if (target instanceof Window) {
        return {
          scrollTop: window.scrollY,
          viewportHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
        };
      }
      return {
        scrollTop: target.scrollTop,
        viewportHeight: target.clientHeight,
        scrollHeight: target.scrollHeight,
      };
    };

    const handleScroll = () => {
      const { scrollTop, viewportHeight, scrollHeight } = getMetrics();
      const isNearBottom = scrollTop + viewportHeight >= scrollHeight - 150;
      setIsAtBottom(isNearBottom);
    };
    
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial position
    return () => target.removeEventListener("scroll", handleScroll);
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
      toast.error("No student selected", "Please select a student to save.");
      return;
    }
    const categoryLabels = { grades: "Grades", behavior: "Behavior", awards: "Awards" };
    toast.success(
      `${categoryLabels[entryCategory]} saved`,
      `${categoryLabels[entryCategory]} saved for ${students.find(s => s.id === selectedStudent)?.name} in Class ${stripCampusPrefix(selectedClass)}.`
    );
  };

  // ============ USE REAL DATA FROM classAnalysis ============
  // Class statistics from real Supabase data (not mock)
  const classAverage = classAnalysis.summaryStats?.classAverage ?? 0;
  const passRate = classAnalysis.summaryStats?.passRate ?? 0;
  const rosterCount = classAnalysis.students.length;
  const passCount = classAnalysis.summaryStats?.passCount ?? 0;
  const gradeDistribution = classAnalysis.gradeDistribution;
  
  // Compute highest/lowest from real student scores
  const highestScore = useMemo(() => {
    if (classAnalysis.studentScores.length === 0) return 0;
    return Math.max(...classAnalysis.studentScores.map(s => s.averageScore));
  }, [classAnalysis.studentScores]);
  
  const lowestScore = useMemo(() => {
    if (classAnalysis.studentScores.length === 0) return 0;
    return Math.min(...classAnalysis.studentScores.map(s => s.averageScore));
  }, [classAnalysis.studentScores]);
  
  const aGradeRate = useMemo(() => {
    if (classAnalysis.studentScores.length === 0) return 0;
    const aCount = classAnalysis.studentScores.filter(s => s.averageScore >= 80).length;
    return Math.round((aCount / classAnalysis.studentScores.length) * 100);
  }, [classAnalysis.studentScores]);

  // Ranked students with real data from classAnalysis
  const rankedStudents = useMemo(() => {
    return classAnalysis.studentScores.map(s => ({
      id: s.studentId,
      name: s.studentName,
      score: s.averageScore,
      photo: null,
      mealPlan: false,
      outdoorCCA: false,
      sportsHouse: "red" as const,
      remarks: "",
      joinDate: ""
    }));
  }, [classAnalysis.studentScores]);

  // At-risk students from classAnalysis
  const atRiskStudents = useMemo(() => 
    classAnalysis.atRiskStudents.map(s => ({
      id: s.studentId,
      name: s.studentName,
      score: s.averageScore,
      photo: null,
      mealPlan: false,
      outdoorCCA: false,
      sportsHouse: "red" as const,
      remarks: "",
      joinDate: ""
    })), [classAnalysis.atRiskStudents]);
  
  // Middle performers from classAnalysis
  const middlePerformers = useMemo(() =>
    classAnalysis.middlePerformers.map(s => ({
      id: s.studentId,
      name: s.studentName,
      score: s.averageScore,
      photo: null,
      mealPlan: false,
      outdoorCCA: false,
      sportsHouse: "red" as const,
      remarks: "",
      joinDate: ""
    })), [classAnalysis.middlePerformers]);
  
  // Top performers from classAnalysis
  const topPerformers = useMemo(() =>
    classAnalysis.topPerformers.map(s => ({
      id: s.studentId,
      name: s.studentName,
      score: s.averageScore,
      photo: null,
      mealPlan: false,
      outdoorCCA: false,
      sportsHouse: "red" as const,
      remarks: "",
      joinDate: ""
    })), [classAnalysis.topPerformers]);

  // ===== BANDS TAB: Use REAL DATA from classAnalysis hook =====
  // The hook already computes bandsDistribution, bandsRankedStudents, etc. from Supabase
  const bandsGradeDistribution = classAnalysis.bandsDistribution;
  const bandsRankedStudents = classAnalysis.bandsRankedStudents.map(s => ({
    id: s.studentId,
    name: s.studentName,
    score: s.score,
    // Add placeholder fields to match expected structure
    photo: null,
    mealPlan: false,
    outdoorCCA: false,
    sportsHouse: "red" as const,
    remarks: "",
    joinDate: ""
  }));
  const bandsTopPerformers = classAnalysis.bandsTopPerformers.map(s => ({
    id: s.studentId,
    name: s.studentName,
    score: s.score,
    photo: null,
    mealPlan: false,
    outdoorCCA: false,
    sportsHouse: "red" as const,
    remarks: "",
    joinDate: ""
  }));
  const bandsMiddlePerformers = classAnalysis.bandsMiddlePerformers.map(s => ({
    id: s.studentId,
    name: s.studentName,
    score: s.score,
    photo: null,
    mealPlan: false,
    outdoorCCA: false,
    sportsHouse: "red" as const,
    remarks: "",
    joinDate: ""
  }));
  const bandsAtRiskStudents = classAnalysis.bandsAtRiskStudents.map(s => ({
    id: s.studentId,
    name: s.studentName,
    score: s.score,
    photo: null,
    mealPlan: false,
    outdoorCCA: false,
    sportsHouse: "red" as const,
    remarks: "",
    joinDate: ""
  }));

  // ===== BANDS COMPARISON: For additional selections, we'd need to fetch separately =====
  // For now, provide empty data for comparison mode (to be implemented with separate queries)
  const bandsSelectionsData = useMemo(() => {
    // Compare mode would need separate fetches per selection - show empty for now
    return bandsAdditionalSelections.map((selection, index) => ({
      ...selection,
      color: getSelectionColor(index + 1),
      gradeDistribution: [] as { range: string; count: number }[],
      rankedStudents: [] as { id: string; name: string; score: number }[],
      topPerformers: [] as { id: string; name: string; score: number }[],
      middlePerformers: [] as { id: string; name: string; score: number }[],
      atRiskStudents: [] as { id: string; name: string; score: number }[],
    }));
  }, [bandsAdditionalSelections]);

  // Keep backward compatibility references for first comparison (Selection B)
  const bandsCompareGradeDistribution = bandsSelectionsData[0]?.gradeDistribution || [];
  const bandsCompareRankedStudents = bandsSelectionsData[0]?.rankedStudents || [];
  const bandsCompareTopPerformers = bandsSelectionsData[0]?.topPerformers || [];
  const bandsCompareMiddlePerformers = bandsSelectionsData[0]?.middlePerformers || [];
  const bandsCompareAtRiskStudents = bandsSelectionsData[0]?.atRiskStudents || [];
  // Backward compatibility getters for old variable names
  const bandsCompareClass = bandsAdditionalSelections[0]?.className || classAnalysis.selectedClass || "";
  const bandsCompareSubject = bandsAdditionalSelections[0]?.subject || bandsSelectedSubject || "Mathematics";

  const academicPeriodById = useMemo(() => {
    return new Map(classAnalysis.academicPeriods.map((period) => [period.id, period]));
  }, [classAnalysis.academicPeriods]);

  const getPeriodLabel = useCallback(
    (periodId: string) => academicPeriodById.get(periodId)?.name || "Exam",
    [academicPeriodById]
  );

  const getPeriodYearLabel = useCallback(
    (periodId: string) => {
      const period = academicPeriodById.get(periodId);
      if (!period) return "Unknown";
      if (Number.isFinite(period.academic_year)) {
        return String(period.academic_year);
      }
      return "Unknown";
    },
    [academicPeriodById]
  );

  const getPeriodExamType = useCallback(
    (periodId: string) => {
      const period = academicPeriodById.get(periodId);
      if (!period) return "Mid-Year";
      const label = `${period.name} ${period.code}`.toLowerCase();
      if (label.includes("mid")) return "Mid-Year";
      if (label.includes("end") || label.includes("final")) return "Year-End";
      return "Mid-Year";
    },
    [academicPeriodById]
  );

  const subjectNameToId = useMemo(() => {
    return new Map(classAnalysis.subjects.map((subject) => [subject.name, subject.id]));
  }, [classAnalysis.subjects]);

  const subjectIdToName = useMemo(() => {
    return new Map(classAnalysis.subjects.map((subject) => [subject.id, subject.name]));
  }, [classAnalysis.subjects]);

  const compareSubjectIds = useMemo(() => {
    return compareSubjects
      .map((name) => subjectNameToId.get(name))
      .filter((id): id is number => typeof id === "number");
  }, [compareSubjects, subjectNameToId]);

  const compareGradesByPeriod = useMemo(() => {
    const map = new Map<string, number[]>();
    classAnalysis.grades.forEach((grade) => {
      if (!compareSubjectIds.includes(grade.subject_id)) return;
      if (!Number.isFinite(grade.total_marks)) return;
      const list = map.get(grade.academic_period_id) || [];
      list.push(grade.total_marks as number);
      map.set(grade.academic_period_id, list);
    });
    return map;
  }, [classAnalysis.grades, compareSubjectIds]);

  const analysisAssessmentRecords = useMemo(() => {
    const studentById = new Map(
      classAnalysis.students.map((student) => [student.id, student])
    );

    return classAnalysis.grades
      .map((grade) => {
        if (!Number.isFinite(grade.total_marks)) return null;
        const student = studentById.get(grade.student_id);
        const subjectName = subjectIdToName.get(grade.subject_id);
        const yearLabel =
          grade.academic_year !== null && grade.academic_year !== undefined
            ? String(grade.academic_year)
            : "Unknown";
        if (!student || !subjectName || yearLabel === "Unknown") return null;
        const yearMatch = student.year_level?.match(/(\d+)/);
        const yearGroup = yearMatch ? `Year ${yearMatch[1]}` : student.year_level || "Year";
        return {
          student_id: student.id,
          student_name: student.name,
          academic_year: yearLabel,
          subject: subjectName,
          exam_type: getPeriodExamType(grade.academic_period_id),
          score_numeric: grade.total_marks as number,
          class_id: student.class,
          year_group: yearGroup,
        };
      })
      .filter((record): record is {
        student_id: string;
        student_name: string;
        academic_year: string;
        subject: string;
        exam_type: "Mid-Year" | "Year-End";
        score_numeric: number;
        class_id: string;
        year_group: string;
      } => record !== null);
  }, [
    classAnalysis.grades,
    classAnalysis.students,
    subjectIdToName,
    getPeriodYearLabel,
    getPeriodExamType,
  ]);

  const studentBoxPlotAssessmentRecords = useMemo(() => {
    const studentById = new Map(
      boxPlotStudentAnalysis.rosterStudents.map((student) => [student.id, student])
    );

    return boxPlotStudentAnalysis.gradeRows
      .map((grade) => {
        if (!Number.isFinite(grade.score_percent)) return null;
        const student = studentById.get(grade.student_id);
        const subjectName = subjectIdToName.get(grade.subject_id) || `Subject ${grade.subject_id}`;
        const yearLabel =
          grade.academic_year !== null && grade.academic_year !== undefined
            ? String(grade.academic_year)
            : "Unknown";
        if (!student || yearLabel === "Unknown") return null;
        const yearMatch = student.year_level?.match(/(\d+)/);
        const yearGroup = yearMatch ? `Year ${yearMatch[1]}` : student.year_level || "Year";
        return {
          student_id: student.id,
          student_name: student.name,
          academic_year: yearLabel,
          subject: subjectName,
          exam_type: getPeriodExamType(grade.exam_period_id),
          score_numeric: grade.score_percent,
          class_id: student.class,
          year_group: yearGroup,
        };
      })
      .filter((record): record is {
        student_id: string;
        student_name: string;
        academic_year: string;
        subject: string;
        exam_type: "Mid-Year" | "Year-End";
        score_numeric: number;
        class_id: string;
        year_group: string;
      } => record !== null);
  }, [
    boxPlotStudentAnalysis.gradeRows,
    boxPlotStudentAnalysis.rosterStudents,
    subjectIdToName,
    getPeriodExamType,
  ]);

  const boxPlotAssessmentRecords = useMemo(() => {
    return boxPlotViewMode === "student"
      ? studentBoxPlotAssessmentRecords
      : analysisAssessmentRecords;
  }, [boxPlotViewMode, studentBoxPlotAssessmentRecords, analysisAssessmentRecords]);

  const boxPlotStudentLookup = useMemo(() => {
    const records = boxPlotStudentsForClass.length > 0
      ? boxPlotStudentsForClass
      : boxPlotStudentAnalysis.rosterStudents;
    return new Map(records.map((student) => [student.id, student]));
  }, [boxPlotStudentsForClass, boxPlotStudentAnalysis.rosterStudents]);

  // Available years from data
  const availableBoxPlotYears = useMemo(
    () => getAvailableYears(boxPlotAssessmentRecords),
    [boxPlotAssessmentRecords]
  );

  useEffect(() => {
    if (availableBoxPlotYears.length === 0) return;
    const sorted = [...availableBoxPlotYears].sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
    const minYear = sorted[0];
    const maxYear = sorted[sorted.length - 1];
    setBoxPlotStartYear((prev) =>
      availableBoxPlotYears.includes(prev) ? prev : minYear
    );
    setBoxPlotEndYear((prev) => {
      const next = availableBoxPlotYears.includes(prev) ? prev : maxYear;
      if (parseInt(next) < parseInt(minYear)) return minYear;
      return next;
    });
  }, [availableBoxPlotYears]);

  useEffect(() => {
    if (!boxPlotStartYear || !boxPlotEndYear) return;
    if (parseInt(boxPlotEndYear) < parseInt(boxPlotStartYear)) {
      setBoxPlotEndYear(boxPlotStartYear);
    }
  }, [boxPlotStartYear, boxPlotEndYear]);

  const buildTwoExamComparison = useCallback(
    (periodAId: string, periodBId: string) => {
      return compareSubjects.map((subjectName) => {
        const subjectId = subjectNameToId.get(subjectName);
        if (!subjectId) {
          return { name: subjectName, examA: 0, examB: 0, delta: 0, improved: false };
        }
        const scoresA = classAnalysis.grades.filter(
          (grade) =>
            grade.academic_period_id === periodAId &&
            grade.subject_id === subjectId &&
            Number.isFinite(grade.total_marks)
        );
        const scoresB = classAnalysis.grades.filter(
          (grade) =>
            grade.academic_period_id === periodBId &&
            grade.subject_id === subjectId &&
            Number.isFinite(grade.total_marks)
        );
        const avgA =
          scoresA.length > 0
            ? Math.round(
                scoresA.reduce(
                  (sum, grade) => sum + (grade.total_marks as number),
                  0
                ) / scoresA.length
              )
            : 0;
        const avgB =
          scoresB.length > 0
            ? Math.round(
                scoresB.reduce(
                  (sum, grade) => sum + (grade.total_marks as number),
                  0
                ) / scoresB.length
              )
            : 0;
        const delta = avgA - avgB;
        return { name: subjectName, examA: avgA, examB: avgB, delta, improved: delta > 0 };
      });
    },
    [classAnalysis.grades, compareSubjects, subjectNameToId]
  );

  // Comparison chart data - now supports all selections
  const bandsComparisonChartData = useMemo(() => {
    return bandsGradeDistribution.map((item, index) => {
      const dataPoint: Record<string, number | string> = {
        grade: item.range,
        selectionA: item.count
      };
      bandsAdditionalSelections.forEach((selection, selIndex) => {
        dataPoint[`selection${selection.id}`] = bandsSelectionsData[selIndex]?.gradeDistribution[index]?.count || 0;
      });
      return dataPoint;
    });
  }, [bandsGradeDistribution, bandsAdditionalSelections, bandsSelectionsData]);

  // Category averages - computed from classAnalysis grades if available
  // Note: classAnalysis.grades contains the raw grade data with category breakdowns
  const categoryAverages = useMemo(() => {
    // For now, use static placeholders since we're focusing on subject averages
    // In future, this can be computed from classAnalysis raw grades
    return [
      { name: "Attitude", average: 0, max: 10, percentage: 0 },
      { name: "Homework", average: 0, max: 10, percentage: 0 },
      { name: "Quiz", average: 0, max: 10, percentage: 0 },
      { name: "Exam", average: 0, max: 70, percentage: 0 }
    ];
  }, []);
  const weakestCategory = categoryAverages[0];

  // Category performance by subject - placeholder for now
  const categoryMax = selectedCategory === "exam" ? 70 : 10;
  const categoryBySubjectData = useMemo(() => {
    // Placeholder - returns empty array until category breakdown is implemented
    return [];
  }, [selectedCategory]);

  // ============ REAL SUBJECT AVERAGES FROM classAnalysis ============
  // This is the key fix - use real Supabase data instead of mock data
  const subjectAverages = useMemo(() => {
    if (!classAnalysis.hasData) {
      return [];
    }
    
    // Map classAnalysis.subjectAverages to the expected format
    const mapped = classAnalysis.subjectAverages.map(sa => ({
      subjectId: sa.subjectId,
      name: sa.subjectName.length > 10 ? sa.subjectName.substring(0, 10) + "..." : sa.subjectName,
      fullName: sa.subjectName,
      average: sa.gradeCount > 0 ? sa.average : 0,
      cohortAvg:
        classAnalysis.cohortAveragesBySubjectId[sa.subjectId] ?? null,
    }));
    
    return mapped;
  }, [
    classAnalysis.subjectAverages,
    classAnalysis.hasData,
    classAnalysis.cohortAveragesBySubjectId,
  ]);
  
  const selectedStudentData = students.find(s => s.id === selectedStudent);

  // Year-over-year trend data from real grades, sliced by selected range
  const trendData = useMemo(() => {
    const data = classAnalysis.trendData;
    const rangeMap: Record<typeof trendPeriod, number> = {
      "1year": 2,
      "2years": 4,
      "3years": 6,
      "4years": 8,
      "5years": 10,
      "6years": 12,
    };
    const sliceCount = rangeMap[trendPeriod];
    if (data.length <= sliceCount) return data;
    return data.slice(-sliceCount);
  }, [classAnalysis.trendData, trendPeriod]);

  const trendSubjectKeys = useMemo(() => {
    const keys = new Set<string>();
    trendData.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key === "period" || key === "periodId" || key === "Average") return;
        keys.add(key);
      });
    });
    return Array.from(keys);
  }, [trendData]);

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
    const latest = trendData[trendData.length - 1];
    if (!latest) return [];

    const subjectList = trendSubjectKeys
      .map((key) => {
        const value = latest[key];
        if (typeof value !== "number") return null;
        return {
          name: key,
          subject: getTinySubjectCode(key),
          score: value,
          fullMark: 100,
        };
      })
      .filter(
        (item): item is { name: string; subject: string; score: number; fullMark: number } =>
          item !== null
      );

    return subjectList.filter((s) => trendsSelectedSubjects.includes(s.name));
  }, [trendData, trendSubjectKeys, trendsSelectedSubjects]);

  // Radar average for color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map(d => d.score);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [radarData]);

  // Calculate average per subject across the selected trend range
  const trendSubjectAverages = useMemo(() => {
    const subjectTotals: Record<string, { sum: number; count: number }> = {};

    trendData.forEach((entry) => {
      Object.entries(entry).forEach(([key, value]) => {
        if (key === "period" || key === "periodId" || key === "Average") return;
        if (typeof value !== "number") return;
        if (!subjectTotals[key]) {
          subjectTotals[key] = { sum: 0, count: 0 };
        }
        subjectTotals[key].sum += value;
        subjectTotals[key].count += 1;
      });
    });

    const averages: Record<string, number> = {};
    Object.entries(subjectTotals).forEach(([subject, { sum, count }]) => {
      averages[subject] = Math.round(sum / count);
    });
    
    return averages;
  }, [trendData]);

  // Subject vs Cohort Average data
  const subjectVsCohortData = useMemo(() => {
    const latest = trendData[trendData.length - 1];
    if (!latest) return [];
    
    // Build from all subjects in latest data
    const allSubjects: { name: string; fullName: string; classScore: number; cohortAvg: number; delta: number }[] = [];
    Object.entries(latest).forEach(([key, value]) => {
      if (key !== "period" && key !== "periodId" && key !== "Average" && typeof value === 'number') {
        const shortName = getShortSubjectName(key);
        const subjectId = subjectNameToId.get(key);
        const subjectCohortAvg =
          (subjectId !== undefined
            ? classAnalysis.cohortAveragesBySubjectId[subjectId]
            : undefined) ?? trendSubjectAverages[key] ?? value;
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
  }, [
    trendData,
    selectedSubjects,
    trendSubjectAverages,
    subjectNameToId,
    classAnalysis.cohortAveragesBySubjectId,
  ]);

  // Performance Heatmap data (filtered by selectedSubjects)
  const heatmapData = useMemo(() => {
    if (trendData.length === 0) return [];

    return trendSubjectKeys
      .filter((subject) => selectedSubjects.includes(subject))
      .map((subject) => ({
        subject: getShortSubjectName(subject).substring(0, 6),
        fullName: subject,
        scores: trendData.map((entry) => ({
          period: entry.period,
          score: typeof entry[subject] === "number" ? (entry[subject] as number) : null,
        })),
      }));
  }, [trendData, trendSubjectKeys, selectedSubjects]);

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
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" crossOrigin="anonymous" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>
        } />

      <div className="px-4 mt-4 pb-4">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
            <TabsTrigger value="entry">Grade Entry</TabsTrigger>
            <TabsTrigger value="analysis">Class Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            {/* Class, Subject & Academic Period Selection - FROM SUPABASE */}
            <div className="grid grid-cols-4 gap-2">
              <Select 
                value={gradeEntry.selectedClass || ""} 
                onValueChange={v => {
                  gradeEntry.setSelectedClass(v || null);
                  gradeEntry.setSelectedSubject(null);
                  setExpandedStudents([]);
                }}
              >
                <SelectTrigger>
                  {gradeEntry.loadingClasses ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Class" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {gradeEntry.classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  gradeEntry.selectedAcademicYear
                    ? String(gradeEntry.selectedAcademicYear)
                    : ""
                }
                onValueChange={(v) =>
                  gradeEntry.setSelectedAcademicYear(v ? Number(v) : null)
                }
                disabled={gradeEntry.availableAcademicYears.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {gradeEntry.availableAcademicYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={gradeEntry.selectedSubject?.id?.toString() || ""} 
                onValueChange={v => {
                  const subject = gradeEntry.subjects.find(s => s.id.toString() === v);
                  gradeEntry.setSelectedSubject(subject || null);
                  setExpandedStudents([]);
                }}
                disabled={!gradeEntry.selectedClass || gradeEntry.loadingSubjects}
              >
                <SelectTrigger>
                  {gradeEntry.loadingSubjects ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Subject" />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card max-h-60">
                  {gradeEntry.subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={gradeEntry.selectedPeriod?.id || ""} 
                onValueChange={v => {
                  const period = gradeEntry.academicPeriodsForYear.find(p => p.id === v);
                  gradeEntry.setSelectedPeriod(period || null);
                }}
                disabled={gradeEntry.academicPeriodsForYear.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {gradeEntry.academicPeriodsForYear.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                      {!period.is_open_for_grading && " (Closed)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grading Closed Banner */}
            {gradeEntry.selectedPeriod && !gradeEntry.selectedPeriod.is_open_for_grading && (
              <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Grading Closed
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                        This exam period is closed for grading. Contact an administrator to reopen it.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error display */}
            {gradeEntry.error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {gradeEntry.error}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Behavior/Awards - still uses local mock (linked via selectedEntrySubject) */}
            {selectedEntrySubject === "Homeroom Behavior" ? (
              <>
                {/* Behavior Header */}
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Homeroom Behavior</p>
                        <p className="text-sm text-muted-foreground">Class {stripCampusPrefix(selectedClass)} • {students.length} students</p>
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
                                      <p className="text-xs text-red-500">Not graded</p>
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

                <Button 
                  className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0 bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    toast.success(
                      "Behavior saved",
                      `Homeroom behavior for ${stripCampusPrefix(selectedClass)} has been saved.`
                    );
                  }}
                >
                  <Save className="h-6 w-6" />
                </Button>
              </>
            ) : selectedEntrySubject === "Awards" ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Award className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Awards entry uses local mode</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Select from dropdowns above for Supabase grades</p>
                </CardContent>
              </Card>
            ) : gradeEntry.selectedClass && gradeEntry.selectedSubject && gradeEntry.selectedPeriod ? (
              <>
                {/* Loading state for students/grades */}
                {(gradeEntry.loadingStudents || gradeEntry.loadingGrades) ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Loading students and grades...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Subject Header */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{gradeEntry.selectedSubject.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Class {stripCampusPrefix(gradeEntry.selectedClass)} • {gradeEntry.students.length} students • {gradeEntry.selectedPeriod.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Grades
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* CSV Export/Import Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-9"
                        onClick={async () => {
                          const csvContent = gradeEntry.generateTemplate();
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const result = await saveAndShareBlob(
                            blob,
                            `${gradeEntry.selectedClass}_${gradeEntry.selectedSubject?.name}_template.csv`,
                            "text/csv;charset=utf-8;"
                          );
                          if (!result.success) {
                            toast({
                              title: "Export failed. Please try again.",
                            });
                            return;
                          }
                          if (result.savedToDevice) {
                            toast({ title: "Saved to Downloads" });
                          }
                          
                          toast({
                            title: "Template Downloaded",
                            description: `CSV template for ${gradeEntry.selectedSubject?.name} has been downloaded.`,
                          });
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-9"
                        onClick={async () => {
                          const csvContent = gradeEntry.exportGrades();
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const result = await saveAndShareBlob(
                            blob,
                            `${gradeEntry.selectedClass}_${gradeEntry.selectedSubject?.name}_grades.csv`,
                            "text/csv;charset=utf-8;"
                          );
                          if (!result.success) {
                            toast({
                              title: "Export failed. Please try again.",
                            });
                            return;
                          }
                          if (result.savedToDevice) {
                            toast({ title: "Saved to Downloads" });
                          }
                          
                          toast({
                            title: "Grades Exported",
                            description: `${gradeEntry.selectedSubject?.name} grades for ${gradeEntry.selectedClass} exported to CSV.`,
                          });
                        }}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                        Export CSV
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                        <p className="text-lg font-bold text-emerald-600">{gradeEntry.stats.graded}</p>
                        <p className="text-[10px] text-muted-foreground">Graded</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-lg font-bold text-amber-600">{gradeEntry.stats.pending}</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                        <p className="text-lg font-bold text-blue-600">{gradeEntry.stats.total}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
                        <p className="text-lg font-bold text-purple-600">{gradeEntry.stats.graded > 0 ? gradeEntry.stats.average : '-'}</p>
                        <p className="text-[10px] text-muted-foreground">Avg</p>
                      </div>
                    </div>

                    {/* Class Study Recommendation - Master Field */}
                    <Card className="border-border bg-card">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                            <Users className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <label className="text-sm font-semibold text-foreground flex-1">
                            Study Recommendation
                          </label>
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 whitespace-nowrap">
                            Class-wide
                          </Badge>
                        </div>
                    <Textarea 
                      placeholder="Enter a study recommendation for all students in this subject..." 
                      value={gradeEntry.classRecommendation} 
                      maxLength={300}
                      onChange={e => {
                        const value = e.target.value;
                        if (value.length > 300) return;
                        gradeEntry.setClassRecommendation(value);
                      }} 
                      disabled={!gradeEntry.selectedPeriod?.is_open_for_grading}
                      className={cn(
                        "min-h-[60px] text-sm resize-none border-border bg-background",
                        !gradeEntry.selectedPeriod?.is_open_for_grading && "opacity-60 cursor-not-allowed"
                      )}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="text-xs h-7 px-3"
                          disabled={gradeEntry.savingClassRecommendation || !gradeEntry.selectedPeriod?.is_open_for_grading}
                          onClick={async () => {
                            const result = await gradeEntry.saveClassRecommendation();
                            if (result.success) {
                              toast.success("Class recommendation saved", "Class default saved successfully.");
                            } else {
                              toast.error(
                                "Save failed",
                                result.error || "Unable to save class recommendation."
                              );
                            }
                          }}
                        >
                          {gradeEntry.savingClassRecommendation ? "Saving..." : "Save"}
                        </Button>
                        {gradeEntry.classRecommendationUpdatedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            Saved {formatSavedAt(gradeEntry.classRecommendationUpdatedAt)}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {gradeEntry.classRecommendation.length}/300
                      </p>
                    </div>
                      </CardContent>
                    </Card>

                    {/* Student List for Grade Entry */}
                    <div className="space-y-2">
                      {gradeEntry.students.map(student => {
                        const isExpanded = expandedStudents.includes(student.id);
                        const input = gradeEntry.gradeInputs[student.id] || { attitude: "", homework: "", quiz: "", exam: "", reportComment: "", studyRecommendation: "", comment: "" };
                        const studentGradeRecord = gradeEntry.existingGrades.get(student.id);
                        const studentSavedAt = formatSavedAt(studentGradeRecord?.updated_at);
                        const attitude = parseInt(input.attitude) || 0;
                        const homework = parseInt(input.homework) || 0;
                        const quiz = parseInt(input.quiz) || 0;
                        const exam = parseInt(input.exam) || 0;
                        const total = attitude + homework + quiz + exam;
                        const letterGrade = getLetterGrade(total);
                        const hasData = input.attitude || input.homework || input.quiz || input.exam;
                        
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
                                        <p className={cn("font-semibold text-foreground truncate", isExpanded ? "text-lg" : "text-sm")}>{student.name}</p>
                                        {hasData && !isExpanded && (
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">Total: {total}</span>
                                            <Badge className={cn("text-[10px] px-1.5 py-0", letterGrade.color)}>
                                              {letterGrade.grade}
                                            </Badge>
                                          </div>
                                        )}
                                        {!hasData && !isExpanded && (
                                          <p className="text-xs text-red-500">Not graded</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasData && (
                                        <Badge className={cn("text-xs px-2 py-0.5", letterGrade.color)}>
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
                                  {/* Total & Grade Display */}
                                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                    <div>
                                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Score</p>
                                      <p className="text-2xl font-bold text-foreground">{total}<span className="text-sm text-muted-foreground">/100</span></p>
                                    </div>
                                    <div className={cn("w-12 h-12 rounded-full border flex items-center justify-center text-lg font-bold", letterGrade.color)}>
                                      {letterGrade.grade}
                                    </div>
                                  </div>

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
                                          value={input[cat.key as keyof typeof input] || ""} 
                                          onChange={e => {
                                            const val = e.target.value;
                                            const num = parseInt(val);
                                            if (val === "" || (num >= 0 && num <= cat.max)) {
                                              gradeEntry.updateGradeInput(student.id, cat.key as "attitude" | "homework" | "quiz" | "exam", val);
                                            }
                                          }} 
                                          disabled={!gradeEntry.selectedPeriod?.is_open_for_grading}
                                          className={cn(
                                            "text-center h-11 text-base font-medium",
                                            !gradeEntry.selectedPeriod?.is_open_for_grading && "opacity-60 cursor-not-allowed"
                                          )}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  {/* Comments Section */}
                                  <div className="space-y-3">
                                    {/* Report Card Comments */}
                                    <div>
                                      <label className="text-sm font-semibold text-foreground mb-1 block">
                                        Report Card Comments
                                      </label>
                                      <Textarea 
                                        placeholder="Comments visible on report card..." 
                                        value={input.reportComment} 
                                        maxLength={500}
                                        onChange={e => {
                                          if (e.target.value.length <= 500) {
                                            gradeEntry.updateGradeInput(student.id, "reportComment", e.target.value);
                                          }
                                        }} 
                                        disabled={!gradeEntry.selectedPeriod?.is_open_for_grading}
                                        className={cn(
                                          "min-h-[70px] text-sm resize-none border-border bg-background",
                                          !gradeEntry.selectedPeriod?.is_open_for_grading && "opacity-60 cursor-not-allowed"
                                        )}
                                      />
                                      <p className="text-[10px] text-muted-foreground text-right mt-1">
                                        {(input.reportComment || "").length}/500
                                      </p>
                                    </div>
                                    
                                    {/* Individual Study Recommendation */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <label className="text-sm font-semibold text-foreground">
                                          Study Recommendation
                                        </label>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600">
                                          Individual
                                        </Badge>
                                      </div>
                                      {gradeEntry.classRecommendation.trim() && (
                                        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50/70 px-2 py-1.5">
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <Users className="h-3 w-3 text-amber-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground">Class recommendation (shown to all):</span>
                                          </div>
                                          <p className="text-[11px] text-foreground">{gradeEntry.classRecommendation}</p>
                                        </div>
                                      )}
                                      <Textarea 
                                        placeholder="Enter individual study tips for this student..." 
                                        value={input.studyRecommendation}
                                        maxLength={300}
                                        onChange={e => {
                                          if (e.target.value.length <= 300) {
                                            gradeEntry.updateGradeInput(student.id, "studyRecommendation", e.target.value);
                                          }
                                        }} 
                                        disabled={!gradeEntry.selectedPeriod?.is_open_for_grading}
                                        className={cn(
                                          "min-h-[70px] text-sm resize-none border-border bg-background",
                                          !gradeEntry.selectedPeriod?.is_open_for_grading && "opacity-60 cursor-not-allowed"
                                        )}
                                      />
                                      <div className="flex items-center justify-between mt-1">
                                        {studentSavedAt ? (
                                          <p className="text-[10px] text-muted-foreground">Saved {studentSavedAt}</p>
                                        ) : (
                                          <span />
                                        )}
                                        <p className="text-[10px] text-muted-foreground text-right">
                                          {(input.studyRecommendation || "").length}/300
                                        </p>
                                      </div>
                                    </div>

                                    {/* Authentic Comments (Internal) - last */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <label className="text-sm font-semibold text-foreground">
                                          Authentic Comments
                                        </label>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-600">
                                          Internal
                                        </Badge>
                                      </div>
                                      <Textarea 
                                        placeholder="Internal notes - not visible to parents..." 
                                        value={input.comment} 
                                        onChange={e => gradeEntry.updateGradeInput(student.id, "comment", e.target.value.slice(0, 300))} 
                                        maxLength={300}
                                        disabled={!gradeEntry.selectedPeriod?.is_open_for_grading}
                                        className={cn(
                                          "min-h-[70px] text-sm resize-none border-border bg-background",
                                          !gradeEntry.selectedPeriod?.is_open_for_grading && "opacity-60 cursor-not-allowed"
                                        )}
                                      />
                                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">{(input.comment || "").length}/300</p>
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
                    {(() => {
                      const isGradingClosed = !gradeEntry.selectedPeriod?.is_open_for_grading;
                      const saveButton = (
                        <Button 
                          className={cn(
                            "fixed z-50 shadow-xl bottom-24 right-4",
                            isGradingClosed 
                              ? "h-12 px-4 rounded-full gap-2" 
                              : "h-14 w-14 rounded-full p-0"
                          )}
                          variant={isGradingClosed ? "secondary" : "default"}
                          disabled={gradeEntry.saving || isGradingClosed}
                          onClick={async () => {
                            if (isGradingClosed) {
                              return;
                            }
                            
                            const result = await gradeEntry.save();
                            if (result.success) {
                              toast.success(
                                "Grades saved",
                                `${gradeEntry.selectedSubject?.name} grades for ${gradeEntry.selectedClass} have been saved to database.`
                              );
                            } else {
                              const isClosedPeriodError = result.error?.includes('row-level security') || 
                                                           result.error?.includes('academic_periods');
                              toast.error(
                                isClosedPeriodError ? "Grading closed" : "Save failed",
                                isClosedPeriodError 
                                  ? `Grading is closed for ${gradeEntry.selectedPeriod?.name || 'this period'}. Contact admin to open grading.`
                                  : (result.error || "Failed to save grades. Please try again.")
                              );
                            }
                          }}
                        >
                          {gradeEntry.saving ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : isGradingClosed ? (
                            <>
                              <Lock className="h-4 w-4" />
                              <span className="text-sm font-medium">Grading Closed</span>
                            </>
                          ) : (
                            <Save className="h-6 w-6" />
                          )}
                        </Button>
                      );

                      return isGradingClosed ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            {saveButton}
                          </PopoverTrigger>
                          <PopoverContent 
                            side="top" 
                            align="end" 
                            className="w-64 p-3 bg-card border shadow-lg"
                          >
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Grading Period Closed</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {gradeEntry.selectedPeriod?.name} is currently closed for grading. Contact an administrator to reopen it.
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : saveButton;
                    })()}
                  </>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a class, subject, and period to start grading</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">All students will appear for quick mark entry</p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Academic Year:</span>
            <Select
              value={
                classAnalysis.selectedAcademicYear
                  ? String(classAnalysis.selectedAcademicYear)
                  : ""
              }
              onValueChange={(v) =>
                classAnalysis.setSelectedAcademicYear(v ? Number(v) : null)
              }
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {classAnalysis.availableAcademicYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Sub-tabs for Class Analysis */}
          <Tabs defaultValue="overview" className="w-full" onValueChange={(v) => setAnalysisSubTab(v as "overview" | "distribution" | "trends" | "comparison" | "boxplot")}>
              <TabsList className="grid w-full grid-cols-5 mb-4 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs">Bands</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Compare</TabsTrigger>
                <TabsTrigger value="boxplot" className="text-xs">Box Plot</TabsTrigger>
              </TabsList>

              {/* ==================== OVERVIEW SUB-TAB ==================== */}
              <TabsContent value="overview" className="space-y-4">
                {/* Loading State */}
                {classAnalysis.loading && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Loading class analysis data...</p>
                    </CardContent>
                  </Card>
                )}

                {/* Error State */}
                {classAnalysis.error && (
                  <Card className="border-destructive">
                    <CardContent className="p-6 text-center">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
                      <p className="text-sm text-destructive">{classAnalysis.error}</p>
                    </CardContent>
                  </Card>
                )}

                {!classAnalysis.loading && !classAnalysis.error && (
                  <>
                    {/* Filters Row - Class and Period selectors */}
                    <div className="flex gap-2">
                      {/* Class Dropdown */}
                      <Select 
                        value={classAnalysis.selectedClass || ""} 
                        onValueChange={(v) => classAnalysis.setSelectedClass(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.classes.length === 0 ? (
                            <SelectItem value="_none" disabled>No classes found</SelectItem>
                          ) : (
                            classAnalysis.classes.map((cls) => (
                              <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Academic Period Dropdown */}
                      <Select
                        value={classAnalysis.selectedPeriodId || ""}
                        onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.academicPeriodsForYear.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Empty State */}
                    {!classAnalysis.selectedClass && (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Select a class to view analysis</p>
                        </CardContent>
                      </Card>
                    )}

                    {classAnalysis.selectedClass && !classAnalysis.hasData && !classAnalysis.loadingData && (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center space-y-3">
                          <BarChart3 className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {classAnalysis.hasYearGrades
                              ? "No grades recorded for this exam period yet."
                              : "No grades recorded for the selected academic year yet."}
                          </p>
                          {!classAnalysis.hasYearGrades && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => gradeEntryRef.current?.scrollIntoView({ behavior: "smooth" })}
                            >
                              Go to Grade Entry
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {classAnalysis.selectedClass && classAnalysis.hasData && (
                      <>
                        {/* Subject Selector - Toggle Chips */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">Subjects ({classAnalysis.subjects.length})</h4>
                            <div className="flex gap-2">
                              <button
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                onClick={() => classAnalysis.selectAllSubjects()}
                              >
                                Select All
                              </button>
                              <button
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                onClick={() => classAnalysis.clearSubjects()}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                            {classAnalysis.subjects.map((subject) => {
                              const isSelected = classAnalysis.selectedSubjectIds.includes(subject.id);
                              return (
                                <button
                                  key={subject.id}
                                  onClick={() => classAnalysis.toggleSubject(subject.id)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  )}
                                >
                                  {subject.name.length > 15 ? subject.name.substring(0, 15) + "..." : subject.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                {/* Rising Subjects - Star pattern design like student page */}
                {classAnalysis.risingSubjects.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{
                    color: '#d97706'
                  }} /> Rising Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {classAnalysis.risingSubjects.map(item => <div key={item.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden" style={{
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
                      }}>+{item.change}%</span>
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

                {/* Subject Performance Bar Chart - Using real data from classAnalysis */}
                {!classAnalysis.hasData ? (
                  <div className="p-6 text-center border rounded-lg bg-muted/30">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {classAnalysis.hasYearGrades
                          ? "No grades recorded for this exam period yet."
                          : "No grades recorded for the selected academic year yet."}
                      </p>
                  </div>
                ) : subjectAverages.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg bg-muted/30">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No subject data available
                    </p>
                  </div>
                ) : (
                  <SubjectPerformanceChart 
                    data={subjectAverages.map((s, index) => ({
                      name: s.name,
                      fullName: s.fullName,
                      score: isNaN(s.average) ? 0 : Math.round(s.average),
                      goal: isNaN(s.average) ? 0 : Math.round(s.average),
                      cohortAvg:
                        typeof s.cohortAvg === "number" ? Math.round(s.cohortAvg) : undefined
                    }))}
                    lineColors={SUBJECT_COLORS}
                    showGoalBadge={false}
                    showCohortDot={true}
                    cohortLabel={classAnalysis.cohortYearLevel}
                    classLabel={classAnalysis.selectedClass}
                  />
                )}

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
                    <span className="text-[9px] text-muted-foreground/70">
                      {subjectAverages[0]?.average != null && !isNaN(subjectAverages[0].average) 
                        ? `${Math.round(subjectAverages[0].average)}%` 
                        : '0%'}
                    </span>
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
                      <span className="text-lg font-bold text-foreground">{rosterCount}</span>
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
                        {passCount}/{rosterCount}
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
                    <span className="text-[9px] text-muted-foreground/70">
                      {subjectAverages[subjectAverages.length - 1]?.average != null && !isNaN(subjectAverages[subjectAverages.length - 1].average) 
                        ? `${Math.round(subjectAverages[subjectAverages.length - 1].average)}%` 
                        : '0%'}
                    </span>
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

                {/* Generate Report Button - at bottom */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setOverviewReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                      </>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ==================== DISTRIBUTION SUB-TAB ==================== */}
              <TabsContent value="distribution" className="space-y-4">
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
                    {/* Row 1: Class + Academic Period (unified with Overview) */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedClass || ""} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Academic Period Dropdown (same as Overview) */}
                      <Select 
                        value={classAnalysis.selectedPeriodId || ""} 
                        onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                          <SelectContent className="bg-card">
                            {classAnalysis.academicPeriodsForYear.map((period) => (
                              <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Subject Filter - use real subjects from classAnalysis */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Subject:</span>
                      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                        {classAnalysis.subjects.length > 0 ? classAnalysis.subjects.map((subject) => (
                          <button
                            key={subject.id}
                            onClick={() => classAnalysis.setBandsSelectedSubjectId(subject.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                              classAnalysis.bandsSelectedSubjectId === subject.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {subject.name.length > 15 ? subject.name.substring(0, 15) + "..." : subject.name}
                          </button>
                        )) : (
                          <span className="text-xs text-muted-foreground">Select a class first</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Additional Selections - Only show when compare mode is on */}
                  {bandsCompareMode && bandsAdditionalSelections.map((selection, index) => {
                    const color = getSelectionColor(index + 1);
                    return (
                      <div key={selection.id} className={cn("space-y-3 p-3 rounded-lg", color.bg, color.border, "border")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                            <span className={cn("text-xs font-semibold", color.text)}>Selection {selection.id}</span>
                          </div>
                          {bandsAdditionalSelections.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setBandsAdditionalSelections(prev => prev.filter(s => s.id !== selection.id))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {/* Row 1: Class + Year + Exam Period */}
                        <div className="flex items-center gap-2">
                          <Select 
                            value={selection.className} 
                            onValueChange={(v) => setBandsAdditionalSelections(prev => 
                              prev.map(s => s.id === selection.id ? {...s, className: v} : s)
                            )}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              {classAnalysis.classes.map((cls) => (
                                <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Academic Period Dropdown */}
                          <Select 
                            value={classAnalysis.selectedPeriodId || ""} 
                            onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                          >
                            <SelectTrigger className="flex-1 h-9">
                              <SelectValue placeholder="Period" />
                            </SelectTrigger>
                              <SelectContent className="bg-card">
                                {classAnalysis.academicPeriodsForYear.map((period) => (
                                  <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Subject Filter - use real subjects */}
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-foreground">Subject:</span>
                          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                            {classAnalysis.subjects.map((subject) => {
                              const isSelected = selection.subject === subject.name;
                              return (
                                <button
                                  key={subject.id}
                                  onClick={() => {
                                    setBandsAdditionalSelections(prev => 
                                      prev.map(s => s.id === selection.id ? {...s, subject: subject.name} : s)
                                    );
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  )}
                                >
                                  {subject.name.length > 15 ? subject.name.substring(0, 15) + "..." : subject.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add Selection Button */}
                  {bandsCompareMode && bandsAdditionalSelections.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-dashed"
                      onClick={() => {
                        const existingIds = ["A", ...bandsAdditionalSelections.map(s => s.id)];
                        const newId = getNextSelectionId(existingIds);
                        const firstSubject = classAnalysis.subjects[0]?.name || "Mathematics";
                        setBandsAdditionalSelections(prev => [...prev, {
                          id: newId,
                          className: classAnalysis.classes[0] || "",
                          year: academicYears[0],
                          period: "midYear",
                          subject: firstSubject
                        }]);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Selection {getNextSelectionId(["A", ...bandsAdditionalSelections.map(s => s.id)])}
                    </Button>
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
                      </div>
                      {/* Dynamic Legend */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSelectionColor(0).hex }} />
                          <span className="text-[10px] text-muted-foreground">{selectedClass} - {bandsSelectedSubject}</span>
                        </div>
                        {bandsAdditionalSelections.map((selection, index) => {
                          const color = getSelectionColor(index + 1);
                          return (
                            <div key={selection.id} className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                              <span className="text-[10px] text-muted-foreground">{selection.className} - {selection.subject}</span>
                            </div>
                          );
                        })}
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
                              formatter={(value: number, name: string) => {
                                if (name === "selectionA") {
                                  return [`${value} students`, `${selectedClass} - ${bandsSelectedSubject}`];
                                }
                                const selId = name.replace("selection", "");
                                const selection = bandsAdditionalSelections.find(s => s.id === selId);
                                return [`${value} students`, selection ? `${selection.className} - ${selection.subject}` : name];
                              }}
                            />
                            <Bar dataKey="selectionA" fill={getSelectionColor(0).hex} radius={[4, 4, 0, 0]} name="selectionA" />
                            {bandsAdditionalSelections.map((selection, index) => (
                              <Bar 
                                key={selection.id} 
                                dataKey={`selection${selection.id}`} 
                                fill={getSelectionColor(index + 1).hex} 
                                radius={[4, 4, 0, 0]} 
                                name={`selection${selection.id}`} 
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stacked Comparison Cards for Mobile - Dynamic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Selection A Distribution */}
                      <div className="space-y-2 p-3 rounded-lg" style={{
                        backgroundColor: `${getSelectionColor(0).hex}10`,
                        borderWidth: 1,
                        borderColor: `${getSelectionColor(0).hex}40`
                      }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSelectionColor(0).hex }} />
                          <span className="text-xs font-semibold" style={{ color: getSelectionColor(0).hex }}>{selectedClass} - {bandsSelectedSubject}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {bandsGradeDistribution.map(g => {
                            const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                            return (
                              <div 
                                key={g.range} 
                                className="flex flex-col items-center p-1.5 rounded-md border bg-background"
                                style={{ borderColor: `${getSelectionColor(0).hex}30` }}
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
                        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: `${getSelectionColor(0).hex}30` }}>
                          <span>Top: {bandsTopPerformers.length}</span>
                          <span>Middle: {bandsMiddlePerformers.length}</span>
                          <span>At-Risk: {bandsAtRiskStudents.length}</span>
                        </div>
                      </div>

                      {/* Dynamic Additional Selection Distribution Cards */}
                      {bandsAdditionalSelections.map((selection, index) => {
                        const color = getSelectionColor(index + 1);
                        const selectionData = bandsSelectionsData[index];
                        const gradeDistribution = selectionData?.gradeDistribution || [];
                        const topPerformers = selectionData?.topPerformers || [];
                        const middlePerformers = selectionData?.middlePerformers || [];
                        const atRiskStudents = selectionData?.atRiskStudents || [];

                        return (
                          <div 
                            key={selection.id} 
                            className="space-y-2 p-3 rounded-lg"
                            style={{
                              backgroundColor: `${color.hex}10`,
                              borderWidth: 1,
                              borderColor: `${color.hex}40`
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                              <span className="text-xs font-semibold" style={{ color: color.hex }}>{selection.className} - {selection.subject}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {gradeDistribution.map(g => {
                                const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                return (
                                  <div 
                                    key={g.range} 
                                    className="flex flex-col items-center p-1.5 rounded-md border bg-background"
                                    style={{ borderColor: `${color.hex}30` }}
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
                            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: `${color.hex}30` }}>
                              <span>Top: {topPerformers.length}</span>
                              <span>Middle: {middlePerformers.length}</span>
                              <span>At-Risk: {atRiskStudents.length}</span>
                            </div>
                          </div>
                        );
                      })}
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
                          onClick={async () => {
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
                            const result = await saveAndShareBlob(
                              blob,
                              `grade-distribution-${selectedClass}-${bandsSelectedSubject}-${new Date().toISOString().split('T')[0]}.csv`,
                              "text/csv;charset=utf-8;"
                            );
                            if (!result.success) {
                              toast({
                                title: "Export failed. Please try again.",
                              });
                            } else if (result.savedToDevice) {
                              toast({ title: "Saved to Downloads" });
                            }
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
                            handleReportPdfExport(
                              bandsReportRef,
                              `grade-distribution-${selectedClass}-${bandsSelectedSubject}-${new Date().toISOString().split('T')[0]}`
                            );
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
                        {/* Report Header - Dual Logo Style */}
                        <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                          <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Grade Distribution Report</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                              {bandsCompareMode ? "Class Comparison Analysis" : `Class ${stripCampusPrefix(selectedClass)} - ${bandsSelectedSubject}`}
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                              Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {' • '}{selectedYear} {selectedPeriod === 'midYear' ? 'Mid-Year' : 'Year-End'} Examination
                            </div>
                          </div>
                          <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
                        </div>

                        {!bandsCompareMode ? (
                          /* Normal Report - Professional Redesign */
                          <>
                            {/* Grade Distribution Bar Chart - SVG for print */}
                            <div className="section" style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                                <span style={{ color: '#065f46' }}><IconBarChart /></span>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Grade Distribution - {bandsSelectedSubject}</h3>
                              </div>
                              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <svg width="100%" height="140" viewBox="0 0 500 140" preserveAspectRatio="xMidYMid meet">
                                  {/* Grid lines */}
                                  <line x1="40" y1="100" x2="460" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                                  {/* Bars */}
                                  {(() => {
                                    const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                    const maxCount = Math.max(...bandsGradeDistribution.map(d => d.count), 1);
                                    return bandsGradeDistribution.map((g, i) => {
                                      const barWidth = 60;
                                      const x = 50 + i * 70;
                                      const barHeight = (g.count / maxCount) * 75;
                                      const y = 100 - barHeight;
                                      const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                      return (
                                        <g key={g.range}>
                                          <defs>
                                            <linearGradient id={`gradeGradient${g.range}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                              <stop offset="0%" stopColor={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} stopOpacity="1" />
                                              <stop offset="100%" stopColor={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} stopOpacity="0.7" />
                                            </linearGradient>
                                          </defs>
                                          <rect x={x} y={y} width={barWidth} height={barHeight} fill={`url(#gradeGradient${g.range})`} rx="4" />
                                          <text x={x + barWidth / 2} y={y - 6} fontSize="11" fill="#374151" textAnchor="middle" fontWeight="700">{g.count}</text>
                                          <text x={x + barWidth / 2} y="115" fontSize="12" fill={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} textAnchor="middle" fontWeight="700">{g.range}</text>
                                          <text x={x + barWidth / 2} y="128" fontSize="9" fill="#6b7280" textAnchor="middle">{percentage}%</text>
                                        </g>
                                      );
                                    });
                                  })()}
                                </svg>
                              </div>
                            </div>

                            {/* Summary Stats with Watermarks */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '14px', pageBreakInside: 'avoid' }}>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{bandsRankedStudents.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{bandsRankedStudents.length}</div>
                                  <div style={{ fontSize: '8px', color: '#1d4ed8' }}>Total</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#f3e8ff', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#9333ea', opacity: 0.15 }}>{bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#9333ea' }}>{bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%</div>
                                  <div style={{ fontSize: '8px', color: '#6b21a8' }}>Pass Rate</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{bandsTopPerformers.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{bandsTopPerformers.length}</div>
                                  <div style={{ fontSize: '8px', color: '#166534' }}>Top (A*/A)</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{bandsMiddlePerformers.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{bandsMiddlePerformers.length}</div>
                                  <div style={{ fontSize: '8px', color: '#1d4ed8' }}>Middle (B/C)</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#ef4444', opacity: 0.15 }}>{bandsAtRiskStudents.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{bandsAtRiskStudents.length}</div>
                                  <div style={{ fontSize: '8px', color: '#991b1b' }}>At-Risk (D/E)</div>
                                </div>
                              </div>
                            </div>

                            {/* Student Lists - All students shown for printing */}
                            <div className="performers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '1px solid #fde047' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #fde047' }}>
                                  <span style={{ color: '#ca8a04' }}><IconTrophy /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#ca8a04', margin: 0 }}>Top Performers ({bandsTopPerformers.length})</h4>
                                </div>
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
                              
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #93c5fd' }}>
                                  <span style={{ color: '#2563eb' }}><IconBook /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#1d4ed8', margin: 0 }}>Middle Performers ({bandsMiddlePerformers.length})</h4>
                                </div>
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
                              
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                                  <span style={{ color: '#dc2626' }}><IconTarget /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', margin: 0 }}>At-Risk ({bandsAtRiskStudents.length})</h4>
                                </div>
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

                            {/* Footer - Professional Style */}
                            <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                            </div>
                          </>
                        ) : (
                          /* Comparison Report */
                          <>
                            {/* Grade Comparison Chart for Report */}
                            <div className="section" style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
                              <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>
                                Grade Comparison Chart
                              </h3>
                              {/* Dynamic Legend */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getSelectionColor(0).hex }} />
                                  <span style={{ fontSize: '9px', color: '#666' }}>{selectedClass} - {bandsSelectedSubject}</span>
                                </div>
                                {bandsAdditionalSelections.map((selection, index) => {
                                  const color = getSelectionColor(index + 1);
                                  return (
                                    <div key={selection.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color.hex }} />
                                      <span style={{ fontSize: '9px', color: '#666' }}>{selection.className} - {selection.subject}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ height: '200px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={bandsComparisonChartData} barGap={2} margin={{ left: 5, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#374151" }} />
                                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} width={30} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px"
                                      }}
                                      formatter={(value: number, name: string) => {
                                        if (name === "selectionA") {
                                          return [`${value} students`, `${selectedClass} - ${bandsSelectedSubject}`];
                                        }
                                        const selId = name.replace("selection", "");
                                        const selection = bandsAdditionalSelections.find(s => s.id === selId);
                                        return [`${value} students`, selection ? `${selection.className} - ${selection.subject}` : name];
                                      }}
                                    />
                                    <Bar dataKey="selectionA" fill={getSelectionColor(0).hex} radius={[4, 4, 0, 0]} name="selectionA" />
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <Bar 
                                        key={selection.id} 
                                        dataKey={`selection${selection.id}`} 
                                        fill={getSelectionColor(index + 1).hex} 
                                        radius={[4, 4, 0, 0]} 
                                        name={`selection${selection.id}`} 
                                      />
                                    ))}
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(bandsAdditionalSelections.length + 1, 2)}, 1fr)`, gap: '12px' }}>
                              {/* Selection A - Primary */}
                              <div className="comparison-box" style={{ padding: '10px', borderRadius: '6px', backgroundColor: `${getSelectionColor(0).hex}15`, border: `1px solid ${getSelectionColor(0).hex}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getSelectionColor(0).hex }} />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: getSelectionColor(0).hex }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: `1px solid ${getSelectionColor(0).hex}40` }}>
                                  <span>Top: {bandsTopPerformers.length}</span>
                                  <span>Middle: {bandsMiddlePerformers.length}</span>
                                  <span>At-Risk: {bandsAtRiskStudents.length}</span>
                                </div>
                              </div>

                              {/* Dynamic Additional Selections */}
                              {bandsAdditionalSelections.map((selection, index) => {
                                const color = getSelectionColor(index + 1);
                                const selectionData = bandsSelectionsData[index];
                                const gradeDistribution = selectionData?.gradeDistribution || [];
                                const topPerformers = selectionData?.topPerformers || [];
                                const middlePerformers = selectionData?.middlePerformers || [];
                                const atRiskStudents = selectionData?.atRiskStudents || [];

                                return (
                                  <div key={selection.id} className="comparison-box" style={{ padding: '10px', borderRadius: '6px', backgroundColor: `${color.hex}15`, border: `1px solid ${color.hex}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color.hex }} />
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: color.hex }}>
                                        {selection.className} - {selection.subject}
                                      </span>
                                    </div>
                                    <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '10px' }}>
                                      {gradeDistribution.map(g => {
                                        const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: `1px solid ${color.hex}40` }}>
                                      <span>Top: {topPerformers.length}</span>
                                      <span>Middle: {middlePerformers.length}</span>
                                      <span>At-Risk: {atRiskStudents.length}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Comparison Summary */}
                            <div className="stats-box" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px', marginTop: '12px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>Comparison Summary</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 6px', backgroundColor: '#e5e5e5' }}>Metric</th>
                                    <th style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: getSelectionColor(0).hex }}>{selectedClass}</th>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <th key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: getSelectionColor(index + 1).hex }}>{selection.className}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Total Students</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsRankedStudents.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsSelectionsData[index]?.rankedStudents?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Top Performers (A*/A)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsTopPerformers.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsSelectionsData[index]?.topPerformers?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Middle Performers (B/C)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsMiddlePerformers.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsSelectionsData[index]?.middlePerformers?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>At-Risk (D/E)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsAtRiskStudents.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsSelectionsData[index]?.atRiskStudents?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Passing Rate (≥50%)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                      {bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%
                                    </td>
                                    {bandsAdditionalSelections.map((selection, index) => {
                                      const rankedStudents = bandsSelectionsData[index]?.rankedStudents || [];
                                      const passingRate = rankedStudents.length > 0 ? Math.round((rankedStudents.filter(s => s.score >= 50).length / rankedStudents.length) * 100) : 0;
                                      return (
                                        <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                          {passingRate}%
                                        </td>
                                      );
                                    })}
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

                {/* Generate Report Button - at bottom */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setBandsReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </TabsContent>

              {/* ==================== TRENDS SUB-TAB ==================== */}
              <TabsContent value="trends" className="space-y-4">
                {/* Current Score Header - Moomoo Style */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 border border-border/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5 truncate">
                        {trendsSelectedSubjects.length === subjects.length ? `Class ${stripCampusPrefix(selectedClass)} Average` : `${trendsSelectedSubjects.length} Subject${trendsSelectedSubjects.length > 1 ? 's' : ''} Selected`}
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
                    {/* Class Selector - uses unified state from classAnalysis */}
                    <Select value={selectedClass || ""} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classAnalysis.classes.map(cls => <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Period Toggle */}
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg flex-1">
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
                  }) => <button key={key} onClick={() => setTrendPeriod(key)} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${trendPeriod === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {label}
                      </button>)}
                  </div>
                </div>

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
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        Range: <span className="font-medium text-foreground">{trendData.length} periods</span>
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Chart View Switcher */}
                        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                          <button
                            onClick={() => setChartViewMode("single")}
                            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                              chartViewMode === "single"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Average
                          </button>
                          <button
                            onClick={() => setChartViewMode("multiple")}
                            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                              chartViewMode === "multiple"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Individual
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">← Swipe • Pinch to zoom →</p>
                      {chartZoom !== 1 && (
                        <div className="flex items-center gap-2">
                          <button onClick={resetZoom} className="text-[10px] text-primary underline">
                            Reset zoom
                          </button>
                          <p className="text-[10px] text-muted-foreground">{`${Math.round(chartZoom * 100)}%`}</p>
                        </div>
                      )}
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
                        {chartViewMode === "single" ? (
                          <AreaChart data={trendData} margin={{
                            top: 10,
                            right: isMobile ? 10 : 20,
                            left: isMobile ? -15 : 0,
                            bottom: 20
                          }}>
                            <defs>
                              <linearGradient id="gradientGreenTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="gradientRedTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="gradientBlueTrend" x1="0" y1="0" x2="0" y2="1">
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
                            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "Pass", fontSize: 9, fill: "#f59e0b", position: "insideTopLeft" }} />
                            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "A", fontSize: 9, fill: "#22c55e", position: "insideTopLeft" }} />
                            <ReferenceLine y={70} stroke="hsl(var(--foreground))" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Goal", fontSize: 9, fill: "hsl(var(--foreground))", position: "insideTopLeft" }} />
                            
                            {trendsSelectedSubjects.length === 1 ? (
                              <Area
                                type="monotone"
                                dataKey={trendsSelectedSubjects[0]}
                                stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"}
                                strokeWidth={2.5}
                                fill={trendDirection.direction === "up" ? "url(#gradientGreenTrend)" : trendDirection.direction === "down" ? "url(#gradientRedTrend)" : "url(#gradientBlueTrend)"}
                                dot={{
                                  fill: trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6",
                                  strokeWidth: 0,
                                  r: 5
                                }}
                                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                                connectNulls
                              />
                            ) : (
                              <Area
                                type="monotone"
                                dataKey="Average"
                                stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"}
                                strokeWidth={2.5}
                                fill={trendDirection.direction === "up" ? "url(#gradientGreenTrend)" : trendDirection.direction === "down" ? "url(#gradientRedTrend)" : "url(#gradientBlueTrend)"}
                                dot={{
                                  fill: trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6",
                                  strokeWidth: 0,
                                  r: 5
                                }}
                                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                                connectNulls
                              />
                            )}
                          </AreaChart>
                        ) : (
                          <LineChart data={trendData} margin={{
                            top: 10,
                            right: isMobile ? 10 : 20,
                            left: isMobile ? -15 : 0,
                            bottom: 20
                          }}>
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
                            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "Pass", fontSize: 9, fill: "#f59e0b", position: "insideTopLeft" }} />
                            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "A", fontSize: 9, fill: "#22c55e", position: "insideTopLeft" }} />
                            <ReferenceLine y={70} stroke="hsl(var(--foreground))" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Goal", fontSize: 9, fill: "hsl(var(--foreground))", position: "insideTopLeft" }} />

                            {trendsSelectedSubjects.map((subject) => {
                              const color = getSubjectColor(subject);
                              return (
                                <Line
                                  key={subject}
                                  type="monotone"
                                  dataKey={subject}
                                  stroke={color}
                                  strokeWidth={2}
                                  dot={{ fill: color, strokeWidth: 0, r: 3 }}
                                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                                  connectNulls
                                />
                              );
                            })}
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Individual subject legend when in multiple mode */}
                  {chartViewMode === "multiple" && trendsSelectedSubjects.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {trendsSelectedSubjects.map((subject) => (
                        <div key={subject} className="flex items-center gap-1.5 px-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getSubjectColor(subject) }}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            {getTinySubjectCode(subject)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exam List for Selected Period */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Exams in selected period
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {trendData.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-0.5 rounded bg-muted/50 text-[11px] font-medium text-muted-foreground"
                      >
                        {item.period}
                      </div>
                    ))}
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
                    {risingSubjects.length === 0 && fallingSubjects.length === 0 && <>Performance is stable across all subjects for Class {stripCampusPrefix(selectedClass)}.</>}
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

                {/* Class vs Cohort Average - Using responsive chart component */}
                <SubjectPerformanceChart 
                  data={subjectVsCohortData.map((s) => ({
                    name: s.name,
                    fullName: s.fullName || s.name,
                    score: s.classScore,
                    goal: s.cohortAvg,
                    cohortAvg: s.cohortAvg
                  }))}
                  lineColors={SUBJECT_COLORS}
                  title="Class versus Cohort Average"
                  showGoalBadge={false}
                  showCohortDot={true}
                  cohortLabel={classAnalysis.cohortYearLevel}
                  classLabel={classAnalysis.selectedClass}
                />

                {/* Performance Heatmap */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance Heatmap
                  </h4>
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Scores across available periods
                  </p>
                  <div className="flex gap-2">
                    <div className="w-20 shrink-0">
                      <div className="h-6 mb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center pr-2 border-r border-border bg-card">
                        Subject
                      </div>
                      {(heatmapExpanded ? heatmapData : heatmapData.slice(0, 6)).map(row => (
                        <div key={row.subject} className="h-7 mb-1 text-[10px] font-medium text-foreground truncate pr-2 flex items-center border-r border-border bg-card">
                          {row.subject}
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-max pr-2">
                        {/* Header row with periods */}
                        <div className="flex gap-1 mb-1">
                          {heatmapData[0]?.scores.map(s => (
                            <div key={s.period} className="w-20 h-6 text-center text-[9px] font-medium text-muted-foreground px-1 flex items-center justify-center whitespace-nowrap">
                              {s.period}
                            </div>
                          ))}
                        </div>
                        {/* Subject rows */}
                        {(heatmapExpanded ? heatmapData : heatmapData.slice(0, 6)).map(row => (
                          <div key={row.subject} className="flex gap-1 mb-1">
                            {row.scores.map((cell, idx) => (
                              <div
                                key={idx}
                                className="w-20 h-7 rounded flex items-center justify-center text-[10px] font-semibold text-white transition-all hover:scale-105 cursor-default whitespace-nowrap"
                                style={{
                                  backgroundColor: getHeatmapColor(cell.score),
                                  opacity: cell.score === null ? 0.3 : 1
                                }}
                                title={`${row.fullName} - ${cell.period}: ${cell.score ?? 'N/A'}%`}
                              >
                                {cell.score ?? "–"}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* View More Button */}
                  {heatmapData.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setHeatmapExpanded(!heatmapExpanded)}
                    >
                      {heatmapExpanded ? "View Less" : `View More (${heatmapData.length - 6} more subjects)`}
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${heatmapExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  )}
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-[9px] text-muted-foreground mr-1">Low</span>
                    {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"].map((color, i) => <div key={i} className="w-4 h-3 rounded-sm" style={{
                    backgroundColor: color
                  }} />)}
                    <span className="text-[9px] text-muted-foreground ml-1">High</span>
                  </div>
                </div>

                {/* Generate Report Button - at bottom */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setTrendsReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </TabsContent>

              {/* ==================== COMPARISON SUB-TAB ==================== */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Dynamic Exam Selectors */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {examSelections.map((exam, index) => {
                      const color = getSelectionColor(index);
                      return (
                        <div key={exam.id} className="flex-1 min-w-[140px] space-y-2 p-3 rounded-xl border" style={{
                          backgroundColor: color.bgHex,
                          borderColor: color.borderHex
                        }}>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: color.hex }}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                              Exam {exam.id}
                            </label>
                            {examSelections.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => setExamSelections(prev => prev.filter(e => e.id !== exam.id))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Select 
                            value={exam.className} 
                            onValueChange={(v) => setExamSelections(prev => 
                              prev.map(e => e.id === exam.id ? {...e, className: v} : e)
                            )}
                          >
                            <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              {classAnalysis.classes.map(cls => <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                            <Select 
                              value={exam.periodId} 
                              onValueChange={(v) => setExamSelections(prev => 
                                prev.map(e => e.id === exam.id ? {...e, periodId: v} : e)
                              )}
                            >
                              <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                                <SelectValue placeholder="Exam Period" />
                              </SelectTrigger>
                              <SelectContent className="bg-card">
                                {classAnalysis.academicPeriodsForYear.map((period) => (
                                  <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Add Exam Button */}
                  {examSelections.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-dashed"
                        onClick={() => {
                          const existingIds = examSelections.map(e => e.id);
                          const newId = getNextSelectionId(existingIds);
                          setExamSelections(prev => [...prev, {
                            id: newId,
                            className: classAnalysis.classes[0] || "",
                            periodId: classAnalysis.academicPeriodsForYear[0]?.id || ""
                          }]);
                        }}
                      >
                      <Plus className="h-3 w-3" />
                      Add Exam {getNextSelectionId(examSelections.map(e => e.id))}
                    </Button>
                  )}
                </div>

                {/* Subject Multi-Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Subjects</label>
                      <div className="flex gap-2">
                        <button className="text-xs font-medium text-foreground hover:text-primary transition-colors" onClick={() => setCompareSubjects([...compareSubjectOptions])}>
                          Select All
                        </button>
                        <button className="text-xs font-medium text-foreground hover:text-primary transition-colors" onClick={() => setCompareSubjects(compareSubjectOptions.length > 0 ? [compareSubjectOptions[0]] : [])}>
                          Clear
                        </button>
                      </div>
                    </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                    {/* Grouped subject pills with mobile-friendly drawers */}
                    {subjectGroups.map(group => (
                      <SubjectGroupPill
                        key={group.baseName}
                        baseName={group.baseName}
                        shortName={group.shortName}
                        variants={group.variants || []}
                        selectedSubjects={compareSubjects}
                        onToggle={subjectName => {
                          if (compareSubjects.includes(subjectName)) {
                            if (compareSubjects.length > 1) {
                              setCompareSubjects(prev => prev.filter(s => s !== subjectName));
                            }
                          } else {
                            setCompareSubjects(prev => [...prev, subjectName]);
                          }
                        }}
                      />
                    ))}
                    {/* Subject count badge */}
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {compareSubjects.length}/{compareSubjectOptions.length}
                      </span>
                  </div>
                </div>

                {/* Comparison Content */}
                {(() => {
                  const getExamLabelForComparison = (cls: string, periodId: string) => {
                    return `${cls} ${getPeriodLabel(periodId)}`;
                  };

                  const allExamData = examSelections.map((exam, index) => {
                    const label = getExamLabelForComparison(exam.className, exam.periodId);
                    const color = getSelectionColor(index);
                    const gradeCount = compareGradesByPeriod.get(exam.periodId)?.length || 0;
                    return { id: exam.id, label, color, className: exam.className, periodId: exam.periodId, gradeCount };
                  });

                  if (compareSubjectIds.length === 0) {
                    return <Card className="bg-muted/30">
                          <CardContent className="p-8 text-center">
                            <Scale className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">Select at least one subject to compare</p>
                          </CardContent>
                        </Card>;
                  }

                  const emptyExam = allExamData.find((exam) => exam.gradeCount === 0);
                  if (emptyExam) {
                    return <Card className="bg-muted/30">
                          <CardContent className="p-8 text-center">
                            <Scale className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">No grades found for {emptyExam.label}</p>
                          </CardContent>
                        </Card>;
                  }

                  const comparisonData = compareSubjects.map(subjectName => {
                    const dataPoint: Record<string, any> = { name: subjectName };
                    const subjectId = subjectNameToId.get(subjectName);
                    examSelections.forEach((exam) => {
                      if (!subjectId) {
                        dataPoint[`exam${exam.id}`] = 0;
                        return;
                      }
                      const subjectGrades = classAnalysis.grades.filter(
                        (grade) =>
                          grade.academic_period_id === exam.periodId &&
                          grade.subject_id === subjectId &&
                          Number.isFinite(grade.total_marks)
                      );
                      const sum = subjectGrades.reduce(
                        (acc, grade) => acc + (grade.total_marks as number),
                        0
                      );
                      dataPoint[`exam${exam.id}`] =
                        subjectGrades.length > 0
                          ? Math.round(sum / subjectGrades.length)
                          : 0;
                    });
                    if (examSelections.length >= 2) {
                      dataPoint.delta =
                        (dataPoint[`exam${examSelections[0].id}`] || 0) -
                        (dataPoint[`exam${examSelections[1].id}`] || 0);
                      dataPoint.improved = dataPoint.delta > 0;
                    }
                    return dataPoint;
                  });

                // Calculate averages for all exams
                const examAverages = examSelections.map(exam => {
                  const sum = comparisonData.reduce((acc, d) => acc + (d[`exam${exam.id}`] || 0), 0);
                  return {
                    id: exam.id,
                    avg: comparisonData.length > 0 ? Math.round(sum / comparisonData.length) : 0
                  };
                });

                // Backward compatibility labels
                const examALabel = allExamData[0]?.label || "";
                const examBLabel = allExamData[1]?.label || "";

                return <>
                      {/* Comparison Summary Cards - Dynamic for all exams */}
                      <div className="overflow-x-auto pb-2 -mx-1 px-1">
                        <div className="flex items-center gap-2" style={{ minWidth: examSelections.length > 2 ? `${examSelections.length * 140}px` : 'auto' }}>
                          {examSelections.map((exam, index) => {
                            const color = getSelectionColor(index);
                            const avg = examAverages.find(a => a.id === exam.id)?.avg || 0;
                            const label = allExamData[index]?.label || "";
                            
                            return (
                              <React.Fragment key={exam.id}>
                                {index > 0 && (
                                  <div className="flex flex-col items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-muted-foreground">vs</span>
                                  </div>
                                )}
                                <div 
                                  className="flex-1 min-w-[120px] p-3 rounded-xl border"
                                  style={{
                                    background: `linear-gradient(to bottom right, ${color.hex}15, ${color.hex}08)`,
                                    borderColor: `${color.hex}30`
                                  }}
                                >
                                  <div className="mb-1.5">
                                    <span className="text-xs font-semibold text-foreground">Exam {exam.id}</span>
                                    <p className="text-[9px] text-muted-foreground truncate">{label}</p>
                                  </div>
                                  <p className="text-xl font-bold text-foreground">{avg}%</p>
                                  <p className="text-[9px] text-muted-foreground">Average</p>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top 5 Growth/Decline Leaders - Swipeable Carousel */}
                      {examSelections.length >= 2 && (() => {
                        // Get first two exam IDs for comparison
                        const examAId = examSelections[0].id;
                        const examBId = examSelections[1].id;
                        
                        const top5Growth = [...comparisonData]
                          .filter(item => item.delta > 0)
                          .sort((a, b) => b.delta - a.delta)
                          .slice(0, 5);
                        const top5Decline = [...comparisonData]
                          .filter(item => item.delta < 0)
                          .sort((a, b) => a.delta - b.delta)
                          .slice(0, 3);

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
                                          <p className="text-[10px] text-muted-foreground">A vs B comparison</p>
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
                                            const examBScore = item[`exam${examBId}`] || 0;
                                            const percentChange = examBScore > 0 ? (item.delta / examBScore * 100).toFixed(0) : '0';
                                            return (
                                              <div key={item.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                                                <span className="text-[10px] font-medium text-foreground">{shortenSubjectName(item.name)}</span>
                                                <span className="text-[10px] font-bold text-emerald-600">+{percentChange}%</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Bar Chart - All exams comparison */}
                                        <div className="h-36 -mx-2">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                              data={top5Growth.map(item => {
                                                const dataPoint: Record<string, any> = { name: shortenSubjectName(item.name) };
                                                examSelections.forEach(exam => {
                                                  dataPoint[`exam${exam.id}`] = item[`exam${exam.id}`] || 0;
                                                });
                                                dataPoint.delta = item.delta;
                                                return dataPoint;
                                              })} 
                                              margin={{ top: 10, right: 10, left: 10, bottom: 0 }} 
                                              barGap={2} 
                                              barCategoryGap="20%"
                                            >
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} height={30} />
                                              <YAxis hide domain={[0, 100]} />
                                              <Tooltip content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                                      <p className="text-xs font-medium text-foreground">{data.name}</p>
                                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {examSelections.map((exam, idx) => {
                                                          const color = getSelectionColor(idx);
                                                          return (
                                                            <span key={exam.id} className="text-[10px]" style={{ color: color.hex }}>
                                                              {exam.id}: {data[`exam${exam.id}`]}
                                                            </span>
                                                          );
                                                        })}
                                                      </div>
                                                      {data.delta !== undefined && (
                                                        <p className={`text-xs font-bold mt-1 ${data.delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                          {data.delta > 0 ? '+' : ''}{data.delta} pts
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} />
                                              {examSelections.map((exam, idx) => {
                                                const color = getSelectionColor(idx);
                                                return (
                                                  <Bar 
                                                    key={exam.id}
                                                    dataKey={`exam${exam.id}`} 
                                                    fill={`${color.hex}80`}
                                                    stroke={color.hex}
                                                    strokeWidth={1.5} 
                                                    radius={[4, 4, 0, 0]} 
                                                    name={`Exam ${exam.id}`} 
                                                  />
                                                );
                                              })}
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Dynamic Legend */}
                                        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px]">
                                          {examSelections.map((exam, idx) => {
                                            const color = getSelectionColor(idx);
                                            return (
                                              <div key={exam.id} className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${color.hex}80`, border: `1px solid ${color.hex}` }} />
                                                <span className="text-muted-foreground">Exam {exam.id}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Top 5 Rankings */}
                                        <div className="space-y-2">
                                          {top5Growth.map((item, index) => {
                                            const examBScore = item[`exam${examBId}`] || 0;
                                            const percentChange = examBScore > 0 ? (item.delta / examBScore * 100).toFixed(1) : '0.0';
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
                                            const examBScore = item[`exam${examBId}`] || 0;
                                            const percentChange = examBScore > 0 ? (Math.abs(item.delta) / examBScore * 100).toFixed(0) : '0';
                                            return (
                                              <div key={item.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                                                <ArrowDown className="h-3 w-3 text-red-500" />
                                                <span className="text-[10px] font-medium text-foreground">{shortenSubjectName(item.name)}</span>
                                                <span className="text-[10px] font-bold text-red-600">-{percentChange}%</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Bar Chart - All exams comparison */}
                                        <div className="h-36 -mx-2">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                              data={top5Decline.map(item => {
                                                const dataPoint: Record<string, any> = { name: shortenSubjectName(item.name) };
                                                examSelections.forEach(exam => {
                                                  dataPoint[`exam${exam.id}`] = item[`exam${exam.id}`] || 0;
                                                });
                                                dataPoint.delta = item.delta;
                                                return dataPoint;
                                              })} 
                                              margin={{ top: 10, right: 10, left: 10, bottom: 0 }} 
                                              barGap={2} 
                                              barCategoryGap="20%"
                                            >
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} height={30} />
                                              <YAxis hide domain={[0, 100]} />
                                              <Tooltip content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                                      <p className="text-xs font-medium text-foreground">{data.name}</p>
                                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {examSelections.map((exam, idx) => {
                                                          const color = getSelectionColor(idx);
                                                          return (
                                                            <span key={exam.id} className="text-[10px]" style={{ color: color.hex }}>
                                                              {exam.id}: {data[`exam${exam.id}`]}
                                                            </span>
                                                          );
                                                        })}
                                                      </div>
                                                      {data.delta !== undefined && (
                                                        <p className={`text-xs font-bold mt-1 text-red-500`}>
                                                          {data.delta} pts
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }} />
                                              {examSelections.map((exam, idx) => {
                                                const color = getSelectionColor(idx);
                                                return (
                                                  <Bar 
                                                    key={exam.id}
                                                    dataKey={`exam${exam.id}`} 
                                                    fill={`${color.hex}80`}
                                                    stroke={color.hex}
                                                    strokeWidth={1.5} 
                                                    radius={[4, 4, 0, 0]} 
                                                    name={`Exam ${exam.id}`} 
                                                  />
                                                );
                                              })}
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Dynamic Legend */}
                                        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px]">
                                          {examSelections.map((exam, idx) => {
                                            const color = getSelectionColor(idx);
                                            return (
                                              <div key={exam.id} className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${color.hex}80`, border: `1px solid ${color.hex}` }} />
                                                <span className="text-muted-foreground">Exam {exam.id}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Top 5 Rankings */}
                                        <div className="space-y-2">
                                          {top5Decline.map((item, index) => {
                                            const examBScore = item[`exam${examBId}`] || 0;
                                            const percentChange = examBScore > 0 ? (Math.abs(item.delta) / examBScore * 100).toFixed(1) : '0.0';
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

                      {/* Subject Comparison - Dynamic for all exams */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                        <div className="space-y-3">
                          {comparisonData.map(item => {
                            // Only show delta badge if we have 2+ exams
                            const showDelta = examSelections.length >= 2 && item.delta !== undefined;
                            const percentChange = showDelta && item[`exam${examSelections[1].id}`] > 0 
                              ? (item.delta / item[`exam${examSelections[1].id}`] * 100).toFixed(1) 
                              : '0.0';
                            
                            return (
                              <div key={item.name} className="p-3 rounded-xl bg-accent/30 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-foreground">{shortenSubjectName(item.name)}</span>
                                  {showDelta && (
                                    <Badge 
                                      variant={item.delta > 0 ? "default" : item.delta < 0 ? "destructive" : "secondary"} 
                                      className={`text-xs px-2 py-0.5 ${item.delta > 0 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : item.delta < 0 ? "bg-red-500/20 text-red-600 border-red-500/30" : ""}`}
                                    >
                                      {item.delta > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : item.delta < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                      {item.delta > 0 ? "+" : ""}{item.delta}pts ({item.delta >= 0 ? "+" : ""}{percentChange}%)
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Visual Bars - Dynamic for all exams */}
                                <div className="space-y-1.5">
                                  {examSelections.map((exam, index) => {
                                    const color = getSelectionColor(index);
                                    const score = item[`exam${exam.id}`] || 0;
                                    const label = allExamData[index]?.label?.split(' ')[0] || exam.id;
                                    
                                    return (
                                      <div key={exam.id} className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-16 truncate">{label}</span>
                                        <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                          <div 
                                            className="h-full rounded-full transition-all duration-500" 
                                            style={{
                                              width: `${score}%`,
                                              backgroundColor: `${color.hex}80`,
                                              border: `2px solid ${color.hex}`
                                            }} 
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                            {score}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Delta Line - Only show if 2+ exams */}
                                {showDelta && item.delta !== 0 && (
                                  <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">A vs B</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs font-bold ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {item[`exam${examSelections[1].id}`]} → {item[`exam${examSelections[0].id}`]}
                                      </span>
                                      <span className={`text-[10px] ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        ({item.delta > 0 ? "↑" : "↓"} {Math.abs(item.delta)} pts)
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
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

                      {/* Generate Report Button - at bottom */}
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setComparisonReportDialogOpen(true)}
                      >
                        <FileText className="h-4 w-4" />
                        Generate Report
                      </Button>
                    </>;
              })()}
              </TabsContent>

              {/* ==================== BOX & WHISKER SUB-TAB ==================== */}
              <TabsContent value="boxplot" className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-foreground">Box & Whisker Analysis</h3>
                  <p className="text-xs text-muted-foreground">Score distribution over academic years</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setBoxPlotViewMode("student")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      boxPlotViewMode === "student" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setBoxPlotViewMode("subject")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      boxPlotViewMode === "subject" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Subject
                  </button>
                </div>

                {/* Year Range Selector */}
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Start Year</label>
                      <Select value={boxPlotStartYear} disabled={availableBoxPlotYears.length === 0} onValueChange={(v) => {
                        setBoxPlotStartYear(v);
                        // Ensure end year is not before start year
                        if (parseInt(v) > parseInt(boxPlotEndYear)) {
                          setBoxPlotEndYear(v);
                        }
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBoxPlotYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-muted-foreground text-xs mt-5">to</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">End Year</label>
                      <Select value={boxPlotEndYear} disabled={availableBoxPlotYears.length === 0} onValueChange={(v) => {
                        setBoxPlotEndYear(v);
                        // Ensure start year is not after end year
                        if (parseInt(v) < parseInt(boxPlotStartYear)) {
                          setBoxPlotStartYear(v);
                        }
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBoxPlotYears.filter(y => parseInt(y) >= parseInt(boxPlotStartYear)).map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filters based on mode */}
                {boxPlotViewMode === "student" ? (
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Select Student
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Grade and Class selectors - using real data from academicFilters */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Grade</label>
                          <Select value={boxPlotGrade} onValueChange={(v) => {
                            setBoxPlotGrade(v);
                            // Get the first class for this year level
                            const matchingYearLevel = allAvailableYearLevels.find(yl => {
                              const match = yl.match(/(\d+)/);
                              return match && match[1] === v;
                            });
                            if (matchingYearLevel) {
                              const classesForYear = academicFilters.getClassesForYearLevel(matchingYearLevel);
                              if (classesForYear.length > 0) {
                                setBoxPlotClass(classesForYear[0]);
                              }
                            }
                            setBoxPlotStudentId("");
                          }}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {allAvailableYearLevels.map(yl => {
                                const match = yl.match(/(\d+)/);
                                const yearNum = match ? match[1] : yl;
                                return (
                                  <SelectItem key={yl} value={yearNum}>
                                    {yl.startsWith("Y") ? `Year ${yearNum}` : yl}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Class</label>
                          <Select value={boxPlotClass} onValueChange={(v) => {
                            setBoxPlotClass(v);
                            setBoxPlotStudentId("");
                          }}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                              {boxPlotClassesForGrade.map(cls => (
                                <SelectItem key={cls} value={cls}>{stripCampusPrefix(cls)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Student selector - using real data from academicFilters */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Student</label>
                        <Select value={boxPlotStudentId} onValueChange={setBoxPlotStudentId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select a student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {boxPlotStudentsForClass.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Optional filters */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Subjects {boxPlotStudentSubjects.length > 0 && `(${boxPlotStudentSubjects.length} selected)`}
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                                {boxPlotStudentSubjects.length === 0 
                                  ? "All Subjects" 
                                  : boxPlotStudentSubjects.length === 1 
                                    ? shortenSubjectName(boxPlotStudentSubjects[0])
                                    : `${boxPlotStudentSubjects.length} subjects`}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 bg-popover z-50" align="start">
                              <div className="space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn("w-full justify-start text-xs", boxPlotStudentSubjects.length === 0 && "bg-accent")}
                                  onClick={() => setBoxPlotStudentSubjects([])}
                                >
                                  <Check className={cn("h-3 w-3 mr-2", boxPlotStudentSubjects.length === 0 ? "opacity-100" : "opacity-0")} />
                                  All Subjects
                                </Button>
                                <div className="relative px-1 py-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    placeholder="Search subjects..."
                                    className="h-7 pl-7 text-xs"
                                    value={boxPlotStudentSubjectSearch}
                                    onChange={(e) => setBoxPlotStudentSubjectSearch(e.target.value)}
                                  />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {allSubjects
                                    .filter(subject => subject.toLowerCase().includes(boxPlotStudentSubjectSearch.toLowerCase()))
                                    .map((subject) => (
                                      <Button
                                        key={subject}
                                        variant="ghost"
                                        size="sm"
                                        className={cn("w-full justify-start text-xs", boxPlotStudentSubjects.includes(subject) && "bg-accent")}
                                        onClick={() => {
                                          setBoxPlotStudentSubjects(prev => 
                                            prev.includes(subject)
                                              ? prev.filter(s => s !== subject)
                                              : [...prev, subject]
                                          );
                                        }}
                                      >
                                        <Check className={cn("h-3 w-3 mr-2", boxPlotStudentSubjects.includes(subject) ? "opacity-100" : "opacity-0")} />
                                        {shortenSubjectName(subject)}
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          {/* Show selected subjects as badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {boxPlotStudentSubjects.length === 0 ? (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                All Subjects
                              </Badge>
                            ) : boxPlotStudentSubjects.length <= 4 ? (
                              boxPlotStudentSubjects.map(subject => (
                                <Badge key={subject} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                  {shortenSubjectName(subject)}
                                </Badge>
                              ))
                            ) : (
                              <>
                                {boxPlotStudentSubjects.slice(0, 3).map(subject => (
                                  <Badge key={subject} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                    {shortenSubjectName(subject)}
                                  </Badge>
                                ))}
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                  +{boxPlotStudentSubjects.length - 3} more
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Exam Type (Optional)</label>
                          <Select value={boxPlotStudentExamType} onValueChange={setBoxPlotStudentExamType}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="All Exams" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Exams</SelectItem>
                              <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                              <SelectItem value="Year-End">Year-End</SelectItem>
                            </SelectContent>
                          </Select>
                          {/* Show selected exams as tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {boxPlotStudentExamType === "all" ? (
                              <>
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                  Mid-Year
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                  Year-End
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                {boxPlotStudentExamType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Select Subject & Cohort
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Subject selector - multi-select */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Subjects {boxPlotSubjects.length > 0 && `(${boxPlotSubjects.length} selected)`}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                              {boxPlotSubjects.length === 0 
                                ? "Select subjects..." 
                                : boxPlotSubjects.length === 1 
                                  ? boxPlotSubjects[0]
                                  : `${boxPlotSubjects.length} subjects`}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-popover z-50" align="start">
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("w-full justify-start text-xs", boxPlotSubjects.length === allSubjects.length && "bg-accent")}
                                onClick={() => setBoxPlotSubjects([...allSubjects])}
                              >
                                <Check className={cn("h-3 w-3 mr-2", boxPlotSubjects.length === allSubjects.length ? "opacity-100" : "opacity-0")} />
                                All Subjects
                              </Button>
                              <div className="relative px-1 py-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  placeholder="Search subjects..."
                                  className="h-7 pl-7 text-xs"
                                  value={boxPlotSubjectSearch}
                                  onChange={(e) => setBoxPlotSubjectSearch(e.target.value)}
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {allSubjects
                                  .filter(subject => subject.toLowerCase().includes(boxPlotSubjectSearch.toLowerCase()))
                                  .map((subject) => (
                                    <Button
                                      key={subject}
                                      variant="ghost"
                                      size="sm"
                                      className={cn("w-full justify-start text-xs", boxPlotSubjects.includes(subject) && "bg-accent")}
                                      onClick={() => {
                                        setBoxPlotSubjects(prev => 
                                          prev.includes(subject)
                                            ? prev.filter(s => s !== subject)
                                            : [...prev, subject]
                                        );
                                      }}
                                    >
                                      <Check className={cn("h-3 w-3 mr-2", boxPlotSubjects.includes(subject) ? "opacity-100" : "opacity-0")} />
                                      {subject}
                                    </Button>
                                  ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Subject pills display */}
                        {boxPlotSubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {boxPlotSubjects.length === allSubjects.length ? (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                                All Subjects
                              </Badge>
                            ) : boxPlotSubjects.length > 4 ? (
                              <>
                                {boxPlotSubjects.slice(0, 3).map((subject) => (
                                  <Badge key={subject} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                                    {getShortSubjectName(subject)}
                                  </Badge>
                                ))}
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                                  +{boxPlotSubjects.length - 3} more
                                </Badge>
                              </>
                            ) : (
                              boxPlotSubjects.map((subject) => (
                                <Badge key={subject} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">
                                  {getShortSubjectName(subject)}
                                </Badge>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cohort scope - Enhanced with multi-select */}
                      <div className="space-y-3">
                        <label className="text-xs text-muted-foreground block">Cohort Scope</label>
                        
                        {/* Cohort type tabs */}
                        <div className="flex rounded-lg border bg-muted/30 p-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex-1 h-7 text-[10px] rounded-md",
                              boxPlotCohortType === "classes" && "bg-background shadow-sm"
                            )}
                            onClick={() => setBoxPlotCohortType("classes")}
                          >
                            Classes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex-1 h-7 text-[10px] rounded-md",
                              boxPlotCohortType === "yearGroups" && "bg-background shadow-sm"
                            )}
                            onClick={() => setBoxPlotCohortType("yearGroups")}
                          >
                            Year Groups
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex-1 h-7 text-[10px] rounded-md",
                              boxPlotCohortType === "school" && "bg-background shadow-sm"
                            )}
                            onClick={() => setBoxPlotCohortType("school")}
                          >
                            School
                          </Button>
                        </div>
                        
                        {/* Conditional multi-select based on cohort type */}
                        {boxPlotCohortType === "classes" && (
                          <div>
                            <Popover open={boxPlotCohortPopoverOpen} onOpenChange={setBoxPlotCohortPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full h-9 justify-between text-xs">
                                  <span>{boxPlotSelectedClasses.length} class{boxPlotSelectedClasses.length !== 1 ? "es" : ""} selected</span>
                                  <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3 z-50 bg-background" align="start">
                                <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-6 text-[10px]"
                                      onClick={() => setBoxPlotSelectedClasses([...allAvailableClasses])}
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-6 text-[10px]"
                                      onClick={() => setBoxPlotSelectedClasses([])}
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                  
                                  {Object.entries(classesByYearGroup).map(([yearGroup, classes]) => (
                                    <div key={yearGroup} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-muted-foreground">{yearGroup}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 text-[9px] px-1 text-primary"
                                          onClick={() => {
                                            const allSelected = classes.every(c => boxPlotSelectedClasses.includes(c));
                                            if (allSelected) {
                                              setBoxPlotSelectedClasses(boxPlotSelectedClasses.filter(c => !classes.includes(c)));
                                            } else {
                                              setBoxPlotSelectedClasses([...new Set([...boxPlotSelectedClasses, ...classes])]);
                                            }
                                          }}
                                        >
                                          {classes.every(c => boxPlotSelectedClasses.includes(c)) ? "Deselect" : "Select"} all
                                        </Button>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {classes.map(cls => (
                                          <Button
                                            key={cls}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                              "h-7 text-[10px] px-2",
                                              boxPlotSelectedClasses.includes(cls) && "bg-primary text-primary-foreground hover:bg-primary/90"
                                            )}
                                            onClick={() => {
                                              if (boxPlotSelectedClasses.includes(cls)) {
                                                setBoxPlotSelectedClasses(boxPlotSelectedClasses.filter(c => c !== cls));
                                              } else {
                                                setBoxPlotSelectedClasses([...boxPlotSelectedClasses, cls]);
                                              }
                                            }}
                                          >
                                            {boxPlotSelectedClasses.includes(cls) && <Check className="h-2.5 w-2.5 mr-1" />}
                                            {cls}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            {/* Selected classes badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {boxPlotSelectedClasses.length === 0 ? (
                                <span className="text-[10px] text-muted-foreground italic">No classes selected</span>
                              ) : boxPlotSelectedClasses.length <= 4 ? (
                                boxPlotSelectedClasses.map(cls => (
                                  <Badge key={cls} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                    {cls}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                  {boxPlotSelectedClasses.length} classes
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {boxPlotCohortType === "yearGroups" && (
                          <div>
                            <div className="flex flex-wrap gap-1.5">
                              {allAvailableYearGroups.map(yg => (
                                <Button
                                  key={yg}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-7 text-[10px] px-2.5",
                                    boxPlotSelectedYearGroups.includes(yg) && "bg-primary text-primary-foreground hover:bg-primary/90"
                                  )}
                                  onClick={() => {
                                    if (boxPlotSelectedYearGroups.includes(yg)) {
                                      setBoxPlotSelectedYearGroups(boxPlotSelectedYearGroups.filter(y => y !== yg));
                                    } else {
                                      setBoxPlotSelectedYearGroups([...boxPlotSelectedYearGroups, yg]);
                                    }
                                  }}
                                >
                                  {boxPlotSelectedYearGroups.includes(yg) && <Check className="h-2.5 w-2.5 mr-1" />}
                                  {yg}
                                </Button>
                              ))}
                            </div>
                            
                            {/* Selected year groups badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {boxPlotSelectedYearGroups.length === 0 ? (
                                <span className="text-[10px] text-muted-foreground italic">No year groups selected</span>
                              ) : (
                                boxPlotSelectedYearGroups.map(yg => (
                                  <Badge key={yg} variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                    {yg}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                        
                        {boxPlotCohortType === "school" && (
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                              All Classes
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Optional exam type filter */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Exam Type (Optional)</label>
                        <Select value={boxPlotSubjectExamType} onValueChange={setBoxPlotSubjectExamType}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="All Exams" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Exams</SelectItem>
                            <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                            <SelectItem value="Year-End">Year-End</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Show selected exams as tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {boxPlotSubjectExamType === "all" ? (
                            <>
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                Mid-Year
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                                Year-End
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                              {boxPlotSubjectExamType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Box Plot Chart */}
                {(() => {
                  // Calculate box plot data based on mode
                  let boxPlotData: BoxPlotStats[] = [];
                  let chartTitle = "";
                  
                  if (boxPlotViewMode === "student") {
                    if (!boxPlotStudentId) {
                      return (
                        <Card className="border-dashed border-2 border-muted-foreground/20">
                          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Select a student to view their score distribution</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    
                      const student = boxPlotStudentLookup.get(boxPlotStudentId);
                      chartTitle = student ? `${student.name}'s Score Distribution` : "Student Score Distribution";
                      
                      boxPlotData = calculateStudentBoxPlotData(
                        boxPlotAssessmentRecords,
                        boxPlotStudentId,
                        boxPlotStudentSubjects.length > 0 ? boxPlotStudentSubjects : undefined,
                        boxPlotStudentExamType && boxPlotStudentExamType !== "all" ? boxPlotStudentExamType : undefined,
                        boxPlotStartYear,
                        boxPlotEndYear
                    );
                  } else {
                    const subjectLabel = boxPlotSubjects.length === 1 
                      ? boxPlotSubjects[0] 
                      : boxPlotSubjects.length > 1 
                        ? `${boxPlotSubjects.length} Subjects`
                        : "No Subject";
                    
                    // Build cohort label based on type
                    let cohortLabel = "";
                    if (boxPlotCohortType === "classes") {
                      cohortLabel = boxPlotSelectedClasses.length === 0 
                        ? "No Classes" 
                        : boxPlotSelectedClasses.length <= 2 
                          ? boxPlotSelectedClasses.join(", ")
                          : `${boxPlotSelectedClasses.length} Classes`;
                    } else if (boxPlotCohortType === "yearGroups") {
                      cohortLabel = boxPlotSelectedYearGroups.length === 0 
                        ? "No Year Groups" 
                        : boxPlotSelectedYearGroups.length <= 2 
                          ? boxPlotSelectedYearGroups.join(", ")
                          : `${boxPlotSelectedYearGroups.length} Year Groups`;
                    } else {
                      cohortLabel = "Entire School";
                    }
                    
                    chartTitle = `${subjectLabel} - ${cohortLabel}`;
                    
                      boxPlotData = calculateSubjectBoxPlotData(
                        boxPlotAssessmentRecords,
                        boxPlotSubjects,
                        boxPlotCohortType,
                        boxPlotSelectedClasses,
                      boxPlotSelectedYearGroups,
                      boxPlotSubjectExamType && boxPlotSubjectExamType !== "all" ? boxPlotSubjectExamType : undefined,
                      boxPlotStartYear,
                      boxPlotEndYear
                    );
                  }
                  
                    const insights = generateInsights(boxPlotData);
                    const totalSamples = boxPlotData.reduce((sum, stat) => sum + stat.n, 0);
                    const hasEnoughSamples = boxPlotData.some((stat) => stat.n >= 5);

                    if (totalSamples === 0) {
                      return (
                        <Card className="border-dashed border-2 border-muted-foreground/20">
                          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">No grades found for selected filters</p>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (!hasEnoughSamples) {
                      return (
                        <Card className="border-dashed border-2 border-muted-foreground/20">
                          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Not enough data to generate box plot (need 5+ scores).</p>
                          </CardContent>
                        </Card>
                      );
                    }
                  
                  return (
                    <>
                      {/* Chart */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{chartTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className="w-full max-w-full overflow-hidden">
                            <BoxPlotChart 
                              data={boxPlotData} 
                              showMean={true} 
                              height={280} 
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Insights Panel */}
                      {insights.length > 0 && (
                        <Card className="bg-accent/30 border-accent">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {insights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className="mt-0.5">
                                  {insight.icon === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                                  {insight.icon === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                                  {insight.icon === "flat" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                                  {insight.icon === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                                  {insight.icon === "info" && <BarChart3 className="h-3.5 w-3.5 text-blue-500" />}
                                </span>
                                <div>
                                  <span className="font-medium text-foreground">{insight.title}</span>
                                  <span className="text-muted-foreground ml-1">{insight.description}</span>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Whiskers Analysis Chart */}
                      {boxPlotData.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              Whiskers Analysis
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {boxPlotViewMode === "student" 
                                ? "Subjects at the upper and lower whisker boundaries"
                                : "Students at the upper and lower whisker boundaries"}
                            </p>
                          </CardHeader>
                          <CardContent>
                            {/* Year Selector and Toggle Buttons */}
                            <div className="flex flex-col gap-3 mb-4">
                              {/* Year Selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Year:</span>
                                <Select value={whiskersAnalysisYear} onValueChange={setWhiskersAnalysisYear}>
                                  <SelectTrigger className="h-8 w-[120px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {availableBoxPlotYears.map(year => (
                                      <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Toggle Buttons */}
                              <div className="flex justify-center">
                                <div className="flex rounded-lg border bg-muted/30 p-0.5">
                                  <button
                                    onClick={() => setBoxPlotRiskView("high")}
                                    className={cn(
                                      "px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                      boxPlotRiskView === "high" 
                                        ? "bg-emerald-500 text-white shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                    High Whiskers
                                  </button>
                                  <button
                                    onClick={() => setBoxPlotRiskView("low")}
                                    className={cn(
                                      "px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                      boxPlotRiskView === "low" 
                                        ? "bg-red-500 text-white shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                    Low Whiskers
                                  </button>
                                </div>
                              </div>
                            </div>

                            {(() => {
                              // Filter boxPlotData by selected year
                              const filteredData = whiskersAnalysisYear === "all" 
                                ? boxPlotData 
                                : boxPlotData.filter(stat => stat.year === whiskersAnalysisYear);
                              
                              // Collect data points at the whisker boundaries using the new whiskerDetails arrays
                              const whiskerData: { year: string; label: string; score: number }[] = [];
                              
                              filteredData.forEach(stat => {
                                // Use the new whiskerHighDetails and whiskerLowDetails arrays
                                const details = boxPlotRiskView === "high" 
                                  ? stat.whiskerHighDetails 
                                  : stat.whiskerLowDetails;
                                
                                if (details && details.length > 0) {
                                  details.forEach(d => {
                                    whiskerData.push({ 
                                      year: stat.year, 
                                      label: d.label, 
                                      score: d.score 
                                    });
                                  });
                                }
                              });

                              // Sort by score (descending for high, ascending for low)
                              whiskerData.sort((a, b) => 
                                boxPlotRiskView === "high" ? b.score - a.score : a.score - b.score
                              );

                              if (whiskerData.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className={cn(
                                      "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                                      boxPlotRiskView === "high" ? "bg-emerald-100" : "bg-red-100"
                                    )}>
                                      {boxPlotRiskView === "high" 
                                        ? <ArrowUp className="h-6 w-6 text-emerald-500" />
                                        : <ArrowDown className="h-6 w-6 text-red-500" />
                                      }
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      No {boxPlotRiskView === "high" ? "high whisker" : "low whisker"} data found
                                    </p>
                                  </div>
                                );
                              }

                              // Prepare data for horizontal bar chart grouped by year
                              const allChartData = whiskerData.map((r, idx) => ({
                                id: idx,
                                name: `${r.label} (${r.year})`,
                                score: r.score,
                                year: r.year,
                                label: r.label
                              }));
                              
                              // Show only half the data initially
                              const halfLength = Math.ceil(allChartData.length / 2);
                              const chartData = whiskersExpanded ? allChartData : allChartData.slice(0, halfLength);
                              const hasMoreData = allChartData.length > halfLength;

                              const barColor = boxPlotRiskView === "high" ? "#22c55e" : "#ef4444";
                              const bgColor = boxPlotRiskView === "high" ? "bg-emerald-50" : "bg-red-50";
                              const textColor = boxPlotRiskView === "high" ? "text-emerald-700" : "text-red-700";
                              const borderColor = boxPlotRiskView === "high" ? "border-emerald-200" : "border-red-200";

                              return (
                                <div className="space-y-2">
                                  {/* Summary Cards by Year */}
                                  {Array.from(new Set(chartData.map(r => r.year))).map((year: string) => {
                                    const yearWhiskers = chartData.filter(r => r.year === year);
                                    return (
                                      <div 
                                        key={year} 
                                        className={cn(
                                          "p-3 rounded-lg border",
                                          bgColor,
                                          borderColor
                                        )}
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-semibold text-foreground">{year}</span>
                                          <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0", bgColor, textColor)}>
                                            {yearWhiskers.length} {boxPlotViewMode === "student" ? "subject" : "student"}{yearWhiskers.length !== 1 ? "s" : ""}
                                          </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {yearWhiskers.map((r, i) => (
                                            <Badge
                                              key={i} 
                                              className={cn(
                                                "text-[10px] px-2 py-0.5",
                                                boxPlotRiskView === "high" 
                                                  ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                                                  : "bg-red-100 text-red-700 border-red-300"
                                              )}
                                            >
                                              {boxPlotRiskView === "high" 
                                                ? <ArrowUp className="h-2.5 w-2.5 mr-0.5" />
                                                : <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                                              }
                                              {r.label}: {r.score}%
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* View More Button */}
                                  {hasMoreData && (
                                    <div className="flex justify-center pt-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setWhiskersExpanded(!whiskersExpanded)}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        {whiskersExpanded ? (
                                          <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            View Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            View More ({allChartData.length - halfLength} more)
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Outliers Trend Chart */}
                      {boxPlotData.some(s => s.outliers.length > 0) && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              Outliers Trend by Year
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              // Prepare data for the outliers trend chart
                              const outliersTrendData = boxPlotData.map(stat => {
                                const highOutliers = stat.outlierDetails?.filter(o => o.score > stat.q3).length || 
                                  stat.outliers.filter(score => score > stat.q3).length;
                                const lowOutliers = stat.outlierDetails?.filter(o => o.score < stat.q1).length || 
                                  stat.outliers.filter(score => score < stat.q1).length;
                                return {
                                  year: stat.year,
                                  high: highOutliers,
                                  low: lowOutliers,
                                  total: stat.outliers.length
                                };
                              });

                              return (
                                <div className="space-y-4">
                                  {/* Chart */}
                                  <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={outliersTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis 
                                          dataKey="year" 
                                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                          axisLine={{ stroke: 'hsl(var(--border))' }}
                                        />
                                        <YAxis 
                                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                          axisLine={{ stroke: 'hsl(var(--border))' }}
                                          allowDecimals={false}
                                        />
                                        <Tooltip 
                                          contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))', 
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            fontSize: '11px'
                                          }}
                                          formatter={(value: number, name: string) => [
                                            value, 
                                            name === 'high' ? 'High Performers' : 'Needs Attention'
                                          ]}
                                        />
                                        <Legend 
                                          wrapperStyle={{ fontSize: '10px' }}
                                          formatter={(value) => value === 'high' ? 'High Performers' : 'Needs Attention'}
                                        />
                                        <Bar dataKey="high" fill="#22c55e" name="high" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="low" fill="#ef4444" name="low" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* Outliers Details List */}
                                  <div className="space-y-2">
                                    {boxPlotData.filter(s => s.outliers.length > 0).map(stat => {
                                      const highOutliers = stat.outlierDetails?.filter(o => o.score > stat.q3) || [];
                                      const lowOutliers = stat.outlierDetails?.filter(o => o.score < stat.q1) || [];
                                      
                                      return (
                                        <div key={stat.year} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-foreground">{stat.year}</span>
                                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                              {stat.outliers.length} outlier{stat.outliers.length !== 1 ? 's' : ''}
                                            </Badge>
                                          </div>
                                          
                                          <div className="space-y-1.5">
                                            {highOutliers.length > 0 && (
                                              <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-1">
                                                  <ArrowUp className="h-2.5 w-2.5" />
                                                  High:
                                                </span>
                                                {highOutliers.map((o, i) => (
                                                  <Badge key={i} className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                                                    {o.label} ({o.score}%)
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {lowOutliers.length > 0 && (
                                              <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[9px] font-medium text-red-600 flex items-center gap-1">
                                                  <ArrowDown className="h-2.5 w-2.5" />
                                                  Low:
                                                </span>
                                                {lowOutliers.map((o, i) => (
                                                  <Badge key={i} className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                                                    {o.label} ({o.score}%)
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Statistics Table */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Year-by-Year Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Year</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">n</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Q1</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Median</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Q3</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">IQR</th>
                                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Outliers</th>
                                </tr>
                              </thead>
                              <tbody>
                                {boxPlotData.map((stat) => (
                                  <tr key={stat.year} className="border-b border-border/50 last:border-0">
                                    <td className="py-2 px-2 font-medium">{stat.year}</td>
                                    <td className={cn(
                                      "text-center py-2 px-2",
                                      stat.n < 5 && stat.n > 0 && "text-amber-600 font-medium"
                                    )}>
                                      {stat.n}{stat.n < 5 && stat.n > 0 && " ⚠"}
                                    </td>
                                    <td className="text-center py-2 px-2">{stat.q1}</td>
                                    <td className="text-center py-2 px-2 font-semibold text-primary">{stat.median}</td>
                                    <td className="text-center py-2 px-2">{stat.q3}</td>
                                    <td className="text-center py-2 px-2">{stat.iqr}</td>
                                    <td className={cn(
                                      "text-center py-2 px-2",
                                      stat.outliers.length > 0 && "text-red-500 font-medium"
                                    )}>
                                      {stat.outliers.length}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Low sample warning */}
                          {boxPlotData.some(s => s.n > 0 && s.n < 5) && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Years with n &lt; 5 have low statistical significance</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Generate Report Button */}
                      <Button
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="lg"
                        onClick={() => setBoxPlotReportDialogOpen(true)}
                      >
                        <FileText className="h-5 w-5" />
                        Generate Report
                      </Button>
                    </>
                  );
                })()}
              </TabsContent>

              {!isAtBottom && (
                <Button
                  className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0 bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
                  onClick={() => {
                    if (analysisSubTab === 'overview') {
                      setOverviewReportDialogOpen(true);
                    } else if (analysisSubTab === 'distribution') {
                      setBandsReportDialogOpen(true);
                    } else if (analysisSubTab === 'trends') {
                      setTrendsReportDialogOpen(true);
                    } else if (analysisSubTab === 'comparison') {
                      setComparisonReportDialogOpen(true);
                    } else if (analysisSubTab === 'boxplot') {
                      setBoxPlotReportDialogOpen(true);
                    }
                  }}
                >
                  <FileText className="h-6 w-6 text-white" />
                </Button>
              )}
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
                onClick={async () => {
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
                  const result = await saveAndShareBlob(
                    blob,
                    `overview-report-${selectedClass}-${new Date().toISOString().split('T')[0]}.csv`,
                    "text/csv;charset=utf-8;"
                  );
                  if (!result.success) {
                    toast({
                      title: "Export failed. Please try again.",
                    });
                  } else if (result.savedToDevice) {
                    toast({ title: "Saved to Downloads" });
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
                  handleReportPdfExport(
                    overviewReportRef,
                    `overview-report-${selectedClass}-${new Date().toISOString().split('T')[0]}`
                  );
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={overviewReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header - Dual Logo Style */}
              <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Class Performance Report</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Class {stripCampusPrefix(selectedClass)} - {selectedYear} {selectedPeriod === 'midYear' ? 'Mid-Year' : 'Year-End'}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
              </div>

              {/* Summary Statistics Cards with Watermarks */}
              <div style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Average */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#dcfce7', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{classAverage}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>{classAverage}%</div>
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600 }}>Class Average</div>
                      <div style={{ fontSize: '8px', color: '#166534', marginTop: '2px' }}>
                        {classAverage >= 80 ? 'Excellent' : classAverage >= 60 ? 'Above Average' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  {/* Highest */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#d97706', opacity: 0.15 }}>{highestScore}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>{highestScore}%</div>
                      <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 600 }}>Highest Score</div>
                      <div style={{ fontSize: '8px', color: '#92400e', marginTop: '2px' }}>Top Student</div>
                    </div>
                  </div>
                  {/* Pass Rate */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#ccfbf1', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#0d9488', opacity: 0.15 }}>{passRate}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#0d9488' }}>{passRate}%</div>
                      <div style={{ fontSize: '10px', color: '#115e59', fontWeight: 600 }}>Pass Rate</div>
                      <div style={{ fontSize: '8px', color: '#115e59', marginTop: '2px' }}>
                        {passRate >= 90 ? 'Excellent' : passRate >= 70 ? 'Good' : 'Needs Focus'}
                      </div>
                    </div>
                  </div>
                  {/* Students */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{rosterCount}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>{rosterCount}</div>
                      <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 600 }}>Students</div>
                      <div style={{ fontSize: '8px', color: '#1d4ed8', marginTop: '2px' }}>In Class</div>
                    </div>
                  </div>
                  {/* A Grade Rate */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#f3e8ff', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#9333ea', opacity: 0.15 }}>{aGradeRate}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#9333ea' }}>{aGradeRate}%</div>
                      <div style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 600 }}>A Grade</div>
                      <div style={{ fontSize: '8px', color: '#6b21a8', marginTop: '2px' }}>Excellence Rate</div>
                    </div>
                  </div>
                  {/* Lowest */}
                  <div style={{ position: 'relative', padding: '12px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', textAlign: 'center', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#dc2626', opacity: 0.15 }}>{lowestScore}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>{lowestScore}%</div>
                      <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 600 }}>Lowest Score</div>
                      <div style={{ fontSize: '8px', color: '#991b1b', marginTop: '2px' }}>Needs Support</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Performance Bar Chart - SVG for print */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBarChart /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Subject Performance Chart</h3>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <svg width="100%" height="180" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    <line x1="100" y1="20" x2="480" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="100" y1="50" x2="480" y2="50" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="100" y1="80" x2="480" y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    <line x1="100" y1="110" x2="480" y2="110" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="100" y1="140" x2="480" y2="140" stroke="#e5e7eb" strokeWidth="1" />
                    {/* X-axis labels */}
                    <text x="95" y="24" fontSize="7" fill="#6b7280" textAnchor="end">100%</text>
                    <text x="95" y="54" fontSize="7" fill="#6b7280" textAnchor="end">75%</text>
                    <text x="95" y="84" fontSize="7" fill="#f59e0b" textAnchor="end">50%</text>
                    <text x="95" y="114" fontSize="7" fill="#6b7280" textAnchor="end">25%</text>
                    <text x="95" y="144" fontSize="7" fill="#6b7280" textAnchor="end">0%</text>
                    {/* Horizontal bars for each subject */}
                    {subjectAverages.slice(0, 8).map((sub, i) => {
                      const barHeight = 14;
                      const y = 20 + i * 15;
                      const barWidth = (sub.average / 100) * 380;
                      const color = sub.average >= 80 ? '#22c55e' : sub.average >= 60 ? '#3b82f6' : sub.average >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <g key={sub.fullName}>
                          <rect x="100" y={y} width={barWidth} height={barHeight} fill={color} rx="2" opacity="0.85" />
                          <text x="100" y={y + 10} fontSize="7" fill="#374151" textAnchor="end" dx="-4">{shortenSubjectName(sub.fullName)}</text>
                          <text x={105 + barWidth} y={y + 10} fontSize="7" fill="#374151" fontWeight="600">{sub.average.toFixed(0)}%</text>
                        </g>
                      );
                    })}
                    {/* Legend */}
                    <rect x="100" y="160" width="10" height="8" fill="#22c55e" rx="1" />
                    <text x="114" y="167" fontSize="7" fill="#374151">A Grade (80%+)</text>
                    <rect x="180" y="160" width="10" height="8" fill="#3b82f6" rx="1" />
                    <text x="194" y="167" fontSize="7" fill="#374151">B/C (60-79%)</text>
                    <rect x="260" y="160" width="10" height="8" fill="#f59e0b" rx="1" />
                    <text x="274" y="167" fontSize="7" fill="#374151">D (50-59%)</text>
                    <rect x="330" y="160" width="10" height="8" fill="#ef4444" rx="1" />
                    <text x="344" y="167" fontSize="7" fill="#374151">E (&lt;50%)</text>
                  </svg>
                </div>
              </div>

              {/* Subject Performance List */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBook /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Subject Rankings</h3>
                </div>
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

              {/* Grade Distribution Bar Chart - SVG for print */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBarChart /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Grade Distribution</h3>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <svg width="100%" height="120" viewBox="0 0 500 120" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    <line x1="40" y1="90" x2="460" y2="90" stroke="#e5e7eb" strokeWidth="1" />
                    {/* Bars */}
                    {(() => {
                      const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
                      const maxCount = Math.max(...gradeDistribution.map(d => d.count), 1);
                      return gradeDistribution.map((g, i) => {
                        const barWidth = 55;
                        const x = 50 + i * 70;
                        const barHeight = (g.count / maxCount) * 65;
                        const y = 90 - barHeight;
                        const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                        return (
                          <g key={g.range}>
                            <rect x={x} y={y} width={barWidth} height={barHeight} fill={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} rx="3" />
                            <text x={x + barWidth / 2} y={y - 4} fontSize="9" fill="#374151" textAnchor="middle" fontWeight="700">{g.count}</text>
                            <text x={x + barWidth / 2} y="103" fontSize="10" fill={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} textAnchor="middle" fontWeight="700">{g.range}</text>
                            <text x={x + barWidth / 2} y="113" fontSize="7" fill="#6b7280" textAnchor="middle">{percentage}%</text>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
              </div>

              {/* Rising Subjects & At-Risk Subjects - Side by Side */}
              {(risingSubjects.length > 0 || fallingSubjects.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: risingSubjects.length > 0 && fallingSubjects.length > 0 ? 'repeat(2, 1fr)' : '1fr', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                  {/* Rising Subjects */}
                  {risingSubjects.length > 0 && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '1px solid #fde047' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fde047' }}>
                        <span style={{ color: '#ca8a04' }}><IconStar /></span>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#ca8a04', margin: 0 }}>Rising Subjects</h4>
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                        <span style={{ color: '#dc2626' }}><IconTarget /></span>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', margin: 0 }}>At-Risk Subjects</h4>
                      </div>
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

              {/* Top Performers & At-Risk Students */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #86efac' }}>
                    <span style={{ color: '#16a34a' }}><IconTrophy /></span>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', margin: 0 }}>Top Performers ({topPerformers.length})</h4>
                  </div>
                  {topPerformers.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #86efac40' }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                    </div>
                  ))}
                  {topPerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                    <span style={{ color: '#dc2626' }}><IconTarget /></span>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', margin: 0 }}>At-Risk Students ({atRiskStudents.length})</h4>
                  </div>
                  {atRiskStudents.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fca5a540' }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                    </div>
                  ))}
                  {atRiskStudents.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                </div>
              </div>

              {/* Footer - Professional Style */}
              <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
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
                onClick={async () => {
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
                  const result = await saveAndShareBlob(
                    blob,
                    `trends-report-${selectedClass}-${new Date().toISOString().split('T')[0]}.csv`,
                    "text/csv;charset=utf-8;"
                  );
                  if (!result.success) {
                    toast({
                      title: "Export failed. Please try again.",
                    });
                  } else if (result.savedToDevice) {
                    toast({ title: "Saved to Downloads" });
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
                  handleReportPdfExport(
                    trendsReportRef,
                    `trends-report-${selectedClass}-${new Date().toISOString().split('T')[0]}`
                  );
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={trendsReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header - Dual Logo Style */}
              <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Performance Trends Report</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Class {selectedClass} - Historical Analysis</div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' • '}Period: {trendPeriod === '1year' ? 'Last 1 Year' : trendPeriod === '2years' ? 'Last 2 Years' : trendPeriod === '3years' ? 'Last 3 Years' : trendPeriod === '4years' ? 'Last 4 Years' : trendPeriod === '5years' ? 'Last 5 Years' : 'Last 6 Years'}
                  </div>
                </div>
                <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
              </div>

              {/* Current Performance Summary */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBarChart /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Current Performance</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: trendDirection.direction === 'up' ? '#dcfce7' : trendDirection.direction === 'down' ? '#fee2e2' : '#f3f4f6', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#6b7280', opacity: 0.15 }}>{trendDirection.currentValue}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>{trendDirection.currentValue}%</div>
                      <div style={{ fontSize: '9px', color: '#666' }}>{trendsSelectedSubjects.length === subjects.length ? 'Class Average' : `${trendsSelectedSubjects.length} Subject${trendsSelectedSubjects.length > 1 ? 's' : ''}`}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#6b7280', marginTop: '4px' }}>
                        {trendDirection.direction === 'up' ? '↑' : trendDirection.direction === 'down' ? '↓' : '→'} {trendDirection.change}%
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{risingSubjects.length}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{risingSubjects.length}</div>
                      <div style={{ fontSize: '9px', color: '#666' }}>Rising Subjects</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#ef4444', opacity: 0.15 }}>{fallingSubjects.length}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{fallingSubjects.length}</div>
                      <div style={{ fontSize: '9px', color: '#666' }}>Needs Focus</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Trend Chart (SVG for print) */}
              <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconTrendingUp /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Performance Trend</h3>
                </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fde047' }}>
                        <span style={{ color: '#ca8a04' }}><IconStar /></span>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#ca8a04', margin: 0 }}>Rising Subjects</h4>
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                        <span style={{ color: '#dc2626' }}><IconTarget /></span>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', margin: 0 }}>At-Risk Subjects</h4>
                      </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBook /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Historical Performance Data</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#065f46' }}>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'left', color: 'white', fontWeight: 600 }}>Period</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'right', color: 'white', fontWeight: 600 }}>Average</th>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconTarget /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Strengths Profile</h3>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBarChart /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Class VS Cohort Average</h3>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                  <span style={{ color: '#065f46' }}><IconBarChart /></span>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Performance Heatmap</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#065f46' }}>
                        <th style={{ padding: '4px 6px', borderBottom: '1px solid #d1d5db', textAlign: 'left', minWidth: '80px', color: 'white', fontWeight: 600 }}>Subject</th>
                        {heatmapData[0]?.scores.map(s => (
                          <th key={s.period} style={{ padding: '4px 6px', borderBottom: '1px solid #d1d5db', textAlign: 'center', minWidth: '40px', color: 'white', fontWeight: 600 }}>{s.period}</th>
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

              {/* Footer - Professional Style */}
              <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
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
                onClick={async () => {
                  // Generate CSV data for comparison - we'll build it dynamically
                  const examALabel = `${examAClass} ${getPeriodLabel(examAPeriodId)}`;
                  const examBLabel = `${examBClass} ${getPeriodLabel(examBPeriodId)}`;
                  const hasExamA = (compareGradesByPeriod.get(examAPeriodId)?.length || 0) > 0;
                  const hasExamB = (compareGradesByPeriod.get(examBPeriodId)?.length || 0) > 0;

                  if (hasExamA && hasExamB) {
                    const compData = buildTwoExamComparison(examAPeriodId, examBPeriodId);
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
                    const result = await saveAndShareBlob(
                      blob,
                      `comparison-report-${new Date().toISOString().split('T')[0]}.csv`,
                      "text/csv;charset=utf-8;"
                    );
                    if (!result.success) {
                      toast({
                        title: "Export failed. Please try again.",
                      });
                    } else if (result.savedToDevice) {
                      toast({ title: "Saved to Downloads" });
                    }
                  } else {
                    toast({
                      title: "No Data",
                      description: "No grades found for one of the selected exam periods.",
                      variant: "destructive"
                    });
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
                  handleReportPdfExport(
                    comparisonReportRef,
                    `comparison-report-${new Date().toISOString().split('T')[0]}`
                  );
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
            <div className="flex-1 overflow-y-auto" ref={comparisonReportRef}>
              {(() => {
              const examALabel = `${examAClass} ${getPeriodLabel(examAPeriodId)}`;
              const examBLabel = `${examBClass} ${getPeriodLabel(examBPeriodId)}`;
              const hasExamA = (compareGradesByPeriod.get(examAPeriodId)?.length || 0) > 0;
              const hasExamB = (compareGradesByPeriod.get(examBPeriodId)?.length || 0) > 0;
              
                if (!hasExamA || !hasExamB) {
                  return (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No data available for the selected exam periods</p>
                    </div>
                  );
                }
              
              const comparisonData = buildTwoExamComparison(examAPeriodId, examBPeriodId);
              
              const avgA = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length) : 0;
              const avgB = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length) : 0;
              const avgDelta = avgA - avgB;
              const improved = comparisonData.filter(d => d.delta > 0).length;
              const declined = comparisonData.filter(d => d.delta < 0).length;
              const unchanged = comparisonData.filter(d => d.delta === 0).length;
              
              return (
                <div className="space-y-4 p-2">
                  {/* Report Header - Dual Logo Style */}
                  <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                    <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Exam Comparison Report</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{examALabel} vs {examBLabel}</div>
                      <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                        Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
                  </div>

                  {/* Summary Comparison */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconScale /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Summary Comparison</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ position: 'relative', padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #d1d5db', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{avgA}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#1d4ed8' }}>Exam A</span>
                          </div>
                          <p style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>{examALabel}</p>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{avgA}%</div>
                          <p style={{ fontSize: '9px', color: '#666' }}>Average Score</p>
                        </div>
                      </div>
                      <div style={{ position: 'relative', padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #d1d5db', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '4px', bottom: '-15px', fontSize: '50px', fontWeight: 800, color: '#ef4444', opacity: 0.15 }}>{avgB}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
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
                  </div>

                  {/* Change Summary with Watermarks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: avgDelta > 0 ? '#dcfce7' : avgDelta < 0 ? '#fee2e2' : '#f3f4f6', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: avgDelta > 0 ? '#22c55e' : avgDelta < 0 ? '#ef4444' : '#6b7280', opacity: 0.15 }}>{Math.abs(avgDelta)}</div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: avgDelta > 0 ? '#22c55e' : avgDelta < 0 ? '#ef4444' : '#6b7280' }}>
                          {avgDelta > 0 ? '+' : ''}{avgDelta}%
                        </div>
                        <div style={{ fontSize: '8px', color: '#666' }}>Overall Change</div>
                      </div>
                    </div>
                    <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{improved}</div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{improved}</div>
                        <div style={{ fontSize: '8px', color: '#666' }}>Improved</div>
                      </div>
                    </div>
                    <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#ef4444', opacity: 0.15 }}>{declined}</div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{declined}</div>
                        <div style={{ fontSize: '8px', color: '#666' }}>Declined</div>
                      </div>
                    </div>
                    <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#6b7280', opacity: 0.15 }}>{unchanged}</div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#6b7280' }}>{unchanged}</div>
                        <div style={{ fontSize: '8px', color: '#666' }}>Unchanged</div>
                      </div>
                    </div>
                  </div>

                  {/* Grouped Bar Chart - SVG for print */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconBarChart /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Visual Comparison Chart</h3>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <svg width="100%" height="180" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        <line x1="80" y1="25" x2="480" y2="25" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="80" y1="55" x2="480" y2="55" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="80" y1="85" x2="480" y2="85" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                        <line x1="80" y1="115" x2="480" y2="115" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="80" y1="145" x2="480" y2="145" stroke="#e5e7eb" strokeWidth="1" />
                        {/* Y-axis labels */}
                        <text x="75" y="29" fontSize="7" fill="#6b7280" textAnchor="end">100</text>
                        <text x="75" y="59" fontSize="7" fill="#6b7280" textAnchor="end">75</text>
                        <text x="75" y="89" fontSize="7" fill="#f59e0b" textAnchor="end">50</text>
                        <text x="75" y="119" fontSize="7" fill="#6b7280" textAnchor="end">25</text>
                        <text x="75" y="149" fontSize="7" fill="#6b7280" textAnchor="end">0</text>
                        {/* Grouped bars for each subject */}
                        {comparisonData.slice(0, 8).map((sub, i) => {
                          const barWidth = 18;
                          const groupWidth = barWidth * 2 + 4;
                          const x = 90 + i * 50;
                          const barHeightA = (sub.examA / 100) * 120;
                          const barHeightB = (sub.examB / 100) * 120;
                          const yA = 145 - barHeightA;
                          const yB = 145 - barHeightB;
                          return (
                            <g key={sub.name}>
                              <rect x={x} y={yA} width={barWidth} height={barHeightA} fill="#3b82f6" rx="2" opacity="0.85" />
                              <rect x={x + barWidth + 2} y={yB} width={barWidth} height={barHeightB} fill="#ef4444" rx="2" opacity="0.85" />
                              <text x={x + groupWidth / 2} y="158" fontSize="7" fill="#374151" textAnchor="middle">{shortenSubjectName(sub.name).slice(0, 4)}</text>
                            </g>
                          );
                        })}
                        {/* Legend */}
                        <rect x="100" y="168" width="10" height="6" fill="#3b82f6" rx="1" />
                        <text x="114" y="174" fontSize="7" fill="#374151">Exam A</text>
                        <rect x="160" y="168" width="10" height="6" fill="#ef4444" rx="1" />
                        <text x="174" y="174" fontSize="7" fill="#374151">Exam B</text>
                      </svg>
                    </div>
                  </div>

                  {/* Top Growth & Declining Subjects - Side by Side */}
                  {(() => {
                    const sortedByGrowth = [...comparisonData].sort((a, b) => b.delta - a.delta);
                    const topGrowth = sortedByGrowth.filter(d => d.delta > 0).slice(0, 3);
                    const topDecline = sortedByGrowth.filter(d => d.delta < 0).slice(-3).reverse();
                    
                    if (topGrowth.length === 0 && topDecline.length === 0) return null;
                    
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: topGrowth.length > 0 && topDecline.length > 0 ? 'repeat(2, 1fr)' : '1fr', gap: '12px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                        {/* Top Growth */}
                        {topGrowth.length > 0 && (
                          <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '1px solid #86efac' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #86efac' }}>
                              <span style={{ color: '#22c55e', fontSize: '12px' }}>↑</span>
                              <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#166534', margin: 0 }}>Top Growth Subjects</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {topGrowth.map((item) => (
                                <div 
                                  key={item.name}
                                  style={{ 
                                    padding: '8px 10px', 
                                    borderRadius: '6px', 
                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #86efac',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#166534' }}>{shortenSubjectName(item.name)}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>+{item.delta}%</div>
                                    <div style={{ fontSize: '7px', color: '#15803d' }}>{item.examB}%→{item.examA}%</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Declining Subjects */}
                        {topDecline.length > 0 && (
                          <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                              <span style={{ color: '#dc2626', fontSize: '12px' }}>↓</span>
                              <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b', margin: 0 }}>Declining Subjects</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {topDecline.map((item) => (
                                <div 
                                  key={item.name}
                                  style={{ 
                                    padding: '8px 10px', 
                                    borderRadius: '6px', 
                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #fca5a5',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#991b1b' }}>{shortenSubjectName(item.name)}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>{item.delta}%</div>
                                    <div style={{ fontSize: '7px', color: '#b91c1c' }}>{item.examB}%→{item.examA}%</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Subject-by-Subject Comparison */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconBook /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Subject Comparison Table</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#065f46' }}>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'left', color: 'white', fontWeight: 600 }}>Subject</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'center', color: 'white', fontWeight: 600 }}>Exam A</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'center', color: 'white', fontWeight: 600 }}>Exam B</th>
                          <th style={{ padding: '6px 8px', borderBottom: '1px solid #d1d5db', textAlign: 'center', color: 'white', fontWeight: 600 }}>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, idx) => (
                          <tr key={item.name} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
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

                  {/* Footer - Professional Style */}
                  <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                    This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Box Plot Report Dialog - Enhanced with Professional Design */}
      <Dialog open={boxPlotReportDialogOpen} onOpenChange={setBoxPlotReportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-10">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Box Plot Analysis Report
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  // Generate CSV data for box plot
                  const boxPlotData = boxPlotViewMode === "student" && boxPlotStudentId
                    ? calculateStudentBoxPlotData(
                        boxPlotAssessmentRecords,
                        boxPlotStudentId,
                        boxPlotStudentSubjects.length > 0 ? boxPlotStudentSubjects : undefined,
                        boxPlotStudentExamType && boxPlotStudentExamType !== "all" ? boxPlotStudentExamType : undefined,
                        boxPlotStartYear,
                        boxPlotEndYear
                      )
                    : calculateSubjectBoxPlotData(
                        boxPlotAssessmentRecords,
                        boxPlotSubjects,
                        boxPlotCohortType,
                        boxPlotSelectedClasses,
                        boxPlotSelectedYearGroups,
                        boxPlotSubjectExamType && boxPlotSubjectExamType !== "all" ? boxPlotSubjectExamType : undefined,
                        boxPlotStartYear,
                        boxPlotEndYear
                      );
                  const csvRows = [
                    ['Year', 'n', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Mean', 'IQR', 'Outliers'],
                    ...boxPlotData.map(stat => [
                      stat.year,
                      stat.n.toString(),
                      stat.min.toString(),
                      stat.q1.toString(),
                      stat.median.toString(),
                      stat.q3.toString(),
                      stat.max.toString(),
                      stat.mean.toString(),
                      stat.iqr.toString(),
                      stat.outliers.length.toString()
                    ])
                  ];
                  const csvContent = csvRows.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const result = await saveAndShareBlob(
                    blob,
                    `boxplot-report-${boxPlotViewMode}-${new Date().toISOString().split('T')[0]}.csv`,
                    "text/csv"
                  );
                  if (!result.success) {
                    toast({
                      title: "Export failed. Please try again.",
                    });
                  } else if (result.savedToDevice) {
                    toast({ title: "Saved to Downloads" });
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
                  handleReportPdfExport(
                    boxPlotReportRef,
                    `boxplot-report-${boxPlotViewMode}-${new Date().toISOString().split('T')[0]}`
                  );
                }}
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto" ref={boxPlotReportRef}>
            {(() => {
              const boxPlotData = boxPlotViewMode === "student" && boxPlotStudentId
                ? calculateStudentBoxPlotData(
                    boxPlotAssessmentRecords,
                    boxPlotStudentId,
                    boxPlotStudentSubjects.length > 0 ? boxPlotStudentSubjects : undefined,
                    boxPlotStudentExamType && boxPlotStudentExamType !== "all" ? boxPlotStudentExamType : undefined,
                    boxPlotStartYear,
                    boxPlotEndYear
                  )
                : calculateSubjectBoxPlotData(
                    boxPlotAssessmentRecords,
                    boxPlotSubjects,
                    boxPlotCohortType,
                    boxPlotSelectedClasses,
                    boxPlotSelectedYearGroups,
                    boxPlotSubjectExamType && boxPlotSubjectExamType !== "all" ? boxPlotSubjectExamType : undefined,
                    boxPlotStartYear,
                    boxPlotEndYear
                  );
              
              const insights = generateInsights(boxPlotData);
              const selectedStudent = boxPlotStudentLookup.get(boxPlotStudentId) || null;
              const reportTitle = boxPlotViewMode === "student" 
                ? `Student: ${selectedStudent?.name || 'N/A'}`
                : `Subjects: ${boxPlotSubjects.length === 0 ? 'All' : boxPlotSubjects.slice(0, 3).join(', ')}${boxPlotSubjects.length > 3 ? ` +${boxPlotSubjects.length - 3} more` : ''}`;
              
              // Calculate summary statistics
              const latestYear = boxPlotData[boxPlotData.length - 1];
              const earliestYear = boxPlotData[0];
              const medianChange = latestYear && earliestYear ? latestYear.median - earliestYear.median : 0;
              const avgMedian = boxPlotData.length > 0 ? Math.round(boxPlotData.reduce((sum, d) => sum + d.median, 0) / boxPlotData.length) : 0;
              const totalOutliers = boxPlotData.reduce((sum, d) => sum + d.outliers.length, 0);
              const avgIQR = boxPlotData.length > 0 ? Math.round(boxPlotData.reduce((sum, d) => sum + d.iqr, 0) / boxPlotData.length) : 0;

              return (
                <div className="space-y-4 p-2">
                  {/* Report Header - Dual Logo Style */}
                  <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                    <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Box Plot Analysis Report</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{reportTitle}</div>
                      <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                        Period: {boxPlotStartYear} - {boxPlotEndYear} • Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
                  </div>

                  {/* Summary Statistics Cards with Watermarks */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconBarChart /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Summary Statistics</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {/* Average Median */}
                      <div style={{ position: 'relative', padding: '10px 8px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{avgMedian}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>{avgMedian}%</div>
                          <div style={{ fontSize: '8px', color: '#166534' }}>Avg Median</div>
                        </div>
                      </div>
                      {/* Median Change */}
                      <div style={{ position: 'relative', padding: '10px 8px', borderRadius: '8px', backgroundColor: medianChange >= 0 ? '#dbeafe' : '#fee2e2', border: `1px solid ${medianChange >= 0 ? '#93c5fd' : '#fca5a5'}`, textAlign: 'center', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: medianChange >= 0 ? '#3b82f6' : '#ef4444', opacity: 0.15 }}>{Math.abs(medianChange)}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: medianChange >= 0 ? '#3b82f6' : '#ef4444' }}>{medianChange >= 0 ? '+' : ''}{medianChange}</div>
                          <div style={{ fontSize: '8px', color: medianChange >= 0 ? '#1d4ed8' : '#991b1b' }}>Median Δ</div>
                        </div>
                      </div>
                      {/* Average IQR */}
                      <div style={{ position: 'relative', padding: '10px 8px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fde047', textAlign: 'center', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#d97706', opacity: 0.15 }}>{avgIQR}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>{avgIQR}</div>
                          <div style={{ fontSize: '8px', color: '#92400e' }}>Avg IQR</div>
                        </div>
                      </div>
                      {/* Total Outliers */}
                      <div style={{ position: 'relative', padding: '10px 8px', borderRadius: '8px', backgroundColor: '#f3e8ff', border: '1px solid #c4b5fd', textAlign: 'center', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#9333ea', opacity: 0.15 }}>{totalOutliers}</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#9333ea' }}>{totalOutliers}</div>
                          <div style={{ fontSize: '8px', color: '#6b21a8' }}>Outliers</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Box Plot Chart */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconBarChart /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Box & Whisker Chart</h3>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ height: '320px' }}>
                        <BoxPlotChart data={boxPlotData} showMean={true} height={300} hideZoomHint={true} />
                      </div>
                      {/* Chart Legend */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666' }}>
                          <div style={{ width: '20px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                          <span>Box (Q1 to Q3)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666' }}>
                          <div style={{ width: '20px', height: '2px', backgroundColor: '#065f46' }} />
                          <span>Median</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666' }}>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%' }} />
                          <span>Mean</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666' }}>
                          <div style={{ width: '1px', height: '12px', backgroundColor: '#6b7280' }} />
                          <span>Whiskers (Min/Max)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#666' }}>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                          <span>Outliers</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insights Section */}
                  {insights.length > 0 && (
                    <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                        <span style={{ color: '#065f46' }}><IconStar /></span>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Key Insights</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {insights.slice(0, 5).map((insight, idx) => {
                          // Map insight.icon to colors and symbols for display
                          const bgColor = insight.icon === 'up' ? '#dcfce7' : insight.icon === 'down' ? '#fee2e2' : insight.icon === 'warning' ? '#fef3c7' : '#f3f4f6';
                          const borderColor = insight.icon === 'up' ? '#86efac' : insight.icon === 'down' ? '#fca5a5' : insight.icon === 'warning' ? '#fde047' : '#d1d5db';
                          const iconColor = insight.icon === 'up' ? '#22c55e' : insight.icon === 'down' ? '#ef4444' : insight.icon === 'warning' ? '#f59e0b' : '#6b7280';
                          const iconSymbol = insight.icon === 'up' ? '↑' : insight.icon === 'down' ? '↓' : insight.icon === 'warning' ? '⚠' : insight.icon === 'flat' ? '→' : 'ℹ';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '6px', backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
                              <span style={{ fontSize: '12px', color: iconColor, fontWeight: 700, flexShrink: 0 }}>{iconSymbol}</span>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>{insight.title}</div>
                                <div style={{ fontSize: '9px', color: '#666' }}>{insight.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Year-by-Year Statistics Table */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconBook /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Year-by-Year Statistics</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#065f46' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: 'white', fontWeight: 600 }}>Year</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>n</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Min</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Q1</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Median</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Q3</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Max</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>Mean</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: 600 }}>IQR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boxPlotData.map((stat, idx) => (
                          <tr key={stat.year} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontWeight: 500 }}>{stat.year}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.n}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.min}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.q1}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{stat.median}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.q3}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.max}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.mean}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{stat.iqr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Whiskers Analysis - High and Low Performers by Year */}
                  <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                      <span style={{ color: '#065f46' }}><IconTrendingUp /></span>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Whiskers Analysis</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {/* High Performers */}
                      <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '1px solid #86efac' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #86efac' }}>
                          <span style={{ fontSize: '12px', color: '#22c55e' }}>▲</span>
                          <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#166534', margin: 0 }}>High Performers (Above Q3)</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {boxPlotData.map(stat => {
                            const highOutliers = stat.outlierDetails?.filter(o => o.score > stat.q3) || [];
                            if (highOutliers.length === 0) return null;
                            return (
                              <div key={stat.year} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '4px', fontSize: '9px' }}>
                                <span style={{ fontWeight: 600, color: '#166534' }}>{stat.year}</span>
                                <span style={{ color: '#15803d' }}>{highOutliers.length} student{highOutliers.length > 1 ? 's' : ''}</span>
                              </div>
                            );
                          }).filter(Boolean)}
                          {boxPlotData.every(stat => !(stat.outlierDetails?.filter(o => o.score > stat.q3).length)) && (
                            <p style={{ fontSize: '9px', color: '#666', textAlign: 'center', padding: '8px' }}>No exceptional high performers identified</p>
                          )}
                        </div>
                      </div>
                      {/* Low Performers */}
                      <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                          <span style={{ fontSize: '12px', color: '#dc2626' }}>▼</span>
                          <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b', margin: 0 }}>Needs Attention (Below Q1)</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {boxPlotData.map(stat => {
                            const lowOutliers = stat.outlierDetails?.filter(o => o.score < stat.q1) || [];
                            if (lowOutliers.length === 0) return null;
                            return (
                              <div key={stat.year} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '4px', fontSize: '9px' }}>
                                <span style={{ fontWeight: 600, color: '#991b1b' }}>{stat.year}</span>
                                <span style={{ color: '#b91c1c' }}>{lowOutliers.length} student{lowOutliers.length > 1 ? 's' : ''}</span>
                              </div>
                            );
                          }).filter(Boolean)}
                          {boxPlotData.every(stat => !(stat.outlierDetails?.filter(o => o.score < stat.q1).length)) && (
                            <p style={{ fontSize: '9px', color: '#666', textAlign: 'center', padding: '8px' }}>No students identified as needing extra attention</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Outliers Section by Year */}
                  {boxPlotData.some(s => s.outliers.length > 0) && (
                    <div className="section" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                        <span style={{ color: '#065f46' }}><IconTarget /></span>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Outliers Detail by Year</h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {boxPlotData.filter(s => s.outliers.length > 0).map(stat => {
                          const highOutliers = stat.outlierDetails?.filter(o => o.score > stat.q3) || [];
                          const lowOutliers = stat.outlierDetails?.filter(o => o.score < stat.q1) || [];
                          
                          return (
                            <div key={stat.year} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a', marginRight: '8px' }}>{stat.year}</span>
                                <span style={{ fontSize: '8px', color: '#6b7280', padding: '2px 6px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                                  {stat.outliers.length} outlier{stat.outliers.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {highOutliers.length > 0 && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {highOutliers.slice(0, 4).map((o, i) => (
                                      <span key={i} style={{ 
                                        fontSize: '8px', 
                                        padding: '2px 6px', 
                                        backgroundColor: '#dcfce7', 
                                        color: '#166534', 
                                        borderRadius: '4px',
                                        border: '1px solid #86efac'
                                      }}>
                                        {o.label}: {o.score}%
                                      </span>
                                    ))}
                                    {highOutliers.length > 4 && <span style={{ fontSize: '8px', color: '#666' }}>+{highOutliers.length - 4} more</span>}
                                  </div>
                                </div>
                              )}
                              
                              {lowOutliers.length > 0 && (
                                <div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {lowOutliers.slice(0, 4).map((o, i) => (
                                      <span key={i} style={{ 
                                        fontSize: '8px', 
                                        padding: '2px 6px', 
                                        backgroundColor: '#fee2e2', 
                                        color: '#991b1b', 
                                        borderRadius: '4px',
                                        border: '1px solid #fca5a5'
                                      }}>
                                        {o.label}: {o.score}%
                                      </span>
                                    ))}
                                    {lowOutliers.length > 4 && <span style={{ fontSize: '8px', color: '#666' }}>+{lowOutliers.length - 4} more</span>}
                                  </div>
                                </div>
                              )}
                              
                              {/* Show raw outliers if no details available */}
                              {(!stat.outlierDetails || stat.outlierDetails.length === 0) && stat.outliers.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {stat.outliers.slice(0, 6).map((score, i) => (
                                    <span key={i} style={{ 
                                      fontSize: '8px', 
                                      padding: '2px 6px', 
                                      backgroundColor: score > stat.q3 ? '#dcfce7' : '#fee2e2', 
                                      color: score > stat.q3 ? '#166534' : '#991b1b', 
                                      borderRadius: '4px'
                                    }}>
                                      {score}%
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer - Professional Style */}
                  <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                    This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
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
