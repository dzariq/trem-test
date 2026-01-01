import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData, classAverages, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp, TrendingDown, Check, ArrowUp, ArrowDown, Minus, BarChart3, GitCompare, Target, AlertTriangle, Star } from "lucide-react";
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

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState("grades");
  const [examType, setExamType] = useState<ExamType>("midYear");
  const [selectedYear, setSelectedYear] = useState<YearKey>("2025");
  const [selectedYears, setSelectedYears] = useState<string[]>(["2025"]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // Grade Analysis sub-tabs
  const [analysisTab, setAnalysisTab] = useState("overview");
  
  // Comparison state
  const [compareExamA, setCompareExamA] = useState({ year: "2025" as YearKey, type: "midYear" as ExamType });
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

  // Subject performance data for bar chart
  const subjectPerformance = useMemo(() => {
    return academicData.subjects.map(s => ({
      name: s.name,
      score: getScore(s, selectedYear, examType) ?? 0,
      classAvg: classAverages[selectedYear]?.[examType] ?? 0
    }));
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

  // Strengths and weaknesses
  const { strengths, weaknesses } = useMemo(() => {
    const sorted = [...academicData.subjects].sort((a, b) => {
      const scoreA = getScore(a, selectedYear, examType) ?? 0;
      const scoreB = getScore(b, selectedYear, examType) ?? 0;
      return scoreB - scoreA;
    });
    return {
      strengths: sorted.slice(0, 2),
      weaknesses: sorted.slice(-2).reverse()
    };
  }, [selectedYear, examType]);

  // Year-over-year trend data
  const trendData = useMemo(() => {
    const years: YearKey[] = ["2023", "2024", "2025"];
    const periods: { year: YearKey; type: ExamType; label: string }[] = [];
    years.forEach(year => {
      periods.push({ year, type: "midYear", label: `Mid ${year}` });
      if (year !== "2025") { // 2025 year-end is null
        periods.push({ year, type: "yearEnd", label: `End ${year}` });
      }
    });
    
    return periods.map(p => {
      const result: Record<string, number | string | null> = { period: p.label };
      academicData.subjects.forEach(s => {
        result[s.name] = getScore(s, p.year, p.type);
      });
      // Overall average
      const scores = academicData.subjects.map(s => getScore(s, p.year, p.type)).filter(s => s !== null) as number[];
      result["Average"] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return result;
    });
  }, []);

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
                <div className="grid grid-cols-2 gap-2">
                  {academicData.subjects.map((subject, index) => {
                    const score = getScore(subject, selectedYear, examType);
                    const isPending = score === null || score === undefined;
                    
                    return (
                      <div key={index} className="flex flex-col p-3 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground text-sm">{subject.name}</h3>
                          {isPending ? (
                            <Badge variant="outline" className="text-muted-foreground text-xs">--</Badge>
                          ) : (
                            <Badge className={`${gradeColors[getGradeFromScore(score!)[0]] || gradeColors.C} text-xs`}>
                              {getGradeFromScore(score!)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {isPending ? "Pending" : `${score}%`}
                        </p>
                      </div>
                    );
                  })}
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
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-4">
                {/* Category Performance */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Category Performance</h4>
                  {categoryAverages.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{cat.category}</span>
                        <span className="font-medium text-foreground">{cat.score}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={cat.score} className="h-2" />
                        <div 
                          className="absolute top-0 h-2 w-0.5 bg-foreground/50" 
                          style={{ left: `${cat.classAverage}%` }}
                          title={`Class Avg: ${cat.classAverage}%`}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {cat.score >= cat.classAverage ? (
                          <span className="text-chart-1">+{cat.score - cat.classAverage}% above class avg</span>
                        ) : (
                          <span className="text-destructive">{cat.score - cat.classAverage}% below class avg</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subject Performance Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div className="h-40">
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

                {/* Grade Distribution Pie */}
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
                            {gradeDistribution.map((entry, index) => (
                              <Cell key={index} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {gradeDistribution.map((g, i) => (
                        <Badge key={g.grade} variant="outline" className="text-[10px] px-1.5 py-0">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                          {g.grade}: {g.count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 text-chart-1" /> Strengths
                      </h4>
                      {strengths.map(s => (
                        <div key={s.name} className="text-xs p-1.5 rounded bg-chart-1/10 text-foreground">
                          {s.name}: {getScore(s, selectedYear, examType)}%
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Target className="h-3 w-3 text-chart-4" /> Focus Areas
                      </h4>
                      {weaknesses.map(s => (
                        <div key={s.name} className="text-xs p-1.5 rounded bg-chart-4/10 text-foreground">
                          {s.name}: {getScore(s, selectedYear, examType)}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                    <BookOpen className="h-5 w-5 mb-1 text-chart-1" />
                    <span className="text-base font-bold text-foreground">{currentAverage}%</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Current Avg</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {currentAverage >= 80 ? "Above Average" : currentAverage >= 65 ? "Average" : "Needs Improvement"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                    <Award className="h-5 w-5 mb-1 text-chart-2" />
                    <span className="text-base font-bold text-foreground">{strengths[0]?.name}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Top Subject</span>
                    <span className="text-[10px] text-muted-foreground/70">{getScore(strengths[0], selectedYear, examType)}%</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                    <TrendingUp className="h-5 w-5 mb-1 text-chart-3" />
                    <span className="text-base font-bold text-foreground">
                      {currentAverage - (classAverages[selectedYear]?.[examType] ?? 0) >= 0 ? "+" : ""}
                      {currentAverage - (classAverages[selectedYear]?.[examType] ?? 0)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">vs Class Avg</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {currentAverage >= (classAverages[selectedYear]?.[examType] ?? 0) ? "Above" : "Below"}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* TRENDS TAB */}
              <TabsContent value="trends" className="space-y-4">
                {/* Subject Filter */}
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

                {/* Year-over-Year Line Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Performance Over Time</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
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
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                        {filteredSubjects.map((subject, index) => (
                          <Line
                            key={subject.name}
                            type="monotone"
                            dataKey={subject.name}
                            stroke={lineColors[index % lineColors.length]}
                            strokeWidth={2}
                            dot={{ fill: lineColors[index % lineColors.length], strokeWidth: 0, r: 4 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Trend */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Category Trends by Year</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Attitude" fill="hsl(var(--chart-1))" />
                        <Bar dataKey="Homework" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="Quiz" fill="hsl(var(--chart-3))" />
                        <Bar dataKey="Exam" fill="hsl(var(--chart-4))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend Insights */}
                <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Insight:</span> Consistent improvement across all categories from 2023 to 2025. 
                    Homework scores show the highest growth (+12%), while Attitude remains the strongest category.
                  </p>
                </div>
              </TabsContent>

              {/* COMPARISON TAB */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Exam Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Exam A</label>
                    <div className="flex gap-2">
                      <Select 
                        value={compareExamA.year} 
                        onValueChange={(v) => setCompareExamA(prev => ({ ...prev, year: v as YearKey }))}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs">
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
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="midYear">Mid-Year</SelectItem>
                          <SelectItem value="yearEnd">Year-End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Exam B</label>
                    <div className="flex gap-2">
                      <Select 
                        value={compareExamB.year} 
                        onValueChange={(v) => setCompareExamB(prev => ({ ...prev, year: v as YearKey }))}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs">
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
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="midYear">Mid-Year</SelectItem>
                          <SelectItem value="yearEnd">Year-End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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