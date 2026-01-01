import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Award, Trophy } from "lucide-react";
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

  // Prepare chart data
  const chartData = [
    { period: "Mid-Year 2024", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearLast])) },
    { period: "Year-End 2024", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.yearEndLast])) },
    { period: "Mid-Year 2025", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearCurrent])) },
    { period: "Year-End 2025", ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.yearEndCurrent ?? 0])) },
  ];

  const lineColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const filteredSubjects = subjectFilter === "all" 
    ? academicData.subjects 
    : academicData.subjects.filter(s => s.name === subjectFilter);

  return (
    <AppLayout>
      <AppHeader title="Academic" />

      {/* Report Card Generator */}
      <section className="px-4 pt-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Card Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button className="w-full" onClick={generateReport}>
              Generate Report Card
            </Button>

            {reportGenerated && (
              <Card className="bg-accent/50 border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Report Card Ready</p>
                    <p className="text-sm text-muted-foreground">
                      {examType === "mid-year" ? "Mid-Year" : "Year-End"} Exam {selectedYear}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Report Card Tabs */}
      <section className="px-4 py-4">
        <Tabs defaultValue="grades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="cocurriculum">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="mt-4 space-y-3">
            {academicData.subjects.map((subject, index) => (
              <Card key={index} className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Mid-Year: {subject.midYearCurrent}%
                    </p>
                  </div>
                  <Badge className={gradeColors[getGradeFromScore(subject.midYearCurrent)[0]] || gradeColors.C}>
                    {getGradeFromScore(subject.midYearCurrent)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="behavior" className="mt-4 space-y-3">
            {academicData.behavior.map((item, index) => (
              <Card key={index} className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{item.category}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge className={gradeColors[item.grade]}>
                    Grade {item.grade}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cocurriculum" className="mt-4 space-y-3">
            {academicData.coCurriculum.map((item, index) => (
              <Card key={index} className="bg-card border-border shadow-sm">
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
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

            <div className="mt-4 p-3 rounded-lg bg-accent/50 border border-primary/20">
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
