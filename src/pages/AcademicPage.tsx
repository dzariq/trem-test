import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData, classAverages, students, attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp, TrendingDown, Check, ArrowUp, ArrowDown, Minus, BarChart3, GitCompare, Target, AlertTriangle, Star, Goal, CheckCircle2, Circle, Edit2, ChevronDown, MessageSquare, Calendar, Sparkles, Printer, FileSpreadsheet, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import schoolLogo from "@/assets/school-badge.png";
import { CertificateDialog } from "@/components/CertificateDialog";
import { ReportCardDialog } from "@/components/ReportCardDialog";
import { EnvelopeAwardCard } from "@/components/EnvelopeAwardCard";
import { SubjectPerformanceChart } from "@/components/SubjectPerformanceChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, ReferenceLine, ReferenceDot, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
type YearKey = "2022" | "2023" | "2024" | "2025";
type ExamType = "midYear" | "yearEnd";

// Helper to get score from data structure
const getScore = (subject: typeof academicData.subjects[0], year: YearKey, examType: ExamType) => {
  const yearData = subject.scores[year];
  return yearData ? yearData[examType] : null;
};

// Helper to get category score
const getCategoryScore = (subject: typeof academicData.subjects[0], year: YearKey, category: "attitude" | "homework" | "quiz" | "exam") => {
  const yearData = subject.scores[year];
  return yearData ? yearData[category] : null;
};

// Import centralized subjects config
import { getShortSubjectName, getTinySubjectCode, subjectGroups, allSubjects } from "@/data/subjectsConfig";
import { SubjectGroupPill } from "@/components/SubjectGroupPill";

// Use centralized short name function
const shortenSubjectName = getShortSubjectName;

// Get subjects that are not part of any variant group (standalone subjects)
const groupedSubjectNames = subjectGroups.flatMap(g => g.variants?.map(v => v.name) || []);
const standaloneSubjects = allSubjects.filter(s => !groupedSubjectNames.includes(s));
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

  // Trends tab filters - multi-select subjects (like Overview)
  const [trendsSelectedSubjects, setTrendsSelectedSubjects] = useState<string[]>(academicData.subjects.map(s => s.name));

  // Grades tab filters - exam selector and multi-select subjects
  const [gradesSelectedSubjects, setGradesSelectedSubjects] = useState<string[]>(academicData.subjects.map(s => s.name));
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportCardDialogOpen, setReportCardDialogOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"comment" | "tips">("comment");

  // Pinch-to-zoom state for chart
  const [chartZoom, setChartZoom] = useState(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
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
  const [analysisTab, setAnalysisTab] = useState("overview");

  // Comparison state
  const [compareExamA, setCompareExamA] = useState({
    year: "2025" as YearKey,
    type: "midYear" as ExamType
  });

  // Goals state - default targets for each subject
  const [goals, setGoals] = useState<Record<string, number>>(() => {
    const initialGoals: Record<string, number> = {};
    academicData.subjects.forEach(s => {
      // Set default goal 5% higher than current score, max 100
      const currentScore = getScore(s, "2025", "midYear") ?? 70;
      initialGoals[s.name] = Math.min(currentScore + 5, 100);
    });
    return initialGoals;
  });
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [tempGoalValue, setTempGoalValue] = useState<string>("");
  const [compareExamB, setCompareExamB] = useState({
    year: "2024" as YearKey,
    type: "yearEnd" as ExamType
  });
  const [compareSubjects, setCompareSubjects] = useState<string[]>(academicData.subjects.map(s => s.name));

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

  // Subject color palette for multiple lines mode (design tokens)
  const subjectStrokePalette = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ];

  const getSubjectStroke = (subject: string, indexHint = 0) => {
    const idx = academicData.subjects.findIndex((s) => s.name === subject);
    const resolvedIndex = idx >= 0 ? idx : indexHint;
    return subjectStrokePalette[resolvedIndex % subjectStrokePalette.length];
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
    const examLabel = examType === "midYear" ? "Mid-Year" : "Year-End";
    return `${examLabel} ${selectedYear}`;
  };

  // Filtered subjects based on gradesSelectedSubjects
  const filteredGradesSubjects = useMemo(() => {
    return academicData.subjects.filter(s => gradesSelectedSubjects.includes(s.name));
  }, [gradesSelectedSubjects]);

  // Calculate averages
  const currentAverage = useMemo(() => {
    const scores = filteredGradesSubjects.map(s => getScore(s, selectedYear, examType)).filter(s => s !== null) as number[];
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Calculate category averages for selected year
  const categoryAverages = useMemo(() => {
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    return categories.map(cat => {
      const scores = filteredGradesSubjects.map(s => getCategoryScore(s, selectedYear, cat)).filter(s => s !== null) as number[];
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        classAverage: classAverages[selectedYear]?.[cat] ?? 0
      };
    });
  }, [selectedYear, filteredGradesSubjects]);

  // Subject performance data for bar chart (sorted best to worst)
  const subjectPerformance = useMemo(() => {
    return filteredGradesSubjects.map(s => ({
      name: s.name,
      score: getScore(s, selectedYear, examType) ?? 0,
      classAvg: classAverages[selectedYear]?.[examType] ?? 0,
      goal: goals[s.name] ?? 80
    })).sort((a, b) => b.score - a.score);
  }, [selectedYear, examType, goals, filteredGradesSubjects]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const grades = {
      "A*": 0,
      "A": 0,
      "B": 0,
      "C": 0,
      "D": 0,
      "E": 0
    };
    filteredGradesSubjects.forEach(s => {
      const score = getScore(s, selectedYear, examType);
      if (score !== null) {
        const grade = getGradeFromScore(score);
        grades[grade as keyof typeof grades]++;
      }
    });
    return Object.entries(grades).map(([grade, count]) => ({
      grade,
      count
    }));
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Top 3 and Bottom 3 subjects (bottom only includes scores below 50%)
  const {
    top3,
    needsAttention
  } = useMemo(() => {
    const sorted = [...filteredGradesSubjects].sort((a, b) => {
      const scoreA = getScore(a, selectedYear, examType) ?? 0;
      const scoreB = getScore(b, selectedYear, examType) ?? 0;
      return scoreB - scoreA;
    });
    // Filter subjects below 50% and take lowest 3
    const below50 = sorted.filter(s => (getScore(s, selectedYear, examType) ?? 0) < 50).reverse().slice(0, 3);
    return {
      top3: sorted.slice(0, 3),
      needsAttention: below50
    };
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Calculate attendance rate from all months
  const attendanceStats = useMemo(() => {
    const totalAttendance = attendanceData.monthly.reduce((acc, month) => ({
      present: acc.present + month.present,
      absent: acc.absent + month.absent,
      late: acc.late + month.late,
      excused: acc.excused + month.excused
    }), {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    });
    const totalDays = totalAttendance.present + totalAttendance.absent + totalAttendance.late + totalAttendance.excused;
    const attendanceRate = totalDays > 0 ? Math.round(totalAttendance.present / totalDays * 100) : 0;
    return {
      attendanceRate
    };
  }, []);

  // Calculate subjects passing (score >= 50)
  const passingStats = useMemo(() => {
    const passingSubjects = filteredGradesSubjects.filter(s => (getScore(s, selectedYear, examType) ?? 0) >= 50);
    const passingCount = passingSubjects.length;
    const totalSubjects = filteredGradesSubjects.length;
    const passingPercentage = totalSubjects > 0 ? Math.round(passingCount / totalSubjects * 100) : 0;
    return {
      passingCount,
      totalSubjects,
      passingPercentage
    };
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Find weakest subject
  const weakestSubjectInfo = useMemo(() => {
    if (filteredGradesSubjects.length === 0) return { name: "N/A", score: 0 };
    const weakest = filteredGradesSubjects.reduce((worst, s) => {
      const currentScore = getScore(s, selectedYear, examType) ?? 100;
      const worstScore = getScore(worst, selectedYear, examType) ?? 100;
      return currentScore < worstScore ? s : worst;
    });
    const weakestScore = getScore(weakest, selectedYear, examType) ?? 0;
    return {
      name: weakest.name,
      score: weakestScore
    };
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Best subject info
  const bestSubjectInfo = useMemo(() => {
    if (filteredGradesSubjects.length === 0) return { name: "N/A", score: 0 };
    const best = filteredGradesSubjects.reduce((bestSub, s) => {
      const currentScore = getScore(s, selectedYear, examType) ?? 0;
      const bestScore = getScore(bestSub, selectedYear, examType) ?? 0;
      return currentScore > bestScore ? s : bestSub;
    });
    const bestScore = getScore(best, selectedYear, examType) ?? 0;
    return {
      name: best.name,
      score: bestScore
    };
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Improvement from previous exam
  const improvementStats = useMemo(() => {
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    if (examType === "midYear") {
      if (selectedYear === "2025") {
        prevYear = "2024";
        prevType = "yearEnd";
      } else if (selectedYear === "2024") {
        prevYear = "2023";
        prevType = "yearEnd";
      } else if (selectedYear === "2023") {
        prevYear = "2022";
        prevType = "yearEnd";
      } else {
        return {
          points: 0,
          text: "N/A"
        };
      }
    } else {
      prevType = "midYear";
    }
    const currentScores = filteredGradesSubjects.map(s => getScore(s, selectedYear, examType)).filter(s => s !== null) as number[];
    const prevScores = filteredGradesSubjects.map(s => getScore(s, prevYear, prevType)).filter(s => s !== null) as number[];
    if (currentScores.length === 0 || prevScores.length === 0) return {
      points: 0,
      text: "N/A"
    };
    const currentAvg = Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length);
    const prevAvg = Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length);
    const points = currentAvg - prevAvg;
    return {
      points,
      text: points >= 0 ? `+${points}%` : `${points}%`
    };
  }, [selectedYear, examType, filteredGradesSubjects]);
  const risingStars = useMemo(() => {
    // Determine previous exam period
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    if (examType === "midYear") {
      // Previous is last year's year-end
      if (selectedYear === "2025") {
        prevYear = "2024";
        prevType = "yearEnd";
      } else if (selectedYear === "2024") {
        prevYear = "2023";
        prevType = "yearEnd";
      } else {
        return [];
      } // No previous for 2023 mid
    } else {
      // Previous is same year's mid-year
      prevType = "midYear";
    }
    const improvements = filteredGradesSubjects.map(s => {
      const current = getScore(s, selectedYear, examType) ?? 0;
      const prev = getScore(s, prevYear, prevType) ?? 0;
      return {
        subject: s,
        current,
        prev,
        improvement: current - prev
      };
    }).filter(item => item.improvement > 0 && item.current > 0 && item.prev > 0);
    return improvements.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Falling behind - subjects with biggest decline from previous exam
  const fallingBehind = useMemo(() => {
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    if (examType === "midYear") {
      if (selectedYear === "2025") {
        prevYear = "2024";
        prevType = "yearEnd";
      } else if (selectedYear === "2024") {
        prevYear = "2023";
        prevType = "yearEnd";
      } else {
        return [];
      }
    } else {
      prevType = "midYear";
    }
    const declines = filteredGradesSubjects.map(s => {
      const current = getScore(s, selectedYear, examType) ?? 0;
      const prev = getScore(s, prevYear, prevType) ?? 0;
      return {
        subject: s,
        current,
        prev,
        decline: prev - current
      };
    }).filter(item => item.decline > 0 && item.current > 0 && item.prev > 0);
    return declines.sort((a, b) => b.decline - a.decline).slice(0, 3);
  }, [selectedYear, examType, filteredGradesSubjects]);

  // Year-over-year trend data with period filtering (3 years of data)
  const trendData = useMemo(() => {
    const years: YearKey[] = ["2022", "2023", "2024", "2025"];
    const periods: {
      year: YearKey;
      type: ExamType;
      label: string;
    }[] = [];
    years.forEach(year => {
      periods.push({
        year,
        type: "midYear",
        label: `Mid ${year}`
      });
      if (year !== "2025") {
        // 2025 year-end is null
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
      filteredPeriods = periods.slice(-2); // Last 2 periods
    } else if (trendPeriod === "2years") {
      filteredPeriods = periods.slice(-4); // Last 4 periods
    } else if (trendPeriod === "3years") {
      filteredPeriods = periods.slice(-6); // Last 6 periods
    } else if (trendPeriod === "4years") {
      filteredPeriods = periods.slice(-8); // Last 8 periods
    } else if (trendPeriod === "5years") {
      // Keep the default view compact (requested: 7 periods)
      filteredPeriods = periods.slice(-7);
    }
    return filteredPeriods.map(p => {
      const result: Record<string, number | string | null> = {
        period: p.label
      };
      // Only include selected subjects
      const selectedSubjectsData = academicData.subjects.filter(s => trendsSelectedSubjects.includes(s.name));
      selectedSubjectsData.forEach(s => {
        result[s.name] = getScore(s, p.year, p.type);
      });
      // Overall average of selected subjects only
      const scores = selectedSubjectsData.map(s => getScore(s, p.year, p.type)).filter(s => s !== null) as number[];
      result["Average"] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return result;
    });
  }, [trendPeriod, trendsSelectedSubjects]);

  // Calculate trend direction for selected subject(s)
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return {
      direction: "stable" as const,
      change: 0
    };
    const key = trendsSelectedSubjects.length === 1 ? trendsSelectedSubjects[0] : "Average";
    const firstValue = trendData[0]?.[key] as number | null;
    const lastValue = trendData[trendData.length - 1]?.[key] as number | null;
    if (firstValue === null || lastValue === null) return {
      direction: "stable" as const,
      change: 0
    };
    const change = lastValue - firstValue;
    return {
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "stable" as const,
      change: Math.abs(change),
      currentValue: lastValue
    };
  }, [trendData, trendsSelectedSubjects]);

  // Calculate goal reference line value for trends chart
  const trendGoalValue = useMemo(() => {
    if (trendsSelectedSubjects.length === 1) {
      return goals[trendsSelectedSubjects[0]] ?? 80;
    }
    // Average of selected subjects' goals
    const selectedGoals = trendsSelectedSubjects.map(s => goals[s] ?? 80);
    return selectedGoals.length > 0 ? Math.round(selectedGoals.reduce((a, b) => a + b, 0) / selectedGoals.length) : 80;
  }, [trendsSelectedSubjects, goals]);

  // Category trend data
  const categoryTrendData = useMemo(() => {
    const years: YearKey[] = ["2023", "2024", "2025"];
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    return years.map(year => {
      const result: Record<string, number | string> = {
        year
      };
      categories.forEach(cat => {
        const scores = academicData.subjects.map(s => getCategoryScore(s, year, cat)).filter(s => s !== null) as number[];
        result[cat.charAt(0).toUpperCase() + cat.slice(1)] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      });
      return result;
    });
  }, []);

  // Radar chart data for subject strengths profile - use tiny codes for compact display
  const radarData = useMemo(() => {
    return academicData.subjects.map(s => ({
      subject: getTinySubjectCode(s.name),
      fullName: s.name,
      score: getScore(s, selectedYear, examType) ?? 0,
      fullMark: 100
    }));
  }, [selectedYear, examType]);

  // Subject vs Class Average data - now uses per-subject class averages
  const subjectVsClassData = useMemo(() => {
    const yearData = classAverages[selectedYear];
    const subjectAverages = yearData?.bySubject as Record<string, number> | undefined;
    const fallbackAvg = yearData?.[examType] ?? 75;
    return academicData.subjects.map(s => {
      const studentScore = getScore(s, selectedYear, examType) ?? 0;
      const classAvg = subjectAverages?.[s.name] ?? fallbackAvg;
      return {
        name: shortenSubjectName(s.name),
        fullName: s.name,
        student: studentScore,
        classAvg: classAvg,
        delta: studentScore - classAvg
      };
    }).sort((a, b) => b.delta - a.delta);
  }, [selectedYear, examType]);

  // Average score for radar color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map(d => d.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [radarData]);

  // Performance Heatmap data - subjects x exam periods
  const heatmapData = useMemo(() => {
    const periods = [{
      year: "2023" as YearKey,
      type: "midYear" as ExamType,
      label: "Mid '23"
    }, {
      year: "2023" as YearKey,
      type: "yearEnd" as ExamType,
      label: "End '23"
    }, {
      year: "2024" as YearKey,
      type: "midYear" as ExamType,
      label: "Mid '24"
    }, {
      year: "2024" as YearKey,
      type: "yearEnd" as ExamType,
      label: "End '24"
    }, {
      year: "2025" as YearKey,
      type: "midYear" as ExamType,
      label: "Mid '25"
    }];
    return academicData.subjects.map(s => ({
      subject: shortenSubjectName(s.name),
      fullName: s.name,
      scores: periods.map(p => ({
        period: p.label,
        score: getScore(s, p.year, p.type)
      }))
    }));
  }, []);

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

  // Comparison data - filtered by selected subjects
  const comparisonData = useMemo(() => {
    return academicData.subjects.filter(s => compareSubjects.includes(s.name)).map(s => {
      const scoreA = getScore(s, compareExamA.year, compareExamA.type) ?? 0;
      const scoreB = getScore(s, compareExamB.year, compareExamB.type) ?? 0;
      const delta = scoreA - scoreB;
      return {
        name: s.name,
        examA: scoreA,
        examB: scoreB,
        delta,
        improved: delta > 0,
        goal: goals[s.name] ?? 80
      };
    });
  }, [compareExamA, compareExamB, compareSubjects, goals]);

  // Category comparison - filtered by selected subjects
  const categoryComparison = useMemo(() => {
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    const filteredSubjects = academicData.subjects.filter(s => compareSubjects.includes(s.name));
    return categories.map(cat => {
      const scoresA = filteredSubjects.map(s => getCategoryScore(s, compareExamA.year, cat)).filter(s => s !== null) as number[];
      const scoresB = filteredSubjects.map(s => getCategoryScore(s, compareExamB.year, cat)).filter(s => s !== null) as number[];
      const avgA = scoresA.length > 0 ? Math.round(scoresA.reduce((a, b) => a + b, 0) / scoresA.length) : 0;
      const avgB = scoresB.length > 0 ? Math.round(scoresB.reduce((a, b) => a + b, 0) / scoresB.length) : 0;
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        examA: avgA,
        examB: avgB,
        delta: avgA - avgB
      };
    });
  }, [compareExamA, compareExamB, compareSubjects]);
  const getExamLabelForComparison = (exam: {
    year: YearKey;
    type: ExamType;
  }) => {
    return `${exam.type === "midYear" ? "Mid-Year" : "Year-End"} ${exam.year}`;
  };

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
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>} rightContent={<Select defaultValue={students[0]?.id}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map(student => <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>)}
            </SelectContent>
          </Select>} />

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
            </CardTitle>
            {/* Year and Exam Period Selectors */}
            <div className="flex gap-2 mt-3">
              <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v as YearKey)}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="midYear">Mid-Year</SelectItem>
                  <SelectItem value="yearEnd">Year-End</SelectItem>
                </SelectContent>
              </Select>
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
              <Button className="w-full gap-2 mt-3" onClick={generateReport}>
                <Download className="h-4 w-4" />
                Download Report Card
              </Button>

              {reportGenerated && <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center mt-2">
                  <p className="text-sm text-foreground">Report Card for {getExamLabel()} downloaded!</p>
                </div>}

              <TabsContent value="grades" className="mt-4">
                <div className="space-y-3">
                  {/* Sort subjects by score (highest to lowest), then group into rows of 2 */}
                  {(() => {
                  const filteredSubjects = academicData.subjects.filter(s => gradesSelectedSubjects.includes(s.name));
                  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
                    const scoreA = getScore(a, selectedYear, examType) ?? 0;
                    const scoreB = getScore(b, selectedYear, examType) ?? 0;
                    return scoreB - scoreA;
                  });
                  return Array.from({
                    length: Math.ceil(sortedSubjects.length / 2)
                  }, (_, rowIndex) => {
                    const rowSubjects = sortedSubjects.slice(rowIndex * 2, rowIndex * 2 + 2);
                    const expandedInRow = rowSubjects.find(s => s.name === expandedSubject);
                    return <div key={rowIndex} className="space-y-3">
                        {/* Subject Cards Row */}
                        <div className="grid grid-cols-2 gap-3">
                          {rowSubjects.map((subject, index) => {
                          const score = getScore(subject, selectedYear, examType);
                          const isPending = score === null || score === undefined;
                          const isExpanded = expandedSubject === subject.name;
                          const gradeKey = isPending ? 'C' : getGradeFromScore(score!)[0];
                          const cardStyle = gradeCardBgStyles[gradeKey] || gradeCardBgStyles.C;
                          return <div key={index} onClick={() => setExpandedSubject(isExpanded ? null : subject.name)} className={`
                                  flex flex-col p-4 rounded-xl cursor-pointer border
                                  transition-all duration-200 ease-out min-h-[80px]
                                  hover:shadow-md
                                  ${isExpanded ? 'ring-2 ring-primary/40 shadow-md' : ''}
                                `} style={{
                            backgroundColor: cardStyle.bg,
                            borderColor: cardStyle.border
                          }}>
                                <h3 className="font-medium text-foreground text-sm leading-tight mb-2">{subject.name}</h3>
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg font-semibold text-foreground">
                                      {isPending ? "Pending" : `${score}%`}
                                    </p>
                                    {!isPending && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                  backgroundColor: (gradePillStyles[getGradeFromScore(score!)[0]] || gradePillStyles.C).bg,
                                  color: (gradePillStyles[getGradeFromScore(score!)[0]] || gradePillStyles.C).text
                                }}>
                                        {getGradeFromScore(score!)}
                                      </span>}
                                  </div>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>;
                        })}
                        </div>
                        
                        {/* Expanded Comment Box - Full Width */}
                        {expandedInRow && <div className="animate-fade-in">
                            <div className={`rounded-xl p-4 relative mt-1 transition-colors ${
                              expandedSection === "tips" 
                                ? "bg-amber-50 border border-amber-200" 
                                : "bg-primary/5 border border-primary/20"
                            }`}>
                              {/* Arrow pointer - clean triangle without bottom line */}
                              <div className="absolute -top-[10px] w-5 h-[10px] overflow-hidden" style={{
                            left: expandedInRow === rowSubjects[0] ? 'calc(25% - 10px)' : 'calc(75% - 10px)'
                          }}>
                                <div className={`w-[14px] h-[14px] rotate-45 border-l border-t ${
                                  expandedSection === "tips"
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-primary/5 border-primary/20"
                                }`} style={{
                              position: 'absolute',
                              top: '5px',
                              left: '3px'
                            }} />
                              </div>
                              
                              {/* Toggle Buttons */}
                              <div className="flex gap-2 mb-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedSection("comment");
                                  }}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    expandedSection === "comment" 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  Teacher's Comment
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedSection("tips");
                                  }}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    expandedSection === "tips" 
                                      ? "bg-amber-500 text-white" 
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                                >
                                  <BookOpen className="h-3 w-3" />
                                  Learning Tips
                                </button>
                              </div>
                              
                              {/* Content Section */}
                              {expandedSection === "comment" ? (
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-primary mb-1">Teacher's Comment</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {expandedInRow.teacherComment}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-3">
                                    {expandedInRow.classStudyRecommendation && (
                                      <div>
                                        <p className="text-xs font-medium text-amber-600 mb-1">Class Learning Tips</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {expandedInRow.classStudyRecommendation}
                                        </p>
                                      </div>
                                    )}
                                    {expandedInRow.studyRecommendation && (
                                      <div className="pt-2 border-t border-amber-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                            Individual Tips
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {expandedInRow.studyRecommendation}
                                        </p>
                                      </div>
                                    )}
                                    {!expandedInRow.classStudyRecommendation && !expandedInRow.studyRecommendation && (
                                      <p className="text-sm text-muted-foreground italic">
                                        No learning tips available for this subject.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>}
                      </div>;
                  });
                })()}
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="mt-4 space-y-4">
                {/* Smart Summary Card */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Smart Summary</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {(() => {
                          const grades = academicData.behavior.map(b => b.grade);
                          const aCount = grades.filter(g => g === "A").length;
                          const bCount = grades.filter(g => g === "B").length;
                          const cCount = grades.filter(g => g === "C").length;
                          const total = grades.length;
                          if (aCount >= total * 0.7) {
                            return "Excellent conduct! The student demonstrates outstanding behavior across all categories, showing strong character and positive attitude.";
                          } else if (aCount + bCount >= total * 0.7) {
                            return "Good overall conduct with some areas showing room for improvement. The student generally displays positive behavior and attitude.";
                          } else if (cCount >= total * 0.5) {
                            return "Needs improvement in behavioral areas. We recommend working with the student to develop better habits and attitudes.";
                          } else {
                            return "Average conduct with mixed performance. The student shows potential and should focus on consistency across all behavioral areas.";
                          }
                        })()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Behavioral Traits Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {academicData.behavior.map((item, index) => {
                  const gradeConfig = {
                    A: {
                      label: "Excellent",
                      bg: "bg-emerald-50",
                      border: "border-emerald-200",
                      text: "text-emerald-700",
                      watermark: "text-emerald-200"
                    },
                    B: {
                      label: "Good",
                      bg: "bg-blue-50",
                      border: "border-blue-200",
                      text: "text-blue-700",
                      watermark: "text-blue-200"
                    },
                    C: {
                      label: "Average",
                      bg: "bg-amber-50",
                      border: "border-amber-200",
                      text: "text-amber-700",
                      watermark: "text-amber-200"
                    },
                    D: {
                      label: "Needs Work",
                      bg: "bg-orange-50",
                      border: "border-orange-200",
                      text: "text-orange-700",
                      watermark: "text-orange-200"
                    },
                    E: {
                      label: "Poor",
                      bg: "bg-red-50",
                      border: "border-red-200",
                      text: "text-red-700",
                      watermark: "text-red-200"
                    }
                  };
                  const config = gradeConfig[item.grade as keyof typeof gradeConfig] || gradeConfig.C;

                  // Smart description based on grade
                  const getSmartDescription = (category: string, grade: string) => {
                    const descriptions: Record<string, Record<string, string>> = {
                      Attendance: {
                        A: "Excellent attendance record",
                        B: "Good attendance",
                        C: "Some absences noted",
                        D: "Frequent absences",
                        E: "Poor attendance"
                      },
                      Punctuality: {
                        A: "Always on time",
                        B: "Usually punctual",
                        C: "Occasionally late",
                        D: "Frequently late",
                        E: "Chronically late"
                      },
                      Cooperation: {
                        A: "Works excellently with others",
                        B: "Cooperates well",
                        C: "Cooperates when prompted",
                        D: "Struggles to cooperate",
                        E: "Needs improvement"
                      },
                      "Self Control": {
                        A: "Excellent self-discipline",
                        B: "Good self-control",
                        C: "Sometimes impulsive",
                        D: "Needs guidance",
                        E: "Lacks self-control"
                      },
                      Responsibility: {
                        A: "Highly responsible",
                        B: "Generally responsible",
                        C: "Moderately responsible",
                        D: "Needs reminders",
                        E: "Irresponsible"
                      },
                      Initiative: {
                        A: "Takes excellent initiative",
                        B: "Shows good initiative",
                        C: "Some initiative shown",
                        D: "Rarely takes initiative",
                        E: "Lacks initiative"
                      },
                      Leadership: {
                        A: "Strong leader",
                        B: "Good leadership skills",
                        C: "Developing leadership",
                        D: "Emerging leader",
                        E: "Needs leadership development"
                      }
                    };
                    return descriptions[category]?.[grade] || "No description available";
                  };
                  return <Card key={index} className={`${config.bg} ${config.border} overflow-hidden relative`}>
                        {/* Oversized watermark grade letter */}
                        <div className={`absolute -right-1 -bottom-3 text-[4.5rem] font-black leading-none ${config.watermark} select-none pointer-events-none`}>
                          {item.grade}
                        </div>
                        <CardContent className="p-3 relative z-10">
                          <span className={`text-xs font-semibold uppercase ${config.text}`}>{item.category}</span>
                          <p className="text-xs text-muted-foreground mt-2">{getSmartDescription(item.category, item.grade)}</p>
                        </CardContent>
                      </Card>;
                })}
                </div>

                {/* Comments Section */}
                {academicData.behaviorComments && <div className="space-y-3">
                    <Card className="bg-rose-50 border-rose-200">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold uppercase text-rose-700 mb-2">Homeroom Teacher Comment</p>
                        <p className="text-sm text-muted-foreground">{academicData.behaviorComments.homeroomComment}</p>
                      </CardContent>
                    </Card>
                  </div>}
              </TabsContent>

              <TabsContent value="cocurriculum" className="mt-4 space-y-3">
                {/* Year Selection */}
                <div className="space-y-2 pb-3 mb-3 border-b border-border">
                  <div className="flex gap-2">
                    {(["2025", "2024", "2023"] as const).map(year => (
                      <button 
                        key={year} 
                        onClick={() => toggleYear(year)} 
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                          selectedYears.includes(year) 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-card border-border text-foreground hover:bg-accent"
                        }`}
                      >
                        {selectedYears.includes(year) && <Check className="h-3.5 w-3.5" />}
                        {year}
                      </button>
                    ))}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Viewing: {selectedYears.sort().reverse().join(", ")}
                  </Badge>
                </div>

                {/* Awards displayed as trophy-style cards with category tags */}
                {academicData.awards && <>
                    {/* Sports House */}
                    {academicData.awards.sportsHouse.organization !== "None" && academicData.awards.sportsHouse.organization && <EnvelopeAwardCard category="Sports House" categoryColor={{
                  bg: 'rgba(239, 68, 68, 0.15)',
                  text: '#dc2626'
                }} organization={academicData.awards.sportsHouse.organization} role={academicData.awards.sportsHouse.role} year="2025" onClick={() => {
                  setSelectedAward({
                    category: "Sports House",
                    organization: academicData.awards.sportsHouse.organization,
                    role: academicData.awards.sportsHouse.role
                  });
                  setCertificateOpen(true);
                }} />}

                    {/* Club */}
                    {academicData.awards.club.organization !== "None" && academicData.awards.club.organization && <EnvelopeAwardCard category="Club" categoryColor={{
                  bg: 'rgba(59, 130, 246, 0.15)',
                  text: '#2563eb'
                }} organization={academicData.awards.club.organization} role={academicData.awards.club.role} year="2024" onClick={() => {
                  setSelectedAward({
                    category: "Club",
                    organization: academicData.awards.club.organization,
                    role: academicData.awards.club.role
                  });
                  setCertificateOpen(true);
                }} />}

                    {/* Student Leadership */}
                    {academicData.awards.studentLeadership.organization !== "None" && academicData.awards.studentLeadership.organization && <EnvelopeAwardCard category="Leadership" categoryColor={{
                  bg: 'rgba(168, 85, 247, 0.15)',
                  text: '#9333ea'
                }} organization={academicData.awards.studentLeadership.organization} role={academicData.awards.studentLeadership.role} year="2024" onClick={() => {
                  setSelectedAward({
                    category: "Leadership",
                    organization: academicData.awards.studentLeadership.organization,
                    role: academicData.awards.studentLeadership.role
                  });
                  setCertificateOpen(true);
                }} />}

                    {/* Events */}
                    {academicData.awards.events.organization !== "None" && academicData.awards.events.organization && <EnvelopeAwardCard category="Events" categoryColor={{
                  bg: 'rgba(34, 197, 94, 0.15)',
                  text: '#16a34a'
                }} organization={academicData.awards.events.organization} role={academicData.awards.events.role} year="2023" onClick={() => {
                  setSelectedAward({
                    category: "Events",
                    organization: academicData.awards.events.organization,
                    role: academicData.awards.events.role
                  });
                  setCertificateOpen(true);
                }} />}

                    {/* Achievements */}
                    {academicData.awards.achievements.event !== "None" && academicData.awards.achievements.event && <EnvelopeAwardCard category="Achievement" categoryColor={{
                  bg: 'rgba(236, 72, 153, 0.15)',
                  text: '#db2777'
                }} organization={academicData.awards.achievements.event} role={academicData.awards.achievements.award} year="2023" onClick={() => {
                  setSelectedAward({
                    category: "Achievement",
                    organization: academicData.awards.achievements.event,
                    role: academicData.awards.achievements.award
                  });
                  setCertificateOpen(true);
                }} />}
                  </>}

                {/* Certificate Dialog */}
                {selectedAward && <CertificateDialog open={certificateOpen} onOpenChange={setCertificateOpen} category={selectedAward.category} organization={selectedAward.organization} role={selectedAward.role} studentName={students[0]?.name || "Student Name"} />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </section>}

      {/* Report Card Dialog */}
      <ReportCardDialog open={reportCardDialogOpen} onOpenChange={setReportCardDialogOpen} studentName={students[0]?.name || "Emma Johnson"} studentClass="Year 10 - International" examType={examType === "midYear" ? "Mid-Year Exam" : "Year-End Exam"} year={selectedYear} subjects={academicData.subjects.map(s => ({
      name: s.name,
      score: getScore(s, selectedYear, examType),
      grade: getScore(s, selectedYear, examType) !== null ? getGradeFromScore(getScore(s, selectedYear, examType)!) : "Pending",
      teacherComment: s.teacherComment || "Good progress this term.",
      classStudyRecommendation: (s as any).classStudyRecommendation || "",
      studyRecommendation: (s as any).studyRecommendation || ""
    }))} behavior={academicData.behavior} homeroomComment={academicData.behaviorComments?.homeroomComment || "The student shows good potential and continues to make progress."} attendance={{
      present: attendanceData.currentMonth?.present || 85,
      absent: attendanceData.currentMonth?.absent || 5,
      late: attendanceData.currentMonth?.late || 3,
      excused: 2,
      totalDays: (attendanceData.currentMonth?.present || 85) + (attendanceData.currentMonth?.absent || 5) + 2,
      percentage: Math.round((attendanceData.currentMonth?.present || 85) / ((attendanceData.currentMonth?.present || 85) + (attendanceData.currentMonth?.absent || 5)) * 100)
    }} achievements={academicData.coCurriculum?.map(c => `${c.activity}: ${c.achievement}`) || []} />

      {/* Grade Analysis Section */}
      {mainSection === "analysis" && <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Grade Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Analysis Sub-tabs */}
            <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 mb-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Compare</TabsTrigger>
                <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-4">
                {/* Exam & Subject Filter Section */}
                <div className="space-y-3 pb-2">
                  {/* Exam Selector Row */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">Exam:</span>
                    <div className="flex gap-2 flex-1">
                      <Select value={selectedYear} onValueChange={v => setSelectedYear(v as YearKey)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                          <SelectItem value="2022">2022</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={examType} onValueChange={v => setExamType(v as ExamType)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="midYear">Mid-Year</SelectItem>
                          <SelectItem value="yearEnd">Year-End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Multi-Select Subject Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Subjects:</span>
                      <div className="flex gap-2">
                        <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setGradesSelectedSubjects(academicData.subjects.map(s => s.name))}>
                          Select All
                        </button>
                        <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setGradesSelectedSubjects([])}>
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                      {/* Grouped subject pills with dropdowns */}
                      {subjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={gradesSelectedSubjects} onToggle={subjectName => {
                      if (gradesSelectedSubjects.includes(subjectName)) {
                        setGradesSelectedSubjects(prev => prev.filter(s => s !== subjectName));
                      } else {
                        setGradesSelectedSubjects(prev => [...prev, subjectName]);
                      }
                    }} />)}
                      {/* Subject count badge */}
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {gradesSelectedSubjects.length}/{academicData.subjects.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rising Stars */}
                {risingStars.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{
                    color: '#d97706'
                  }} /> Rising Stars
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {risingStars.map(item => <div key={item.subject.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden animate-glow min-h-[110px]" style={{
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

                {/* At-Risk Subjects */}
                {fallingBehind.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" style={{
                    color: '#dc2626'
                  }} /> At-Risk Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Subjects that need extra attention</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fallingBehind.slice(0, 3).map(item => <div key={item.subject.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden min-h-[110px]" style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #f87171 100%)',
                    borderColor: 'rgba(248, 113, 113, 0.5)'
                  }}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 40%)'
                    }} />
                          {/* Warning pattern background */}
                          <div className="absolute inset-0 pointer-events-none">
                            <AlertTriangle className="absolute top-1 -left-1 w-7 h-7 opacity-20" style={{
                        color: '#dc2626'
                      }} />
                            <AlertTriangle className="absolute bottom-1 -right-1 w-6 h-6 opacity-15" style={{
                        color: '#ef4444'
                      }} />
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{shortenSubjectName(item.subject.name)}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowDown className="h-3 w-3" style={{
                        color: '#dc2626'
                      }} />
                            <span className="text-sm font-bold" style={{
                        color: '#dc2626'
                      }}>-{item.decline}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#fef2f2',
                        color: '#991b1b'
                      }}>
                              {item.prev}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#ef4444',
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
                    const totalSubjects = filteredGradesSubjects.length;
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
                      const percentage = totalSubjects > 0 ? Math.round(g.count / totalSubjects * 100) : 0;
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
                            <span className="text-xl font-bold text-foreground">{g.count}</span>
                            <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                          </div>;
                    });
                  })()}
                  </div>
                </div>

                <SubjectPerformanceChart 
                  data={subjectPerformance.map(s => ({
                    name: shortenSubjectName(s.name),
                    fullName: s.name,
                    score: s.score,
                    goal: s.goal
                  }))}
                  lineColors={lineColors}
                />

                {/* Stats Cards Grid - 6 cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[{
                  icon: BookOpen,
                  label: "Average",
                  value: `${currentAverage}%`,
                  subtext: currentAverage >= 70 ? "Above Average" : currentAverage >= 50 ? "Average" : "Below Average",
                  iconColor: "#3b82f6",
                  bgColor: "rgba(59, 130, 246, 0.08)"
                }, {
                  icon: Award,
                  label: "Best Subject",
                  value: shortenSubjectName(bestSubjectInfo.name),
                  subtext: `${bestSubjectInfo.score}%`,
                  iconColor: "#f59e0b",
                  bgColor: "rgba(245, 158, 11, 0.08)"
                }, {
                  icon: TrendingUp,
                  label: "Improvement",
                  value: improvementStats.text,
                  subtext: improvementStats.points >= 0 ? "Improved" : "Declined",
                  iconColor: improvementStats.points >= 0 ? "#10b981" : "#ef4444",
                  bgColor: improvementStats.points >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
                }, {
                  icon: Calendar,
                  label: "Attendance",
                  value: `${attendanceStats.attendanceRate}%`,
                  subtext: "This Term",
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
                  subtext: `${weakestSubjectInfo.score}%`,
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
                <div className="grid grid-cols-2 gap-3">
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
                        const score = getScore(s, selectedYear, examType);
                        return (
                          <div key={s.name} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]" style={{
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

                  {/* Needs Attention - only subjects below 50% */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} /> Needs Attention
                    </h4>
                    <div className="space-y-2">
                      {[0, 1, 2].map((index) => {
                        const s = needsAttention[index];
                        if (!s) {
                          return <div key={index} className="min-h-[60px]" />;
                        }
                        const score = getScore(s, selectedYear, examType);
                        return (
                          <div key={s.name} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]" style={{
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
                              <span className="text-sm font-medium text-foreground leading-tight">{shortenSubjectName(s.name)}</span>
                              <Badge className="text-xs font-semibold w-fit mt-1 text-white" style={{ backgroundColor: '#f87171' }}>{score}%</Badge>
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

              </TabsContent>

              {/* TRENDS TAB */}
              <TabsContent value="trends" className="space-y-4">
                {/* Current Score Header - Moomoo Style */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 border border-border/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5 truncate">
                        {subjectFilter === "all" ? "Overall Average" : subjectFilter}
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-bold text-foreground">
                          {trendDirection.currentValue ?? currentAverage}%
                        </span>
                        {trendDirection.direction !== "stable" && <span className={`flex items-center text-sm font-semibold ${trendDirection.direction === "up" ? "text-green-500" : "text-red-500"}`}>
                            {trendDirection.direction === "up" ? <TrendingUp className="h-4 w-4 mr-0.5" /> : <TrendingDown className="h-4 w-4 mr-0.5" />}
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
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setTrendsSelectedSubjects(academicData.subjects.map(s => s.name))}>
                        Select All
                      </button>
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setTrendsSelectedSubjects([])}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                    {/* Grouped subject pills with mobile-friendly drawers */}
                    {subjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={trendsSelectedSubjects} onToggle={subjectName => {
                    if (trendsSelectedSubjects.includes(subjectName)) {
                      setTrendsSelectedSubjects(prev => prev.filter(s => s !== subjectName));
                    } else {
                      setTrendsSelectedSubjects(prev => [...prev, subjectName]);
                    }
                  }} />)}
                    {/* Subject count badge */}
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {trendsSelectedSubjects.length}/{academicData.subjects.length}
                    </span>
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
                      {trendsSelectedSubjects.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">Select at least one subject to view the chart.</p>
                        </div>
                      ) : (
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

                              {trendsSelectedSubjects.length === 1 ? (
                                <Area
                                  type="monotone"
                                  dataKey={trendsSelectedSubjects[0]}
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

                              {trendsSelectedSubjects.map((subject, i) => {
                                const stroke = getSubjectStroke(subject, i);
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
                      )}
                    </div>
                  </div>
                  {/* Color Legend for Multiple Lines Mode */}
                  {chartViewMode === "multiple" && trendsSelectedSubjects.length > 1 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 px-1">
                      {trendsSelectedSubjects.map((subject, i) => (
                        <div key={subject} className="flex items-center gap-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getSubjectStroke(subject, i) }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {getTinySubjectCode(subject)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
                      {risingStars.length > 0 ? risingStars.map((item, idx) => <div key={idx} className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/10 h-[72px] flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{item.subject.name}</span>
                            <span className="text-xs font-bold text-green-600 flex-shrink-0">+{item.improvement}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {item.prev}% → {item.current}%
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
                      {fallingBehind.length > 0 ? fallingBehind.map((item, idx) => <div key={idx} className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 h-[72px] flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{item.subject.name}</span>
                            <span className="text-xs font-bold text-red-600 flex-shrink-0">-{item.decline}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {item.prev}% → {item.current}%
                          </p>
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
                    <div className="min-w-[320px]">
                      {/* Header row with periods */}
                      <div className="flex gap-1 mb-1">
                        <div className="w-16 shrink-0" />
                        {heatmapData[0]?.scores.map(s => <div key={s.period} className="flex-1 text-center text-[9px] font-medium text-muted-foreground px-1">
                            {s.period}
                          </div>)}
                      </div>
                      {/* Subject rows */}
                      {(heatmapExpanded ? heatmapData : heatmapData.slice(0, 6)).map(row => <div key={row.subject} className="flex gap-1 mb-1">
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
              </TabsContent>

              {/* COMPARISON TAB */}
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
                    <Select value={compareExamA.year} onValueChange={v => setCompareExamA(prev => ({
                    ...prev,
                    year: v as YearKey
                  }))}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={compareExamA.type} onValueChange={v => setCompareExamA(prev => ({
                    ...prev,
                    type: v as ExamType
                  }))}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="midYear">Mid-Year</SelectItem>
                        <SelectItem value="yearEnd">Year-End</SelectItem>
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
                    <Select value={compareExamB.year} onValueChange={v => setCompareExamB(prev => ({
                    ...prev,
                    year: v as YearKey
                  }))}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={compareExamB.type} onValueChange={v => setCompareExamB(prev => ({
                    ...prev,
                    type: v as ExamType
                  }))}>
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="midYear">Mid-Year</SelectItem>
                        <SelectItem value="yearEnd">Year-End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject Multi-Select - Standardized */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Subjects</span>
                    <div className="flex gap-2">
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setCompareSubjects(academicData.subjects.map(s => s.name))}>
                        Select All
                      </button>
                      <button className="text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setCompareSubjects([academicData.subjects[0].name])}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background items-center">
                    {/* Grouped subject pills with dropdowns */}
                    {subjectGroups.map(group => <SubjectGroupPill key={group.baseName} baseName={group.baseName} shortName={group.shortName} variants={group.variants || []} selectedSubjects={compareSubjects} onToggle={subjectName => {
                    if (compareSubjects.includes(subjectName)) {
                      // Don't allow deselecting all subjects
                      if (compareSubjects.length > 1) {
                        setCompareSubjects(prev => prev.filter(s => s !== subjectName));
                      }
                    } else {
                      setCompareSubjects(prev => [...prev, subjectName]);
                    }
                  }} />)}
                    {/* Subject count badge */}
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {compareSubjects.length}/{academicData.subjects.length}
                    </span>
                  </div>
                </div>

                {/* Report Button for Comparison */}
                <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setComparisonReportDialogOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>

                {/* Comparison Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card border-l-4 border-l-blue-500 border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-xs font-semibold text-blue-600">Exam A</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{getExamLabelForComparison(compareExamA)}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border-l-4 border-l-red-500 border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-xs font-semibold text-red-600">Exam B</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{getExamLabelForComparison(compareExamB)}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                </div>

                {/* Comparison Stats Cards */}
                {(() => {
                  const avgA = Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length);
                  const avgB = Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length);
                  const overallChange = avgA - avgB;
                  const improvedSubjects = comparisonData.filter(d => d.delta > 0);
                  const declinedSubjects = comparisonData.filter(d => d.delta < 0);
                  const bestPerforming = [...comparisonData].sort((a, b) => b.delta - a.delta)[0];
                  
                  return (
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Improved */}
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs">🚀</span>
                          <p className="text-sm font-bold text-emerald-600">{improvedSubjects.length}</p>
                          <p className="text-[9px] text-muted-foreground">Improved</p>
                        </div>
                        <p className="text-[8px] text-emerald-600 truncate">
                          {improvedSubjects.slice(0, 2).map(s => shortenSubjectName(s.name)).join(', ')}
                          {improvedSubjects.length > 2 && ` +${improvedSubjects.length - 2}`}
                        </p>
                      </div>

                      {/* Declined */}
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs">📉</span>
                          <p className="text-sm font-bold text-red-500">{declinedSubjects.length}</p>
                          <p className="text-[9px] text-muted-foreground">Declined</p>
                        </div>
                        <p className="text-[8px] text-red-500 truncate">
                          {declinedSubjects.slice(0, 2).map(s => shortenSubjectName(s.name)).join(', ')}
                          {declinedSubjects.length > 2 && ` +${declinedSubjects.length - 2}`}
                        </p>
                      </div>

                      {/* Best Performing */}
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs">🏆</span>
                          <p className="text-xs font-bold text-amber-600 truncate">{bestPerforming ? shortenSubjectName(bestPerforming.name) : '-'}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground">Best Performing</p>
                        <p className="text-[8px] text-amber-600">
                          {bestPerforming && bestPerforming.delta > 0 ? `+${bestPerforming.delta} marks` : '-'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Top 5 Growth Leaders - Moomoo Style */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Top Growth Subjects</h4>
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
                                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                            fontSize: 9,
                            fill: 'hsl(var(--muted-foreground))'
                          }} interval={0} height={30} />
                              <YAxis hide />
                              <Area type="monotone" dataKey="growth" stroke="hsl(142, 76%, 46%)" strokeWidth={2} fill="url(#growthGradient)" dot={{
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
                    const maxScore = Math.max(item.examA, item.examB, 1);
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
                              <span className="text-[10px] text-muted-foreground w-16 truncate">{getExamLabelForComparison(compareExamB).split(' ')[0]}</span>
                              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{
                              width: `${item.examB / 100 * 100}%`
                            }} />
                                {/* Goal marker line */}
                                <div className="absolute top-0 h-full w-0.5 bg-black" style={{
                              left: `${item.goal}%`
                            }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                  {item.examB}
                                </span>
                              </div>
                            </div>
                            
                            {/* Exam A (Current) - Orange */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 truncate">{getExamLabelForComparison(compareExamA).split(' ')[0]}</span>
                              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{
                              width: `${item.examA / 100 * 100}%`
                            }} />
                                {/* Goal marker line */}
                                <div className="absolute top-0 h-full w-0.5 bg-black" style={{
                              left: `${item.goal}%`
                            }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                  {item.examA}
                                </span>
                              </div>
                            </div>

                            {/* Goal Row - Black */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 truncate font-medium">Goal</span>
                              <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden relative">
                                <div className="h-full bg-black rounded-full transition-all duration-500" style={{
                              width: `${item.goal / 100 * 100}%`
                            }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-foreground">
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
                    const avgDelta = Math.round(comparisonData.reduce((sum, d) => sum + d.delta, 0) / comparisonData.length);
                    if (avgDelta > 0) {
                      return `Overall improvement of +${avgDelta}% from ${getExamLabelForComparison(compareExamB)} to ${getExamLabelForComparison(compareExamA)}. ${improved} subjects improved, ${declined} declined.`;
                    } else if (avgDelta < 0) {
                      return `Overall decline of ${avgDelta}% from ${getExamLabelForComparison(compareExamB)} to ${getExamLabelForComparison(compareExamA)}. Focus on ${comparisonData.filter(d => d.delta < 0).map(d => d.name).join(", ")}.`;
                    }
                    return "Performance remained stable between the two periods.";
                  })()}
                  </p>
                </div>
              </TabsContent>

              {/* GOALS TAB */}
              <TabsContent value="goals" className="space-y-4">
                {/* Goals Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Goal className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">Target Grades</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Year-End 2025 Goals
                  </Badge>
                </div>

                {/* Goals Progress Summary */}
                {(() => {
                const goalsData = academicData.subjects.map(s => {
                  const current = getScore(s, "2025", "midYear") ?? 0;
                  const target = goals[s.name] ?? 80;
                  const progress = Math.min(current / target * 100, 100);
                  const achieved = current >= target;
                  const gap = target - current;
                  return {
                    name: s.name,
                    current,
                    target,
                    progress,
                    achieved,
                    gap
                  };
                });
                const achievedCount = goalsData.filter(g => g.achieved).length;
                const onTrackCount = goalsData.filter(g => !g.achieved && g.gap <= 30).length;
                const needsWorkCount = goalsData.filter(g => !g.achieved && g.gap > 30).length;
                return <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl text-center" style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle2 className="h-5 w-5" style={{
                          color: '#22c55e'
                        }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{achievedCount}</p>
                          <p className="text-xs text-muted-foreground">Achieved</p>
                          <p className="text-[9px] mt-0.5" style={{
                        color: '#16a34a'
                      }}>Met target</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-5 w-5" style={{
                          color: '#3b82f6'
                        }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{onTrackCount}</p>
                          <p className="text-xs text-muted-foreground">On Track</p>
                          <p className="text-[9px] mt-0.5" style={{
                        color: '#2563eb'
                      }}>≤30% to target</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                      border: '1px solid rgba(249, 115, 22, 0.3)'
                    }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="h-5 w-5" style={{
                          color: '#f97316'
                        }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{needsWorkCount}</p>
                          <p className="text-xs text-muted-foreground">Needs Focus</p>
                          <p className="text-[9px] mt-0.5" style={{
                        color: '#ea580c'
                      }}>&gt;30% to target</p>
                        </div>
                      </div>

                      {/* Individual Subject Goals */}
                      <div className="space-y-3">
                        {goalsData.map(item => <div key={item.name} className="p-4 rounded-xl bg-accent/30 border border-border/50 transition-all cursor-pointer active:opacity-70" onClick={() => {
                        if (editingGoal === item.name) {
                          setEditingGoal(null);
                        } else {
                          setEditingGoal(item.name);
                          setTempGoalValue(item.target.toString());
                        }
                      }}>
                            {/* Card Header */}
                            <div className="flex items-center justify-between min-h-[44px]">
                              <div className="flex items-center gap-3">
                                {item.achieved ? <CheckCircle2 className="h-7 w-7" style={{
                            color: '#22c55e'
                          }} /> : item.gap <= 30 ? <Circle className="h-7 w-7 text-chart-2" /> : <Circle className="h-7 w-7 text-chart-4" />}
                                <span className="font-medium text-foreground">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={item.achieved ? "default" : "outline"} className="text-sm px-3 py-1">
                                  {item.target}%
                                </Badge>
                                <Edit2 className={`h-4 w-4 transition-transform ${editingGoal === item.name ? 'rotate-45 text-primary' : 'text-muted-foreground'}`} />
                              </div>
                            </div>

                            {/* Expanded Slider Section */}
                            {editingGoal === item.name && <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Set Target Goal</span>
                                  <span className="text-lg font-bold text-primary">{tempGoalValue}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={tempGoalValue} onChange={e => setTempGoalValue(e.target.value)} className="w-full h-10 appearance-none bg-transparent cursor-pointer touch-pan-x [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-background [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-background" />
                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => setEditingGoal(null)}>
                                    Cancel
                                  </Button>
                                  <Button className="flex-1 h-12 text-base" onClick={() => {
                            const newValue = parseInt(tempGoalValue);
                            if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
                              setGoals(prev => ({
                                ...prev,
                                [item.name]: newValue
                              }));
                            }
                            setEditingGoal(null);
                          }}>
                                    <Check className="h-5 w-5 mr-2" />
                                    Save
                                  </Button>
                                </div>
                              </div>}
                            
                            {/* Progress Bar - Only show when not editing */}
                            {editingGoal !== item.name && <>
                                <div className="relative mt-3 mb-2">
                                  <div className="h-3 bg-transparent border border-border rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{
                              width: `${item.current}%`,
                              backgroundColor: item.achieved ? '#22c55e' : item.gap <= 30 ? '#3b82f6' : '#f87171'
                            }} />
                                  </div>
                                  {/* Target marker */}
                                  <div className="absolute top-0 h-3 w-0.5 bg-foreground/70 rounded" style={{
                            left: `${Math.min(item.target, 100)}%`
                          }} />
                                </div>

                                {/* Score Details */}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Current: <span className="font-medium text-foreground">{item.current}%</span>
                                  </span>
                                  {item.achieved ? <span className="text-chart-1 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Goal Achieved!
                                    </span> : <span className={item.gap <= 30 ? "text-chart-2" : "text-chart-4"}>
                                      {item.gap}% to go
                                    </span>}
                                </div>
                              </>}
                          </div>)}
                      </div>

                      {/* Goal Tips */}
                      <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Tip:</span>{" "}
                          {achievedCount === goalsData.length ? "Amazing! You've achieved all your goals. Consider setting higher targets!" : needsWorkCount > achievedCount ? `Focus on ${goalsData.filter(g => !g.achieved && g.gap > 5).slice(0, 2).map(g => g.name).join(" and ")} to close the gap. Small consistent improvements lead to big results!` : `You're doing great! ${onTrackCount} subjects are almost at target. Keep pushing!`}
                        </p>
                      </div>
                    </>;
              })()}
              </TabsContent>
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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              // Generate CSV data for overview
              const csvRows = [['Subject', 'Score', 'Goal', 'Grade'], ...subjectPerformance.map(sub => [sub.name, sub.score.toString(), sub.goal.toString(), getGradeFromScore(sub.score)])];
              const csvContent = csvRows.map(row => row.join(',')).join('\n');
              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
              });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `overview-report-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              if (overviewReportRef.current) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Academic Overview Report</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; line-height: 1.4; color: #1a1a1a; padding: 10px; }
                              .report-header { display: flex !important; align-items: center !important; gap: 12px !important; margin-bottom: 15px !important; padding-bottom: 10px !important; border-bottom: 2px solid #3b82f6 !important; }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              .stats-grid { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 6px !important; text-align: center !important; }
                              .stat-card { padding: 8px 4px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
                              .subject-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
                              .grade-grid { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 6px !important; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>${overviewReportRef.current.innerHTML}</body>
                        </html>
                      `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }
            }}>
                <Printer className="h-4 w-4" />
                PDF
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
                <img src={schoolLogo} alt="School Logo" style={{
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
                  }}>{currentAverage}%</div>
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
                      {currentAverage >= 80 ? 'Excellent' : currentAverage >= 60 ? 'Above Average' : 'Needs Improvement'}
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
                  }}>{bestSubjectInfo.score}%</div>
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
                      {improvementStats.points > 0 ? 'Improved' : improvementStats.points < 0 ? 'Declined' : 'Stable'}
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
                  }}>{attendanceStats.attendanceRate}%</div>
                    <div style={{
                    fontSize: '10px',
                    color: '#1d4ed8',
                    fontWeight: 600
                  }}>Attendance</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#1d4ed8',
                    marginTop: '2px'
                  }}>This Term</div>
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
                    fontWeight: 600
                  }}>Needs Focus</div>
                    <div style={{
                    fontSize: '8px',
                    color: '#991b1b',
                    marginTop: '2px'
                  }}>{weakestSubjectInfo.score}%</div>
                  </div>
                </div>
              </div>

              {/* Rising Stars & At-Risk Subjects - Side by Side */}
              {(risingStars.length > 0 || fallingBehind.length > 0) && <div style={{
              display: 'grid',
              gridTemplateColumns: risingStars.length > 0 && fallingBehind.length > 0 ? 'repeat(2, 1fr)' : '1fr',
              gap: '12px',
              marginBottom: '12px',
              pageBreakInside: 'avoid'
            }}>
                  {/* Rising Stars */}
                  {risingStars.length > 0 && <div style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
                border: '1px solid #fde047'
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
                        {risingStars.slice(0, 3).map(item => <div key={item.subject.name} style={{
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
                  
                  {/* At-Risk Subjects */}
                  {fallingBehind.length > 0 && <div style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid #fca5a5'
              }}>
                      <h4 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#dc2626',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                        ⚠️ At-Risk Subjects
                      </h4>
                      <p style={{
                  fontSize: '8px',
                  color: '#b91c1c',
                  marginBottom: '8px'
                }}>Needs extra attention</p>
                      <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                        {fallingBehind.slice(0, 3).map(item => <div key={item.subject.name} style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                    border: '1px solid rgba(252, 165, 165, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                            <div style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#991b1b'
                    }}>{shortenSubjectName(item.subject.name)}</div>
                            <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                              <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#dc2626'
                      }}>-{item.decline}%</div>
                              <div style={{
                        fontSize: '7px',
                        color: '#b91c1c'
                      }}>{item.prev}%→{item.current}%</div>
                            </div>
                          </div>)}
                      </div>
                    </div>}
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
                  {subjectPerformance.map((sub, idx) => <div key={sub.name} style={{
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
                      <div key={sub.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  }}>{g.count}</div>
                    </div>)}
                </div>
              </div>

              {/* Top & Needs Attention */}
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
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac'
              }}>
                  <h4 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#16a34a',
                  marginBottom: '6px'
                }}>Top Subjects</h4>
                  {top3.map((s, i) => <div key={s.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  fontSize: '9px',
                  borderBottom: '1px solid #86efac40'
                }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{
                    fontWeight: 600
                  }}>{getScore(s, selectedYear, examType)}%</span>
                    </div>)}
                </div>
                <div style={{
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5'
              }}>
                  <h4 style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#dc2626',
                  marginBottom: '6px'
                }}>Needs Attention</h4>
                  {needsAttention.length > 0 ? needsAttention.map((s, i) => <div key={s.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  fontSize: '9px',
                  borderBottom: '1px solid #fca5a540'
                }}>
                      <span>{i + 1}. {s.name}</span>
                      <span style={{
                    fontWeight: 600
                  }}>{getScore(s, selectedYear, examType)}%</span>
                    </div>) : <p style={{
                  fontSize: '9px',
                  color: '#666'
                }}>All subjects passing!</p>}
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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              // Generate CSV data for trends
              const csvRows = [['Period', ...academicData.subjects.map(s => s.name)], ...trendData.map(row => [row.period as string, ...academicData.subjects.map(s => {
                const value = row[s.name];
                return value !== null && value !== undefined ? value.toString() : '';
              })])];
              const csvContent = csvRows.map(row => row.join(',')).join('\n');
              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
              });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `trends-report-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              if (trendsReportRef.current) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Performance Trends Report</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; line-height: 1.4; color: #1a1a1a; padding: 10px; }
                              .report-header { display: flex !important; align-items: center !important; gap: 12px !important; margin-bottom: 15px !important; padding-bottom: 10px !important; border-bottom: 2px solid #22c55e !important; }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
                              th, td { padding: 5px 8px !important; border-bottom: 1px solid #ddd !important; }
                              th { background: #f5f5f5 !important; font-weight: 600 !important; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>${trendsReportRef.current.innerHTML}</body>
                        </html>
                      `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }
            }}>
                <Printer className="h-4 w-4" />
                PDF
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
                <img src={schoolLogo} alt="School Logo" style={{
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
                    {' • '}Period: {trendPeriod === '1year' ? 'Last 1 Year' : trendPeriod === '2years' ? 'Last 2 Years' : trendPeriod === '3years' ? 'Last 3 Years' : 'All Years'}
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
                  }}>{currentAverage}%</div>
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
                  marginBottom: '6px'
                }}>Rising Subjects Details</h4>
                  {risingStars.length > 0 ? risingStars.map((item, i) => <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  fontSize: '9px',
                  borderBottom: '1px solid #86efac40'
                }}>
                      <span>{item.subject.name}</span>
                      <span style={{
                    fontWeight: 600,
                    color: '#22c55e'
                  }}>+{item.improvement}% ({item.prev}% → {item.current}%)</span>
                    </div>) : <p style={{
                  fontSize: '9px',
                  color: '#666'
                }}>No improving subjects</p>}
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
                  marginBottom: '6px'
                }}>Needs Focus Details</h4>
                  {fallingBehind.length > 0 ? fallingBehind.map((item, i) => <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  fontSize: '9px',
                  borderBottom: '1px solid #fca5a540'
                }}>
                      <span>{item.subject.name}</span>
                      <span style={{
                    fontWeight: 600,
                    color: '#ef4444'
                  }}>-{item.decline}% ({item.prev}% → {item.current}%)</span>
                    </div>) : <p style={{
                  fontSize: '9px',
                  color: '#666'
                }}>All subjects stable</p>}
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

              {/* Strengths Profile + Subject vs Class Average - Side by Side */}
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

                {/* Subject vs Class Average - Horizontal Bar Chart Style */}
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
                }}>Your Score vs Class Average</h3>
                  <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                    {subjectVsClassData.slice(0, 6).map((item, i) => {
                    const subjectTinyColors: Record<string, string> = {
                      "Eng": "hsl(var(--chart-3))",
                      "Math": "hsl(var(--chart-2))",
                      "Sci": "hsl(var(--chart-1))",
                      "Phy": "hsl(var(--chart-4))",
                      "Chem": "hsl(var(--chart-5))",
                      "Bio": "hsl(var(--chart-3))",
                      "Hist": "hsl(var(--chart-4))",
                      "Geo": "hsl(var(--chart-2))",
                      "Art": "hsl(var(--chart-5))",
                      "ICT": "hsl(var(--chart-1))",
                      "Islam": "hsl(var(--chart-3))",
                      "Add M": "hsl(var(--chart-2))"
                    };
                    const fallbackColors = [
                      "hsl(var(--chart-1))",
                      "hsl(var(--chart-2))",
                      "hsl(var(--chart-3))",
                      "hsl(var(--chart-4))",
                      "hsl(var(--chart-5))"
                    ];
                    const barColor = subjectTinyColors[item.name] || fallbackColors[i % fallbackColors.length];
                    return <div key={item.name} style={{
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
                      <span>Class Avg</span>
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
                    {trendData.map((item, idx) => <tr key={idx} style={{
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
                      {heatmapData[0]?.scores.map(s => <th key={s.period} style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'center',
                      minWidth: '40px'
                    }}>{s.period}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, idx) => <tr key={row.subject} style={{
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                        <td style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      fontWeight: 500
                    }}>{row.fullName}</td>
                        {row.scores.map((cell, cellIdx) => <td key={cellIdx} style={{
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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              // Generate CSV data for comparison
              const examALabel = getExamLabelForComparison(compareExamA);
              const examBLabel = getExamLabelForComparison(compareExamB);
              const csvRows = [['Subject', examALabel, examBLabel, 'Change'], ...comparisonData.map(d => [d.name, d.examA.toString(), d.examB.toString(), (d.delta >= 0 ? '+' : '') + d.delta.toString()])];
              const csvContent = csvRows.map(row => row.join(',')).join('\n');
              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
              });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `comparison-report-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              if (comparisonReportRef.current) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Exam Comparison Report</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; }
                              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; line-height: 1.4; color: #1a1a1a; padding: 10px; }
                              .report-header { display: flex !important; align-items: center !important; gap: 12px !important; margin-bottom: 15px !important; padding-bottom: 10px !important; border-bottom: 2px solid #8b5cf6 !important; }
                              .school-logo { width: 40px !important; height: 40px !important; object-fit: contain !important; }
                              .section { margin-bottom: 12px; page-break-inside: avoid; }
                              table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
                              th, td { padding: 5px 8px !important; border-bottom: 1px solid #ddd !important; }
                              th { background: #f5f5f5 !important; font-weight: 600 !important; }
                              .footer { text-align: center !important; font-size: 8px !important; color: #666 !important; margin-top: 15px !important; padding-top: 8px !important; border-top: 1px solid #ddd !important; }
                              @media print { body { padding: 0 !important; margin: 0 !important; } .no-print { display: none !important; } }
                            </style>
                          </head>
                          <body>${comparisonReportRef.current.innerHTML}</body>
                        </html>
                      `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }
            }}>
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto" ref={comparisonReportRef}>
            {(() => {
            const examALabel = getExamLabelForComparison(compareExamA);
            const examBLabel = getExamLabelForComparison(compareExamB);
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
                    <img src={schoolLogo} alt="School Logo" style={{
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
                        {comparisonData.map((item, idx) => <tr key={item.name} style={{
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