import { useState, useMemo, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData, classAverages, students, attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp, TrendingDown, Check, ArrowUp, ArrowDown, Minus, BarChart3, GitCompare, Target, AlertTriangle, Star, Goal, CheckCircle2, Circle, Edit2, ChevronDown, MessageSquare, Calendar, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import schoolLogo from "@/assets/school-badge.png";
import { CertificateDialog } from "@/components/CertificateDialog";
import { EnvelopeAwardCard } from "@/components/EnvelopeAwardCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ReferenceLine,
  ReferenceDot,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

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

// Helper to shorten long subject names
const shortenSubjectName = (name: string): string => {
  const abbreviations: Record<string, string> = {
    "Mathematics": "Math",
    "Physical Education": "PE",
    "Social Studies": "Social St.",
    "Information Technology": "IT",
    "Computer Science": "Comp Sci",
  };
  return abbreviations[name] || name;
};

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState("grades");
  const [examType, setExamType] = useState<ExamType>("midYear");
  const [selectedYear, setSelectedYear] = useState<YearKey>("2025");
  const [selectedYears, setSelectedYears] = useState<string[]>(["2025"]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "all">("all");
  
  // Grades tab filters - exam selector and multi-select subjects
  const [gradesSelectedSubjects, setGradesSelectedSubjects] = useState<string[]>(
    academicData.subjects.map(s => s.name)
  );
  const [reportGenerated, setReportGenerated] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Pinch-to-zoom state for chart
  const [chartZoom, setChartZoom] = useState(1);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
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
  
  // Grade Analysis sub-tabs
  const [analysisTab, setAnalysisTab] = useState("overview");
  
  // Comparison state
  const [compareExamA, setCompareExamA] = useState({ year: "2025" as YearKey, type: "midYear" as ExamType });
  
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
  const [compareExamB, setCompareExamB] = useState({ year: "2024" as YearKey, type: "yearEnd" as ExamType });
  const [compareSubjects, setCompareSubjects] = useState<string[]>(academicData.subjects.map(s => s.name));

  // Certificate dialog state
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<{
    category: string;
    organization: string;
    role: string;
  } | null>(null);

  const isActivitiesTab = activeTab === "cocurriculum";

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const gradeColors: Record<string, string> = {
    "A*": "bg-chart-1 text-card",
    A: "bg-chart-1 text-card",
    B: "bg-chart-2 text-card",
    C: "bg-chart-4 text-card",
    D: "bg-chart-5 text-card",
    E: "bg-destructive text-destructive-foreground",
  };

  // Background colors for subject cards (using direct color values)
  const gradeCardBgStyles: Record<string, { bg: string; border: string }> = {
    "A*": { bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.3)' },
    A: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' },
    B: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)' },
    C: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' },
    D: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
    E: { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.3)' },
  };

  // Pill colors for grades
  const gradePillStyles: Record<string, { bg: string; text: string }> = {
    "A*": { bg: '#059669', text: '#ffffff' },
    A: { bg: '#22c55e', text: '#ffffff' },
    B: { bg: '#eab308', text: '#ffffff' },
    C: { bg: '#f97316', text: '#ffffff' },
    D: { bg: '#ef4444', text: '#ffffff' },
    E: { bg: '#dc2626', text: '#ffffff' },
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
    setReportGenerated(true);
  };

  const getExamLabel = () => {
    const examLabel = examType === "midYear" ? "Mid-Year" : "Year-End";
    return `${examLabel} ${selectedYear}`;
  };

  // Calculate averages
  const currentAverage = useMemo(() => {
    const scores = academicData.subjects.map(s => getScore(s, selectedYear, examType)).filter(s => s !== null) as number[];
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [selectedYear, examType]);

  // Calculate category averages for selected year
  const categoryAverages = useMemo(() => {
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    return categories.map(cat => {
      const scores = academicData.subjects.map(s => getCategoryScore(s, selectedYear, cat)).filter(s => s !== null) as number[];
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        classAverage: classAverages[selectedYear]?.[cat] ?? 0
      };
    });
  }, [selectedYear]);

  // Subject performance data for bar chart (sorted best to worst)
  const subjectPerformance = useMemo(() => {
    return academicData.subjects
      .map(s => ({
        name: s.name,
        score: getScore(s, selectedYear, examType) ?? 0,
        classAvg: classAverages[selectedYear]?.[examType] ?? 0,
        goal: goals[s.name] ?? 80
      }))
      .sort((a, b) => b.score - a.score);
  }, [selectedYear, examType, goals]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const grades = { "A*": 0, "A": 0, "B": 0, "C": 0, "D": 0, "E": 0 };
    academicData.subjects.forEach(s => {
      const score = getScore(s, selectedYear, examType);
      if (score !== null) {
        const grade = getGradeFromScore(score);
        grades[grade as keyof typeof grades]++;
      }
    });
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }, [selectedYear, examType]);

  // Top 3 and Bottom 3 subjects (bottom only includes scores below 50%)
  const { top3, needsAttention } = useMemo(() => {
    const sorted = [...academicData.subjects].sort((a, b) => {
      const scoreA = getScore(a, selectedYear, examType) ?? 0;
      const scoreB = getScore(b, selectedYear, examType) ?? 0;
      return scoreB - scoreA;
    });
    // Filter subjects below 50% and take lowest 3
    const below50 = sorted
      .filter((s) => (getScore(s, selectedYear, examType) ?? 0) < 50)
      .reverse()
      .slice(0, 3);
    return {
      top3: sorted.slice(0, 3),
      needsAttention: below50
    };
  }, [selectedYear, examType]);

  // Calculate attendance rate from all months
  const attendanceStats = useMemo(() => {
    const totalAttendance = attendanceData.monthly.reduce(
      (acc, month) => ({
        present: acc.present + month.present,
        absent: acc.absent + month.absent,
        late: acc.late + month.late,
        excused: acc.excused + month.excused,
      }),
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
    const totalDays = totalAttendance.present + totalAttendance.absent + totalAttendance.late + totalAttendance.excused;
    const attendanceRate = totalDays > 0 ? Math.round((totalAttendance.present / totalDays) * 100) : 0;
    return { attendanceRate };
  }, []);

  // Calculate subjects passing (score >= 50)
  const passingStats = useMemo(() => {
    const passingSubjects = academicData.subjects.filter(s => (getScore(s, selectedYear, examType) ?? 0) >= 50);
    const passingCount = passingSubjects.length;
    const totalSubjects = academicData.subjects.length;
    const passingPercentage = Math.round((passingCount / totalSubjects) * 100);
    return { passingCount, totalSubjects, passingPercentage };
  }, [selectedYear, examType]);

  // Find weakest subject
  const weakestSubjectInfo = useMemo(() => {
    const weakest = academicData.subjects.reduce((worst, s) => {
      const currentScore = getScore(s, selectedYear, examType) ?? 100;
      const worstScore = getScore(worst, selectedYear, examType) ?? 100;
      return currentScore < worstScore ? s : worst;
    });
    const weakestScore = getScore(weakest, selectedYear, examType) ?? 0;
    return { name: weakest.name, score: weakestScore };
  }, [selectedYear, examType]);

  // Best subject info
  const bestSubjectInfo = useMemo(() => {
    const best = academicData.subjects.reduce((bestSub, s) => {
      const currentScore = getScore(s, selectedYear, examType) ?? 0;
      const bestScore = getScore(bestSub, selectedYear, examType) ?? 0;
      return currentScore > bestScore ? s : bestSub;
    });
    const bestScore = getScore(best, selectedYear, examType) ?? 0;
    return { name: best.name, score: bestScore };
  }, [selectedYear, examType]);

  // Improvement from previous exam
  const improvementStats = useMemo(() => {
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    
    if (examType === "midYear") {
      if (selectedYear === "2025") { prevYear = "2024"; prevType = "yearEnd"; }
      else if (selectedYear === "2024") { prevYear = "2023"; prevType = "yearEnd"; }
      else if (selectedYear === "2023") { prevYear = "2022"; prevType = "yearEnd"; }
      else { return { points: 0, text: "N/A" }; }
    } else {
      prevType = "midYear";
    }

    const currentScores = academicData.subjects.map(s => getScore(s, selectedYear, examType)).filter(s => s !== null) as number[];
    const prevScores = academicData.subjects.map(s => getScore(s, prevYear, prevType)).filter(s => s !== null) as number[];
    
    if (currentScores.length === 0 || prevScores.length === 0) return { points: 0, text: "N/A" };
    
    const currentAvg = Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length);
    const prevAvg = Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length);
    const points = currentAvg - prevAvg;
    
    return { points, text: points >= 0 ? `+${points}%` : `${points}%` };
  }, [selectedYear, examType]);


  const risingStars = useMemo(() => {
    // Determine previous exam period
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    
    if (examType === "midYear") {
      // Previous is last year's year-end
      if (selectedYear === "2025") { prevYear = "2024"; prevType = "yearEnd"; }
      else if (selectedYear === "2024") { prevYear = "2023"; prevType = "yearEnd"; }
      else { return []; } // No previous for 2023 mid
    } else {
      // Previous is same year's mid-year
      prevType = "midYear";
    }

    const improvements = academicData.subjects.map(s => {
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
  }, [selectedYear, examType]);

  // Falling behind - subjects with biggest decline from previous exam
  const fallingBehind = useMemo(() => {
    let prevYear: YearKey = selectedYear;
    let prevType: ExamType = examType;
    
    if (examType === "midYear") {
      if (selectedYear === "2025") { prevYear = "2024"; prevType = "yearEnd"; }
      else if (selectedYear === "2024") { prevYear = "2023"; prevType = "yearEnd"; }
      else { return []; }
    } else {
      prevType = "midYear";
    }

    const declines = academicData.subjects.map(s => {
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
  }, [selectedYear, examType]);

  // Year-over-year trend data with period filtering (3 years of data)
  const trendData = useMemo(() => {
    const years: YearKey[] = ["2022", "2023", "2024", "2025"];
    const periods: { year: YearKey; type: ExamType; label: string }[] = [];
    years.forEach(year => {
      periods.push({ year, type: "midYear", label: `Mid ${year}` });
      if (year !== "2025") { // 2025 year-end is null
        periods.push({ year, type: "yearEnd", label: `End ${year}` });
      }
    });
    
    // Filter based on trendPeriod
    let filteredPeriods = periods;
    if (trendPeriod === "1year") {
      filteredPeriods = periods.slice(-2); // Last 2 periods (current year)
    } else if (trendPeriod === "2years") {
      filteredPeriods = periods.slice(-4); // Last 4 periods
    } else if (trendPeriod === "3years") {
      filteredPeriods = periods.slice(-6); // Last 6 periods
    }
    // "all" shows all periods
    
    return filteredPeriods.map(p => {
      const result: Record<string, number | string | null> = { period: p.label };
      academicData.subjects.forEach(s => {
        result[s.name] = getScore(s, p.year, p.type);
      });
      // Overall average
      const scores = academicData.subjects.map(s => getScore(s, p.year, p.type)).filter(s => s !== null) as number[];
      result["Average"] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return result;
    });
  }, [trendPeriod]);

  // Calculate trend direction for selected subject(s)
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return { direction: "stable" as const, change: 0 };
    
    const key = subjectFilter === "all" ? "Average" : subjectFilter;
    const firstValue = trendData[0]?.[key] as number | null;
    const lastValue = trendData[trendData.length - 1]?.[key] as number | null;
    
    if (firstValue === null || lastValue === null) return { direction: "stable" as const, change: 0 };
    
    const change = lastValue - firstValue;
    return {
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "stable" as const,
      change: Math.abs(change),
      currentValue: lastValue
    };
  }, [trendData, subjectFilter]);

  // Calculate goal reference line value for trends chart
  const trendGoalValue = useMemo(() => {
    if (subjectFilter === "all") {
      // Average of all goals
      const goalValues = Object.values(goals);
      return goalValues.length > 0 ? Math.round(goalValues.reduce((a, b) => a + b, 0) / goalValues.length) : 80;
    }
    return goals[subjectFilter] ?? 80;
  }, [subjectFilter, goals]);

  // Category trend data
  const categoryTrendData = useMemo(() => {
    const years: YearKey[] = ["2023", "2024", "2025"];
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    
    return years.map(year => {
      const result: Record<string, number | string> = { year };
      categories.forEach(cat => {
        const scores = academicData.subjects.map(s => getCategoryScore(s, year, cat)).filter(s => s !== null) as number[];
        result[cat.charAt(0).toUpperCase() + cat.slice(1)] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      });
      return result;
    });
  }, []);

  // Radar chart data for subject strengths profile
  const radarData = useMemo(() => {
    return academicData.subjects.map(s => ({
      subject: shortenSubjectName(s.name),
      score: getScore(s, selectedYear, examType) ?? 0,
      fullMark: 100
    }));
  }, [selectedYear, examType]);

  // Subject vs Class Average data - now uses per-subject class averages
  const subjectVsClassData = useMemo(() => {
    const yearData = classAverages[selectedYear];
    const subjectAverages = yearData?.bySubject as Record<string, number> | undefined;
    const fallbackAvg = yearData?.[examType] ?? 75;
    
    return academicData.subjects
      .map(s => {
        const studentScore = getScore(s, selectedYear, examType) ?? 0;
        const classAvg = subjectAverages?.[s.name] ?? fallbackAvg;
        return {
          name: shortenSubjectName(s.name),
          fullName: s.name,
          student: studentScore,
          classAvg: classAvg,
          delta: studentScore - classAvg
        };
      })
      .sort((a, b) => b.delta - a.delta);
  }, [selectedYear, examType]);

  // Average score for radar color coding
  const radarAverage = useMemo(() => {
    const scores = radarData.map(d => d.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [radarData]);

  // Performance Heatmap data - subjects x exam periods
  const heatmapData = useMemo(() => {
    const periods = [
      { year: "2023" as YearKey, type: "midYear" as ExamType, label: "Mid '23" },
      { year: "2023" as YearKey, type: "yearEnd" as ExamType, label: "End '23" },
      { year: "2024" as YearKey, type: "midYear" as ExamType, label: "Mid '24" },
      { year: "2024" as YearKey, type: "yearEnd" as ExamType, label: "End '24" },
      { year: "2025" as YearKey, type: "midYear" as ExamType, label: "Mid '25" },
    ];
    
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
    return academicData.subjects
      .filter(s => compareSubjects.includes(s.name))
      .map(s => {
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

  const getExamLabelForComparison = (exam: { year: YearKey; type: ExamType }) => {
    return `${exam.type === "midYear" ? "Mid-Year" : "Year-End"} ${exam.year}`;
  };

  // Distinct colors for subjects
  const lineColors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  
  // Grade-specific colors for distribution chart
  const gradeChartColors: Record<string, string> = {
    "A*": "#059669", // dark green
    "A": "#16a34a",  // green
    "B": "#22c55e",  // light green
    "C": "#eab308",  // yellow
    "D": "#f97316",  // orange
    "E": "#ef4444",  // red
  };

  const filteredSubjects = subjectFilter === "all" 
    ? academicData.subjects 
    : academicData.subjects.filter(s => s.name === subjectFilter);

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>
        }
        rightContent={
          <Select defaultValue={students[0]?.id}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Report Card Section */}
      <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Year Selection for Activities Tab Only */}
            {isActivitiesTab && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {(["2025", "2024", "2023"] as const).map((year) => (
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
            )}

            {/* Tabs for Grades/Behavior/Activities */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="cocurriculum">Awards</TabsTrigger>
              </TabsList>

              <TabsContent value="grades" className="mt-4">
                <div className="space-y-3">
                  {/* Sort subjects by score (highest to lowest), then group into rows of 2 */}
                  {(() => {
                    const filteredSubjects = academicData.subjects.filter(s => 
                      gradesSelectedSubjects.includes(s.name)
                    );
                    const sortedSubjects = [...filteredSubjects].sort((a, b) => {
                      const scoreA = getScore(a, selectedYear, examType) ?? 0;
                      const scoreB = getScore(b, selectedYear, examType) ?? 0;
                      return scoreB - scoreA;
                    });
                    
                    return Array.from({ length: Math.ceil(sortedSubjects.length / 2) }, (_, rowIndex) => {
                      const rowSubjects = sortedSubjects.slice(rowIndex * 2, rowIndex * 2 + 2);
                      const expandedInRow = rowSubjects.find(s => s.name === expandedSubject);
                    
                    return (
                      <div key={rowIndex} className="space-y-3">
                        {/* Subject Cards Row */}
                        <div className="grid grid-cols-2 gap-3">
                          {rowSubjects.map((subject, index) => {
                            const score = getScore(subject, selectedYear, examType);
                            const isPending = score === null || score === undefined;
                            const isExpanded = expandedSubject === subject.name;
                            const gradeKey = isPending ? 'C' : getGradeFromScore(score!)[0];
                            const cardStyle = gradeCardBgStyles[gradeKey] || gradeCardBgStyles.C;
                            
                            return (
                              <div
                                key={index}
                                onClick={() => setExpandedSubject(isExpanded ? null : subject.name)}
                                className={`
                                  flex flex-col p-4 rounded-xl cursor-pointer border
                                  transition-all duration-200 ease-out min-h-[80px]
                                  hover:shadow-md
                                  ${isExpanded ? 'ring-2 ring-primary/40 shadow-md' : ''}
                                `}
                                style={{
                                  backgroundColor: cardStyle.bg,
                                  borderColor: cardStyle.border
                                }}
                              >
                                <h3 className="font-medium text-foreground text-sm leading-tight mb-2">{subject.name}</h3>
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg font-semibold text-foreground">
                                      {isPending ? "Pending" : `${score}%`}
                                    </p>
                                    {!isPending && (
                                      <span 
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: (gradePillStyles[getGradeFromScore(score!)[0]] || gradePillStyles.C).bg,
                                          color: (gradePillStyles[getGradeFromScore(score!)[0]] || gradePillStyles.C).text
                                        }}
                                      >
                                        {getGradeFromScore(score!)}
                                      </span>
                                    )}
                                  </div>
                                  <ChevronDown 
                                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Expanded Comment Box - Full Width */}
                        {expandedInRow && (
                          <div className="animate-fade-in">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 relative mt-1">
                              {/* Arrow pointer - clean triangle without bottom line */}
                              <div 
                                className="absolute -top-[10px] w-5 h-[10px] overflow-hidden"
                                style={{
                                  left: expandedInRow === rowSubjects[0] ? 'calc(25% - 10px)' : 'calc(75% - 10px)'
                                }}
                              >
                                <div 
                                  className="w-[14px] h-[14px] rotate-45 bg-primary/5 border-l border-t border-primary/20"
                                  style={{ 
                                    position: 'absolute',
                                    top: '5px',
                                    left: '3px'
                                  }}
                                />
                              </div>
                              
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
                            </div>
                          </div>
                        )}
                      </div>
                    );
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
                      A: { label: "Excellent", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", watermark: "text-emerald-200" },
                      B: { label: "Good", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", watermark: "text-blue-200" },
                      C: { label: "Average", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", watermark: "text-amber-200" },
                      D: { label: "Needs Work", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", watermark: "text-orange-200" },
                      E: { label: "Poor", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", watermark: "text-red-200" }
                    };
                    const config = gradeConfig[item.grade as keyof typeof gradeConfig] || gradeConfig.C;
                    
                    // Smart description based on grade
                    const getSmartDescription = (category: string, grade: string) => {
                      const descriptions: Record<string, Record<string, string>> = {
                        Attendance: { A: "Excellent attendance record", B: "Good attendance", C: "Some absences noted", D: "Frequent absences", E: "Poor attendance" },
                        Punctuality: { A: "Always on time", B: "Usually punctual", C: "Occasionally late", D: "Frequently late", E: "Chronically late" },
                        Cooperation: { A: "Works excellently with others", B: "Cooperates well", C: "Cooperates when prompted", D: "Struggles to cooperate", E: "Needs improvement" },
                        "Self Control": { A: "Excellent self-discipline", B: "Good self-control", C: "Sometimes impulsive", D: "Needs guidance", E: "Lacks self-control" },
                        Responsibility: { A: "Highly responsible", B: "Generally responsible", C: "Moderately responsible", D: "Needs reminders", E: "Irresponsible" },
                        Initiative: { A: "Takes excellent initiative", B: "Shows good initiative", C: "Some initiative shown", D: "Rarely takes initiative", E: "Lacks initiative" },
                        Leadership: { A: "Strong leader", B: "Good leadership skills", C: "Developing leadership", D: "Emerging leader", E: "Needs leadership development" }
                      };
                      return descriptions[category]?.[grade] || "No description available";
                    };
                    
                    return (
                      <Card key={index} className={`${config.bg} ${config.border} overflow-hidden relative`}>
                        {/* Oversized watermark grade letter */}
                        <div className={`absolute -right-1 -bottom-3 text-[4.5rem] font-black leading-none ${config.watermark} select-none pointer-events-none`}>
                          {item.grade}
                        </div>
                        <CardContent className="p-3 relative z-10">
                          <span className={`text-xs font-semibold uppercase ${config.text}`}>{item.category}</span>
                          <p className="text-xs text-muted-foreground mt-2">{getSmartDescription(item.category, item.grade)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Comments Section */}
                {academicData.behaviorComments && (
                  <div className="space-y-3">
                    <Card className="bg-rose-50 border-rose-200">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold uppercase text-rose-700 mb-2">Homeroom Teacher Comment</p>
                        <p className="text-sm text-muted-foreground">{academicData.behaviorComments.homeroomComment}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold uppercase text-purple-700 mb-2">Responsibility Comment</p>
                        <p className="text-sm text-muted-foreground">{academicData.behaviorComments.responsibilityComment}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cocurriculum" className="mt-4 space-y-3">
                {/* Awards displayed as trophy-style cards with category tags */}
                {academicData.awards && (
                  <>
                    {/* Sports House */}
                    {academicData.awards.sportsHouse.organization !== "None" && academicData.awards.sportsHouse.organization && (
                      <EnvelopeAwardCard
                        category="Sports House"
                        categoryColor={{ bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' }}
                        organization={academicData.awards.sportsHouse.organization}
                        role={academicData.awards.sportsHouse.role}
                        year="2025"
                        onClick={() => {
                          setSelectedAward({
                            category: "Sports House",
                            organization: academicData.awards.sportsHouse.organization,
                            role: academicData.awards.sportsHouse.role
                          });
                          setCertificateOpen(true);
                        }}
                      />
                    )}

                    {/* Club */}
                    {academicData.awards.club.organization !== "None" && academicData.awards.club.organization && (
                      <EnvelopeAwardCard
                        category="Club"
                        categoryColor={{ bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' }}
                        organization={academicData.awards.club.organization}
                        role={academicData.awards.club.role}
                        year="2024"
                        onClick={() => {
                          setSelectedAward({
                            category: "Club",
                            organization: academicData.awards.club.organization,
                            role: academicData.awards.club.role
                          });
                          setCertificateOpen(true);
                        }}
                      />
                    )}

                    {/* Student Leadership */}
                    {academicData.awards.studentLeadership.organization !== "None" && academicData.awards.studentLeadership.organization && (
                      <EnvelopeAwardCard
                        category="Leadership"
                        categoryColor={{ bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea' }}
                        organization={academicData.awards.studentLeadership.organization}
                        role={academicData.awards.studentLeadership.role}
                        year="2024"
                        onClick={() => {
                          setSelectedAward({
                            category: "Leadership",
                            organization: academicData.awards.studentLeadership.organization,
                            role: academicData.awards.studentLeadership.role
                          });
                          setCertificateOpen(true);
                        }}
                      />
                    )}

                    {/* Events */}
                    {academicData.awards.events.organization !== "None" && academicData.awards.events.organization && (
                      <EnvelopeAwardCard
                        category="Events"
                        categoryColor={{ bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a' }}
                        organization={academicData.awards.events.organization}
                        role={academicData.awards.events.role}
                        year="2023"
                        onClick={() => {
                          setSelectedAward({
                            category: "Events",
                            organization: academicData.awards.events.organization,
                            role: academicData.awards.events.role
                          });
                          setCertificateOpen(true);
                        }}
                      />
                    )}

                    {/* Achievements */}
                    {academicData.awards.achievements.event !== "None" && academicData.awards.achievements.event && (
                      <EnvelopeAwardCard
                        category="Achievement"
                        categoryColor={{ bg: 'rgba(236, 72, 153, 0.15)', text: '#db2777' }}
                        organization={academicData.awards.achievements.event}
                        role={academicData.awards.achievements.award}
                        year="2023"
                        onClick={() => {
                          setSelectedAward({
                            category: "Achievement",
                            organization: academicData.awards.achievements.event,
                            role: academicData.awards.achievements.award
                          });
                          setCertificateOpen(true);
                        }}
                      />
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
                    studentName={students[0]?.name || "Student Name"}
                  />
                )}
              </TabsContent>
            </Tabs>

            {/* Download Button */}
            <Button className="w-full gap-2" onClick={generateReport}>
              <Download className="h-4 w-4" />
              Download Report Card
            </Button>

            {reportGenerated && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-foreground">Report Card for {getExamLabel()} downloaded!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Grade Analysis Section */}
      <section className="px-4 pb-4">
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
                      <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v as YearKey)}>
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
                      <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
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
                      <span className="text-sm font-medium text-muted-foreground">Subjects:</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-sm font-medium"
                          onClick={() => setGradesSelectedSubjects(academicData.subjects.map(s => s.name))}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-sm font-medium"
                          onClick={() => setGradesSelectedSubjects([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {academicData.subjects.map((subject) => {
                        const isSelected = gradesSelectedSubjects.includes(subject.name);
                        return (
                          <Badge
                            key={subject.name}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer text-sm px-3 py-1.5 rounded-full transition-colors ${
                              isSelected 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "hover:bg-accent"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setGradesSelectedSubjects(prev => prev.filter(s => s !== subject.name));
                              } else {
                                setGradesSelectedSubjects(prev => [...prev, subject.name]);
                              }
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            {shortenSubjectName(subject.name)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rising Stars */}
                {risingStars.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{ color: '#d97706' }} /> Rising Stars
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {risingStars.map((item) => (
                        <div 
                          key={item.subject.name} 
                          className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden animate-glow"
                          style={{ 
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)', 
                            borderColor: 'rgba(251, 191, 36, 0.5)'
                          }}
                        >
                          {/* Inner shine effect */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 40%)',
                            }}
                          />
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
                            <ArrowUp className="h-3 w-3" style={{ color: '#d97706' }} />
                            <span className="text-sm font-bold" style={{ color: '#d97706' }}>+{item.improvement}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span 
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                            >
                              {item.prev}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span 
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                            >
                              {item.current}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject Performance Bar Chart with Goal Dot Markers */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Subject Performance
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: "hsl(var(--foreground))" }}
                      />
                      Goal
                    </Badge>
                  </h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={70} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value: number, name: string) => [
                            `${value}%`, 
                            name === "score" ? "Score" : name === "goal" ? "Goal" : name
                          ]}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {subjectPerformance.map((entry, index) => (
                            <Cell key={index} fill={lineColors[index % lineColors.length]} />
                          ))}
                        </Bar>

                        {subjectPerformance.map((entry) => (
                          <ReferenceDot
                            key={`goal-${entry.name}`}
                            x={entry.goal}
                            y={entry.name}
                            r={4}
                            fill="hsl(var(--foreground))"
                            stroke="hsl(var(--background))"
                            strokeWidth={1}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats Cards Grid - 6 cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { 
                      icon: BookOpen, 
                      label: "Average", 
                      value: `${currentAverage}%`,
                      subtext: currentAverage >= 70 ? "Above Average" : currentAverage >= 50 ? "Average" : "Below Average",
                      iconColor: "#3b82f6",
                      bgColor: "rgba(59, 130, 246, 0.08)"
                    },
                    { 
                      icon: Award, 
                      label: "Best Subject", 
                      value: shortenSubjectName(bestSubjectInfo.name),
                      subtext: `${bestSubjectInfo.score}%`,
                      iconColor: "#f59e0b",
                      bgColor: "rgba(245, 158, 11, 0.08)"
                    },
                    { 
                      icon: TrendingUp, 
                      label: "Improvement", 
                      value: improvementStats.text,
                      subtext: improvementStats.points >= 0 ? "Improved" : "Declined",
                      iconColor: improvementStats.points >= 0 ? "#10b981" : "#ef4444",
                      bgColor: improvementStats.points >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
                    },
                    { 
                      icon: Calendar, 
                      label: "Attendance", 
                      value: `${attendanceStats.attendanceRate}%`,
                      subtext: "This Term",
                      iconColor: "#8b5cf6",
                      bgColor: "rgba(139, 92, 246, 0.08)"
                    },
                    { 
                      icon: Target, 
                      label: "Passing", 
                      value: `${passingStats.passingCount}/${passingStats.totalSubjects}`,
                      subtext: `${passingStats.passingPercentage}%`,
                      iconColor: "#06b6d4",
                      bgColor: "rgba(6, 182, 212, 0.08)"
                    },
                    { 
                      icon: AlertTriangle, 
                      label: "Needs Focus", 
                      value: shortenSubjectName(weakestSubjectInfo.name),
                      subtext: `${weakestSubjectInfo.score}%`,
                      iconColor: "#ef4444",
                      bgColor: "rgba(239, 68, 68, 0.08)"
                    },
                  ].map((stat, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center p-3 rounded-xl border"
                      style={{ backgroundColor: stat.bgColor, borderColor: 'transparent' }}
                    >
                      <stat.icon className="h-5 w-5 mb-1" style={{ color: stat.iconColor }} />
                      <span className="text-lg font-bold text-foreground">{stat.value}</span>
                      <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                      <span className="text-[9px] text-muted-foreground/70">{stat.subtext}</span>
                    </div>
                  ))}
                </div>

                {/* Top 3 Performers & Bottom 3 to Focus */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Top 3 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Trophy className="h-4 w-4" style={{ color: '#22c55e' }} /> Top Performers
                    </h4>
                    <div className="space-y-2">
                      {top3.map((s, index) => {
                        const score = getScore(s, selectedYear, examType);
                        return (
                          <div key={s.name} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                            <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }}>
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
                  {needsAttention.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} /> Needs Attention
                      </h4>
                      <div className="space-y-2">
                        {needsAttention.map((s, index) => {
                          const score = getScore(s, selectedYear, examType);
                          return (
                            <div key={s.name} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]" style={{ backgroundColor: 'rgba(254, 202, 202, 0.3)', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                              <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(254, 202, 202, 0.5)', color: '#dc2626' }}>
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
                  )}
                </div>

                {/* Grade Distribution Cards */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Grade Distribution</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {(() => {
                      const totalSubjects = academicData.subjects.length;
                      const gradeCardColors: Record<string, { bg: string; text: string }> = {
                        "A*": { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
                        "A": { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
                        "B": { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
                        "C": { bg: 'rgba(234, 179, 8, 0.12)', text: '#ca8a04' },
                        "D": { bg: 'rgba(249, 115, 22, 0.12)', text: '#ea580c' },
                        "E": { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626' },
                      };
                      return gradeDistribution.map((g) => {
                        const percentage = totalSubjects > 0 ? Math.round((g.count / totalSubjects) * 100) : 0;
                        const colors = gradeCardColors[g.grade] || { bg: 'rgba(156, 163, 175, 0.12)', text: '#6b7280' };
                        return (
                          <div 
                            key={g.grade}
                            className="flex flex-col items-center text-center p-2 rounded-lg"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <span className="text-xs font-semibold" style={{ color: colors.text }}>{g.grade}</span>
                            <span className="text-xl font-bold text-foreground">{g.count}</span>
                            <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
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
                        {trendDirection.direction !== "stable" && (
                          <span className={`flex items-center text-sm font-semibold ${
                            trendDirection.direction === "up" ? "text-green-500" : "text-red-500"
                          }`}>
                            {trendDirection.direction === "up" ? (
                              <TrendingUp className="h-4 w-4 mr-0.5" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-0.5" />
                            )}
                            {trendDirection.direction === "up" ? "+" : "-"}{trendDirection.change}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Period Toggle */}
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                    {([
                      { key: "1year", label: "1Y" },
                      { key: "2years", label: "2Y" },
                      { key: "3years", label: "3Y" },
                      { key: "all", label: "All" }
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setTrendPeriod(key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                          trendPeriod === key
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Badge 
                    variant={subjectFilter === "all" ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setSubjectFilter("all")}
                  >
                    All Subjects
                  </Badge>
                  {academicData.subjects.map((subject) => (
                    <Badge
                      key={subject.name}
                      variant={subjectFilter === subject.name ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap"
                      onClick={() => setSubjectFilter(subject.name)}
                    >
                      {subject.name}
                    </Badge>
                  ))}
                </div>

                {/* Moomoo-Style Gradient Area Chart - Scrollable with Pinch-to-Zoom */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">← Swipe • Pinch to zoom →</p>
                    <div className="flex items-center gap-2">
                      {chartZoom !== 1 && (
                        <button 
                          onClick={resetZoom}
                          className="text-[10px] text-primary underline"
                        >
                          Reset zoom
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {chartZoom !== 1 ? `${Math.round(chartZoom * 100)}%` : `${trendData.length} periods`}
                      </p>
                    </div>
                  </div>
                  <div 
                    ref={chartContainerRef}
                    className="h-64 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                    style={{
                      WebkitOverflowScrolling: 'touch',
                      scrollBehavior: 'smooth',
                      touchAction: 'pan-x pinch-zoom',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div style={{ 
                      width: Math.max(100, (trendData.length / 4) * 100 * chartZoom) + '%', 
                      minWidth: '100%', 
                      height: '100%',
                      transition: 'width 0.1s ease-out'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
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
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="hsl(var(--border))" 
                            strokeOpacity={0.2}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="period" 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            height={40}
                            tick={({ x, y, payload }) => {
                              const parts = payload.value.split(' ');
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text 
                                    x={0} 
                                    y={0} 
                                    dy={12} 
                                    textAnchor="middle" 
                                    fontSize={10}
                                    fill="hsl(var(--muted-foreground))"
                                  >
                                    {parts[0]}
                                  </text>
                                  <text 
                                    x={0} 
                                    y={0} 
                                    dy={24} 
                                    textAnchor="middle" 
                                    fontSize={9}
                                    fill="hsl(var(--muted-foreground))"
                                    opacity={0.7}
                                  >
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
                          <ReferenceLine 
                            y={50} 
                            stroke="#f59e0b" 
                            strokeDasharray="5 5" 
                            strokeOpacity={0.6}
                            label={{ value: "Pass", fontSize: 9, fill: "#f59e0b" }}
                          />
                          <ReferenceLine 
                            y={80} 
                            stroke="#22c55e" 
                            strokeDasharray="5 5" 
                            strokeOpacity={0.6}
                            label={{ value: "A", fontSize: 9, fill: "#22c55e" }}
                          />
                          <ReferenceLine 
                            y={trendGoalValue} 
                            stroke="hsl(var(--foreground))" 
                            strokeDasharray="4 4" 
                            strokeWidth={2}
                            label={(labelProps: any) => {
                              const vb = labelProps?.viewBox;
                              if (!vb) return null;
                              const text = "Goal";
                              const fontSize = 9;
                              const x = (vb.x ?? 0) + 6;
                              const y = vb.y ?? 0;
                              const textWidth = text.length * (fontSize * 0.6);
                              const padX = 4;
                              const rectW = textWidth + padX * 2;
                              const rectH = fontSize + 4;
                              const rectX = x - padX;
                              const rectY = y - rectH / 2;

                              return (
                                <g>
                                  <rect
                                    x={rectX}
                                    y={rectY}
                                    width={rectW}
                                    height={rectH}
                                    rx={3}
                                    fill="hsl(var(--card))"
                                  />
                                  <text
                                    x={x}
                                    y={y}
                                    fontSize={fontSize}
                                    fill="hsl(var(--foreground))"
                                    dominantBaseline="middle"
                                  >
                                    {text}
                                  </text>
                                </g>
                              );
                            }}
                          />
                          {subjectFilter === "all" ? (
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
                          ) : (
                            <Area
                              type="monotone"
                              dataKey={subjectFilter}
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
                      {risingStars.length > 0 ? risingStars.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.subject.name}</span>
                            <span className="text-xs font-bold text-green-600">+{item.improvement}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.prev}% → {item.current}%
                          </p>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground p-2">No improving subjects</p>
                      )}
                    </div>
                  </div>

                  {/* Falling Behind */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Needs Focus
                    </h4>
                    <div className="space-y-2">
                      {fallingBehind.length > 0 ? fallingBehind.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.subject.name}</span>
                            <span className="text-xs font-bold text-red-600">-{item.decline}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.prev}% → {item.current}%
                          </p>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground p-2">All subjects stable!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Trend Insights */}
                <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Insight:</span>{" "}
                    {risingStars.length > 0 && (
                      <>{risingStars[0].subject.name} shows great improvement (+{risingStars[0].improvement}%). </>
                    )}
                    {fallingBehind.length > 0 && (
                      <>Focus more on {fallingBehind[0].subject.name} which dropped {fallingBehind[0].decline}%. </>
                    )}
                    {risingStars.length === 0 && fallingBehind.length === 0 && (
                      <>Performance is stable across all subjects.</>
                    )}
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
                  <p className="text-[10px] text-muted-foreground text-center">
                    Visual snapshot of performance across all subjects
                  </p>
                </div>

                {/* Subject vs Class Average Horizontal Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <GitCompare className="h-4 w-4 text-primary" />
                    vs Class Average
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectVsClassData} layout="vertical" barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} horizontal={false} />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                          width={60}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))", 
                            borderRadius: "8px" 
                          }}
                          formatter={(value: number, name: string) => [
                            `${value}%`, 
                            name === "student" ? "Your Score" : "Class Average"
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: 10 }} 
                          formatter={(value) => value === "student" ? "Your Score" : "Class Avg"}
                        />
                        <Bar dataKey="student" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="classAvg" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={10} opacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Delta badges */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {subjectVsClassData.slice(0, 4).map((item) => (
                      <Badge 
                        key={item.name} 
                        variant={item.delta >= 0 ? "default" : "destructive"}
                        className={`text-[10px] px-2 py-0.5 ${item.delta >= 0 ? "bg-[#3b82f6] hover:bg-[#3b82f6]/90" : ""}`}
                      >
                        {item.name}: {item.delta >= 0 ? "+" : ""}{item.delta}%
                      </Badge>
                    ))}
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
                    <div className="min-w-[320px]">
                      {/* Header row with periods */}
                      <div className="flex gap-1 mb-1">
                        <div className="w-16 shrink-0" />
                        {heatmapData[0]?.scores.map((s) => (
                          <div 
                            key={s.period} 
                            className="flex-1 text-center text-[9px] font-medium text-muted-foreground px-1"
                          >
                            {s.period}
                          </div>
                        ))}
                      </div>
                      {/* Subject rows */}
                      {heatmapData.map((row) => (
                        <div key={row.subject} className="flex gap-1 mb-1">
                          <div className="w-16 shrink-0 text-[10px] font-medium text-foreground truncate pr-1 flex items-center">
                            {row.subject}
                          </div>
                          {row.scores.map((cell, idx) => (
                            <div
                              key={idx}
                              className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-semibold text-white transition-all hover:scale-105 cursor-default"
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
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-[9px] text-muted-foreground mr-1">Low</span>
                    {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"].map((color, i) => (
                      <div 
                        key={i} 
                        className="w-4 h-3 rounded-sm" 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-1">High</span>
                  </div>
                </div>
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
                    <Select 
                      value={compareExamA.year} 
                      onValueChange={(v) => setCompareExamA(prev => ({ ...prev, year: v as YearKey }))}
                    >
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={compareExamA.type} 
                      onValueChange={(v) => setCompareExamA(prev => ({ ...prev, type: v as ExamType }))}
                    >
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
                    <Select 
                      value={compareExamB.year} 
                      onValueChange={(v) => setCompareExamB(prev => ({ ...prev, year: v as YearKey }))}
                    >
                      <SelectTrigger className="w-full h-9 text-sm bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={compareExamB.type} 
                      onValueChange={(v) => setCompareExamB(prev => ({ ...prev, type: v as ExamType }))}
                    >
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

                {/* Subject Multi-Select */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Subjects</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[38px]">
                    {academicData.subjects.map(s => {
                      const isSelected = compareSubjects.includes(s.name);
                      return (
                        <Badge
                          key={s.name}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-colors ${
                            isSelected 
                              ? "bg-primary text-primary-foreground hover:bg-primary/80" 
                              : "hover:bg-accent"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              // Don't allow deselecting all subjects
                              if (compareSubjects.length > 1) {
                                setCompareSubjects(prev => prev.filter(name => name !== s.name));
                              }
                            } else {
                              setCompareSubjects(prev => [...prev, s.name]);
                            }
                          }}
                        >
                          {shortenSubjectName(s.name)}
                          {isSelected && <Check className="h-3 w-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setCompareSubjects(academicData.subjects.map(s => s.name))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setCompareSubjects([academicData.subjects[0].name])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Comparison Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/30">
                    <p className="text-xs text-muted-foreground mb-1">{getExamLabelForComparison(compareExamA)}</p>
                    <p className="text-xl font-bold text-foreground">
                      {Math.round(comparisonData.reduce((sum, d) => sum + d.examA, 0) / comparisonData.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                  <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/30">
                    <p className="text-xs text-muted-foreground mb-1">{getExamLabelForComparison(compareExamB)}</p>
                    <p className="text-xl font-bold text-foreground">
                      {Math.round(comparisonData.reduce((sum, d) => sum + d.examB, 0) / comparisonData.length)}%
                    </p>
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
                    const top5Growth = [...comparisonData]
                      .sort((a, b) => b.delta - a.delta)
                      .slice(0, 5)
                      .filter(item => item.delta > 0);
                    
                    if (top5Growth.length === 0) {
                      return (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No subjects showed improvement in this period
                        </div>
                      );
                    }
                    
                    const maxDelta = Math.max(...top5Growth.map(t => t.delta));
                    
                    return (
                      <div className="space-y-3">
                        {/* Mini Area Chart */}
                        <div className="h-32 -mx-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                              data={top5Growth.map(item => ({
                                name: shortenSubjectName(item.name),
                                growth: item.delta,
                                percentChange: item.examB > 0 ? ((item.delta / item.examB) * 100) : 0,
                                from: item.examB,
                                to: item.examA
                              }))}
                              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="name" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                                interval={0}
                                height={30}
                              />
                              <YAxis hide />
                              <Area
                                type="monotone"
                                dataKey="growth"
                                stroke="hsl(142, 76%, 46%)"
                                strokeWidth={2}
                                fill="url(#growthGradient)"
                                dot={{ r: 4, fill: "hsl(142, 76%, 46%)", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                                activeDot={{ r: 6, fill: "hsl(142, 76%, 46%)", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-popover border border-border rounded-lg shadow-lg p-2">
                                        <p className="text-xs font-medium text-foreground">{data.name}</p>
                                        <p className="text-xs text-emerald-500 font-bold">+{data.growth} pts</p>
                                        <p className="text-[10px] text-muted-foreground">{data.from} → {data.to}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Top 5 Rankings */}
                        <div className="space-y-2">
                          {top5Growth.map((item, index) => {
                            const percentChange = item.examB > 0 ? ((item.delta / item.examB) * 100).toFixed(1) : '0.0';
                            const barWidth = (item.delta / maxDelta) * 100;
                            
                            return (
                              <div key={item.name} className="flex items-center gap-2">
                                {/* Rank Badge */}
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                                  index === 1 ? 'bg-gray-400/20 text-gray-500' :
                                  index === 2 ? 'bg-amber-600/20 text-amber-600' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                
                                {/* Subject Name */}
                                <span className="text-xs font-medium text-foreground w-16 truncate">
                                  {shortenSubjectName(item.name)}
                                </span>
                                
                                {/* Growth Bar */}
                                <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden relative">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                
                                {/* Growth Stats */}
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
                    );
                  })()}
                </div>

                {/* Subject Comparison - Moomoo Style */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div className="space-y-3">
                    {comparisonData.map((item) => {
                      const maxScore = Math.max(item.examA, item.examB, 1);
                      const percentChange = item.examB > 0 ? ((item.delta / item.examB) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={item.name} className="p-3 rounded-xl bg-accent/30 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{shortenSubjectName(item.name)}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={item.delta > 0 ? "default" : item.delta < 0 ? "destructive" : "secondary"}
                                className={`text-xs px-2 py-0.5 ${
                                  item.delta > 0 
                                    ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" 
                                    : item.delta < 0 
                                    ? "bg-red-500/20 text-red-600 border-red-500/30" 
                                    : ""
                                }`}
                              >
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
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(item.examB / 100) * 100}%` }}
                                />
                                {/* Goal marker line */}
                                <div 
                                  className="absolute top-0 h-full w-0.5 bg-black"
                                  style={{ left: `${item.goal}%` }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                  {item.examB}
                                </span>
                              </div>
                            </div>
                            
                            {/* Exam A (Current) - Orange */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 truncate">{getExamLabelForComparison(compareExamA).split(' ')[0]}</span>
                              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                                <div 
                                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(item.examA / 100) * 100}%` }}
                                />
                                {/* Goal marker line */}
                                <div 
                                  className="absolute top-0 h-full w-0.5 bg-black"
                                  style={{ left: `${item.goal}%` }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                                  {item.examA}
                                </span>
                              </div>
                            </div>

                            {/* Goal Row - Black */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 truncate font-medium">Goal</span>
                              <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden relative">
                                <div 
                                  className="h-full bg-black rounded-full transition-all duration-500"
                                  style={{ width: `${(item.goal / 100) * 100}%` }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-foreground">
                                  {item.goal}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Delta Line */}
                          {item.delta !== 0 && (
                            <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Change</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-bold ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {item.examB} → {item.examA}
                                </span>
                                <span className={`text-[10px] ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  ({item.delta > 0 ? "↑" : "↓"} {Math.abs(item.delta)} points)
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
                    const progress = Math.min((current / target) * 100, 100);
                    const achieved = current >= target;
                    const gap = target - current;
                    return { name: s.name, current, target, progress, achieved, gap };
                  });
                  const achievedCount = goalsData.filter(g => g.achieved).length;
                  const onTrackCount = goalsData.filter(g => !g.achieved && g.gap <= 30).length;
                  const needsWorkCount = goalsData.filter(g => !g.achieved && g.gap > 30).length;

                  return (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle2 className="h-5 w-5" style={{ color: '#22c55e' }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{achievedCount}</p>
                          <p className="text-xs text-muted-foreground">Achieved</p>
                          <p className="text-[9px] mt-0.5" style={{ color: '#16a34a' }}>Met target</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-5 w-5" style={{ color: '#3b82f6' }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{onTrackCount}</p>
                          <p className="text-xs text-muted-foreground">On Track</p>
                          <p className="text-[9px] mt-0.5" style={{ color: '#2563eb' }}>≤30% to target</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="h-5 w-5" style={{ color: '#f97316' }} />
                          </div>
                          <p className="text-xl font-bold text-foreground">{needsWorkCount}</p>
                          <p className="text-xs text-muted-foreground">Needs Focus</p>
                          <p className="text-[9px] mt-0.5" style={{ color: '#ea580c' }}>&gt;30% to target</p>
                        </div>
                      </div>

                      {/* Individual Subject Goals */}
                      <div className="space-y-3">
                        {goalsData.map((item) => (
                          <div 
                            key={item.name} 
                            className="p-4 rounded-xl bg-accent/30 border border-border/50 transition-all"
                          >
                            {/* Card Header - Tappable */}
                            <div 
                              className="flex items-center justify-between cursor-pointer active:opacity-70 min-h-[44px]"
                              onClick={() => {
                                if (editingGoal === item.name) {
                                  setEditingGoal(null);
                                } else {
                                  setEditingGoal(item.name);
                                  setTempGoalValue(item.target.toString());
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {item.achieved ? (
                                  <CheckCircle2 className="h-5 w-5" style={{ color: '#22c55e' }} />
                                ) : item.gap <= 30 ? (
                                  <Circle className="h-5 w-5 text-chart-2" />
                                ) : (
                                  <Circle className="h-5 w-5 text-chart-4" />
                                )}
                                <span className="font-medium text-foreground">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={item.achieved ? "default" : "outline"} 
                                  className="text-sm px-3 py-1"
                                >
                                  {item.target}%
                                </Badge>
                                <Edit2 className={`h-4 w-4 transition-transform ${editingGoal === item.name ? 'rotate-45 text-primary' : 'text-muted-foreground'}`} />
                              </div>
                            </div>

                            {/* Expanded Slider Section */}
                            {editingGoal === item.name && (
                              <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Set Target Goal</span>
                                  <span className="text-lg font-bold text-primary">{tempGoalValue}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tempGoalValue}
                                  onChange={(e) => setTempGoalValue(e.target.value)}
                                  className="w-full h-10 appearance-none bg-transparent cursor-pointer touch-pan-x [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-background [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-background"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1 h-12 text-base"
                                    onClick={() => setEditingGoal(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="flex-1 h-12 text-base"
                                    onClick={() => {
                                      const newValue = parseInt(tempGoalValue);
                                      if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
                                        setGoals(prev => ({ ...prev, [item.name]: newValue }));
                                      }
                                      setEditingGoal(null);
                                    }}
                                  >
                                    <Check className="h-5 w-5 mr-2" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Progress Bar - Only show when not editing */}
                            {editingGoal !== item.name && (
                              <>
                                <div className="relative mt-3 mb-2">
                                  <div className="h-3 bg-transparent border border-border rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all"
                                      style={{ 
                                        width: `${item.current}%`,
                                        backgroundColor: item.achieved 
                                          ? '#22c55e' 
                                          : item.gap <= 30 
                                            ? '#3b82f6' 
                                            : '#f87171'
                                      }}
                                    />
                                  </div>
                                  {/* Target marker */}
                                  <div 
                                    className="absolute top-0 h-3 w-0.5 bg-foreground/70 rounded"
                                    style={{ left: `${Math.min(item.target, 100)}%` }}
                                  />
                                </div>

                                {/* Score Details */}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Current: <span className="font-medium text-foreground">{item.current}%</span>
                                  </span>
                                  {item.achieved ? (
                                    <span className="text-chart-1 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Goal Achieved!
                                    </span>
                                  ) : (
                                    <span className={item.gap <= 30 ? "text-chart-2" : "text-chart-4"}>
                                      {item.gap}% to go
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Goal Tips */}
                      <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Tip:</span>{" "}
                          {achievedCount === goalsData.length ? (
                            "Amazing! You've achieved all your goals. Consider setting higher targets!"
                          ) : needsWorkCount > achievedCount ? (
                            `Focus on ${goalsData.filter(g => !g.achieved && g.gap > 5).slice(0, 2).map(g => g.name).join(" and ")} to close the gap. Small consistent improvements lead to big results!`
                          ) : (
                            `You're doing great! ${onTrackCount} subjects are almost at target. Keep pushing!`
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>

            <Button className="w-full mt-4 gap-2">
              <FileText className="h-4 w-4" />
              Generate Grade Analysis Report
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}