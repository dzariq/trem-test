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
import { 
  Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, 
  Users, Target, Award, AlertTriangle, BookOpen, BarChart3,
  FileText, CheckCircle, XCircle, Lightbulb, Copy, Printer,
  ArrowRight, ArrowUpRight, ArrowDownRight, Scale, Download, FileSpreadsheet
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, classGrades, detailedClassGrades, yearOverYearData, categoryYearOverYear, examComparisonData, ExamData, subjectYearlyData, multiClassTrendData } from "@/data/teacherMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Grade categories with max scores
const gradeCategories = [
  { key: "attitude", label: "Attitude", max: 10 },
  { key: "homework", label: "Homework", max: 10 },
  { key: "quiz", label: "Quiz", max: 10 },
  { key: "exam", label: "Exam", max: 70 },
];

// Subjects for grade entry
const subjects = [
  "Arts",
  "Chinese as a Second Language",
  "English",
  "Mathematics",
  "Science",
  "Physical Education",
];

// Academic years (past 6 years) and exam periods
const academicYears = ["2026", "2025", "2024", "2023", "2022", "2021"];
const examPeriods = [
  { value: "midYear", label: "Mid-Year" },
  { value: "yearEnd", label: "Year-End" },
];

interface StudentGrades {
  attitude: string;
  homework: string;
  quiz: string;
  exam: string;
  comment: string;
  reportComment: string;
}

const calculateTotal = (grades: StudentGrades): number => {
  return (
    (parseInt(grades.attitude) || 0) +
    (parseInt(grades.homework) || 0) +
    (parseInt(grades.quiz) || 0) +
    (parseInt(grades.exam) || 0)
  );
};

const getLetterGrade = (total: number): { grade: string; color: string } => {
  if (total >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  if (total >= 80) return { grade: "A", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  if (total >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700 border-blue-300" };
  if (total >= 60) return { grade: "C", color: "bg-amber-100 text-amber-700 border-amber-300" };
  if (total >= 50) return { grade: "D", color: "bg-orange-100 text-orange-700 border-orange-300" };
  return { grade: "F", color: "bg-red-100 text-red-700 border-red-300" };
};

export default function TeacherAcademicPage() {
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [studentGrades, setStudentGrades] = useState<Record<string, Record<string, StudentGrades>>>({});
  const [selectedYears, setSelectedYears] = useState<string[]>([academicYears[0]]);
  const [selectedPeriod, setSelectedPeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [selectedCategory, setSelectedCategory] = useState<"attitude" | "homework" | "quiz" | "exam">("quiz");
  
  // Comparison tab state
  const [comparisonClass, setComparisonClass] = useState(teacherProfile.classes[0]);
  const [examAClass, setExamAClass] = useState(teacherProfile.classes[0]);
  const [examAYear, setExamAYear] = useState("2026");
  const [examAPeriod, setExamAPeriod] = useState<"midYear" | "yearEnd">("midYear");
  const [examBClass, setExamBClass] = useState(teacherProfile.classes[0]);
  const [examBYear, setExamBYear] = useState("2025");
  const [examBPeriod, setExamBPeriod] = useState<"midYear" | "yearEnd">("yearEnd");

  // Trends tab state - like student page
  const [trendPeriod, setTrendPeriod] = useState<"1year" | "2years" | "3years" | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  
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

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.length > 1 ? prev.filter(y => y !== year) : prev // Keep at least one selected
        : [...prev, year]
    );
  };

  const students = classRosters[selectedClass as keyof typeof classRosters] || [];
  const existingGrades = classGrades[selectedClass as keyof typeof classGrades] || {};

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const getStudentSubjectGrades = (studentId: string, subject: string): StudentGrades => {
    return studentGrades[studentId]?.[subject] || {
      attitude: "",
      homework: "",
      quiz: "",
      exam: "",
      comment: "",
      reportComment: "",
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
          [field]: value,
        },
      },
    }));
  };

  const handleSaveGrades = () => {
    if (!selectedStudent) {
      toast({
        title: "No Student Selected",
        description: "Please select a student to save grades.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Grades Saved",
      description: `Grades saved for ${students.find(s => s.id === selectedStudent)?.name} in Class ${selectedClass}.`,
    });
  };

  // Calculate class statistics for analysis
  const allGrades = Object.values(existingGrades)
    .map(g => g.midYear)
    .filter((g): g is number => g !== null);
  
  const classAverage = allGrades.length > 0 
    ? Math.round(allGrades.reduce((a, b) => a + b, 0) / allGrades.length) 
    : 0;
  const highestScore = allGrades.length > 0 ? Math.max(...allGrades) : 0;
  const lowestScore = allGrades.length > 0 ? Math.min(...allGrades) : 0;
  const passRate = allGrades.length > 0 
    ? Math.round((allGrades.filter(g => g >= 50).length / allGrades.length) * 100)
    : 0;
  const aGradeRate = allGrades.length > 0
    ? Math.round((allGrades.filter(g => g >= 80).length / allGrades.length) * 100)
    : 0;

  const gradeDistribution = [
    { range: "A", count: allGrades.filter(g => g >= 80).length },
    { range: "B", count: allGrades.filter(g => g >= 70 && g < 80).length },
    { range: "C", count: allGrades.filter(g => g >= 60 && g < 70).length },
    { range: "D", count: allGrades.filter(g => g >= 50 && g < 60).length },
    { range: "F", count: allGrades.filter(g => g < 50).length },
  ];

  const rankedStudents = students
    .map(s => ({
      ...s,
      score: existingGrades[s.id]?.midYear || null
    }))
    .filter(s => s.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // At-risk students (below 60)
  const atRiskStudents = rankedStudents.filter(s => s.score !== null && s.score < 60);

  // Calculate category averages from detailed grades
  const detailedGradesForClass = detailedClassGrades[selectedClass as keyof typeof detailedClassGrades] || {};
  const categoryTotals = { attitude: { sum: 0, count: 0, max: 10 }, homework: { sum: 0, count: 0, max: 10 }, quiz: { sum: 0, count: 0, max: 10 }, exam: { sum: 0, count: 0, max: 70 } };
  
  Object.values(detailedGradesForClass).forEach((studentGrades) => {
    Object.values(studentGrades).forEach((subjectGrade) => {
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

  const categoryAverages = [
    { name: "Attitude", average: categoryTotals.attitude.count > 0 ? categoryTotals.attitude.sum / categoryTotals.attitude.count : 0, max: 10, percentage: categoryTotals.attitude.count > 0 ? (categoryTotals.attitude.sum / categoryTotals.attitude.count / 10) * 100 : 0 },
    { name: "Homework", average: categoryTotals.homework.count > 0 ? categoryTotals.homework.sum / categoryTotals.homework.count : 0, max: 10, percentage: categoryTotals.homework.count > 0 ? (categoryTotals.homework.sum / categoryTotals.homework.count / 10) * 100 : 0 },
    { name: "Quiz", average: categoryTotals.quiz.count > 0 ? categoryTotals.quiz.sum / categoryTotals.quiz.count : 0, max: 10, percentage: categoryTotals.quiz.count > 0 ? (categoryTotals.quiz.sum / categoryTotals.quiz.count / 10) * 100 : 0 },
    { name: "Exam", average: categoryTotals.exam.count > 0 ? categoryTotals.exam.sum / categoryTotals.exam.count : 0, max: 70, percentage: categoryTotals.exam.count > 0 ? (categoryTotals.exam.sum / categoryTotals.exam.count / 70) * 100 : 0 },
  ];

  const weakestCategory = categoryAverages.reduce((min, cat) => cat.percentage < min.percentage ? cat : min, categoryAverages[0]);

  // Calculate category performance by subject (for the selected category)
  const categoryBySubject: Record<string, { sum: number; count: number; max: number }> = {};
  const categoryMax = selectedCategory === "exam" ? 70 : 10;
  
  Object.values(detailedGradesForClass).forEach((studentGrades) => {
    Object.entries(studentGrades).forEach(([subject, grades]) => {
      if (!categoryBySubject[subject]) categoryBySubject[subject] = { sum: 0, count: 0, max: categoryMax };
      categoryBySubject[subject].sum += grades[selectedCategory];
      categoryBySubject[subject].count++;
    });
  });

  const categoryBySubjectData = Object.entries(categoryBySubject)
    .map(([subject, data]) => ({
      name: subject.length > 8 ? subject.substring(0, 8) + "..." : subject,
      fullName: subject,
      average: data.count > 0 ? data.sum / data.count : 0,
      percentage: data.count > 0 ? (data.sum / data.count / categoryMax) * 100 : 0,
      max: categoryMax,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate subject averages
  const subjectTotals: Record<string, { sum: number; count: number }> = {};
  Object.values(detailedGradesForClass).forEach((studentGrades) => {
    Object.entries(studentGrades).forEach(([subject, grades]) => {
      const total = grades.attitude + grades.homework + grades.quiz + grades.exam;
      if (!subjectTotals[subject]) subjectTotals[subject] = { sum: 0, count: 0 };
      subjectTotals[subject].sum += total;
      subjectTotals[subject].count++;
    });
  });

  const subjectAverages = Object.entries(subjectTotals).map(([name, data]) => ({
    name: name.length > 10 ? name.substring(0, 10) + "..." : name,
    fullName: name,
    average: data.count > 0 ? data.sum / data.count : 0,
  })).sort((a, b) => b.average - a.average);

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  // Year-over-year trend data with period filtering (like student page)
  const trendData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const years = data.map(d => d.year);
    
    // Create periods array (mid-year and year-end for each year except current)
    const periods: { year: string; type: "midYear" | "yearEnd"; label: string }[] = [];
    years.forEach((year, idx) => {
      periods.push({ year, type: "midYear", label: `Mid ${year}` });
      if (idx < years.length - 1) {
        periods.push({ year, type: "yearEnd", label: `End ${year}` });
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
      const yearData = data.find(d => d.year === p.year);
      if (!yearData) return { period: p.label, Average: 0 };
      
      const result: Record<string, number | string | null> = { period: p.label };
      result["Mathematics"] = yearData.Mathematics;
      result["Science"] = yearData.Science;
      result["English"] = yearData.English;
      result["Arts"] = yearData.Arts;
      result["Physical Education"] = yearData["Physical Education"];
      result["Chinese as a Second Language"] = yearData["Chinese as a Second Language"];
      
      // Calculate average
      const scores = [yearData.Mathematics, yearData.Science, yearData.English, yearData.Arts, yearData["Physical Education"], yearData["Chinese as a Second Language"]];
      result["Average"] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return result;
    });
  }, [selectedClass, trendPeriod]);

  // Calculate trend direction for selected subject(s)
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return { direction: "stable" as const, change: 0, currentValue: 0 };
    
    const key = subjectFilter === "all" ? "Average" : subjectFilter;
    const firstValue = trendData[0]?.[key] as number | null;
    const lastValue = trendData[trendData.length - 1]?.[key] as number | null;
    
    if (firstValue === null || lastValue === null) return { direction: "stable" as const, change: 0, currentValue: 0 };
    
    const change = lastValue - firstValue;
    return {
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "stable" as const,
      change: Math.abs(change),
      currentValue: lastValue
    };
  }, [trendData, subjectFilter]);

  // Rising subjects - biggest improvement from first to last period
  const risingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    const subjectNames = ["Mathematics", "Science", "English", "Arts", "Physical Education", "Chinese as a Second Language"];
    
    return subjectNames.map(name => {
      const first = trendData[0]?.[name] as number ?? 0;
      const last = trendData[trendData.length - 1]?.[name] as number ?? 0;
      return { name, first, last, improvement: last - first };
    })
    .filter(s => s.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 3);
  }, [trendData]);

  // Falling subjects - biggest decline
  const fallingSubjects = useMemo(() => {
    if (trendData.length < 2) return [];
    const subjectNames = ["Mathematics", "Science", "English", "Arts", "Physical Education", "Chinese as a Second Language"];
    
    return subjectNames.map(name => {
      const first = trendData[0]?.[name] as number ?? 0;
      const last = trendData[trendData.length - 1]?.[name] as number ?? 0;
      return { name, first, last, decline: first - last };
    })
    .filter(s => s.decline > 0)
    .sort((a, b) => b.decline - a.decline)
    .slice(0, 3);
  }, [trendData]);

  // Radar chart data for subject strengths
  const radarData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const latest = data[data.length - 1];
    const shortNames: Record<string, string> = {
      "Mathematics": "Math",
      "Science": "Science",
      "English": "English",
      "Arts": "Arts",
      "Physical Education": "PE",
      "Chinese as a Second Language": "Chinese",
    };
    return [
      { subject: shortNames["Mathematics"], score: latest.Mathematics, fullMark: 100 },
      { subject: shortNames["Science"], score: latest.Science, fullMark: 100 },
      { subject: shortNames["English"], score: latest.English, fullMark: 100 },
      { subject: shortNames["Arts"], score: latest.Arts, fullMark: 100 },
      { subject: shortNames["Physical Education"], score: latest["Physical Education"], fullMark: 100 },
      { subject: shortNames["Chinese as a Second Language"], score: latest["Chinese as a Second Language"], fullMark: 100 },
    ];
  }, [selectedClass]);

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
    const shortNames: Record<string, string> = {
      "Mathematics": "Math",
      "Science": "Science",
      "English": "English",
      "Arts": "Arts",
      "Physical Education": "PE",
      "Chinese as a Second Language": "Chinese",
    };
    return [
      { name: shortNames["Mathematics"], fullName: "Mathematics", classScore: latest.Mathematics, schoolAvg, delta: latest.Mathematics - schoolAvg },
      { name: shortNames["Science"], fullName: "Science", classScore: latest.Science, schoolAvg, delta: latest.Science - schoolAvg },
      { name: shortNames["English"], fullName: "English", classScore: latest.English, schoolAvg, delta: latest.English - schoolAvg },
      { name: shortNames["Arts"], fullName: "Arts", classScore: latest.Arts, schoolAvg, delta: latest.Arts - schoolAvg },
      { name: shortNames["Physical Education"], fullName: "Physical Education", classScore: latest["Physical Education"], schoolAvg, delta: latest["Physical Education"] - schoolAvg },
      { name: shortNames["Chinese as a Second Language"], fullName: "Chinese as a Second Language", classScore: latest["Chinese as a Second Language"], schoolAvg, delta: latest["Chinese as a Second Language"] - schoolAvg },
    ].sort((a, b) => b.delta - a.delta);
  }, [selectedClass]);

  // Performance Heatmap data
  const heatmapData = useMemo(() => {
    const data = subjectYearlyData[selectedClass as keyof typeof subjectYearlyData] || subjectYearlyData["5A"];
    const subjectKeys = ["Mathematics", "Science", "English", "Arts", "Physical Education", "Chinese as a Second Language"] as const;
    const shortNames: Record<string, string> = {
      "Mathematics": "Math",
      "Science": "Sci",
      "English": "Eng",
      "Arts": "Arts",
      "Physical Education": "PE",
      "Chinese as a Second Language": "Chi",
    };
    
    return subjectKeys.map(subject => ({
      subject: shortNames[subject],
      fullName: subject,
      scores: data.map(yearData => ({
        period: yearData.year,
        score: yearData[subject]
      }))
    }));
  }, [selectedClass]);

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

  return (
    <TeacherAppLayout>
      <AppHeader 
        showBack
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Academic</h1>
          </div>
        }
      />

      <div className="px-4 mt-4 pb-4">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="entry">Grade Entry</TabsTrigger>
            <TabsTrigger value="analysis">Class Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            {/* Class & Student Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudent(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherProfile.classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStudent || ""} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && selectedStudentData ? (
              <>
                {/* Student Header */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <p className="font-semibold text-foreground">{selectedStudentData.name}</p>
                    <p className="text-sm text-muted-foreground">Class {selectedClass}</p>
                  </CardContent>
                </Card>

                {/* Subject Grade Cards */}
                <div className="space-y-3">
                  {subjects.map((subject) => {
                    const isExpanded = expandedSubjects.includes(subject);
                    const grades = getStudentSubjectGrades(selectedStudent, subject);
                    const total = calculateTotal(grades);
                    const { grade: letterGrade, color: gradeColor } = getLetterGrade(total);
                    const hasData = Object.values(grades).some(v => v !== "");

                    return (
                      <Collapsible key={subject} open={isExpanded} onOpenChange={() => toggleSubject(subject)}>
                        <Card className={cn(
                          "overflow-hidden transition-colors",
                          isExpanded ? "border-primary/50" : ""
                        )}>
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
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <CardContent className="p-3 pt-0 space-y-3">
                              {/* Score Inputs - 2x2 Grid for Mobile */}
                              <div className="grid grid-cols-2 gap-2">
                                {gradeCategories.map((cat) => (
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
                                      onChange={(e) => updateGrade(selectedStudent, subject, cat.key as keyof StudentGrades, e.target.value)}
                                      className="text-center h-10"
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Total & Grade Display */}
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

                              {/* Comments */}
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Performance comment (e.g., Outstanding performance in Arts)"
                                  value={grades.comment}
                                  onChange={(e) => updateGrade(selectedStudent, subject, "comment", e.target.value)}
                                  className={cn(
                                    "min-h-[60px] text-sm resize-none",
                                    total >= 80 ? "border-emerald-200 bg-emerald-50/50" : 
                                    total < 50 ? "border-red-200 bg-red-50/50" : ""
                                  )}
                                />
                                <Textarea
                                  placeholder="Report card comments..."
                                  value={grades.reportComment}
                                  onChange={(e) => updateGrade(selectedStudent, subject, "reportComment", e.target.value)}
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

                <Button className="w-full" size="lg" onClick={handleSaveGrades}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Grades
                </Button>
              </>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Select a student to enter grades</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Sub-tabs for Class Analysis */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
              </TabsList>

              {/* ==================== OVERVIEW SUB-TAB ==================== */}
              <TabsContent value="overview" className="space-y-4">
                {/* Filters Row - Class and Year selectors */}
                <div className="flex gap-2">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="text-xs flex-1">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherProfile.classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-9 justify-between flex-1">
                        {selectedYears.length === 1 
                          ? selectedYears[0] 
                          : `${selectedYears.length} Years`}
                        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-background z-50" align="start">
                      <div className="space-y-2">
                        {academicYears.map((year) => (
                          <label 
                            key={year} 
                            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded"
                          >
                            <Checkbox 
                              checked={selectedYears.includes(year)}
                              onCheckedChange={() => toggleYear(year)}
                            />
                            <span className="text-xs">{year}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as "midYear" | "yearEnd")}>
                    <SelectTrigger className="text-xs flex-1">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {examPeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected filters badge */}
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {selectedClass}
                  </Badge>
                  {selectedYears.map(year => (
                    <Badge key={year} variant="outline" className="text-[10px] font-normal">
                      {year}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {examPeriods.find(p => p.value === selectedPeriod)?.label}
                  </Badge>
                </div>

                {/* Subject Performance Bar Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Subject Performance</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectAverages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={70} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, "Average"]}
                        />
                        <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                          {subjectAverages.map((_, index) => (
                            <Cell key={index} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top 3 Performers & Subjects Needing Focus */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Top Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Award className="h-4 w-4" style={{ color: '#22c55e' }} /> Top Subjects
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(0, 3).map((sub, index) => (
                        <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{ backgroundColor: '#22c55e' }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subjects Needing Focus */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" style={{ color: '#f59e0b' }} /> Needs Focus
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(-3).reverse().map((sub, index) => (
                        <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#d97706' }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{ backgroundColor: '#f59e0b' }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grade Distribution Pie + Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Grade Distribution</h4>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution.filter(d => d.count > 0)}
                            dataKey="count"
                            nameKey="range"
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={2}
                          >
                            {gradeDistribution.filter(d => d.count > 0).map((entry) => (
                              <Cell key={entry.range} fill={GRADE_COLORS[entry.range as keyof typeof GRADE_COLORS]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, 'Students']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {gradeDistribution.filter(d => d.count > 0).map((g) => (
                        <Badge key={g.range} variant="outline" className="text-[10px] px-1.5 py-0">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }} />
                          {g.range}: {g.count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-2">
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                      <Users className="h-5 w-5 mb-1 text-primary" />
                      <span className="text-lg font-bold text-foreground">{students.length}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">Students</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50">
                      <Target className="h-5 w-5 mb-1 text-emerald-600" />
                      <span className="text-lg font-bold text-foreground">{classAverage}%</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">Class Average</span>
                    </div>
                  </div>
                </div>

                {/* At-Risk Students */}
                {atRiskStudents.length > 0 && (
                  <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        At-Risk Students ({atRiskStudents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {atRiskStudents.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-2 rounded-lg bg-background border border-red-200"
                        >
                          <span className="text-sm font-medium">{student.name}</span>
                          <Badge variant="destructive" className="text-xs">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Top Students with medals */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rankedStudents.slice(0, 5).map((student, index) => (
                      <div 
                        key={student.id} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          index === 0 ? "bg-amber-50 border border-amber-200" :
                          index === 1 ? "bg-slate-50 border border-slate-200" :
                          index === 2 ? "bg-orange-50 border border-orange-200" :
                          "bg-accent/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-lg font-bold w-8 text-center",
                            index === 0 ? "text-amber-500" : 
                            index === 1 ? "text-slate-400" : 
                            index === 2 ? "text-orange-400" : "text-muted-foreground"
                          )}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                          </span>
                          <span className="text-sm font-medium">{student.name}</span>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          student.score && student.score >= 90 ? "bg-emerald-100 text-emerald-700" :
                          student.score && student.score >= 80 ? "bg-blue-100 text-blue-700" :
                          "bg-accent"
                        )}>
                          {student.score}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
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
                    {/* Class Selector */}
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherProfile.classes.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {subjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant={subjectFilter === subject ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap"
                      onClick={() => setSubjectFilter(subject)}
                    >
                      {subject.length > 12 ? subject.substring(0, 12) + "..." : subject}
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
                      {risingSubjects.length > 0 ? risingSubjects.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</span>
                            <span className="text-xs font-bold text-green-600">+{item.improvement}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.first}% → {item.last}%
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
                      {fallingSubjects.length > 0 ? fallingSubjects.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</span>
                            <span className="text-xs font-bold text-red-600">-{item.decline}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.first}% → {item.last}%
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
                    {risingSubjects.length > 0 && (
                      <>{risingSubjects[0].name} shows great improvement (+{risingSubjects[0].improvement}%). </>
                    )}
                    {fallingSubjects.length > 0 && (
                      <>Focus more on {fallingSubjects[0].name} which dropped {fallingSubjects[0].decline}%. </>
                    )}
                    {risingSubjects.length === 0 && fallingSubjects.length === 0 && (
                      <>Performance is stable across all subjects for Class {selectedClass}.</>
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
                            name === "classScore" ? "Class Score" : "School Average"
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: 10 }} 
                          formatter={(value) => value === "classScore" ? "Class Score" : "School Avg"}
                        />
                        <Bar dataKey="classScore" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="schoolAvg" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={10} opacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Delta badges */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {subjectVsSchoolData.slice(0, 4).map((item) => (
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

              {/* ==================== COMPARISON SUB-TAB ==================== */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Exam A and Exam B Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Exam A */}
                  <Card className="border-primary/30">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs text-primary">Exam A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <Select value={examAClass} onValueChange={setExamAClass}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {teacherProfile.classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={examAYear} onValueChange={setExamAYear}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={examAPeriod} onValueChange={(v) => setExamAPeriod(v as "midYear" | "yearEnd")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {examPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Exam B */}
                  <Card className="border-emerald-500/30">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs text-emerald-600">Exam B</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <Select value={examBClass} onValueChange={setExamBClass}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {teacherProfile.classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={examBYear} onValueChange={setExamBYear}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={examBPeriod} onValueChange={(v) => setExamBPeriod(v as "midYear" | "yearEnd")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {examPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Results */}
                {(() => {
                  const examAKey = `${examAYear}-${examAPeriod}`;
                  const examBKey = `${examBYear}-${examBPeriod}`;
                  const classAData = examComparisonData[examAClass as keyof typeof examComparisonData] || {};
                  const classBData = examComparisonData[examBClass as keyof typeof examComparisonData] || {};
                  const examA = classAData[examAKey];
                  const examB = classBData[examBKey];
                  
                  if (!examA || !examB) {
                    return (
                      <Card className="bg-muted/30">
                        <CardContent className="p-8 text-center">
                          <Scale className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">No data available for the selected exam periods</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  const getDeltaIcon = (a: number, b: number) => {
                    const diff = a - b;
                    if (diff > 0) return <ArrowUpRight className="h-3 w-3 text-emerald-600" />;
                    if (diff < 0) return <ArrowDownRight className="h-3 w-3 text-red-600" />;
                    return <ArrowRight className="h-3 w-3 text-muted-foreground" />;
                  };

                  const getDeltaColor = (a: number, b: number) => {
                    const diff = a - b;
                    if (diff > 0) return "text-emerald-600";
                    if (diff < 0) return "text-red-600";
                    return "text-muted-foreground";
                  };

                  const formatDelta = (a: number, b: number, suffix: string = "") => {
                    const diff = a - b;
                    if (diff > 0) return `+${diff.toFixed(1)}${suffix}`;
                    return `${diff.toFixed(1)}${suffix}`;
                  };

                  const examALabel = `${examAClass} ${examAYear} ${examPeriods.find(p => p.value === examAPeriod)?.label}`;
                  const examBLabel = `${examBClass} ${examBYear} ${examPeriods.find(p => p.value === examBPeriod)?.label}`;

                  // Prepare chart data for category comparison
                  const categoryComparisonData = [
                    { name: "Attitude", examA: examA.attitude, examB: examB.attitude },
                    { name: "Homework", examA: examA.homework, examB: examB.homework },
                    { name: "Quiz", examA: examA.quiz, examB: examB.quiz },
                    { name: "Exam", examA: examA.exam / 7, examB: examB.exam / 7 }, // Normalize exam to 10
                  ];

                  return (
                    <>
                      {/* Side-by-Side Stats */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Comparison Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Average */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-primary">{examA.average}%</p>
                              <p className="text-[10px] text-muted-foreground">{examALabel}</p>
                            </div>
                            <div className="flex flex-col items-center px-3">
                              {getDeltaIcon(examA.average, examB.average)}
                              <span className={cn("text-xs font-medium", getDeltaColor(examA.average, examB.average))}>
                                {formatDelta(examA.average, examB.average)}
                              </span>
                              <span className="text-[9px] text-muted-foreground">Average</span>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-emerald-600">{examB.average}%</p>
                              <p className="text-[10px] text-muted-foreground">{examBLabel}</p>
                            </div>
                          </div>

                          {/* Pass Rate */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-primary">{examA.passRate}%</p>
                            </div>
                            <div className="flex flex-col items-center px-3">
                              {getDeltaIcon(examA.passRate, examB.passRate)}
                              <span className={cn("text-xs font-medium", getDeltaColor(examA.passRate, examB.passRate))}>
                                {formatDelta(examA.passRate, examB.passRate, "%")}
                              </span>
                              <span className="text-[9px] text-muted-foreground">Pass Rate</span>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-emerald-600">{examB.passRate}%</p>
                            </div>
                          </div>

                          {/* A-Grade Rate */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-primary">{examA.aRate}%</p>
                            </div>
                            <div className="flex flex-col items-center px-3">
                              {getDeltaIcon(examA.aRate, examB.aRate)}
                              <span className={cn("text-xs font-medium", getDeltaColor(examA.aRate, examB.aRate))}>
                                {formatDelta(examA.aRate, examB.aRate, "%")}
                              </span>
                              <span className="text-[9px] text-muted-foreground">A-Grade</span>
                            </div>
                            <div className="text-center flex-1">
                              <p className="text-lg font-bold text-emerald-600">{examB.aRate}%</p>
                            </div>
                          </div>

                          {/* Highest/Lowest */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                              <div className="text-center flex-1">
                                <p className="text-sm font-bold">{examA.highest}</p>
                              </div>
                              <div className="flex flex-col items-center px-2">
                                <TrendingUp className="h-3 w-3 text-emerald-600" />
                                <span className="text-[9px] text-emerald-600">Highest</span>
                              </div>
                              <div className="text-center flex-1">
                                <p className="text-sm font-bold">{examB.highest}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                              <div className="text-center flex-1">
                                <p className="text-sm font-bold">{examA.lowest}</p>
                              </div>
                              <div className="flex flex-col items-center px-2">
                                <TrendingDown className="h-3 w-3 text-red-600" />
                                <span className="text-[9px] text-red-600">Lowest</span>
                              </div>
                              <div className="text-center flex-1">
                                <p className="text-sm font-bold">{examB.lowest}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Category Comparison Chart */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Category Comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={categoryComparisonData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} width={25} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="examA" name={examALabel} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="examB" name={examBLabel} fill="#10b981" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Summary Insight */}
                      <Card className={cn(
                        "border",
                        examA.average > examB.average ? "border-primary/30 bg-primary/5" : 
                        examA.average < examB.average ? "border-emerald-500/30 bg-emerald-50/50" :
                        "border-muted bg-muted/30"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {examA.average !== examB.average ? (
                              examA.average > examB.average ? (
                                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-emerald-600 mt-0.5" />
                              )
                            ) : (
                              <Minus className="h-5 w-5 text-muted-foreground mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {examA.average > examB.average 
                                  ? `${examALabel} performed better`
                                  : examA.average < examB.average 
                                  ? `${examBLabel} performed better`
                                  : "Both exams had similar performance"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {examA.average !== examB.average && (
                                  <>
                                    Average score difference: <span className="font-medium">{Math.abs(examA.average - examB.average).toFixed(1)}%</span>
                                    {examA.passRate !== examB.passRate && (
                                      <> • Pass rate difference: <span className="font-medium">{Math.abs(examA.passRate - examB.passRate)}%</span></>
                                    )}
                                  </>
                                )}
                                {examA.average === examB.average && "Both exam periods achieved identical average scores."}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherAppLayout>
  );
}

// Subject colors for charts
const SUBJECT_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
];

// Grade colors for charts
const GRADE_COLORS = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};
