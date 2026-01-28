import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp, TrendingDown, Check, ArrowUp, ArrowDown, Minus, BarChart3, GitCompare, Target, AlertTriangle, Star, Goal, CheckCircle2, Circle, Edit2, ChevronDown, MessageSquare, Calendar, Sparkles, Printer, FileSpreadsheet, ArrowRightLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import schoolLogo from "@/assets/school-badge.png";
import { CertificateDialog } from "@/components/CertificateDialog";
import { ReportCardDialog } from "@/components/ReportCardDialog";
import { EnvelopeAwardCard } from "@/components/EnvelopeAwardCard";
import { SubjectPerformanceChart } from "@/components/SubjectPerformanceChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, ReferenceLine, ReferenceDot, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useAuth } from "@/contexts/AuthContext";
import { StatusIcon, type StatusIconVariant } from "@/components/common/StatusIcon";
import { useStudentReportCard } from "@/hooks/useStudentReportCard";
import { useStudentGradeGoals } from "@/hooks/useStudentGradeGoals";
import { useAssignedSubjectsFromSelections } from "@/hooks/useAssignedSubjectsFromSelections";
import { useStudentGradesByPeriods } from "@/hooks/useStudentGradesByPeriods";
import { StudentPillSelector } from "@/components/home/StudentPillSelector";
import { generateBehaviorSummary } from "@/lib/summary/behaviorSummary";
import { exportElementToPdf } from "@/lib/pdf/exportToPdf";
import { saveAndShareBlob } from "@/lib/export/nativeDownload";
import { toast } from "@/hooks/use-toast";
type YearKey = "2022" | "2023" | "2024" | "2025";
type ExamType = "midYear" | "yearEnd";
type AnalysisPeriod = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  yearLabel: string;
  periodLabel: string;
  displayLabel: string;
  academicPeriodId: string | null;
  academicPeriodName: string | null;
  academicYear: number | null;
};

const PERIOD_ORDER: readonly string[] = [
  "Mid Year Exam",
  "Trial (Checkpoint)",
  "Final Year Exam"
];

const ANALYSIS_TAB_VALUES = ["overview", "trends", "comparison", "goals"] as const;
type AnalysisTabValue = (typeof ANALYSIS_TAB_VALUES)[number];

const getPeriodOrderIndex = (name: string) => {
  const index = PERIOD_ORDER.indexOf(name);
  return index === -1 ? PERIOD_ORDER.length : index;
};

const safeNumber = (value: number | null | undefined, fallback = 0) => {
  return Number.isFinite(value) ? value : fallback;
};

const safePercent = (value: number | null | undefined, fallback = 0) => {
  const safe = safeNumber(value, fallback);
  return Math.min(100, Math.max(0, safe));
};

const safeText = (value: number | null | undefined, fallback = "—") => {
  return Number.isFinite(value) ? String(value) : fallback;
};

// Helper to get score from data structure
const getScore = (subject: typeof academicData.subjects[0], year: YearKey, examType: ExamType) => {
  const yearData = subject.scores[year];
  return yearData ? yearData[examType] : null;
};

// Import centralized subjects config
import { getShortSubjectName, getTinySubjectCode, subjectGroups, getSubjectColor } from "@/data/subjectsConfig";
import { SubjectGroupPill } from "@/components/SubjectGroupPill";

// Use centralized short name function
const shortenSubjectName = getShortSubjectName;

// Get subjects that are not part of any variant group (standalone subjects)
const groupedSubjectNames = subjectGroups.flatMap(g => g.variants?.map(v => v.name) || []);
export default function AcademicPage() {
  const [searchParams] = useSearchParams();
  const [mainSection, setMainSection] = useState<"report" | "analysis">(() => {
    const section = searchParams.get("section");
    return section === "analysis" ? "analysis" : "report";
  });
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "cocurriculum" ? "cocurriculum" : "grades";
  });
  const [examType, setExamType] = useState<ExamType>("midYear");
  const [selectedYear, setSelectedYear] = useState<YearKey>("2025");
  const [selectedYears, setSelectedYears] = useState<string[]>(["2025", "2024", "2023"]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "4years" | "5years">("5years");
  const [isExportingOverviewPdf, setIsExportingOverviewPdf] = useState(false);
  const [isExportingTrendsPdf, setIsExportingTrendsPdf] = useState(false);
  const [isExportingComparisonPdf, setIsExportingComparisonPdf] = useState(false);

  // Real student selection from Supabase
  const { linkedStudents, selectedStudentId, setSelectedStudentId, selectedStudent, loading: studentsLoading } = useStudentSelection();
  const { profile } = useAuth();
  const role = profile?.role?.toLowerCase() ?? "parent";
  const canViewBreakdown = role !== "parent";
  // Shared academic year / exam selection with localStorage persistence
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parent_selected_academic_year_id') || "";
    }
    return "";
  });

  const [selectedExamPeriodId, setSelectedExamPeriodId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("parent_selected_exam_period_id") || "";
    }
    return "";
  });

  // Persist shared selections to localStorage
  const [selectedAcademicPeriodId, setSelectedAcademicPeriodId] = useState<string>("");

  useEffect(() => {
    if (selectedAcademicYearId) {
      localStorage.setItem("parent_selected_academic_year_id", selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);

  useEffect(() => {
    if (selectedExamPeriodId) {
      localStorage.setItem("parent_selected_exam_period_id", selectedExamPeriodId);
    }
  }, [selectedExamPeriodId]);

  // Real report card data from Supabase
  const { 
    academicPeriods,
    periodsLoading,
    grades: realGrades,
    behavior: realBehavior,
    behaviorItems: realBehaviorItems,
    awards: realAwards,
    loading: reportCardLoading,
    hasData: hasRealData,
  } = useStudentReportCard(
    selectedStudentId || null,
    selectedExamPeriodId || null,
    selectedAcademicPeriodId || null
  );

  const behaviorSummary = useMemo(() => {
    const grades = {
      attendance: realBehavior?.attendanceRating,
      punctuality: realBehavior?.punctualityRating,
      cooperation: realBehavior?.cooperationRating,
      self_control: realBehavior?.selfControlRating,
      responsibility: realBehavior?.responsibilityRating,
      initiative: realBehavior?.initiativeRating,
      leadership: realBehavior?.leadershipRating,
    };
    const seed = `${selectedStudentId ?? "unknown"}:${realBehavior?.id ?? selectedExamPeriodId ?? "unknown"}`;
    return generateBehaviorSummary({ grades, seed });
  }, [
    realBehavior?.attendanceRating,
    realBehavior?.punctualityRating,
    realBehavior?.cooperationRating,
    realBehavior?.selfControlRating,
    realBehavior?.responsibilityRating,
    realBehavior?.initiativeRating,
    realBehavior?.leadershipRating,
    realBehavior?.id,
    selectedExamPeriodId,
    selectedStudentId,
  ]);

  const {
    subjects: assignedSubjects,
    assignedSubjectIds,
    loading: assignedSubjectsLoading,
    error: assignedSubjectsError,
  } = useAssignedSubjectsFromSelections(selectedStudentId || null);

  const assignedSubjectNames = useMemo(
    () => assignedSubjects.map((subject) => subject.name),
    [assignedSubjects]
  );

  const analysisSubjectGroups = useMemo(() => {
    const assignedSet = new Set(assignedSubjectNames);
    return subjectGroups
      .map((group) => ({
        ...group,
        variants: (group.variants || []).filter((variant) =>
          assignedSet.has(variant.name)
        ),
      }))
      .filter((group) => group.variants.length > 0);
  }, [assignedSubjectNames]);

  const analysisStandaloneSubjects = useMemo(() => {
    return assignedSubjects.filter(
      (subject) => !groupedSubjectNames.includes(subject.name)
    );
  }, [assignedSubjects]);

  const subjectNameToId = useMemo(() => {
    return new Map(assignedSubjects.map((subject) => [subject.name, subject.id]));
  }, [assignedSubjects]);

  const initRef = useRef<string | null>(null);
  const initCompleteRef = useRef<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const toggleSubject = useCallback((subjectId: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  }, []);
  const selectAllSubjects = useCallback(() => {
    setSelectedSubjectIds(assignedSubjectIds);
  }, [assignedSubjectIds]);
  const clearAllSubjects = useCallback(() => {
    setSelectedSubjectIds([]);
  }, []);

  useEffect(() => {
    if (!selectedStudentId || typeof window === "undefined") {
      return;
    }
    if (initRef.current === selectedStudentId) {
      return;
    }
    if (assignedSubjectIds.length === 0) {
      setSelectedSubjectIds([]);
      return;
    }
    const storageKey = `grade_analysis_selected_subjects_${selectedStudentId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const filtered = parsed
            .map((id) => Number(id))
            .filter((id) => assignedSubjectIds.includes(id));
          setSelectedSubjectIds(
            filtered.length > 0 ? filtered : assignedSubjectIds
          );
          initRef.current = selectedStudentId;
          initCompleteRef.current = selectedStudentId;
          return;
        }
      } catch {
        // Fall through to default selection.
      }
    }
    setSelectedSubjectIds(assignedSubjectIds);
    initRef.current = selectedStudentId;
    initCompleteRef.current = selectedStudentId;
  }, [selectedStudentId, assignedSubjectIds.join(",")]);

  useEffect(() => {
    if (!selectedStudentId || typeof window === "undefined") {
      return;
    }
    if (initCompleteRef.current !== selectedStudentId) {
      return;
    }
    const storageKey = `grade_analysis_selected_subjects_${selectedStudentId}`;
    localStorage.setItem(storageKey, JSON.stringify(selectedSubjectIds));
  }, [selectedStudentId, selectedSubjectIds]);

  const selectedSubjects = useMemo(() => {
    return assignedSubjects.filter((subject) =>
      selectedSubjectIds.includes(subject.id)
    );
  }, [assignedSubjects, selectedSubjectIds]);

  const selectedSubjectNames = useMemo(() => {
    return selectedSubjects.map((subject) => subject.name);
  }, [selectedSubjects]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportCardDialogOpen, setReportCardDialogOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"comment" | "tips">("comment");

  // Pinch-to-zoom state for chart
  const [chartZoom, setChartZoom] = useState(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  // Carousel state for Top Growth/Decline section
  const [growthCarouselSlide, setGrowthCarouselSlide] = useState(0);
  const [showGrowthSwipeHint, setShowGrowthSwipeHint] = useState(true);
  const [growthCarouselApi, setGrowthCarouselApi] = useState<any>(null);
  
  // Hide swipe hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGrowthSwipeHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle pinch-to-zoom with 2 fingers, allow single-finger scrolling to pass through
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      setIsPinching(true);
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
      const newZoom = Math.min(3, Math.max(0.5, chartZoom * scale));
      
      // Trigger haptic at zoom thresholds
      if ((chartZoom < 1.5 && newZoom >= 1.5) || (chartZoom >= 1.5 && newZoom < 1.5) ||
          (chartZoom < 2 && newZoom >= 2) || (chartZoom >= 2 && newZoom < 2)) {
        triggerHaptic();
      }
      
      setChartZoom(newZoom);
      lastTouchDistance.current = currentDistance;
    }
    // Single finger touches pass through for normal page scrolling
  }, [chartZoom, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    setIsPinching(false);
    lastTouchDistance.current = null;
  }, []);

  const resetZoom = useCallback(() => {
    triggerHaptic();
    setChartZoom(1);
  }, [triggerHaptic]);

  // Grade Analysis sub-tabs
  const [analysisTab, setAnalysisTab] = useState<AnalysisTabValue>("overview");
  const [compareExamAId, setCompareExamAId] = useState<string>("");
  const [compareExamBId, setCompareExamBId] = useState<string>("");

  const analysisPeriods = useMemo<AnalysisPeriod[]>(() => {
    return academicPeriods.map((period) => {
      const academicYear = period.academicYear ?? null;
      const academicPeriodId = period.academicPeriodId ?? null;
      const academicPeriodName = period.academicPeriodName ?? null;
      const yearLabel = Number.isFinite(academicYear)
        ? String(academicYear)
        : academicPeriodName ?? "";
      const periodLabel = period.name;
      const displayLabel = yearLabel ? `${periodLabel} ${yearLabel}`.trim() : periodLabel;

      return {
        id: period.id,
        name: period.name,
        code: period.code,
        sortOrder: getPeriodOrderIndex(period.name),
        yearLabel,
        periodLabel,
        displayLabel,
        academicPeriodId,
        academicPeriodName,
        academicYear,
      };
    });
  }, [academicPeriods]);

  const lastStudentIdRef = useRef<string | null>(null);
  const resetExamForStudentChangeRef = useRef(false);
  useEffect(() => {
    const previous = lastStudentIdRef.current;
    const current = selectedStudentId ?? null;
    if (previous && current && previous !== current) {
      resetExamForStudentChangeRef.current = true;
    }
    lastStudentIdRef.current = current;
  }, [selectedStudentId]);

  const academicPeriodOptions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; academicYear: number | null }
    >();

    analysisPeriods.forEach((period) => {
      if (!Number.isFinite(period.academicYear)) return;
      const id = String(period.academicYear);
      if (!map.has(id)) {
        map.set(id, {
          id,
          label: String(period.academicYear),
          academicYear: period.academicYear ?? null,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const byYear =
        safeNumber(b.academicYear) - safeNumber(a.academicYear);
      if (byYear !== 0) return byYear;
      return a.label.localeCompare(b.label);
    });
  }, [analysisPeriods]);

  useEffect(() => {
    if (academicPeriodOptions.length === 0) {
      setSelectedAcademicYearId("");
      setSelectedExamPeriodId("");
      setCompareExamAId("");
      setCompareExamBId("");
      return;
    }

    const validAcademicYear = academicPeriodOptions.some(
      (period) => period.id === selectedAcademicYearId
    );
    if (!selectedAcademicYearId || !validAcademicYear) {
      setSelectedAcademicYearId(academicPeriodOptions[0].id);
    }
  }, [academicPeriodOptions, selectedAcademicYearId]);

  const examPeriodOptions = useMemo(() => {
    const selectedYear = Number(selectedAcademicYearId);
    if (!Number.isFinite(selectedYear)) return [];

    const filtered = analysisPeriods.filter((period) => {
      return period.academicYear === selectedYear;
    });

    const deduped = Array.from(
      new Map(filtered.map((period) => [period.id, period])).values()
    );

    return deduped.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.periodLabel.localeCompare(b.periodLabel);
    });
  }, [analysisPeriods, selectedAcademicYearId]);

  useEffect(() => {
    if (!ANALYSIS_TAB_VALUES.includes(analysisTab)) {
      setAnalysisTab("overview");
    }
  }, [analysisTab]);

  useEffect(() => {
    if (!selectedAcademicYearId || examPeriodOptions.length === 0) {
      setSelectedExamPeriodId("");
      setCompareExamAId("");
      setCompareExamBId("");
      return;
    }

    if (resetExamForStudentChangeRef.current) {
      setSelectedExamPeriodId(examPeriodOptions[0].id);
      resetExamForStudentChangeRef.current = false;
    } else {
      const validOverview = examPeriodOptions.some(
        (period) => period.id === selectedExamPeriodId
      );
      if (!selectedExamPeriodId || !validOverview) {
        setSelectedExamPeriodId(examPeriodOptions[0].id);
      }
    }

    const [first, second] = examPeriodOptions;
    const validCompareA = examPeriodOptions.some((period) => period.id === compareExamAId);
    const validCompareB = examPeriodOptions.some((period) => period.id === compareExamBId);
    const nextA = validCompareA ? compareExamAId : first?.id || "";
    let nextB = validCompareB ? compareExamBId : second?.id || first?.id || "";
    if (examPeriodOptions.length >= 2 && nextA && nextA === nextB) {
      nextB = second?.id || nextB;
    }
    if (nextA !== compareExamAId) {
      setCompareExamAId(nextA);
    }
    if (nextB !== compareExamBId) {
      setCompareExamBId(nextB);
    }
  }, [
    selectedAcademicYearId,
    examPeriodOptions,
    selectedExamPeriodId,
    compareExamAId,
    compareExamBId,
  ]);

  const selectedAcademicYearLabel = useMemo(() => {
    return (
      academicPeriodOptions.find((period) => period.id === selectedAcademicYearId)
        ?.label ?? ""
    );
  }, [academicPeriodOptions, selectedAcademicYearId]);

  const selectedAcademicPeriodOption = useMemo(() => {
    return (
      academicPeriodOptions.find((period) => period.id === selectedAcademicYearId) ??
      null
    );
  }, [academicPeriodOptions, selectedAcademicYearId]);

  const selectedAcademicYear = useMemo(() => {
    const parsed = Number(selectedAcademicYearId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedAcademicYearId]);

  const selectedExamPeriod = useMemo(() => {
    return academicPeriods.find((period) => period.id === selectedExamPeriodId) ?? null;
  }, [academicPeriods, selectedExamPeriodId]);

  const selectedExamPeriodName = useMemo(() => {
    return (
      examPeriodOptions.find((period) => period.id === selectedExamPeriodId)
        ?.periodLabel ?? null
    );
  }, [examPeriodOptions, selectedExamPeriodId]);

  const resolvedAcademicPeriodId = useMemo(() => {
    if (selectedAcademicYear === null || !selectedExamPeriodName) return "";
    const match = academicPeriods.find(
      (period) =>
        period.academicYear === selectedAcademicYear &&
        period.name === selectedExamPeriodName
    );
    return match?.id ?? "";
  }, [academicPeriods, selectedAcademicYear, selectedExamPeriodName]);

  useEffect(() => {
    const resolvedId = resolvedAcademicPeriodId || "";
    setSelectedAcademicPeriodId(resolvedId);
    console.log("[AcademicPage] resolved selectedAcademicPeriodId", {
      selectedAcademicPeriodId: resolvedId || null,
      name: selectedExamPeriodName,
      year: selectedAcademicYear,
    });
    if (!resolvedId && selectedAcademicYear !== null && selectedExamPeriodName) {
      console.warn("[AcademicPage] selectedAcademicPeriodId missing after resolution", {
        name: selectedExamPeriodName,
        year: selectedAcademicYear,
      });
    }
  }, [resolvedAcademicPeriodId, selectedExamPeriodName, selectedAcademicYear]);

  const reportCardYearLabel = useMemo(() => {
    if (selectedAcademicPeriodOption?.label) return selectedAcademicPeriodOption.label;
    if (selectedAcademicYearLabel) return selectedAcademicYearLabel;
    if (Number.isFinite(selectedExamPeriod?.academicYear)) {
      return String(selectedExamPeriod?.academicYear);
    }
    return "";
  }, [selectedAcademicPeriodOption, selectedAcademicYearLabel, selectedExamPeriod]);

  const reportCardExamLabel = selectedExamPeriod?.name ?? "";

  const currentCalendarYear = new Date().getFullYear();
  const goalYear = useMemo(() => {
    const parsed = Number(selectedAcademicYearLabel);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : currentCalendarYear;
  }, [selectedAcademicYearLabel, currentCalendarYear]);

  // Real goals from Supabase
  const {
    goals: realGoals,
    loading: goalsLoading,
    savingGoalId,
    error: goalsError,
    upsertGoal,
    achievedCount,
    onTrackCount,
    needsFocusCount
  } = useStudentGradeGoals(selectedStudentId || null, goalYear);

  const [editingGoalSubjectId, setEditingGoalSubjectId] = useState<number | null>(null);
  const [tempGoalValue, setTempGoalValue] = useState<string>("");
  const goalsBySubjectId = useMemo(() => {
    const goalMap = new Map<number, number>();
    realGoals.forEach((goal) => {
      if (goal.targetPercentage !== null) {
        goalMap.set(goal.subjectId, goal.targetPercentage);
      }
    });
    return goalMap;
  }, [realGoals]);

  // Certificate dialog state
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<{
    category: string;
    organization: string;
    role: string;
  } | null>(null);

  // PDF Report dialog state
  const [overviewReportDialogOpen, setOverviewReportDialogOpen] = useState(false);
  const overviewReportRef = useRef<HTMLDivElement>(null);
  const [trendsReportDialogOpen, setTrendsReportDialogOpen] = useState(false);
  const trendsReportRef = useRef<HTMLDivElement>(null);
  const [comparisonReportDialogOpen, setComparisonReportDialogOpen] = useState(false);
  const comparisonReportRef = useRef<HTMLDivElement>(null);
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<"single" | "multiple">("single");
  const [isAtBottom, setIsAtBottom] = useState(false);
  const pdfDateStamp = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleExportOverviewPdf = useCallback(async () => {
    if (!overviewReportRef.current || isExportingOverviewPdf) return;
    setIsExportingOverviewPdf(true);
    try {
      const result = await exportElementToPdf({
        element: overviewReportRef.current,
        filename: `overview-report-${pdfDateStamp}`,
      });
      if (result.savedToDevice) {
        toast.success("Saved to Downloads");
      }
    } catch (error) {
      console.error("[AcademicPage] Overview PDF export failed", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExportingOverviewPdf(false);
    }
  }, [isExportingOverviewPdf, pdfDateStamp]);

  const handleExportTrendsPdf = useCallback(async () => {
    if (!trendsReportRef.current || isExportingTrendsPdf) return;
    setIsExportingTrendsPdf(true);
    try {
      const result = await exportElementToPdf({
        element: trendsReportRef.current,
        filename: `trends-report-${pdfDateStamp}`,
      });
      if (result.savedToDevice) {
        toast.success("Saved to Downloads");
      }
    } catch (error) {
      console.error("[AcademicPage] Trends PDF export failed", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExportingTrendsPdf(false);
    }
  }, [isExportingTrendsPdf, pdfDateStamp]);

  const handleExportComparisonPdf = useCallback(async () => {
    if (!comparisonReportRef.current || isExportingComparisonPdf) return;
    setIsExportingComparisonPdf(true);
    try {
      const result = await exportElementToPdf({
        element: comparisonReportRef.current,
        filename: `comparison-report-${pdfDateStamp}`,
      });
      if (result.savedToDevice) {
        toast.success("Saved to Downloads");
      }
    } catch (error) {
      console.error("[AcademicPage] Comparison PDF export failed", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExportingComparisonPdf(false);
    }
  }, [isExportingComparisonPdf, pdfDateStamp]);

  // Scroll detection for floating FAB
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

  // Use centralized subject colors for chart strokes
  const getSubjectStroke = (subject: string) => {
    return getSubjectColor(subject);
  };
  const isActivitiesTab = activeTab === "cocurriculum";
  const toggleYear = (year: string) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };
  const gradeColors: Record<string, string> = {
    "A*": "bg-chart-1 text-card",
    A: "bg-chart-1 text-card",
    B: "bg-chart-2 text-card",
    C: "bg-chart-4 text-card",
    D: "bg-chart-5 text-card",
    E: "bg-destructive text-destructive-foreground"
  };

  // Background colors for subject cards (using direct color values)
  const gradeCardBgStyles: Record<string, {
    bg: string;
    border: string;
  }> = {
    "A*": {
      bg: 'rgba(5, 150, 105, 0.1)',
      border: 'rgba(5, 150, 105, 0.3)'
    },
    A: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)'
    },
    B: {
      bg: 'rgba(234, 179, 8, 0.1)',
      border: 'rgba(234, 179, 8, 0.3)'
    },
    C: {
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.3)'
    },
    D: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    },
    E: {
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.3)'
    }
  };

  // Pill colors for grades
  const gradePillStyles: Record<string, {
    bg: string;
    text: string;
  }> = {
    "A*": {
      bg: '#059669',
      text: '#ffffff'
    },
    A: {
      bg: '#22c55e',
      text: '#ffffff'
    },
    B: {
      bg: '#eab308',
      text: '#ffffff'
    },
    C: {
      bg: '#f97316',
      text: '#ffffff'
    },
    D: {
      bg: '#ef4444',
      text: '#ffffff'
    },
    E: {
      bg: '#dc2626',
      text: '#ffffff'
    }
  };
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A*";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "E";
  };
  const generateReport = () => {
    setReportCardDialogOpen(true);
  };
  const getExamLabel = () => {
    const period = examPeriodOptions.find((item) => item.id === selectedExamPeriodId);
    if (!period) return "Exam";
    if (selectedAcademicYearLabel) {
      return `${period.periodLabel} ${selectedAcademicYearLabel}`.trim();
    }
    return period.periodLabel;
  };

  const filteredGradesSubjects = selectedSubjects;

  const analysisSelectedSubjectIds = useMemo(() => {
    return selectedSubjectIds;
  }, [selectedSubjectIds]);

  const sortedPeriodsForYear = useMemo(() => {
    return [...examPeriodOptions].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.displayLabel.localeCompare(b.displayLabel);
    });
  }, [examPeriodOptions]);

  const currentPeriodId = useMemo(() => {
    const match = sortedPeriodsForYear.find(
      (period) => period.id === selectedExamPeriodId
    );
    return match?.id ?? null;
  }, [sortedPeriodsForYear, selectedExamPeriodId]);

  const previousPeriodId = useMemo(() => {
    if (!currentPeriodId) return null;
    const currentIndex = sortedPeriodsForYear.findIndex(
      (period) => period.id === currentPeriodId
    );
    if (currentIndex <= 0) return null;
    return sortedPeriodsForYear[currentIndex - 1]?.id ?? null;
  }, [sortedPeriodsForYear, currentPeriodId]);

  const trendPeriods = useMemo(() => {
    if (sortedPeriodsForYear.length === 0) return [];
    let filtered = sortedPeriodsForYear;
    if (trendPeriod === "1year") {
      filtered = sortedPeriodsForYear.slice(-2);
    } else if (trendPeriod === "2years") {
      filtered = sortedPeriodsForYear.slice(-4);
    } else if (trendPeriod === "3years") {
      filtered = sortedPeriodsForYear.slice(-6);
    } else if (trendPeriod === "4years") {
      filtered = sortedPeriodsForYear.slice(-8);
    } else if (trendPeriod === "5years") {
      filtered = sortedPeriodsForYear.slice(-7);
    }
    return filtered;
  }, [sortedPeriodsForYear, trendPeriod]);

  const trendPeriodIds = useMemo(() => {
    return trendPeriods.map((period) => period.id);
  }, [trendPeriods]);

  const comparePeriodIdsA = useMemo(() => {
    return compareExamAId ? [compareExamAId] : [];
  }, [compareExamAId]);

  const comparePeriodIdsB = useMemo(() => {
    return compareExamBId ? [compareExamBId] : [];
  }, [compareExamBId]);

  const allAcademicPeriodIds = useMemo(() => {
    return examPeriodOptions.map((period) => period.id);
  }, [examPeriodOptions]);

  const analysisPeriodIdsForQuery = useMemo(() => {
    const ids = new Set<string>();
    allAcademicPeriodIds.forEach((id) => ids.add(id));
    if (currentPeriodId) ids.add(currentPeriodId);
    if (previousPeriodId) ids.add(previousPeriodId);
    trendPeriodIds.forEach((id) => ids.add(id));
    comparePeriodIdsA.forEach((id) => ids.add(id));
    comparePeriodIdsB.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [
    allAcademicPeriodIds,
    currentPeriodId,
    previousPeriodId,
    trendPeriodIds,
    comparePeriodIdsA,
    comparePeriodIdsB,
  ]);

  const {
    grades: analysisGrades,
    loading: analysisGradesLoading,
    error: analysisGradesError,
  } = useStudentGradesByPeriods({
    studentId: selectedStudentId || null,
    subjectIds: analysisSelectedSubjectIds,
    periodIds: analysisPeriodIdsForQuery,
  });

  const gradesByPeriod = useMemo(() => {
    const map = new Map<string, Map<number, typeof analysisGrades[number]>>();
    analysisGrades.forEach((grade) => {
      if (!map.has(grade.academic_period_id)) {
        map.set(grade.academic_period_id, new Map());
      }
      map.get(grade.academic_period_id)!.set(grade.subject_id, grade);
    });
    return map;
  }, [analysisGrades]);

  const getGradeFor = useCallback(
    (periodId: string | null, subjectId: number) => {
      if (!periodId) return null;
      return gradesByPeriod.get(periodId)?.get(subjectId) ?? null;
    },
    [gradesByPeriod]
  );

  const getScoreFor = useCallback(
    (periodId: string | null, subjectId: number) => {
      const grade = getGradeFor(periodId, subjectId);
      return Number.isFinite(grade?.total_marks) ? grade!.total_marks! : null;
    },
    [getGradeFor]
  );

  const currentScores = useMemo(() => {
    return filteredGradesSubjects
      .map((subject) => ({
        subject,
        score: getScoreFor(currentPeriodId, subject.id),
      }))
      .filter((item) => item.score !== null);
  }, [filteredGradesSubjects, currentPeriodId, getScoreFor]);

  const currentGradeRows = useMemo(() => {
    if (!currentPeriodId) return [];
    return filteredGradesSubjects
      .map((subject) => getGradeFor(currentPeriodId, subject.id))
      .filter((grade): grade is typeof analysisGrades[number] => Boolean(grade));
  }, [filteredGradesSubjects, currentPeriodId, getGradeFor]);

  const previousGradeRows = useMemo(() => {
    if (!previousPeriodId) return [];
    return filteredGradesSubjects
      .map((subject) => getGradeFor(previousPeriodId, subject.id))
      .filter((grade): grade is typeof analysisGrades[number] => Boolean(grade));
  }, [filteredGradesSubjects, previousPeriodId, getGradeFor]);

  const hasAssignedSubjects = assignedSubjectIds.length > 0;
  const analysisLoading = assignedSubjectsLoading || analysisGradesLoading;
  const analysisError = assignedSubjectsError || analysisGradesError;
  const hasCurrentGrades = currentGradeRows.length > 0;
  const hasPreviousGrades = previousGradeRows.length > 0;
  const overviewEmptyMessage = !hasAssignedSubjects
    ? "No subjects assigned to this student yet"
    : selectedSubjectIds.length === 0
    ? "Select at least one subject to view grades"
    : !currentPeriodId || !hasCurrentGrades
    ? "No grades found for selected exam/subjects"
    : null;

  // Calculate averages
  const currentAverage = useMemo(() => {
    if (currentScores.length === 0) return 0;
    const total = currentScores.reduce(
      (sum, item) => sum + safeNumber(item.score),
      0
    );
    return Math.round(total / currentScores.length);
  }, [currentScores]);
  const currentAverageDisplay =
    currentScores.length > 0 ? `${safeNumber(currentAverage)}%` : "—";

  // Subject performance data for bar chart (sorted best to worst)
  const subjectPerformance = useMemo(() => {
    return filteredGradesSubjects
      .map((subject) => {
        const score = getScoreFor(currentPeriodId, subject.id);
        const goal = goalsBySubjectId.get(subject.id) ?? 80;
        return {
          subjectId: subject.id,
          name: subject.name,
          score: safeNumber(score),
          goal: safeNumber(goal, 80),
        };
      })
      .sort((a, b) => safeNumber(b.score) - safeNumber(a.score));
  }, [filteredGradesSubjects, currentPeriodId, getScoreFor, goalsBySubjectId]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const defaultBuckets = Object.keys(gradePillStyles);
    const gradeOrder: string[] = [];
    const gradeCounts = new Map<string, number>();

    const ensureBucket = (label: string) => {
      if (!gradeCounts.has(label)) {
        gradeCounts.set(label, 0);
        gradeOrder.push(label);
      }
    };

    defaultBuckets.forEach(ensureBucket);

    currentGradeRows.forEach((gradeRow) => {
      const letter =
        gradeRow.letter_grade ||
        (Number.isFinite(gradeRow.total_marks)
          ? getGradeFromScore(gradeRow.total_marks!)
          : null);
      if (!letter) return;
      ensureBucket(letter);
      gradeCounts.set(letter, safeNumber(gradeCounts.get(letter)) + 1);
    });

    return gradeOrder.map((grade) => ({
      grade,
      count: safeNumber(gradeCounts.get(grade)),
    }));
  }, [currentGradeRows, getGradeFromScore, gradePillStyles]);

  const gradeDistributionTotal = useMemo(() => {
    return gradeDistribution.reduce(
      (sum, item) => sum + safeNumber(item.count),
      0
    );
  }, [gradeDistribution]);

  // Top 3 and Bottom 3 subjects (bottom only includes scores below 50%)
  const top3 = useMemo(() => {
    const sorted = [...filteredGradesSubjects]
      .map((subject) => ({
        subject,
        score: safeNumber(getScoreFor(currentPeriodId, subject.id)),
      }))
      .sort((a, b) => safeNumber(b.score) - safeNumber(a.score));
    return sorted.slice(0, 3).map((item) => item.subject);
  }, [filteredGradesSubjects, currentPeriodId, getScoreFor]);

  // Calculate subjects passing (score >= 50)
  const passingStats = useMemo(() => {
    const passingSubjects = currentScores.filter(
      (item) => (item.score ?? 0) >= 50
    );
    const passingCount = passingSubjects.length;
    const totalSubjects = filteredGradesSubjects.length;
    const passingPercentage = safePercent(
      totalSubjects > 0 ? (passingCount / totalSubjects) * 100 : 0
    );
    return {
      passingCount: safeNumber(passingCount),
      totalSubjects: safeNumber(totalSubjects),
      passingPercentage: Math.round(passingPercentage)
    };
  }, [currentScores, filteredGradesSubjects]);

  // Find weakest subject
  const weakestSubjectInfo = useMemo(() => {
    if (currentScores.length === 0) return { name: "N/A", score: 0 };
    const weakest = currentScores.reduce((worst, current) => {
      return safeNumber(current.score) < safeNumber(worst.score)
        ? current
        : worst;
    });
    return {
      name: weakest.subject.name,
      score: safeNumber(weakest.score)
    };
  }, [currentScores]);
  const weakestSubjectScoreDisplay =
    currentScores.length > 0 ? `${safeNumber(weakestSubjectInfo.score)}%` : "—";

  // Best subject info
  const bestSubjectInfo = useMemo(() => {
    if (currentScores.length === 0) return { name: "N/A", score: 0 };
    const best = currentScores.reduce((bestItem, current) => {
      return safeNumber(current.score) > safeNumber(bestItem.score)
        ? current
        : bestItem;
    });
    return {
      name: best.subject.name,
      score: safeNumber(best.score)
    };
  }, [currentScores]);
  const bestSubjectScoreDisplay =
    currentScores.length > 0 ? `${safeNumber(bestSubjectInfo.score)}%` : "—";

  // Improvement from previous exam
  const improvementStats = useMemo(() => {
    if (!previousPeriodId || !hasPreviousGrades || currentScores.length === 0) {
      return { points: 0, text: "N/A", hasDelta: false };
    }
    const deltas = filteredGradesSubjects
      .map((subject) => {
        const current = getScoreFor(currentPeriodId, subject.id);
        const prev = getScoreFor(previousPeriodId, subject.id);
        if (current === null || prev === null) return null;
        return safeNumber(current) - safeNumber(prev);
      })
      .filter((delta): delta is number => delta !== null);
    if (deltas.length === 0) return { points: 0, text: "N/A", hasDelta: false };
    const avgDelta = Math.round(
      deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length
    );
    return {
      points: avgDelta,
      text: avgDelta >= 0 ? `+${avgDelta}%` : `${avgDelta}%`,
      hasDelta: true
    };
  }, [filteredGradesSubjects, currentPeriodId, previousPeriodId, getScoreFor, hasPreviousGrades, currentScores.length]);
  const risingStars = useMemo(() => {
    if (!previousPeriodId || !hasPreviousGrades) return [];
    const improvements = filteredGradesSubjects
      .map((subject) => {
        const current = getScoreFor(currentPeriodId, subject.id);
        const prev = getScoreFor(previousPeriodId, subject.id);
        if (current === null || prev === null) return null;
        return {
          subject,
          current: safeNumber(current),
          prev: safeNumber(prev),
          improvement: safeNumber(current) - safeNumber(prev)
        };
      })
      .filter(
        (item): item is { subject: typeof filteredGradesSubjects[number]; current: number; prev: number; improvement: number } =>
          item !== null && item.improvement > 0
      );
    return improvements.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, [filteredGradesSubjects, currentPeriodId, previousPeriodId, getScoreFor, hasPreviousGrades]);

  // Falling behind - subjects with biggest decline from previous exam
  const fallingBehind = useMemo(() => {
    if (!previousPeriodId || !hasPreviousGrades) return [];
    const declines = filteredGradesSubjects
      .map((subject) => {
        const current = getScoreFor(currentPeriodId, subject.id);
        const prev = getScoreFor(previousPeriodId, subject.id);
        if (current === null || prev === null) return null;
        return {
          subject,
          current: safeNumber(current),
          prev: safeNumber(prev),
          decline: safeNumber(prev) - safeNumber(current)
        };
      })
      .filter(
        (item): item is { subject: typeof filteredGradesSubjects[number]; current: number; prev: number; decline: number } =>
          item !== null && (item.current < 50 || item.decline >= 5)
      );
    return declines.sort((a, b) => b.decline - a.decline).slice(0, 3);
  }, [filteredGradesSubjects, currentPeriodId, previousPeriodId, getScoreFor, hasPreviousGrades]);

  // Trend data for selected year/periods
  const trendData = useMemo(() => {
    return trendPeriods.map((period) => {
      const result: Record<string, number | string> = {
        periodId: period.id,
        period: period.periodLabel
      };
      selectedSubjects.forEach((subject) => {
        result[subject.name] = safeNumber(
          getScoreFor(period.id, subject.id)
        );
      });
      const scores = selectedSubjects
        .map((subject) => getScoreFor(period.id, subject.id))
        .filter((score): score is number => score !== null);
      result["Average"] =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      return result;
    });
  }, [trendPeriods, selectedSubjects, getScoreFor]);

  // Calculate trend direction for selected subject(s)
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return {
      direction: "stable" as const,
      change: 0
    };
    const key = selectedSubjectNames.length === 1 ? selectedSubjectNames[0] : "Average";
    const firstValue = trendData[0]?.[key] as number | null | undefined;
    const lastValue = trendData[trendData.length - 1]?.[key] as number | null | undefined;
    if (!Number.isFinite(firstValue) || !Number.isFinite(lastValue)) return {
      direction: "stable" as const,
      change: 0
    };
    const change = safeNumber(lastValue) - safeNumber(firstValue);
    return {
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "stable" as const,
      change: Math.abs(safeNumber(change)),
      currentValue: safeNumber(lastValue)
    };
  }, [trendData, selectedSubjectNames]);

  const trendHeaderValue = useMemo(() => {
    if (selectedSubjectIds.length === 0) return "—";
    const value =
      trendDirection.currentValue ?? (currentScores.length > 0 ? currentAverage : null);
    return safeText(value, "—");
  }, [selectedSubjectIds.length, trendDirection.currentValue, currentScores.length, currentAverage]);

  // Calculate goal reference line value for trends chart
  const trendGoalValue = useMemo(() => {
    if (selectedSubjectIds.length === 1) {
      const subjectId = selectedSubjectIds[0];
      return goalsBySubjectId.get(subjectId) ?? 80;
    }
    const selectedGoals = selectedSubjectIds.map(
      (id) => goalsBySubjectId.get(id) ?? 80
    );
    return selectedGoals.length > 0
      ? Math.round(
          selectedGoals.reduce((a, b) => a + b, 0) / selectedGoals.length
        )
      : 80;
  }, [selectedSubjectIds, goalsBySubjectId]);

  // Radar chart data for subject strengths profile - use tiny codes for compact display
  const radarData = useMemo(() => {
    return assignedSubjects.map((subject) => ({
      subject: getTinySubjectCode(subject.name),
      fullName: subject.name,
      score: safeNumber(getScoreFor(currentPeriodId, subject.id)),
      fullMark: 100
    }));
  }, [assignedSubjects, currentPeriodId, getScoreFor]);

  // Subject vs Overall Average data derived from current period scores
  const subjectVsClassData = useMemo(() => {
    const overallAvg = safeNumber(currentAverage);
    return filteredGradesSubjects
      .map((subject) => {
        const studentScore = safeNumber(
          getScoreFor(currentPeriodId, subject.id)
        );
        return {
          subjectId: subject.id,
          name: shortenSubjectName(subject.name),
          fullName: subject.name,
          student: studentScore,
          classAvg: overallAvg,
          delta: safeNumber(studentScore - overallAvg)
        };
      })
      .sort((a, b) => safeNumber(b.delta) - safeNumber(a.delta));
  }, [filteredGradesSubjects, currentPeriodId, getScoreFor, currentAverage]);

  // Average score for radar color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map((d) => d.score);
    return scores.length > 0
      ? safeNumber(scores.reduce((a, b) => a + b, 0)) / scores.length
      : 0;
  }, [radarData]);

  // Performance Heatmap data - subjects x exam periods
  const heatmapData = useMemo(() => {
    return assignedSubjects.map((subject) => ({
      subjectId: subject.id,
      subject: shortenSubjectName(subject.name),
      fullName: subject.name,
      scores: sortedPeriodsForYear.map((period) => ({
        periodId: period.id,
        periodLabel: period.periodLabel,
        score: getScoreFor(period.id, subject.id)
      }))
    }));
  }, [assignedSubjects, sortedPeriodsForYear, getScoreFor]);

  // Helper function to get heatmap cell color based on score
  const getHeatmapColor = (score: number | null): string => {
    if (score === null) return "hsl(var(--muted))";
    if (score >= 85) return "#16a34a"; // dark green
    if (score >= 75) return "#22c55e"; // green
    if (score >= 65) return "#84cc16"; // lime
    if (score >= 55) return "#eab308"; // yellow
    if (score >= 45) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const analysisPeriodById = useMemo(() => {
    return new Map(analysisPeriods.map((period) => [period.id, period]));
  }, [analysisPeriods]);

  const getPeriodLabel = useCallback(
    (periodId: string | null) => {
      if (!periodId) return "Exam";
      const period = analysisPeriodById.get(periodId);
      if (!period) return "Exam";
      if (period.yearLabel && period.yearLabel !== "Unknown") {
        return `${period.periodLabel} ${period.yearLabel}`.trim();
      }
      return period.periodLabel;
    },
    [analysisPeriodById]
  );

  // Comparison data - filtered by selected subjects
  const comparisonData = useMemo(() => {
    const examAId = compareExamAId || null;
    const examBId = compareExamBId || null;
    return selectedSubjects
      .map((subject) => {
        const scoreA = safeNumber(getScoreFor(examAId, subject.id));
        const scoreB = safeNumber(getScoreFor(examBId, subject.id));
        const delta = safeNumber(scoreA - scoreB);
        return {
          subjectId: subject.id,
          name: subject.name,
          examA: scoreA,
          examB: scoreB,
          delta,
          improved: delta > 0,
          goal: safeNumber(goalsBySubjectId.get(subject.id), 80)
        };
      });
  }, [
    selectedSubjects,
    compareExamAId,
    compareExamBId,
    getScoreFor,
    goalsBySubjectId
  ]);

  const compareEmptyMessage = !hasAssignedSubjects
    ? "No subjects assigned to this student yet"
    : selectedSubjectIds.length === 0
    ? "Select at least one subject to compare"
    : comparePeriodIdsA.length === 0 || comparePeriodIdsB.length === 0
    ? "Select two exam periods to compare"
    : comparisonData.length === 0
    ? "No comparison data for these periods yet"
    : null;

  // Category comparison - filtered by selected subjects
  const categoryComparison = useMemo(() => {
    const examAId = compareExamAId || null;
    const examBId = compareExamBId || null;
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    const filteredSubjects = selectedSubjects;
    return categories.map((category) => {
      const scoresA = filteredSubjects
        .map((subject) => {
          const grade = getGradeFor(examAId, subject.id);
          if (!grade) return null;
          if (category === "attitude") return grade.attitude_marks ?? null;
          if (category === "homework") return grade.homework_marks ?? null;
          if (category === "quiz") return grade.quiz_marks ?? null;
          return grade.exam_marks ?? null;
        })
        .filter((score): score is number => score !== null);
      const scoresB = filteredSubjects
        .map((subject) => {
          const grade = getGradeFor(examBId, subject.id);
          if (!grade) return null;
          if (category === "attitude") return grade.attitude_marks ?? null;
          if (category === "homework") return grade.homework_marks ?? null;
          if (category === "quiz") return grade.quiz_marks ?? null;
          return grade.exam_marks ?? null;
        })
        .filter((score): score is number => score !== null);
      const avgA = safeNumber(
        scoresA.length > 0
          ? Math.round(scoresA.reduce((a, b) => a + b, 0) / scoresA.length)
          : 0
      );
      const avgB = safeNumber(
        scoresB.length > 0
          ? Math.round(scoresB.reduce((a, b) => a + b, 0) / scoresB.length)
          : 0
      );
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        examA: avgA,
        examB: avgB,
        delta: safeNumber(avgA - avgB)
      };
    });
  }, [selectedSubjects, compareExamAId, compareExamBId, getGradeFor]);

  // Distinct colors for subjects
  const lineColors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  // Grade-specific colors for distribution chart
  const gradeChartColors: Record<string, string> = {
    "A*": "#059669",
    // dark green
    "A": "#16a34a",
    // green
    "B": "#22c55e",
    // light green
    "C": "#eab308",
    // yellow
    "D": "#f97316",
    // orange
    "E": "#ef4444" // red
  };
  const filteredSubjects = subjectFilter === "all" ? academicData.subjects : academicData.subjects.filter(s => s.name === subjectFilter);
  return <AppLayout>
      <AppHeader leftContent={<div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" crossOrigin="anonymous" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>} rightContent={<StudentPillSelector onStudentChange={setSelectedStudentId} />} />

      {/* Main Tab Switcher - Report Card / Grade Analysis */}
      <section className="px-4 pt-4">
        <Tabs value={mainSection} onValueChange={v => setMainSection(v as "report" | "analysis")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="report">Report Card</TabsTrigger>
            <TabsTrigger value="analysis">Grade Analysis</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Report Card Section */}
      {mainSection === "report" && <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Card
              {selectedStudent && <Badge variant="secondary" className="ml-auto text-xs">{selectedStudent.name}</Badge>}
            </CardTitle>
            {/* Shared Year / Exam Filters */}
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Year:</span>
                <Select
                  value={selectedAcademicYearId}
                  onValueChange={setSelectedAcademicYearId}
                  disabled={periodsLoading || academicPeriodOptions.length === 0}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue
                      placeholder={periodsLoading ? "Loading years..." : "Select Year"}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {academicPeriodOptions.length === 0 && !periodsLoading ? (
                      <SelectItem value="__empty_year__" disabled>
                        No years
                      </SelectItem>
                    ) : (
                      academicPeriodOptions.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Exam:</span>
                <Select
                  value={selectedExamPeriodId}
                  onValueChange={setSelectedExamPeriodId}
                  disabled={periodsLoading || examPeriodOptions.length === 0}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue
                      placeholder={periodsLoading ? "Loading exams..." : "Select Exam"}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {examPeriodOptions.length === 0 && !periodsLoading ? (
                      <SelectItem value="__empty_exam__" disabled>
                        No exams
                      </SelectItem>
                    ) : (
                      examPeriodOptions.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.periodLabel}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tabs for Grades/Behavior/Activities */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="cocurriculum">Awards</TabsTrigger>
              </TabsList>

              {/* Download Button */}
              <Button className="w-full gap-2 mt-3" onClick={generateReport} disabled={!hasRealData || reportCardLoading}>
                {reportCardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Report Card
              </Button>

              {reportGenerated && <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center mt-2">
                  <p className="text-sm text-foreground">Report Card downloaded!</p>
                </div>}

              <TabsContent value="grades" className="mt-4">
                {/* Loading State */}
                {reportCardLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Empty State */}
                {!reportCardLoading && realGrades.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No grades available for this period.</p>
                    <p className="text-xs text-muted-foreground mt-1">Please select a different academic period.</p>
                  </div>
                )}

                {/* Real Grades Display */}
                {!reportCardLoading && realGrades.length > 0 && (
                  <div className="space-y-3">
                    {/* Sort subjects by total marks (highest to lowest), then group into rows of 2 */}
                    {(() => {
                      const sortedGrades = [...realGrades].sort((a, b) => b.totalMarks - a.totalMarks);
                      return Array.from({
                        length: Math.ceil(sortedGrades.length / 2)
                      }, (_, rowIndex) => {
                        const rowGrades = sortedGrades.slice(rowIndex * 2, rowIndex * 2 + 2);
                        const expandedInRow = rowGrades.find(g => g.subjectName === expandedSubject);
                        return <div key={rowIndex} className="space-y-3">
                            {/* Subject Cards Row */}
                            <div className="grid grid-cols-2 gap-3">
                              {rowGrades.map((grade, index) => {
                                const isPending = grade.letterGrade === null;
                                const isExpanded = expandedSubject === grade.subjectName;
                                const gradeKey = isPending ? 'C' : (grade.letterGrade?.[0] || 'C');
                                const cardStyle = gradeCardBgStyles[gradeKey] || gradeCardBgStyles.C;
                                return <div key={index} onClick={() => setExpandedSubject(isExpanded ? null : grade.subjectName)} className={`
                                        flex flex-col p-4 rounded-xl cursor-pointer border
                                        transition-all duration-200 ease-out min-h-[80px]
                                        hover:shadow-md
                                        ${isExpanded ? 'ring-2 ring-primary/40 shadow-md' : ''}
                                      `} style={{
                                  backgroundColor: cardStyle.bg,
                                  borderColor: cardStyle.border
                                }}>
                                      <h3 className="font-medium text-foreground text-sm leading-tight mb-2 line-clamp-2 break-words">{grade.subjectName}</h3>
                                      <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                          <p className="text-lg font-semibold text-foreground">
                                            {isPending ? "Pending" : `${grade.totalMarks}%`}
                                          </p>
                                          {!isPending && grade.letterGrade && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                            backgroundColor: (gradePillStyles[grade.letterGrade[0]] || gradePillStyles.C).bg,
                                            color: (gradePillStyles[grade.letterGrade[0]] || gradePillStyles.C).text
                                          }}>
                                              {grade.letterGrade}
                                            </span>}
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                      </div>
                                    </div>;
                              })}
                            </div>
                            
                            {/* Expanded Comment Box - Full Width */}
                            {expandedInRow && (
                              <div className="animate-fade-in">
                                <div className="rounded-xl p-4 relative mt-1 transition-colors bg-primary/5 border border-primary/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">Teacher's Comment</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {expandedInRow.teacherComment || "No comment available for this subject."}
                                  </p>
                                  {canViewBreakdown && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Score Breakdown</p>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center p-2 bg-muted/50 rounded-md">
                                          <p className="text-xs text-muted-foreground">Quiz</p>
                                          <p className="text-sm font-semibold">{expandedInRow.quizMarks}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted/50 rounded-md">
                                          <p className="text-xs text-muted-foreground">HW</p>
                                          <p className="text-sm font-semibold">{expandedInRow.homeworkMarks}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted/50 rounded-md">
                                          <p className="text-xs text-muted-foreground">Exam</p>
                                          <p className="text-sm font-semibold">{expandedInRow.examMarks}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted/50 rounded-md">
                                          <p className="text-xs text-muted-foreground">Att</p>
                                          <p className="text-sm font-semibold">{expandedInRow.attitudeMarks}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>;
                      });
                    })()}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="behavior" className="mt-4 space-y-4">
                {/* Loading State */}
                {reportCardLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Empty State */}
                {!reportCardLoading && realBehaviorItems.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No behavior assessment available for this period.</p>
                  </div>
                )}

                {/* Real Behavior Data */}
                {!reportCardLoading && realBehaviorItems.length > 0 && (
                  <>
                    {/* Automated Behaviour Summary Card */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary mb-1">Smart Summary</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {behaviorSummary.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Automatically generated based on behaviour indicators.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Behavioral Traits Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {realBehaviorItems.map((item, index) => {
                        const gradeConfig: Record<string, { bg: string; border: string; text: string; watermark: string }> = {
                          A: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", watermark: "text-emerald-200" },
                          B: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", watermark: "text-blue-200" },
                          C: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", watermark: "text-amber-200" },
                          D: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", watermark: "text-orange-200" },
                          E: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", watermark: "text-red-200" }
                        };
                        const config = gradeConfig[item.grade] || gradeConfig.C;
                        return (
                          <Card key={index} className={`${config.bg} ${config.border} overflow-hidden relative`}>
                            <div className={`absolute -right-1 -bottom-3 text-[4.5rem] font-black leading-none ${config.watermark} select-none pointer-events-none`}>
                              {item.grade}
                            </div>
                            <CardContent className="p-3 relative z-10">
                              <span className={`text-xs font-semibold uppercase ${config.text}`}>{item.category}</span>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Homeroom Teacher Comment Section */}
                    <Card className="bg-rose-50 border-rose-200 rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-rose-100">
                            <MessageSquare className="h-5 w-5 text-rose-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold uppercase text-rose-700 mb-2">Homeroom Teacher Comment</p>
                            {realBehavior?.homeroomTeacherComment ? (
                              <p className="text-sm text-rose-900 leading-relaxed">
                                {realBehavior.homeroomTeacherComment}
                              </p>
                            ) : (
                              <p className="text-sm text-rose-400 italic">
                                No homeroom teacher comment for this period.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="cocurriculum" className="mt-4 space-y-3">
                {/* Loading State */}
                {reportCardLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Empty State */}
                {!reportCardLoading && !realAwards && (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No awards or activities recorded for this period.</p>
                    <p className="text-xs text-muted-foreground mt-1">Cocurricular activities will appear here once added.</p>
                  </div>
                )}

                {/* Real Awards Data */}
                {!reportCardLoading && realAwards && (
                  <>
                    {/* Sports House */}
                    {realAwards.sportsHouse.organization !== "None" && realAwards.sportsHouse.organization && (
                      <EnvelopeAwardCard 
                        category="Sports House" 
                        categoryColor={{ bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' }} 
                        organization={realAwards.sportsHouse.organization} 
                        role={realAwards.sportsHouse.role} 
                        year={reportCardYearLabel}
                        onClick={() => {
                          setSelectedAward({
                            category: "Sports House",
                            organization: realAwards.sportsHouse.organization,
                            role: realAwards.sportsHouse.role
                          });
                          setCertificateOpen(true);
                        }} 
                      />
                    )}

                    {/* Club */}
                    {realAwards.club.organization !== "None" && realAwards.club.organization && (
                      <EnvelopeAwardCard 
                        category="Club" 
                        categoryColor={{ bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' }} 
                        organization={realAwards.club.organization} 
                        role={realAwards.club.role} 
                        year={reportCardYearLabel}
                        onClick={() => {
                          setSelectedAward({
                            category: "Club",
                            organization: realAwards.club.organization,
                            role: realAwards.club.role
                          });
                          setCertificateOpen(true);
                        }} 
                      />
                    )}

                    {/* Student Leadership */}
                    {realAwards.studentLeadership.organization !== "None" && realAwards.studentLeadership.organization && (
                      <EnvelopeAwardCard 
                        category="Leadership" 
                        categoryColor={{ bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea' }} 
                        organization={realAwards.studentLeadership.organization} 
                        role={realAwards.studentLeadership.role} 
                        year={reportCardYearLabel}
                        onClick={() => {
                          setSelectedAward({
                            category: "Leadership",
                            organization: realAwards.studentLeadership.organization,
                            role: realAwards.studentLeadership.role
                          });
                          setCertificateOpen(true);
                        }} 
                      />
                    )}

                    {/* Events */}
                    {realAwards.events.organization !== "None" && realAwards.events.organization && (
                      <EnvelopeAwardCard 
                        category="Events" 
                        categoryColor={{ bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a' }} 
                        organization={realAwards.events.organization} 
                        role={realAwards.events.role} 
                        year={reportCardYearLabel}
                        onClick={() => {
                          setSelectedAward({
                            category: "Events",
                            organization: realAwards.events.organization,
                            role: realAwards.events.role
                          });
                          setCertificateOpen(true);
                        }} 
                      />
                    )}

                    {/* Achievements */}
                    {realAwards.achievements.event !== "None" && realAwards.achievements.event && (
                      <EnvelopeAwardCard 
                        category="Achievement" 
                        categoryColor={{ bg: 'rgba(236, 72, 153, 0.15)', text: '#db2777' }} 
                        organization={realAwards.achievements.event} 
                        role={realAwards.achievements.award} 
                        year={reportCardYearLabel}
                        onClick={() => {
                          setSelectedAward({
                            category: "Achievement",
                            organization: realAwards.achievements.event,
                            role: realAwards.achievements.award
                          });
                          setCertificateOpen(true);
                        }} 
                      />
                    )}

                    {/* Show message if all awards are "None" */}
                    {realAwards.sportsHouse.organization === "None" && 
                     realAwards.club.organization === "None" && 
                     realAwards.studentLeadership.organization === "None" && 
                     realAwards.events.organization === "None" && 
                     realAwards.achievements.event === "None" && (
                      <div className="text-center py-8">
                        <Trophy className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No specific awards for this period.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Certificate Dialog */}
                {selectedAward && (
                  <CertificateDialog 
                    open={certificateOpen} 
                    onOpenChange={setCertificateOpen} 
                    category={selectedAward.category} 
                    organization={selectedAward.organization} 
                    role={selectedAward.role} 
                    studentName={selectedStudent?.name || "Student Name"} 
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </section>}

      {/* Report Card Dialog */}
      <ReportCardDialog
        open={reportCardDialogOpen}
        onOpenChange={setReportCardDialogOpen}
        studentName={selectedStudent?.name || "Student"}
        studentClass={
          selectedStudent?.classLabel ||
          [selectedStudent?.className, selectedStudent?.grade].filter(Boolean).join(" - ") ||
          "Class"
        }
        examType={reportCardExamLabel || "Report Period"}
        year={reportCardYearLabel}
        subjects={realGrades.map((grade) => {
          const override = (grade.subjectComment || "").trim();
          const classDefault = (grade.classStudyRecommendation || "").trim();
          return {
            name: grade.subjectName,
            score: grade.totalMarks,
            grade: grade.letterGrade || getGradeFromScore(grade.totalMarks),
            teacherComment: grade.teacherComment || "",
            classStudyRecommendation: classDefault || undefined,
            studyRecommendation: override || undefined,
          };
        })}
        behavior={realBehaviorItems}
        homeroomComment={
          realBehavior?.homeroomTeacherComment || "No homeroom teacher comment for this period."
        }
        attendance={{
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          totalDays: 0,
          percentage: 0,
        }}
        achievements={[
          realAwards?.sportsHouse?.organization && realAwards.sportsHouse.organization !== "None"
            ? `Sports House: ${realAwards.sportsHouse.organization} (${realAwards.sportsHouse.role})`
            : null,
          realAwards?.club?.organization && realAwards.club.organization !== "None"
            ? `Club: ${realAwards.club.organization} (${realAwards.club.role})`
            : null,
          realAwards?.studentLeadership?.organization && realAwards.studentLeadership.organization !== "None"
            ? `Leadership: ${realAwards.studentLeadership.organization} (${realAwards.studentLeadership.role})`
            : null,
          realAwards?.events?.organization && realAwards.events.organization !== "None"
            ? `Events: ${realAwards.events.organization} (${realAwards.events.role})`
            : null,
          realAwards?.achievements?.event && realAwards.achievements.event !== "None"
            ? `Achievement: ${realAwards.achievements.event} ${realAwards.achievements.award || ""}`.trim()
            : null,
        ].filter((item): item is string => Boolean(item))}
      />

      {/* Grade Analysis Section */}
      {mainSection === "analysis" && <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Grade Analysis
              {selectedStudent && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {selectedStudent.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Analysis Sub-tabs */}
            <Tabs
              value={analysisTab}
              onValueChange={(value) => setAnalysisTab(value as AnalysisTabValue)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 mb-3">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Compare</TabsTrigger>
                <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
              </TabsList>

              {/* Shared Year / Exam Filters */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Year:</span>
                  <Select
                    value={selectedAcademicYearId}
                    onValueChange={setSelectedAcademicYearId}
                    disabled={academicPeriodOptions.length === 0}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {academicPeriodOptions.length === 0 ? (
                        <SelectItem value="__empty_year__" disabled>
                          No years
                        </SelectItem>
                      ) : (
                        academicPeriodOptions.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {(analysisTab === "overview" || analysisTab === "trends") && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">Exam:</span>
                    <Select
                      value={selectedExamPeriodId}
                      onValueChange={setSelectedExamPeriodId}
                      disabled={examPeriodOptions.length === 0}
                    >
                      <SelectTrigger className="min-w-0 flex-1 sm:w-[220px]">
                        <SelectValue placeholder="Exam" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriodOptions.length === 0 ? (
                          <SelectItem value="__empty_exam__" disabled>
                            No exams
                          </SelectItem>
                        ) : (
                          examPeriodOptions.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.periodLabel}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              </div>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-3 pb-2">
                  {/* Multi-Select Subject Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Subjects:</span>
                      <div className="flex gap-2">
                        <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={selectAllSubjects}>
                          Select All
                        </button>
                        <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={clearAllSubjects}>
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                      {/* Grouped subject pills with dropdowns */}
                      {analysisSubjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={selectedSubjectNames} onToggle={subjectName => {
                      const subjectId = subjectNameToId.get(subjectName);
                      if (subjectId !== undefined) {
                        toggleSubject(subjectId);
                      }
                    }} />)}
                      {analysisStandaloneSubjects.map(subject => {
                      const isSelected = selectedSubjectIds.includes(subject.id);
                      return <button key={subject.id} onClick={() => {
                      toggleSubject(subject.id);
                    }} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border hover:bg-accent"}`}>
                          {getShortSubjectName(subject.name)}
                        </button>;
                    })}
                      {/* Subject count badge */}
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {selectedSubjectIds.length}/{assignedSubjectIds.length}
                      </span>
                    </div>
                  </div>
                </div>

                {analysisLoading && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading grade analysis...
                  </div>}
                {!analysisLoading && analysisError && <div className="text-sm text-destructive py-4">
                    {analysisError}
                  </div>}
                {!analysisLoading && !analysisError && overviewEmptyMessage && <div className="text-sm text-muted-foreground py-4">
                    {overviewEmptyMessage}
                  </div>}
                {!analysisLoading && !analysisError && !overviewEmptyMessage && <>
                {/* Rising Stars */}
                {risingStars.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{
                    color: '#d97706'
                  }} /> Rising Stars
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {risingStars.map((item) => <div key={item.subject.id} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden animate-glow min-h-[110px]" style={{
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
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{shortenSubjectName(item.subject.name)}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowUp className="h-3 w-3" style={{
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
                              {item.prev}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff'
                      }}>
                              {item.current}%
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Grade Distribution</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {(() => {
                    const totalSubjects = gradeDistributionTotal;
                    const gradeCardColors: Record<string, {
                      bg: string;
                      text: string;
                    }> = {
                      "A*": {
                        bg: 'rgba(5, 150, 105, 0.15)',
                        text: '#059669'
                      },
                      "A": {
                        bg: 'rgba(34, 197, 94, 0.12)',
                        text: '#22c55e'
                      },
                      "B": {
                        bg: 'rgba(59, 130, 246, 0.12)',
                        text: '#3b82f6'
                      },
                      "C": {
                        bg: 'rgba(234, 179, 8, 0.12)',
                        text: '#ca8a04'
                      },
                      "D": {
                        bg: 'rgba(249, 115, 22, 0.12)',
                        text: '#ea580c'
                      },
                      "E": {
                        bg: 'rgba(239, 68, 68, 0.12)',
                        text: '#dc2626'
                      }
                    };
                    return gradeDistribution.map(g => {
                      const percentage = Math.round(
                        safePercent(
                          totalSubjects > 0
                            ? (safeNumber(g.count) / totalSubjects) * 100
                            : 0
                        )
                      );
                      const colors = gradeCardColors[g.grade] || {
                        bg: 'rgba(156, 163, 175, 0.12)',
                        text: '#6b7280'
                      };
                      return <div key={g.grade} className="flex flex-col items-center text-center p-2 rounded-lg" style={{
                        backgroundColor: colors.bg
                      }}>
                            <span className="text-xs font-semibold" style={{
                          color: colors.text
                        }}>{g.grade}</span>
                            <span className="text-xl font-bold text-foreground">{safeNumber(g.count)}</span>
                            <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                          </div>;
                    });
                  })()}
                  </div>
                </div>

                <SubjectPerformanceChart 
                  data={subjectVsClassData.map(s => ({
                    name: s.name,
                    fullName: s.fullName,
                    score: safeNumber(s.student),
                    goal: (() => {
                      const subjectId = subjectNameToId.get(s.fullName);
                      return subjectId ? safeNumber(goalsBySubjectId.get(subjectId), 80) : 80;
                    })()
                  }))}
                  lineColors={lineColors}
                  title="Subject Performance"
                  showGoalBadge={true}
                  showCohortDot={false}
                />

                {/* Stats Cards Grid - 6 cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[{
                  icon: BookOpen,
                  label: "Average",
                  value: currentAverageDisplay,
                  subtext: currentScores.length > 0 ? currentAverage >= 70 ? "Above Average" : currentAverage >= 50 ? "Average" : "Below Average" : "N/A",
                  iconColor: "#3b82f6",
                  bgColor: "rgba(59, 130, 246, 0.08)"
                }, {
                  icon: Award,
                  label: "Best Subject",
                  value: shortenSubjectName(bestSubjectInfo.name),
                  subtext: bestSubjectScoreDisplay,
                  iconColor: "#f59e0b",
                  bgColor: "rgba(245, 158, 11, 0.08)"
                }, {
                  icon: TrendingUp,
                  label: "Improvement",
                  value: improvementStats.text,
                  subtext: improvementStats.hasDelta
                    ? improvementStats.points >= 0 ? "Improved" : "Declined"
                    : "N/A",
                  iconColor: improvementStats.hasDelta
                    ? improvementStats.points >= 0 ? "#10b981" : "#ef4444"
                    : "#64748b",
                  bgColor: improvementStats.hasDelta
                    ? improvementStats.points >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
                    : "rgba(148, 163, 184, 0.08)"
                }, {
                  icon: Calendar,
                  label: "Attendance",
                  value: "--",
                  subtext: "Not available",
                  iconColor: "#8b5cf6",
                  bgColor: "rgba(139, 92, 246, 0.08)"
                }, {
                  icon: Target,
                  label: "Passing",
                  value: `${passingStats.passingCount}/${passingStats.totalSubjects}`,
                  subtext: `${passingStats.passingPercentage}%`,
                  iconColor: "#06b6d4",
                  bgColor: "rgba(6, 182, 212, 0.08)"
                }, {
                  icon: AlertTriangle,
                  label: "Needs Focus",
                  value: shortenSubjectName(weakestSubjectInfo.name),
                  subtext: weakestSubjectScoreDisplay,
                  iconColor: "#ef4444",
                  bgColor: "rgba(239, 68, 68, 0.08)"
                }].map((stat, index) => {
                  // Determine text size based on value length
                  const valueLength = String(stat.value).length;
                  const textSizeClass = valueLength > 12 ? "text-xs" : valueLength > 8 ? "text-sm" : "text-lg";
                  return <div key={index} className="flex flex-col items-center justify-center p-3 rounded-xl border min-h-[100px] text-center" style={{
                    backgroundColor: stat.bgColor,
                    borderColor: 'transparent'
                  }}>
                        <stat.icon className="h-5 w-5 mb-1" style={{
                      color: stat.iconColor
                    }} />
                        <span className={`${textSizeClass} font-bold text-foreground text-center leading-tight line-clamp-2 w-full`}>{stat.value}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 text-center w-full">{stat.label}</span>
                        <span className="text-[9px] text-muted-foreground/70 text-center w-full">{stat.subtext}</span>
                      </div>;
                })}
                </div>

                {/* Top 3 Performers & Bottom 3 to Focus */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Top 3 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Trophy className="h-4 w-4" style={{ color: '#22c55e' }} /> Top Performers
                    </h4>
                    <div className="space-y-2">
                      {[0, 1, 2].map((index) => {
                        const s = top3[index];
                        if (!s) {
                          return <div key={index} className="min-h-[60px]" />;
                        }
                        const score = safeNumber(getScoreFor(currentPeriodId, s.id));
                        return (
                          <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]" style={{
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
                              <span className="text-sm font-medium text-foreground leading-tight">{shortenSubjectName(s.name)}</span>
                              <Badge className="text-xs font-semibold w-fit mt-1 text-white" style={{ backgroundColor: '#22c55e' }}>{score}%</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Report Button for Overview - at the bottom */}
                <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setOverviewReportDialogOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                </>}

              </TabsContent>

              {/* TRENDS TAB */}
              <TabsContent value="trends" className="space-y-4">
                {analysisLoading && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading trends...
                  </div>}
                {!analysisLoading && analysisError && <div className="text-sm text-destructive py-4">
                    {analysisError}
                  </div>}
                {!analysisLoading && !analysisError && <>
                {/* Current Score Header - Moomoo Style */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 border border-border/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5 truncate">
                        {selectedSubjectNames.length === 1 ? selectedSubjectNames[0] : "Overall Average"}
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-foreground">
                          {trendHeaderValue}{trendHeaderValue === "—" ? "" : "%"}
                        </span>
                        {trendDirection.direction !== "stable" && <span className={`flex items-center text-sm font-bold px-2 py-1 rounded ${trendDirection.direction === "up" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                            {trendDirection.direction === "up" ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                            {trendDirection.direction === "up" ? "+" : "-"}{trendDirection.change}%
                          </span>}
                      </div>
                    </div>
                  </div>
                  {/* Period Toggle */}
                  <div className="flex items-center bg-muted/50 p-1 rounded-lg w-full">
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
                  }] as const).map(({
                    key,
                    label
                  }) => <button key={key} onClick={() => setTrendPeriod(key)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center ${trendPeriod === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {label}
                      </button>)}
                  </div>
                </div>

                {/* Subject Filter Pills - Standardized with mobile-friendly dropdowns */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Subjects:</span>
                    <div className="flex gap-2">
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={selectAllSubjects}>
                        Select All
                      </button>
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={clearAllSubjects}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                    {/* Grouped subject pills with mobile-friendly drawers */}
                      {analysisSubjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={selectedSubjectNames} onToggle={subjectName => {
                      const subjectId = subjectNameToId.get(subjectName);
                      if (subjectId !== undefined) {
                        toggleSubject(subjectId);
                      }
                    }} />)}
                      {analysisStandaloneSubjects.map(subject => {
                      const isSelected = selectedSubjectIds.includes(subject.id);
                      return <button key={subject.id} onClick={() => {
                      toggleSubject(subject.id);
                    }} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border hover:bg-accent"}`}>
                          {getShortSubjectName(subject.name)}
                        </button>;
                    })}
                      {/* Subject count badge */}
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {selectedSubjectIds.length}/{assignedSubjectIds.length}
                      </span>
                  </div>
                </div>

                {!hasAssignedSubjects ? (
                  <div className="text-sm text-muted-foreground py-4">
                    No subjects assigned to this student yet
                  </div>
                ) : selectedSubjectIds.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">
                    Select at least one subject to view trends
                  </div>
                ) : (
                <>
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
                  <div ref={chartContainerRef} className="h-64 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  touchAction: 'pan-x pan-y pinch-zoom'
                }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <div style={{
                    width: Math.max(100, trendData.length / 4 * 100 * chartZoom) + '%',
                    minWidth: '100%',
                    height: '100%',
                    transition: 'width 0.1s ease-out'
                  }}>
                      <ResponsiveContainer width="100%" height="100%">
                          {chartViewMode === "single" ? (
                            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
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
                              <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                height={40}
                                tick={({ x, y, payload }) => {
                                  const parts = payload.value.split(" ");
                                  return (
                                    <g transform={`translate(${x},${y})`}>
                                      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
                                        {parts[0]}
                                      </text>
                                      <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.7}>
                                        {parts[1]}
                                      </text>
                                    </g>
                                  );
                                }}
                              />
                              <YAxis
                                domain={[30, 100]}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                                width={35}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "12px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}
                                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                              />
                              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "Pass", fontSize: 9, fill: "#f59e0b", position: "insideTopLeft" }} />
                              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "A", fontSize: 9, fill: "#22c55e", position: "insideTopLeft" }} />
                              <ReferenceLine y={trendGoalValue} stroke="hsl(var(--foreground))" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Goal", fontSize: 9, fill: "hsl(var(--foreground))", position: "insideTopLeft" }} />

                              {selectedSubjectNames.length === 1 ? (
                                <Area
                                  type="monotone"
                                  dataKey={selectedSubjectNames[0]}
                                  stroke={trendDirection.direction === "up" ? "#22c55e" : trendDirection.direction === "down" ? "#ef4444" : "#3b82f6"}
                                  strokeWidth={2.5}
                                  fill={trendDirection.direction === "up" ? "url(#gradientGreen)" : trendDirection.direction === "down" ? "url(#gradientRed)" : "url(#gradientBlue)"}
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
                                  fill={trendDirection.direction === "up" ? "url(#gradientGreen)" : trendDirection.direction === "down" ? "url(#gradientRed)" : "url(#gradientBlue)"}
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
                            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
                              <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                height={40}
                                tick={({ x, y, payload }) => {
                                  const parts = payload.value.split(" ");
                                  return (
                                    <g transform={`translate(${x},${y})`}>
                                      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
                                        {parts[0]}
                                      </text>
                                      <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.7}>
                                        {parts[1]}
                                      </text>
                                    </g>
                                  );
                                }}
                              />
                              <YAxis
                                domain={[30, 100]}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                                width={35}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "12px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}
                                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                              />
                              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "Pass", fontSize: 9, fill: "#f59e0b", position: "insideTopLeft" }} />
                              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: "A", fontSize: 9, fill: "#22c55e", position: "insideTopLeft" }} />
                              <ReferenceLine y={trendGoalValue} stroke="hsl(var(--foreground))" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Goal", fontSize: 9, fill: "hsl(var(--foreground))", position: "insideTopLeft" }} />

                              {selectedSubjectNames.map((subject) => {
                                const stroke = getSubjectStroke(subject);
                                return (
                                  <Line
                                    key={subject}
                                    type="monotone"
                                    dataKey={subject}
                                    stroke={stroke}
                                    strokeWidth={2}
                                    dot={{ fill: stroke, strokeWidth: 0, r: 3 }}
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
                  {/* Color Legend for Multiple Lines Mode */}
                  {chartViewMode === "multiple" && selectedSubjectNames.length > 1 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 px-1">
                      {selectedSubjectNames.map((subject) => (
                        <div key={subject} className="flex items-center gap-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getSubjectStroke(subject) }}
                          />
                          <span className="text-[10px] text-muted-foreground">
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
                    {trendData.map((item) => (
                      <div
                        key={String(item.periodId)}
                        className="px-2 py-0.5 rounded bg-muted/50 text-[11px] font-medium text-muted-foreground"
                      >
                        {item.period}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rising & Falling Subjects */}
                <div className="grid grid-cols-2 gap-3 items-start">
                  {/* Rising Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 min-h-[40px]">
                      <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="leading-tight">Rising<br />Subjects</span>
                    </h4>
                    <div className="space-y-2">
                      {risingStars.length > 0 ? risingStars.map((item) => <div key={item.subject.id} className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/10 h-[84px] flex flex-col">
                          <div className="flex items-start justify-between gap-2 min-h-[32px]">
                            <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{item.subject.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-green-500 text-[10px] font-bold text-white flex-shrink-0">+{item.improvement}%</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-base font-bold text-muted-foreground">{item.prev}%</span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-base font-bold text-green-600">{item.current}%</span>
                          </div>
                        </div>) : <p className="text-xs text-muted-foreground p-2">No improving subjects</p>}
                    </div>
                  </div>

                  {/* Falling Behind */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 min-h-[40px]">
                      <TrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="leading-tight">Needs<br />Focus</span>
                    </h4>
                    <div className="space-y-2">
                      {fallingBehind.length > 0 ? fallingBehind.map((item) => <div key={item.subject.id} className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 h-[84px] flex flex-col">
                          <div className="flex items-start justify-between gap-2 min-h-[32px]">
                            <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{item.subject.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-red-500 text-[10px] font-bold text-white flex-shrink-0">-{item.decline}%</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-base font-bold text-muted-foreground">{item.prev}%</span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-base font-bold text-red-600">{item.current}%</span>
                          </div>
                        </div>) : <p className="text-xs text-muted-foreground p-2">All subjects stable!</p>}
                    </div>
                  </div>
                </div>

                {/* Dynamic Trend Insights */}
                <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Insight:</span>{" "}
                    {risingStars.length > 0 && <>{risingStars[0].subject.name} shows great improvement (+{risingStars[0].improvement}%). </>}
                    {fallingBehind.length > 0 && <>Focus more on {fallingBehind[0].subject.name} which dropped {fallingBehind[0].decline}%. </>}
                    {risingStars.length === 0 && fallingBehind.length === 0 && <>Performance is stable across all subjects.</>}
                  </p>
                </div>

                {/* Strengths Profile Radar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Strengths Profile
                  </h4>
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Larger areas indicate stronger subjects. Smaller areas need more focus.
                  </p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} 
                          tickLine={false} 
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} 
                          tickCount={5} 
                          axisLine={false} 
                        />
                        <Radar 
                          name="Score" 
                          dataKey="score" 
                          stroke={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} 
                          fill={radarAverage >= 70 ? "#22c55e" : radarAverage >= 50 ? "#f59e0b" : "#ef4444"} 
                          fillOpacity={0.3} 
                          strokeWidth={2} 
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: 12
                          }} 
                          formatter={(value: number) => [`${value}%`, "Score"]} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Heatmap */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance Heatmap
                  </h4>
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Scores across all exam periods
                  </p>
                  <div className="overflow-x-auto">
                    <div className="min-w-[360px]">
                      {/* Header row with periods */}
                      <div className="flex gap-1 mb-1">
                        <div className="w-20 h-6 sticky left-0 z-10 bg-card text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                          Subject
                        </div>
                        {heatmapData[0]?.scores.map((s) => (
                          <div key={s.periodId} className="w-14 h-6 text-center text-[9px] font-medium text-muted-foreground px-1 flex items-center justify-center">
                            {s.periodLabel}
                          </div>
                        ))}
                      </div>
                      {/* Subject rows */}
                      {(heatmapExpanded ? heatmapData : heatmapData.slice(0, 6)).map((row) => (
                        <div key={row.subjectId} className="flex gap-1 mb-1">
                          <div className="w-20 h-7 sticky left-0 z-10 bg-card text-[10px] font-medium text-foreground truncate pr-1 flex items-center">
                            {row.subject}
                          </div>
                          {row.scores.map((cell) => (
                            <div
                              key={cell.periodId}
                              className="w-14 h-7 rounded flex items-center justify-center text-[10px] font-semibold text-white transition-all hover:scale-105 cursor-default"
                              style={{
                                backgroundColor: getHeatmapColor(cell.score),
                                opacity: cell.score === null ? 0.3 : 1
                              }}
                              title={`${row.fullName} - ${cell.periodLabel}: ${cell.score ?? "N/A"}%`}
                            >
                              {cell.score ?? "–"}
                            </div>
                          ))}
                        </div>
                      ))}
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

                {/* Report Button for Trends - at the bottom */}
                <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setTrendsReportDialogOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                </>
                )}
                </>}
              </TabsContent>

              {/* COMPARISON TAB */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Exam Selectors */}
                <div className="flex items-center gap-2">
                  {/* Exam A - Light Blue Box */}
                  <div className="flex-1 space-y-2 p-2 sm:p-3 rounded-xl border min-w-0" style={{
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
                    <Select
                      value={compareExamAId}
                      onValueChange={setCompareExamAId}
                      disabled={examPeriodOptions.length === 0}
                    >
                      <SelectTrigger className="w-full h-8 text-sm px-2 sm:px-3 bg-background/80 min-w-0">
                        <SelectValue placeholder="Exam A" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriodOptions.length === 0 ? (
                          <SelectItem value="__none_compare_a__" disabled>
                            No exams
                          </SelectItem>
                        ) : (
                          examPeriodOptions.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.periodLabel}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">vs</span>
                  </div>
                  
                  {/* Exam B - Light Amber Box */}
                  <div className="flex-1 space-y-2 p-2 sm:p-3 rounded-xl border min-w-0" style={{
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
                    <Select
                      value={compareExamBId}
                      onValueChange={setCompareExamBId}
                      disabled={examPeriodOptions.length === 0}
                    >
                      <SelectTrigger className="w-full h-8 text-sm px-2 sm:px-3 bg-background/80 min-w-0">
                        <SelectValue placeholder="Exam B" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {examPeriodOptions.length === 0 ? (
                          <SelectItem value="__none_compare_b__" disabled>
                            No exams
                          </SelectItem>
                        ) : (
                          examPeriodOptions.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.periodLabel}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject Multi-Select - Standardized */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Subjects</span>
                    <div className="flex gap-2">
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={selectAllSubjects}>
                        Select All
                      </button>
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={clearAllSubjects}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                    {/* Grouped subject pills with dropdowns */}
                    {analysisSubjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={selectedSubjectNames} onToggle={subjectName => {
                    const subjectId = subjectNameToId.get(subjectName);
                    if (subjectId !== undefined) {
                      toggleSubject(subjectId);
                    }
                  }} />)}
                    {analysisStandaloneSubjects.map(subject => {
                    const isSelected = selectedSubjectIds.includes(subject.id);
                    return <button key={subject.id} onClick={() => {
                    toggleSubject(subject.id);
                  }} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border hover:bg-accent"}`}>
                        {getShortSubjectName(subject.name)}
                      </button>;
                  })}
                    {/* Subject count badge */}
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {selectedSubjectIds.length}/{assignedSubjectIds.length}
                    </span>
                  </div>
                </div>

                {analysisLoading && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading comparison...
                  </div>}
                {!analysisLoading && analysisError && <div className="text-sm text-destructive py-4">
                    {analysisError}
                  </div>}
                {!analysisLoading && !analysisError && compareEmptyMessage && <div className="text-sm text-muted-foreground py-4">
                    {compareEmptyMessage}
                  </div>}
                {!analysisLoading && !analysisError && !compareEmptyMessage && <>
                {/* Comparison Summary Cards */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-foreground">Exam A</span>
                      <p className="text-[10px] text-muted-foreground">{getPeriodLabel(compareExamAId || null)}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {comparisonData.length > 0
                    ? `${safeNumber(Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length))}%`
                    : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Average Score</p>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">vs</span>
                  </div>
                  
                  <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-foreground">Exam B</span>
                      <p className="text-[10px] text-muted-foreground">{getPeriodLabel(compareExamBId || null)}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {comparisonData.length > 0
                    ? `${safeNumber(Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length))}%`
                    : "—"}
                    </p>
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
                              setShowGrowthSwipeHint(false);
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
                                        <div key={item.subjectId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
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
                                                  <span className="text-[10px] text-violet-400">B: {data.examB}</span>
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
                                        <div key={item.subjectId} className="flex items-center gap-2">
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
                                        <div key={item.subjectId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
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
                                                  <span className="text-[10px] text-violet-400">B: {data.examB}</span>
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
                                        <div key={item.subjectId} className="flex items-center gap-2">
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
                    const maxScore = Math.max(item.examA, item.examB, 1);
                    const percentChange = item.examB > 0 ? (item.delta / item.examB * 100).toFixed(1) : '0.0';
                    return <div key={item.subjectId} className="p-3 rounded-xl bg-accent/30 border border-border/50">
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
                              <span className="text-[10px] text-muted-foreground w-16 truncate">{getPeriodLabel(compareExamBId || null).split(' ')[0]}</span>
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
                              <span className="text-[10px] text-muted-foreground w-16 truncate">{getPeriodLabel(compareExamAId || null).split(' ')[0]}</span>
                              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                <div className="h-full bg-[hsl(217,91%,75%)] border-2 border-[hsl(217,91%,50%)] rounded-full transition-all duration-500" style={{
                              width: `${item.examA / 100 * 100}%`
                            }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                  {item.examA}
                                </span>
                              </div>
                            </div>

                            {/* Goal Row - Measurement/Ruler Design */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 truncate font-medium">Goal</span>
                              <div className="flex-1 h-4 relative">
                                {/* Ruler track */}
                                <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-muted-foreground/30" />
                                
                                {/* Tick marks */}
                                {[0, 25, 50, 75, 100].map((tick) => (
                                  <div key={tick} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${tick}%` }}>
                                    <div className={`w-[1px] ${tick === 0 || tick === 100 ? 'h-3' : 'h-2'} bg-muted-foreground/40 -translate-x-1/2`} />
                                  </div>
                                ))}
                                
                                {/* Goal marker (diamond) */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45 shadow-sm"
                                  style={{ left: `${item.goal}%` }}
                                />
                                
                                {/* Goal value label */}
                                <span 
                                  className="absolute -top-3 text-[9px] font-bold text-foreground -translate-x-1/2"
                                  style={{ left: `${item.goal}%` }}
                                >
                                  {item.goal}
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
                    const avgDelta = comparisonData.length > 0
                      ? Math.round(comparisonData.reduce((sum, d) => sum + d.delta, 0) / comparisonData.length)
                      : 0;
                    if (avgDelta > 0) {
                      return `Overall improvement of +${avgDelta}% from ${getPeriodLabel(compareExamBId || null)} to ${getPeriodLabel(compareExamAId || null)}. ${improved} subjects improved, ${declined} declined.`;
                    } else if (avgDelta < 0) {
                      return `Overall decline of ${avgDelta}% from ${getPeriodLabel(compareExamBId || null)} to ${getPeriodLabel(compareExamAId || null)}. Focus on ${comparisonData.filter(d => d.delta < 0).map(d => d.name).join(", ")}.`;
                    }
                    return "Performance remained stable between the two periods.";
                  })()}
                  </p>
                </div>

                {/* Generate Report Button - at bottom */}
                <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setComparisonReportDialogOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                </>}
              </TabsContent>

              {/* GOALS TAB */}
              <TabsContent value="goals" className="space-y-4">
                {/* Goals Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Goal className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">Target Grades</h4>
                  </div>
                </div>

                {/* Loading/Error States */}
                {goalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : goalsError ? (
                  <div className="text-center py-8 text-destructive text-sm">{goalsError}</div>
                ) : realGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No goals set for {goalYear}. Set targets to track progress.
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-1" style={{ color: '#22c55e' }} />
                        <p className="text-xl font-bold text-foreground">{achievedCount}</p>
                        <p className="text-xs text-muted-foreground">Achieved</p>
                      </div>
                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <Target className="h-5 w-5 mx-auto mb-1" style={{ color: '#3b82f6' }} />
                        <p className="text-xl font-bold text-foreground">{onTrackCount}</p>
                        <p className="text-xs text-muted-foreground">On Track</p>
                      </div>
                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                        <AlertTriangle className="h-5 w-5 mx-auto mb-1" style={{ color: '#f97316' }} />
                        <p className="text-xl font-bold text-foreground">{needsFocusCount}</p>
                        <p className="text-xs text-muted-foreground">Needs Focus</p>
                      </div>
                    </div>

                    {/* Subject Goals */}
                    <div className="space-y-3">
                      {realGoals.map(item => {
                        const isEditing = editingGoalSubjectId === item.subjectId;
                        const isSaving = savingGoalId === item.subjectId;
                        const hasTarget = item.targetPercentage !== null;
                        const displayTarget = item.targetPercentage ?? 80;
                        const currentPct = item.currentPercentage ?? 0;
                        const gap = hasTarget ? item.deltaToGo : 0;
                        const isOnTrack = hasTarget && !item.achieved && item.targetPercentage !== null && item.currentPercentage !== null && ((item.targetPercentage - item.currentPercentage) / item.targetPercentage) <= 0.30;
                        const statusVariant: StatusIconVariant = item.achieved ? "achieved" : isOnTrack ? "pending" : "warning";
                        const parsedTempGoal = tempGoalValue.trim() === "" ? null : Number(tempGoalValue);
                        const isValidTarget = parsedTempGoal !== null
                          && Number.isInteger(parsedTempGoal)
                          && parsedTempGoal >= 0
                          && parsedTempGoal <= 100;

                        return (
                          <div key={item.subjectId} className="p-4 rounded-xl bg-accent/30 border border-border/50 transition-all cursor-pointer active:opacity-70" onClick={() => {
                            if (isEditing) {
                              setEditingGoalSubjectId(null);
                            } else {
                              setEditingGoalSubjectId(item.subjectId);
                              setTempGoalValue(
                                item.targetPercentage !== null ? item.targetPercentage.toString() : "80"
                              );
                            }
                          }}>
                            <div className="flex items-center justify-between min-h-[44px]">
                              <div className="flex items-center gap-3">
                                <StatusIcon variant={statusVariant} size={24} />
                                <span className="font-medium text-foreground">{item.subjectName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                  <>
                                    <Badge variant={item.achieved ? "default" : "outline"} className="text-sm px-3 py-1">
                                      {hasTarget ? `${displayTarget}%` : 'Set'}
                                    </Badge>
                                    <Edit2 className={`h-4 w-4 transition-transform ${isEditing ? 'rotate-45 text-primary' : 'text-muted-foreground'}`} />
                                  </>
                                )}
                              </div>
                            </div>

                            {isEditing && (
                              <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Set Target Goal</span>
                                  <span className="text-lg font-bold text-primary">
                                    {tempGoalValue.trim() === "" ? "--" : `${tempGoalValue}%`}
                                  </span>
                                </div>
                                <input type="range" min="0" max="100" value={tempGoalValue} onChange={e => {
                                  if (e.target.value.trim() === "") return;
                                  setTempGoalValue(e.target.value);
                                }} className="w-full h-10 appearance-none bg-transparent cursor-pointer touch-pan-x [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-background" />
                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => setEditingGoalSubjectId(null)}>Cancel</Button>
                                  <Button className="flex-1 h-12 text-base" disabled={!isValidTarget} onClick={() => {
                                    if (!isValidTarget || parsedTempGoal === null) return;
                                    upsertGoal(item.subjectId, parsedTempGoal);
                                    setEditingGoalSubjectId(null);
                                  }}>
                                    <Check className="h-5 w-5 mr-2" />Save
                                  </Button>
                                </div>
                              </div>
                            )}

                            {!isEditing && hasTarget && (
                              <>
                                <div className="relative mt-3 mb-2">
                                  <div className="h-3 bg-transparent border border-border rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${currentPct}%`, backgroundColor: item.achieved ? '#22c55e' : isOnTrack ? '#3b82f6' : '#f87171' }} />
                                  </div>
                                  <div className="absolute top-0 h-3 w-0.5 bg-foreground/70 rounded" style={{ left: `${Math.min(displayTarget, 100)}%` }} />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Current: <span className="font-medium text-foreground">{currentPct}%</span></span>
                                  {item.achieved ? (
                                    <span className="text-chart-1 font-medium flex items-center gap-1"><StatusIcon variant="achieved" size={16} />Achieved!</span>
                                  ) : (
                                    <span className={isOnTrack ? "text-chart-2" : "text-chart-4"}>{gap}% to go</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tip */}
                    <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Tip:</span>{" "}
                        {achievedCount === realGoals.filter(g => g.targetPercentage !== null).length && achievedCount > 0
                          ? "Amazing! All goals achieved. Consider setting higher targets!"
                          : needsFocusCount > achievedCount
                          ? "Focus on subjects with the biggest gaps. Small consistent improvements lead to big results!"
                          : `You're doing great! ${onTrackCount} subjects are almost at target. Keep pushing!`}
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Floating Generate Report FAB - for Overview, Trends, Compare tabs */}
              {mainSection === "analysis" && (analysisTab === "overview" || analysisTab === "trends" || analysisTab === "comparison") && !isAtBottom && (
                <Button
                  className="fixed z-50 shadow-xl bottom-24 right-4 h-14 w-14 rounded-full p-0 bg-emerald-600 hover:bg-emerald-700 transition-all duration-300"
                  onClick={() => {
                    if (analysisTab === 'overview') {
                      setOverviewReportDialogOpen(true);
                    } else if (analysisTab === 'trends') {
                      setTrendsReportDialogOpen(true);
                    } else if (analysisTab === 'comparison') {
                      setComparisonReportDialogOpen(true);
                    }
                  }}
                >
                  <FileText className="h-6 w-6 text-white" />
                </Button>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </section>}

      {/* Overview Report Dialog */}
      <Dialog open={overviewReportDialogOpen} onOpenChange={setOverviewReportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-12">
            <DialogTitle>Overview Report</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
                            // Generate CSV data for overview
              const csvRows: string[][] = [
                ['Subject', 'Score', 'Goal', 'Grade'],
                ...subjectPerformance.map((sub) => [
                  sub?.name ?? '',
                  String(sub?.score ?? ''),
                  String(sub?.goal ?? ''),
                  String(getGradeFromScore(sub?.score ?? 0)),
                ]),
              ];

              const csvContent = csvRows
                .map((row) =>
                  row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(',')
                )
                .join('\n');

              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
              });
              const filename = `overview-report-${new Date().toISOString().split('T')[0]}.csv`;
              const result = await saveAndShareBlob(
                blob,
                filename,
                "text/csv;charset=utf-8"
              );
              if (!result.success) {
                toast.error("Export failed. Please try again.");
              } else if (result.savedToDevice) {
                toast.success("Saved to Downloads");
              }
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportOverviewPdf} disabled={isExportingOverviewPdf}>
                {isExportingOverviewPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {isExportingOverviewPdf ? "Generating..." : "PDF"}
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={overviewReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header */}
              <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '2px solid #3b82f6'
            }}>
                <img src={schoolLogo} alt="School Logo" crossOrigin="anonymous" style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain'
              }} />
                <div style={{
                textAlign: 'left'
              }}>
                  <h1 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: '0 0 2px 0'
                }}>Academic Overview Report</h1>
                  <p style={{
                  fontSize: '10px',
                  color: '#666',
                  margin: 0
                }}>Student Performance Analysis</p>
                  <p style={{
                  fontSize: '9px',
                  color: '#888',
                  margin: '2px 0 0 0'
                }}>
                    Generated on {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                    {' • '}{getExamLabel()}
                  </p>
                </div>
              </div>

              {/* Summary Statistics Cards */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                  {/* Average */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#dcfce7',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>📖</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#22c55e'
                  }}>{currentAverageDisplay}</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#166534',
                    fontWeight: 600
                  }}>Average</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#166534',
                    marginTop: '2px'
                  }}>
                      {currentScores.length > 0 ? currentAverage >= 80 ? 'Excellent' : currentAverage >= 60 ? 'Above Average' : 'Needs Improvement' : 'N/A'}
                    </div>
                  </div>
                  {/* Best Subject */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>🏆</div>
                    <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#d97706'
                  }}>{shortenSubjectName(bestSubjectInfo.name)}</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#92400e',
                    fontWeight: 600
                  }}>Best Subject</div>
                  <div style={{
                    fontSize: '8px',
                    color: '#92400e',
                    marginTop: '2px'
                  }}>{bestSubjectScoreDisplay}</div>
                  </div>
                  {/* Improvement */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#ccfbf1',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>📈</div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0d9488'
                  }}>{improvementStats.text}</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#115e59',
                    fontWeight: 600
                  }}>Improvement</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#115e59',
                    marginTop: '2px'
                  }}>
                      {improvementStats.hasDelta ? improvementStats.points > 0 ? 'Improved' : improvementStats.points < 0 ? 'Declined' : 'Stable' : 'N/A'}
                    </div>
                  </div>
                  {/* Attendance */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>📅</div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#3b82f6'
                  }}>--</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#1d4ed8',
                    fontWeight: 600
                  }}>Attendance</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#1d4ed8',
                    marginTop: '2px'
                  }}>Not available</div>
                  </div>
                  {/* Passing */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#f3e8ff',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>🎯</div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#9333ea'
                  }}>{passingStats.passingCount}/{passingStats.totalSubjects}</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#6b21a8',
                    fontWeight: 600
                  }}>Passing</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#6b21a8',
                    marginTop: '2px'
                  }}>{passingStats.passingPercentage}%</div>
                  </div>
                  {/* Needs Focus */}
                  <div style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  textAlign: 'center'
                }}>
                    <div style={{
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>⚠️</div>
                    <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#dc2626'
                  }}>{shortenSubjectName(weakestSubjectInfo.name)}</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#991b1b',
                    fontWeight: 600,
                    lineHeight: '1.2'
                  }}>Needs<br />Focus</div>
                  <div style={{
                    fontSize: '8px',
                    color: '#991b1b',
                    marginTop: '2px'
                  }}>{weakestSubjectScoreDisplay}</div>
                  </div>
                </div>
              </div>

              {/* Rising Stars */}
              {risingStars.length > 0 && <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
              border: '1px solid #fde047',
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                      <h4 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ca8a04',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                        ⭐ Rising Stars
                      </h4>
                      <p style={{
                  fontSize: '8px',
                  color: '#a16207',
                  marginBottom: '8px'
                }}>Top performing subjects</p>
                      <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                        {risingStars.slice(0, 3).map((item) => <div key={item.subject.id} style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                    border: '1px solid rgba(253, 224, 71, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                            <div style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#713f12'
                    }}>{shortenSubjectName(item.subject.name)}</div>
                            <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                              <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#a16207'
                      }}>+{item.improvement}%</div>
                              <div style={{
                        fontSize: '7px',
                        color: '#854d0e'
                      }}>{item.prev}%→{item.current}%</div>
                            </div>
                          </div>)}
                      </div>
                    </div>}

              {/* Subject Performance */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Subject Performance</h3>
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px'
              }}>
                  {subjectPerformance.map((sub, idx) => <div key={sub.subjectId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: idx < 3 ? '#dcfce7' : idx >= subjectPerformance.length - 3 ? '#fee2e2' : '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}>
                      <span style={{
                    fontWeight: 500
                  }}>{idx + 1}. {sub.name}</span>
                      <span style={{
                    fontWeight: 700,
                    color: sub.score >= 80 ? '#22c55e' : sub.score >= 50 ? '#3b82f6' : '#ef4444'
                  }}>{sub.score}%</span>
                    </div>)}
                </div>
              </div>

              {/* Subject Performance Bar Chart */}
              <div style={{
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📊 Performance Chart
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {subjectPerformance.map((sub, index) => {
                    const barColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
                    const barColor = barColors[index % barColors.length];
                    return (
                      <div key={sub.subjectId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', fontSize: '8px', fontWeight: 500, color: '#374151', textAlign: 'right', flexShrink: 0 }}>
                          {shortenSubjectName(sub.name)}
                        </div>
                        <div style={{ flex: 1, height: '14px', background: '#f3f4f6', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                          {/* Score bar */}
                          <div style={{ 
                            width: `${sub.score}%`, 
                            height: '100%', 
                            background: barColor,
                            borderRadius: '4px'
                          }} />
                          {/* Goal marker */}
                          <div style={{
                            position: 'absolute',
                            left: `${sub.goal}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '8px',
                            height: '8px',
                            background: '#1a1a1a',
                            borderRadius: '50%',
                            border: '1.5px solid white'
                          }} />
                        </div>
                        <div style={{ width: '35px', fontSize: '9px', fontWeight: 600, color: '#1a1a1a', textAlign: 'right', flexShrink: 0 }}>
                          {sub.score}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '20px', height: '8px', background: '#3b82f6', borderRadius: '2px' }} />
                    <span style={{ fontSize: '7px', color: '#6b7280' }}>Score</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#1a1a1a', borderRadius: '50%', border: '1px solid #d1d5db' }} />
                    <span style={{ fontSize: '7px', color: '#6b7280' }}>Goal</span>
                  </div>
                </div>
              </div>

              {/* Grade Distribution */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Grade Distribution</h3>
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px'
              }}>
                  {gradeDistribution.map(g => <div key={g.grade} style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#fff'
                }}>
                      <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: gradeChartColors[g.grade]
                  }}>{g.grade}</div>
                      <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1a1a1a'
                  }}>{safeNumber(g.count)}</div>
                    </div>)}
                </div>
              </div>

              {/* Top Subjects */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <div style={{
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac'
              }}>
                  <h4 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#16a34a',
                  marginBottom: '6px'
                }}>Top Subjects</h4>
                  {top3.map((s, i) => <div key={s.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  fontSize: '9px',
                  borderBottom: '1px solid #86efac40'
                }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{
                    fontWeight: 600
                  }}>{safeNumber(getScoreFor(currentPeriodId, s.id))}%</span>
                    </div>)}
                </div>
              </div>

              {/* Footer */}
              <div style={{
              textAlign: 'center',
              fontSize: '8px',
              color: '#666',
              marginTop: '15px',
              paddingTop: '8px',
              borderTop: '1px solid #ddd'
            }}>
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
              <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
                            // Generate CSV data for trends
              const csvRows: string[][] = [
                ['Period', ...selectedSubjectNames],
                ...trendData.map((row) => [
                  String(row.period ?? ''),
                  ...selectedSubjectNames.map((subjectName) => {
                    const value = row[subjectName];
                    return value !== null && value !== undefined ? String(value) : '';
                  }),
                ]),
              ];

              const csvContent = csvRows
                .map((row) =>
                  row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(',')
                )
                .join('\n');

              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
              });
              const filename = `trends-report-${new Date().toISOString().split('T')[0]}.csv`;
              const result = await saveAndShareBlob(
                blob,
                filename,
                "text/csv;charset=utf-8"
              );
              if (!result.success) {
                toast.error("Export failed. Please try again.");
              } else if (result.savedToDevice) {
                toast.success("Saved to Downloads");
              }
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportTrendsPdf} disabled={isExportingTrendsPdf}>
                {isExportingTrendsPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {isExportingTrendsPdf ? "Generating..." : "PDF"}
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={trendsReportRef}>
            <div className="space-y-4 p-2">
              {/* Report Header */}
              <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '2px solid #22c55e'
            }}>
                <img src={schoolLogo} alt="School Logo" crossOrigin="anonymous" style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain'
              }} />
                <div style={{
                textAlign: 'left'
              }}>
                  <h1 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: '0 0 2px 0'
                }}>Performance Trends Report</h1>
                  <p style={{
                  fontSize: '10px',
                  color: '#666',
                  margin: 0
                }}>Historical Performance Analysis</p>
                  <p style={{
                  fontSize: '9px',
                  color: '#888',
                  margin: '2px 0 0 0'
                }}>
                    Generated on {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                    {' • '}Period: {trendPeriod === '1year' ? 'Last 1 Year' : trendPeriod === '2years' ? 'Last 2 Years' : trendPeriod === '3years' ? 'Last 3 Years' : trendPeriod === '4years' ? 'Last 4 Years' : trendPeriod === '5years' ? 'Last 5 Years' : 'All Years'}
                  </p>
                </div>
              </div>

              {/* Current Performance - Consolidated Summary */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Current Performance</h3>
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}>
                  {/* Overall Average */}
                  <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  textAlign: 'center'
                }}>
                    <div style={{
                    marginBottom: '4px'
                  }}>
                      <span style={{
                      fontSize: '12px'
                    }}>📊</span>
                    </div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#3b82f6'
                  }}>{currentAverageDisplay}</div>
                    <div style={{
                    fontSize: '9px',
                    color: '#666'
                  }}>Overall Average</div>
                  </div>
                  {/* Improvement */}
                  <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: trendDirection.direction === 'up' ? '#dcfce7' : trendDirection.direction === 'down' ? '#fee2e2' : '#f3f4f6',
                  border: `1px solid ${trendDirection.direction === 'up' ? '#86efac' : trendDirection.direction === 'down' ? '#fca5a5' : '#d1d5db'}`,
                  textAlign: 'center'
                }}>
                    <div style={{
                    marginBottom: '4px'
                  }}>
                      <span style={{
                      fontSize: '12px'
                    }}>{trendDirection.direction === 'up' ? '📈' : trendDirection.direction === 'down' ? '📉' : '➡️'}</span>
                    </div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#6b7280'
                  }}>
                      {trendDirection.direction === 'up' ? '+' : trendDirection.direction === 'down' ? '-' : ''}{trendDirection.change}%
                    </div>
                    <div style={{
                    fontSize: '9px',
                    color: '#666'
                  }}>Improvement</div>
                  </div>
                  {/* Rising Subjects with names */}
                  <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #86efac',
                  textAlign: 'center'
                }}>
                    <div style={{
                    marginBottom: '4px'
                  }}>
                      <span style={{
                      fontSize: '12px'
                    }}>🚀</span>
                    </div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#22c55e'
                  }}>{risingStars.length}</div>
                    <div style={{
                    fontSize: '9px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>Rising Subjects</div>
                    {risingStars.length > 0 && <div style={{
                    fontSize: '8px',
                    color: '#16a34a',
                    lineHeight: '1.3'
                  }}>
                        {risingStars.slice(0, 3).map(s => shortenSubjectName(s.subject.name)).join(', ')}
                      </div>}
                  </div>
                  {/* Needs Focus with names */}
                  <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  textAlign: 'center'
                }}>
                    <div style={{
                    marginBottom: '4px'
                  }}>
                      <span style={{
                      fontSize: '12px'
                    }}>⚠️</span>
                    </div>
                    <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ef4444'
                  }}>{fallingBehind.length}</div>
                    <div style={{
                    fontSize: '9px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>Needs Focus</div>
                    {fallingBehind.length > 0 && <div style={{
                    fontSize: '8px',
                    color: '#dc2626',
                    lineHeight: '1.3'
                  }}>
                        {fallingBehind.slice(0, 3).map(s => shortenSubjectName(s.subject.name)).join(', ')}
                      </div>}
                  </div>
                </div>
              </div>

              {/* Exams in Selected Period */}
              <div style={{
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                <h3 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#6b7280'
                }}>Exams in Selected Period</h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {trendData.map((item) => (
                    <span key={String(item.periodId)} style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      fontSize: '9px',
                      fontWeight: 500,
                      color: '#6b7280'
                    }}>
                      {item.period}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rising & Falling - Detailed breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac'
                }}>
                  <h4 style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#16a34a',
                    marginBottom: '8px'
                  }}>Rising Subjects</h4>
                  {risingStars.length > 0 ? risingStars.map((item, i) => <div key={i} style={{
                    padding: '6px 8px',
                    marginBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 500, color: '#1f2937' }}>{item.subject.name}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: 700
                      }}>+{item.improvement}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>{item.prev}%</span>
                      <span style={{ fontSize: '9px', color: '#9ca3af' }}>→</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>{item.current}%</span>
                    </div>
                  </div>) : <p style={{ fontSize: '9px', color: '#666' }}>No improving subjects</p>}
                </div>
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5'
                }}>
                  <h4 style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#dc2626',
                    marginBottom: '8px'
                  }}>Needs Focus</h4>
                  {fallingBehind.length > 0 ? fallingBehind.map((item, i) => <div key={i} style={{
                    padding: '6px 8px',
                    marginBottom: '6px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 500, color: '#1f2937' }}>{item.subject.name}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: 700
                      }}>-{item.decline}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>{item.prev}%</span>
                      <span style={{ fontSize: '9px', color: '#9ca3af' }}>→</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>{item.current}%</span>
                    </div>
                  </div>) : <p style={{ fontSize: '9px', color: '#666' }}>All subjects stable</p>}
                </div>
              </div>

              {/* Performance Trend Chart (SVG for print) */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Performance Trend</h3>
                <div style={{
                padding: '10px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
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
                      <linearGradient id="trendGradientPrint" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {/* Draw trend line and area */}
                    {trendData.length > 0 && <>
                        <path d={`M ${trendData.map((d, i) => {
                      const x = 40 + i / (trendData.length - 1 || 1) * 440;
                      const avg = typeof d.Average === 'number' ? d.Average : 0;
                      const y = 100 - (avg - 30) / 70 * 80;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L ${40 + 440} 100 L 40 100 Z`} fill="url(#trendGradientPrint)" />
                        <path d={trendData.map((d, i) => {
                      const x = 40 + i / (trendData.length - 1 || 1) * 440;
                      const avg = typeof d.Average === 'number' ? d.Average : 0;
                      const y = 100 - (avg - 30) / 70 * 80;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} fill="none" stroke={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} strokeWidth="2.5" />
                        {/* Data points */}
                        {trendData.map((d, i) => {
                      const x = 40 + i / (trendData.length - 1 || 1) * 440;
                      const avg = typeof d.Average === 'number' ? d.Average : 0;
                      const y = 100 - (avg - 30) / 70 * 80;
                      const periodStr = typeof d.period === 'string' ? d.period : String(d.period);
                      return <g key={i}>
                              <circle cx={x} cy={y} r="4" fill={trendDirection.direction === 'up' ? '#22c55e' : trendDirection.direction === 'down' ? '#ef4444' : '#3b82f6'} />
                              <text x={x} y={y - 8} fontSize="8" fill="#374151" textAnchor="middle" fontWeight="600">{avg}%</text>
                              <text x={x} y="115" fontSize="7" fill="#6b7280" textAnchor="middle">{periodStr.split(' ')[0]}</text>
                            </g>;
                    })}
                      </>}
                  </svg>
                </div>
              </div>

              {/* Strengths Profile + Subject vs Overall Average - Side by Side */}
              <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                {/* Strengths Profile Radar Chart (SVG for print) */}
                <div style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                  <h3 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#374151'
                }}>Strengths Profile</h3>
                  <div style={{
                  textAlign: 'center'
                }}>
                    <svg width="180" height="180" viewBox="0 0 180 180" style={{
                    margin: '0 auto',
                    display: 'block'
                  }}>
                      {/* Radar background circles with fill */}
                      {[100, 80, 60, 40, 20].map((r, i) => <circle key={i} cx="90" cy="90" r={r * 0.65} fill={i === 0 ? "#f9fafb" : "none"} stroke="#e5e7eb" strokeWidth="1" />)}
                      {/* Axis lines */}
                      {radarData.slice(0, 6).map((_, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const x2 = 90 + 65 * Math.cos(angle);
                      const y2 = 90 + 65 * Math.sin(angle);
                      return <line key={i} x1="90" y1="90" x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth="1" />;
                    })}
                      {/* Radar polygon with gradient-like fill */}
                      <polygon points={radarData.slice(0, 6).map((d, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const r = d.score / 100 * 65;
                      const x = 90 + r * Math.cos(angle);
                      const y = 90 + r * Math.sin(angle);
                      return `${x},${y}`;
                    }).join(' ')} fill={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'} fillOpacity="0.35" stroke={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="2.5" />
                      {/* Data points and labels */}
                      {radarData.slice(0, 6).map((d, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const r = d.score / 100 * 65;
                      const x = 90 + r * Math.cos(angle);
                      const y = 90 + r * Math.sin(angle);
                      const labelR = 78;
                      const labelX = 90 + labelR * Math.cos(angle);
                      const labelY = 90 + labelR * Math.sin(angle);
                      return <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={radarAverage >= 70 ? '#22c55e' : radarAverage >= 50 ? '#f59e0b' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
                            <text x={labelX} y={labelY} fontSize="9" fill="#374151" textAnchor="middle" dominantBaseline="middle" fontWeight="500">
                              {d.subject}
                            </text>
                          </g>;
                    })}
                    </svg>
                  </div>
                  <p style={{
                  fontSize: '8px',
                  color: '#6b7280',
                  textAlign: 'center',
                  marginTop: '6px'
                }}>
                    Visual snapshot of performance across subjects
                  </p>
                </div>

                {/* Subject vs Overall Average - Horizontal Bar Chart Style */}
                <div style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                  <h3 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#374151'
                }}>Your Score vs Overall Average</h3>
                  <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                    {subjectVsClassData.slice(0, 6).map((item) => {
                    // Use centralized subject color - look up by full name
                    const barColor = getSubjectColor(item.fullName);
                    return <div key={item.subjectId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                          <div style={{
                        width: '45px',
                        fontSize: '9px',
                        fontWeight: 500,
                        color: '#374151',
                        textAlign: 'right'
                      }}>{item.name}</div>
                          <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                            {/* Student bar */}
                            <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${item.student}%`,
                          backgroundColor: barColor,
                          borderRadius: '4px',
                          transition: 'width 0.3s'
                        }} />
                            {/* Class average marker */}
                            <div style={{
                          position: 'absolute',
                          left: `${item.classAvg}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#374151',
                          borderRadius: '50%',
                          border: '1.5px solid #fff'
                        }} />
                          </div>
                          <div style={{
                        width: '35px',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: item.delta >= 0 ? '#22c55e' : '#ef4444',
                        textAlign: 'right'
                      }}>
                            {item.delta >= 0 ? '+' : ''}{item.delta}%
                          </div>
                        </div>;
                  })}
                  </div>
                  {/* Legend */}
                  <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '10px',
                  fontSize: '8px',
                  color: '#6b7280'
                }}>
                    <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                      <div style={{
                      width: '12px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '2px'
                    }} />
                      <span>Your Score</span>
                    </div>
                    <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                      <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#374151',
                      borderRadius: '50%'
                    }} />
                      <span>Overall Avg</span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Historical Data Table */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Historical Performance Data</h3>
                <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9px'
              }}>
                  <thead>
                    <tr style={{
                    backgroundColor: '#f5f5f5'
                  }}>
                      <th style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'left'
                    }}>Period</th>
                      <th style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'right'
                    }}>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((item, idx) => <tr key={String(item.periodId)} style={{
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                        <td style={{
                      padding: '5px 8px',
                      borderBottom: '1px solid #eee'
                    }}>{item.period}</td>
                        <td style={{
                      padding: '5px 8px',
                      borderBottom: '1px solid #eee',
                      textAlign: 'right',
                      fontWeight: 600
                    }}>{item.Average}%</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Performance Heatmap */}
              <div style={{
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ddd'
              }}>Performance Heatmap</h3>
                <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9px'
              }}>
                  <thead>
                    <tr style={{
                    backgroundColor: '#f5f5f5'
                  }}>
                      <th style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'left',
                      minWidth: '80px'
                    }}>Subject</th>
                      {heatmapData[0]?.scores.map((s) => <th key={s.periodId} style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'center',
                      minWidth: '40px'
                    }}>{s.periodLabel}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, idx) => <tr key={row.subjectId} style={{
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                        <td style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      fontWeight: 500
                    }}>{row.fullName}</td>
                        {row.scores.map((cell) => <td key={cell.periodId} style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: cell.score ? cell.score >= 80 ? '#22c55e' : cell.score >= 50 ? '#3b82f6' : '#ef4444' : '#999'
                    }}>
                            {cell.score ?? '-'}
                          </td>)}
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{
              textAlign: 'center',
              fontSize: '8px',
              color: '#666',
              marginTop: '15px',
              paddingTop: '8px',
              borderTop: '1px solid #ddd'
            }}>
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
              <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
                            // Generate CSV data for comparison
              const examALabel = getPeriodLabel(compareExamAId || null);
              const examBLabel = getPeriodLabel(compareExamBId || null);
              const csvRows: string[][] = [
                ['Subject', examALabel, examBLabel, 'Change'],
                ...comparisonData.map((d) => [
                  d?.name ?? '',
                  String(d?.examA ?? ''),
                  String(d?.examB ?? ''),
                  `${d?.delta && d.delta >= 0 ? '+' : ''}${String(d?.delta ?? '')}`,
                ]),
              ];

              const csvContent = csvRows
                .map((row) =>
                  row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(',')
                )
                .join('\n');

              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
              });
              const filename = `comparison-report-${new Date().toISOString().split('T')[0]}.csv`;
              const result = await saveAndShareBlob(
                blob,
                filename,
                "text/csv;charset=utf-8"
              );
              if (!result.success) {
                toast.error("Export failed. Please try again.");
              } else if (result.savedToDevice) {
                toast.success("Saved to Downloads");
              }
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportComparisonPdf} disabled={isExportingComparisonPdf}>
                {isExportingComparisonPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {isExportingComparisonPdf ? "Generating..." : "PDF"}
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={comparisonReportRef}>
            {(() => {
            const examALabel = getPeriodLabel(compareExamAId || null);
            const examBLabel = getPeriodLabel(compareExamBId || null);
            const avgA = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length) : 0;
            const avgB = comparisonData.length > 0 ? Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length) : 0;
            const avgDelta = avgA - avgB;
            const improvedSubjects = comparisonData.filter(d => d.delta > 0);
            const declinedSubjects = comparisonData.filter(d => d.delta < 0);
            const improved = improvedSubjects.length;
            const declined = declinedSubjects.length;

            // Best performing subject - the one that improved the most
            const bestPerforming = improvedSubjects.length > 0 ? improvedSubjects.reduce((best, current) => current.delta > best.delta ? current : best) : null;
            return <div className="space-y-4 p-2">
                  {/* Report Header */}
                  <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #8b5cf6'
              }}>
                    <img src={schoolLogo} alt="School Logo" crossOrigin="anonymous" style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain'
                }} />
                    <div style={{
                  textAlign: 'left'
                }}>
                      <h1 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 2px 0'
                  }}>Exam Comparison Report</h1>
                      <p style={{
                    fontSize: '10px',
                    color: '#666',
                    margin: 0
                  }}>{examALabel} vs {examBLabel}</p>
                      <p style={{
                    fontSize: '9px',
                    color: '#888',
                    margin: '2px 0 0 0'
                  }}>
                        Generated on {new Date().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                      </p>
                    </div>
                  </div>

                  {/* Summary Comparison */}
                  <div style={{
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                    <h3 style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #ddd'
                }}>Summary Comparison</h3>
                    <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                      <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #3b82f6'
                  }}>
                        <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                          <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6'
                      }} />
                          <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#1d4ed8'
                      }}>Exam A</span>
                        </div>
                        <p style={{
                      fontSize: '9px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>{examALabel}</p>
                        <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1a1a1a'
                    }}>{avgA}%</div>
                        <p style={{
                      fontSize: '9px',
                      color: '#666'
                    }}>Average Score</p>
                      </div>
                      <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #ef4444'
                  }}>
                        <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                          <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444'
                      }} />
                          <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#dc2626'
                      }}>Exam B</span>
                        </div>
                        <p style={{
                      fontSize: '9px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>{examBLabel}</p>
                        <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1a1a1a'
                    }}>{avgB}%</div>
                        <p style={{
                      fontSize: '9px',
                      color: '#666'
                    }}>Average Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Change Summary with Subject Names */}
                  <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                    <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: avgDelta > 0 ? '#dcfce7' : avgDelta < 0 ? '#fee2e2' : '#f3f4f6',
                  border: '1px solid #ddd',
                  textAlign: 'center'
                }}>
                      <div style={{
                    marginBottom: '4px'
                  }}>
                        <span style={{
                      fontSize: '12px'
                    }}>{avgDelta > 0 ? '📈' : avgDelta < 0 ? '📉' : '➡️'}</span>
                      </div>
                      <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: avgDelta > 0 ? '#22c55e' : avgDelta < 0 ? '#ef4444' : '#6b7280'
                  }}>
                        {avgDelta > 0 ? '+' : ''}{avgDelta}%
                      </div>
                      <div style={{
                    fontSize: '8px',
                    color: '#666'
                  }}>Overall Change</div>
                    </div>
                    <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #86efac',
                  textAlign: 'center'
                }}>
                      <div style={{
                    marginBottom: '4px'
                  }}>
                        <span style={{
                      fontSize: '12px'
                    }}>🚀</span>
                      </div>
                      <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#22c55e'
                  }}>{improved}</div>
                      <div style={{
                    fontSize: '8px',
                    color: '#666'
                  }}>Improved</div>
                      {improvedSubjects.length > 0 && <div style={{
                    fontSize: '7px',
                    color: '#22c55e',
                    marginTop: '4px',
                    lineHeight: 1.3
                  }}>
                          {improvedSubjects.slice(0, 3).map(s => shortenSubjectName(s.name)).join(', ')}
                          {improvedSubjects.length > 3 && ` +${improvedSubjects.length - 3}`}
                        </div>}
                    </div>
                    <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  textAlign: 'center'
                }}>
                      <div style={{
                    marginBottom: '4px'
                  }}>
                        <span style={{
                      fontSize: '12px'
                    }}>📉</span>
                      </div>
                      <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#ef4444'
                  }}>{declined}</div>
                      <div style={{
                    fontSize: '8px',
                    color: '#666'
                  }}>Declined</div>
                      {declinedSubjects.length > 0 && <div style={{
                    fontSize: '7px',
                    color: '#ef4444',
                    marginTop: '4px',
                    lineHeight: 1.3
                  }}>
                          {declinedSubjects.slice(0, 3).map(s => shortenSubjectName(s.name)).join(', ')}
                          {declinedSubjects.length > 3 && ` +${declinedSubjects.length - 3}`}
                        </div>}
                    </div>
                    <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  textAlign: 'center'
                }}>
                      <div style={{
                    marginBottom: '4px'
                  }}>
                        <span style={{
                      fontSize: '12px'
                    }}>🏆</span>
                      </div>
                      <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#d97706'
                  }}>
                        {bestPerforming ? shortenSubjectName(bestPerforming.name) : '-'}
                      </div>
                      <div style={{
                    fontSize: '8px',
                    color: '#666'
                  }}>Best Performing</div>
                      {bestPerforming && <div style={{
                    fontSize: '7px',
                    color: '#d97706',
                    marginTop: '4px'
                  }}>
                          +{bestPerforming.delta} marks
                        </div>}
                    </div>
                  </div>

                  {/* Subject Comparison Table */}
                  <div style={{
                marginBottom: '12px',
                pageBreakInside: 'avoid'
              }}>
                    <h3 style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #ddd'
                }}>Subject Comparison</h3>
                    <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '9px'
                }}>
                      <thead>
                        <tr style={{
                      backgroundColor: '#f5f5f5'
                    }}>
                          <th style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid #ddd',
                        textAlign: 'left'
                      }}>Subject</th>
                          <th style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center'
                      }}>Exam A</th>
                          <th style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center'
                      }}>Exam B</th>
                          <th style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center'
                      }}>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, idx) => <tr key={item.subjectId} style={{
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}>
                            <td style={{
                        padding: '5px 8px',
                        borderBottom: '1px solid #eee',
                        fontWeight: 500
                      }}>{item.name}</td>
                            <td style={{
                        padding: '5px 8px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'center'
                      }}>{item.examA}%</td>
                            <td style={{
                        padding: '5px 8px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'center'
                      }}>{item.examB}%</td>
                            <td style={{
                        padding: '5px 8px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: item.delta > 0 ? '#22c55e' : item.delta < 0 ? '#ef4444' : '#6b7280'
                      }}>
                              {item.delta > 0 ? '+' : ''}{item.delta}
                            </td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>

                  {/* Insight */}
                  <div style={{
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #ddd',
                marginBottom: '12px'
              }}>
                    <p style={{
                  fontSize: '10px',
                  color: '#1a1a1a'
                }}>
                      <strong>Insight:</strong>{' '}
                      {avgDelta > 0 ? `Overall improvement of +${avgDelta}% from ${examBLabel} to ${examALabel}. ${improved} subjects improved, ${declined} declined.${bestPerforming ? ` Best performing: ${bestPerforming.name} (+${bestPerforming.delta}).` : ''}` : avgDelta < 0 ? `Overall decline of ${avgDelta}% from ${examBLabel} to ${examALabel}. Focus needed on declining subjects.` : `Performance remained stable between the two periods.`}
                    </p>
                  </div>

                  {/* Footer */}
                  <div style={{
                textAlign: 'center',
                fontSize: '8px',
                color: '#666',
                marginTop: '15px',
                paddingTop: '8px',
                borderTop: '1px solid #ddd'
              }}>
                    <p>This report was generated automatically by the School Management System</p>
                    <p>© {new Date().getFullYear()} All Rights Reserved</p>
                  </div>
                </div>;
          })()}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>;
}

