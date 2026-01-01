import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Award, Trophy, BookOpen, TrendingUp } from "lucide-react";
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
} from "recharts";

export default function AcademicPage() {
  const [examType, setExamType] = useState("mid-year");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);

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

  // Helper function to get score based on exam type and year selection
  const getScoreForSelection = (subject: typeof academicData.subjects[0]) => {
    if (selectedYear === "2025") {
      return examType === "mid-year" ? subject.midYearCurrent : subject.yearEndCurrent;
    } else {
      return examType === "mid-year" ? subject.midYearLast : subject.yearEndLast;
    }
  };

  const getExamLabel = () => {
    return `${examType === "mid-year" ? "Mid-Year" : "Year-End"} ${selectedYear}`;
  };

  // Prepare chart data
  const chartData = [
    { period: "Mid-Year 2024", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearLast])) },
    { period: "Year-End 2024", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.yearEndLast])) },
    { period: "Mid-Year 2025", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearCurrent])) },
    { period: "Year-End 2025", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.yearEndCurrent ?? 0])) },
  ];

  // Distinct colors for each subject - varied hues
  const lineColors = [
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#ef4444", // red
  ];

  const filteredSubjects = subjectFilter === "all" 
    ? academicData.subjects 
    : academicData.subjects.filter(s => s.name === subjectFilter);

  return (
    <AppLayout>
      <AppHeader title="Academic" />

      {/* Unified Report Card Section */}
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
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Exam Type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="mid-year">Mid-Year Exam</SelectItem>
                  <SelectItem value="year-end">Year-End Exam</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selected Period Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Viewing: {getExamLabel()}
              </Badge>
            </div>

            {/* Tabs for Grades/Behavior/Activities */}
            <Tabs defaultValue="grades" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="cocurriculum">Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="grades" className="mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {academicData.subjects.map((subject, index) => {
                    const score = getScoreForSelection(subject);
                    const isPending = score === null || score === undefined;
                    
                    return (
                      <div key={index} className="flex flex-col p-3 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground text-sm">{subject.name}</h3>
                          {isPending ? (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              --
                            </Badge>
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
                    <Badge className={gradeColors[item.grade]}>
                      Grade {item.grade}
                    </Badge>
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
                <p className="text-sm text-foreground">
                  Report Card for {getExamLabel()} downloaded!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Grade Analysis Chart */}
      <section className="px-4 pb-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Grade Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(0, 3)}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.3}
                    horizontal={true}
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
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {filteredSubjects.map((subject, index) => (
                    <Line
                      key={subject.name}
                      type="monotone"
                      dataKey={subject.name}
                      stroke={lineColors[index % lineColors.length]}
                      strokeWidth={2}
                      dot={{ fill: lineColors[index % lineColors.length], strokeWidth: 0, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                <BookOpen className="h-5 w-5 mb-1 text-chart-1" />
                <span className="text-base font-bold text-foreground">
                  {Math.round(academicData.subjects.reduce((sum, s) => sum + s.midYearCurrent, 0) / academicData.subjects.length)}%
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">Current Avg</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {Math.round(academicData.subjects.reduce((sum, s) => sum + s.midYearCurrent, 0) / academicData.subjects.length) >= 80 
                    ? "Above Average" 
                    : Math.round(academicData.subjects.reduce((sum, s) => sum + s.midYearCurrent, 0) / academicData.subjects.length) >= 65 
                      ? "Average" 
                      : "Needs Improvement"}
                </span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                <Award className="h-5 w-5 mb-1 text-chart-2" />
                <span className="text-base font-bold text-foreground">
                  {academicData.subjects.reduce((best, s) => s.midYearCurrent > best.midYearCurrent ? s : best).name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">Top Subject</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {academicData.subjects.reduce((best, s) => s.midYearCurrent > best.midYearCurrent ? s : best).midYearCurrent}%
                </span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                <TrendingUp className="h-5 w-5 mb-1 text-chart-3" />
                <span className="text-base font-bold text-foreground">
                  +{Math.round(academicData.subjects.reduce((sum, s) => sum + s.midYearCurrent, 0) / academicData.subjects.length) - 
                     Math.round(academicData.subjects.reduce((sum, s) => sum + s.yearEndLast, 0) / academicData.subjects.length)}%
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">vs Last Exam</span>
                <span className="text-[10px] text-muted-foreground/70">Improved</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
              <p className="text-sm text-foreground">
                <span className="font-medium">Insight:</span> Overall improvement of {academicData.improvement} compared to last exam period. Strong performance in {academicData.bestSubject}.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
