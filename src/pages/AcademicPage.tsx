import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData, classAverages, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp, TrendingDown, Check, ArrowUp, ArrowDown, Minus, BarChart3, GitCompare, Target, AlertTriangle, Star, Goal, CheckCircle2, Circle, Edit2, ChevronDown, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import schoolLogo from "@/assets/school-badge.png";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

type YearKey = "2023" | "2024" | "2025";
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
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "all">("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
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

  const isActivitiesTab = activeTab === "cocurriculum";

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const gradeColors: Record<string, string> = {
    A: "bg-chart-1 text-card",
    B: "bg-chart-2 text-card",
    C: "bg-chart-4 text-card",
    D: "bg-chart-5 text-card",
  };

  // Background colors for subject cards (using direct color values)
  const gradeCardBgStyles: Record<string, { bg: string; border: string }> = {
    A: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' },
    B: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)' },
    C: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' },
    D: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
  };

  // Pill colors for grades
  const gradePillStyles: Record<string, { bg: string; text: string }> = {
    A: { bg: '#22c55e', text: '#ffffff' },
    B: { bg: '#eab308', text: '#ffffff' },
    C: { bg: '#f97316', text: '#ffffff' },
    D: { bg: '#ef4444', text: '#ffffff' },
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
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
        classAvg: classAverages[selectedYear]?.[examType] ?? 0
      }))
      .sort((a, b) => b.score - a.score);
  }, [selectedYear, examType]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const grades = { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0 };
    academicData.subjects.forEach(s => {
      const score = getScore(s, selectedYear, examType);
      if (score !== null) {
        const grade = getGradeFromScore(score);
        grades[grade as keyof typeof grades]++;
      }
    });
    return Object.entries(grades).map(([grade, count]) => ({ grade, count })).filter(g => g.count > 0);
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

  // Rising stars - subjects with biggest improvement from previous exam
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

  // Year-over-year trend data with period filtering
  const trendData = useMemo(() => {
    const years: YearKey[] = ["2023", "2024", "2025"];
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
    }
    
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

  // Subject vs Class Average data
  const subjectVsClassData = useMemo(() => {
    const classAvg = classAverages[selectedYear]?.[examType] ?? 75;
    return academicData.subjects
      .map(s => {
        const studentScore = getScore(s, selectedYear, examType) ?? 0;
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

  // Comparison data
  const comparisonData = useMemo(() => {
    return academicData.subjects.map(s => {
      const scoreA = getScore(s, compareExamA.year, compareExamA.type) ?? 0;
      const scoreB = getScore(s, compareExamB.year, compareExamB.type) ?? 0;
      const delta = scoreA - scoreB;
      return {
        name: s.name,
        examA: scoreA,
        examB: scoreB,
        delta,
        improved: delta > 0
      };
    });
  }, [compareExamA, compareExamB]);

  // Category comparison
  const categoryComparison = useMemo(() => {
    const categories = ["attitude", "homework", "quiz", "exam"] as const;
    return categories.map(cat => {
      const scoresA = academicData.subjects.map(s => getCategoryScore(s, compareExamA.year, cat)).filter(s => s !== null) as number[];
      const scoresB = academicData.subjects.map(s => getCategoryScore(s, compareExamB.year, cat)).filter(s => s !== null) as number[];
      const avgA = scoresA.length > 0 ? Math.round(scoresA.reduce((a, b) => a + b, 0) / scoresA.length) : 0;
      const avgB = scoresB.length > 0 ? Math.round(scoresB.reduce((a, b) => a + b, 0) / scoresB.length) : 0;
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        examA: avgA,
        examB: avgB,
        delta: avgA - avgB
      };
    });
  }, [compareExamA, compareExamB]);

  const getExamLabelForComparison = (exam: { year: YearKey; type: ExamType }) => {
    return `${exam.type === "midYear" ? "Mid-Year" : "Year-End"} ${exam.year}`;
  };

  // Distinct colors for subjects
  const lineColors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  
  // Grade-specific colors for distribution chart
  const gradeChartColors: Record<string, string> = {
    "A+": "#16a34a", // green
    "A": "#22c55e",  // green
    "B": "#84cc16",  // light green
    "C": "#eab308",  // yellow
    "D": "#ef4444",  // red
  };

  const filteredSubjects = subjectFilter === "all" 
    ? academicData.subjects 
    : academicData.subjects.filter(s => s.name === subjectFilter);

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
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
            {/* Exam Selection Row */}
            <div className="flex gap-3">
              {!isActivitiesTab && (
                <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Exam Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="midYear">Mid-Year Exam</SelectItem>
                    <SelectItem value="yearEnd">Year-End Exam</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {isActivitiesTab ? (
                <div className="flex-1 flex gap-2">
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
              ) : (
                <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v as YearKey)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Period Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {isActivitiesTab ? (
                <Badge variant="secondary" className="text-xs">
                  Viewing: {selectedYears.sort().reverse().join(", ")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Viewing: {getExamLabel()}
                </Badge>
              )}
            </div>

            {/* Tabs for Grades/Behavior/Activities */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="cocurriculum">Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="grades" className="mt-4">
                <div className="space-y-3">
                  {/* Sort subjects by score (highest to lowest), then group into rows of 2 */}
                  {(() => {
                    const sortedSubjects = [...academicData.subjects].sort((a, b) => {
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

              <TabsContent value="behavior" className="mt-4 space-y-3">
                {academicData.behavior.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50">
                    <div>
                      <h3 className="font-medium text-foreground">{item.category}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge className={gradeColors[item.grade]}>Grade {item.grade}</Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="cocurriculum" className="mt-4 space-y-3">
                {academicData.coCurriculum.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg bg-accent/30 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{item.activity}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3" />
                          {item.achievement}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                {/* Subject Performance Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={70} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value: number) => [`${value}%`, "Score"]}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {subjectPerformance.map((entry, index) => (
                            <Cell key={index} fill={lineColors[index % lineColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                          className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden"
                          style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                        >
                          {/* Star pattern background */}
                          <div className="absolute inset-0 pointer-events-none">
                            <svg className="absolute -top-1 -left-1 w-8 h-8 opacity-30" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute top-0 right-0 w-6 h-6 opacity-25" fill="none" stroke="#fbbf24" strokeWidth="1" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute -bottom-2 -right-1 w-7 h-7 opacity-35" fill="none" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg className="absolute bottom-2 left-0 w-5 h-5 opacity-20" fill="none" stroke="#fcd34d" strokeWidth="1" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{shortenSubjectName(item.subject.name)}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowUp className="h-3 w-3" style={{ color: '#d97706' }} />
                            <span className="text-sm font-bold" style={{ color: '#d97706' }}>+{item.improvement}%</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground relative z-10">{item.prev}% → {item.current}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Distribution Pie + Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Grade Distribution</h4>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution}
                            dataKey="count"
                            nameKey="grade"
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={2}
                          >
                            {gradeDistribution.map((entry) => (
                              <Cell key={entry.grade} fill={gradeChartColors[entry.grade] || pieColors[0]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {gradeDistribution.map((g) => (
                        <Badge key={g.grade} variant="outline" className="text-[10px] px-1.5 py-0">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gradeChartColors[g.grade] || pieColors[0] }} />
                          {g.grade}: {g.count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-2">
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                      <BookOpen className="h-5 w-5 mb-1 text-chart-1" />
                      <span className="text-lg font-bold text-foreground">{currentAverage}%</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">Current Average</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                      <TrendingUp className="h-5 w-5 mb-1 text-chart-3" />
                      <span className="text-lg font-bold text-foreground">
                        {currentAverage - (classAverages[selectedYear]?.[examType] ?? 0) >= 0 ? "+" : ""}
                        {currentAverage - (classAverages[selectedYear]?.[examType] ?? 0)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">vs Class Avg</span>
                    </div>
                  </div>
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
                        className="text-[10px] px-2 py-0.5"
                      >
                        {item.name}: {item.delta >= 0 ? "+" : ""}{item.delta}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* TRENDS TAB */}
              <TabsContent value="trends" className="space-y-4">
                {/* Current Score Header - Moomoo Style */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {subjectFilter === "all" ? "Overall Average" : subjectFilter}
                    </p>
                    <div className="flex items-baseline gap-2">
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
                  {/* Period Toggle */}
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {([
                      { key: "1year", label: "1Y" },
                      { key: "2years", label: "2Y" },
                      { key: "all", label: "All" }
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setTrendPeriod(key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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

                {/* Moomoo-Style Gradient Area Chart */}
                <div className="space-y-2">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
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
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[50, 100]}
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
                          y={75} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="5 5" 
                          strokeOpacity={0.5}
                          label={{ value: "Target", fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
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
              </TabsContent>

              {/* COMPARISON TAB */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Exam Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Exam A</label>
                    <Select 
                      value={compareExamA.year} 
                      onValueChange={(v) => setCompareExamA(prev => ({ ...prev, year: v as YearKey }))}
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
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
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="midYear">Mid-Year</SelectItem>
                        <SelectItem value="yearEnd">Year-End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Exam B</label>
                    <Select 
                      value={compareExamB.year} 
                      onValueChange={(v) => setCompareExamB(prev => ({ ...prev, year: v as YearKey }))}
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
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
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="midYear">Mid-Year</SelectItem>
                        <SelectItem value="yearEnd">Year-End</SelectItem>
                      </SelectContent>
                    </Select>
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

                {/* Subject-wise Comparison */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Comparison</h4>
                  <div className="space-y-2">
                    {comparisonData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{item.examB}%</span>
                          <span className="text-sm font-medium">→</span>
                          <span className="text-xs text-foreground">{item.examA}%</span>
                          <Badge 
                            variant={item.delta > 0 ? "default" : item.delta < 0 ? "destructive" : "secondary"}
                            className="text-xs px-1.5 py-0"
                          >
                            {item.delta > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : item.delta < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                            {Math.abs(item.delta)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Comparison Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Category Comparison</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="examA" name={getExamLabelForComparison(compareExamA)} fill="hsl(var(--chart-1))" />
                        <Bar dataKey="examB" name={getExamLabelForComparison(compareExamB)} fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
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
                  const onTrackCount = goalsData.filter(g => !g.achieved && g.gap <= 5).length;
                  const needsWorkCount = goalsData.filter(g => !g.achieved && g.gap > 5).length;

                  return (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/30 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-chart-1" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{achievedCount}</p>
                          <p className="text-[10px] text-muted-foreground">Achieved</p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/30 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-4 w-4 text-chart-2" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{onTrackCount}</p>
                          <p className="text-[10px] text-muted-foreground">On Track</p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/30 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="h-4 w-4 text-chart-4" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{needsWorkCount}</p>
                          <p className="text-[10px] text-muted-foreground">Needs Focus</p>
                        </div>
                      </div>

                      {/* Individual Subject Goals */}
                      <div className="space-y-3">
                        {goalsData.map((item) => (
                          <div key={item.name} className="p-3 rounded-lg bg-accent/30 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {item.achieved ? (
                                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                                ) : item.gap <= 5 ? (
                                  <Circle className="h-4 w-4 text-chart-2" />
                                ) : (
                                  <Circle className="h-4 w-4 text-chart-4" />
                                )}
                                <span className="font-medium text-foreground text-sm">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingGoal === item.name ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={tempGoalValue}
                                      onChange={(e) => setTempGoalValue(e.target.value)}
                                      className="w-16 h-7 text-xs text-center"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => {
                                        const newValue = parseInt(tempGoalValue);
                                        if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
                                          setGoals(prev => ({ ...prev, [item.name]: newValue }));
                                        }
                                        setEditingGoal(null);
                                      }}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Badge 
                                      variant={item.achieved ? "default" : "outline"} 
                                      className="text-xs cursor-pointer"
                                      onClick={() => {
                                        setEditingGoal(item.name);
                                        setTempGoalValue(item.target.toString());
                                      }}
                                    >
                                      Target: {item.target}%
                                      <Edit2 className="h-2.5 w-2.5 ml-1 opacity-60" />
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="relative mb-2">
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    item.achieved ? "bg-chart-1" : item.gap <= 5 ? "bg-chart-2" : "bg-chart-4"
                                  }`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              {/* Target marker */}
                              <div 
                                className="absolute top-0 h-3 w-0.5 bg-foreground/70 rounded"
                                style={{ left: `${Math.min(item.target, 100)}%` }}
                              />
                            </div>

                            {/* Score Details */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Current: <span className="font-medium text-foreground">{item.current}%</span>
                              </span>
                              {item.achieved ? (
                                <span className="text-chart-1 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Goal Achieved!
                                </span>
                              ) : (
                                <span className={item.gap <= 5 ? "text-chart-2" : "text-chart-4"}>
                                  {item.gap}% to go
                                </span>
                              )}
                            </div>
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