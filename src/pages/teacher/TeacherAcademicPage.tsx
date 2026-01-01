import { useState } from "react";
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
import { teacherProfile, classRosters, classGrades, detailedClassGrades, yearOverYearData, categoryYearOverYear, examComparisonData, ExamData } from "@/data/teacherMockData";
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
            <Tabs defaultValue="report" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="report" className="text-xs">Report</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs">Comparison</TabsTrigger>
              </TabsList>

              {/* ==================== REPORT SUB-TAB ==================== */}
              <TabsContent value="report" className="space-y-4">
                {/* Filters Row */}
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="text-xs">
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
                      <Button variant="outline" className="text-xs h-9 justify-between">
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
                    <SelectTrigger className="text-xs">
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
                  {selectedYears.map(year => (
                    <Badge key={year} variant="outline" className="text-[10px] font-normal">
                      {year}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {examPeriods.find(p => p.value === selectedPeriod)?.label}
                  </Badge>
                </div>

                {/* Summary Stats - 2x3 Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <Card>
                    <CardContent className="p-2 text-center">
                      <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold text-foreground">{students.length}</p>
                      <p className="text-[10px] text-muted-foreground">Class Size</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 text-center">
                      <Minus className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold text-foreground">{classAverage}</p>
                      <p className="text-[10px] text-muted-foreground">Average</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 text-center">
                      <Target className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      <p className="text-lg font-bold text-foreground">{passRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Pass Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 text-center">
                      <Award className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                      <p className="text-lg font-bold text-foreground">{aGradeRate}%</p>
                      <p className="text-[10px] text-muted-foreground">A Grade</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 text-center">
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      <p className="text-lg font-bold text-foreground">{highestScore}</p>
                      <p className="text-[10px] text-muted-foreground">Highest</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 text-center">
                      <TrendingDown className="h-4 w-4 mx-auto mb-1 text-red-600" />
                      <p className="text-lg font-bold text-foreground">{lowestScore}</p>
                      <p className="text-[10px] text-muted-foreground">Lowest</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Category Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryAverages.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{cat.name}</span>
                          <span className="font-medium">{cat.average.toFixed(1)}/{cat.max}</span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                      </div>
                    ))}
                    {weakestCategory && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mt-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="text-xs text-amber-700">
                          <span className="font-medium">{weakestCategory.name}</span> needs improvement ({weakestCategory.percentage.toFixed(0)}%)
                        </p>
                      </div>
                    )}

                    {/* Category by Subject Analysis */}
                    <div className="pt-3 border-t mt-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">View by Subject</span>
                        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as "attitude" | "homework" | "quiz" | "exam")}>
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="attitude">Attitude</SelectItem>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryBySubjectData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={55} />
                            <Tooltip 
                              formatter={(value: number, name: string, props: { payload?: { fullName?: string; average?: number; max?: number } }) => [
                                `${props.payload?.average?.toFixed(1)}/${props.payload?.max} (${value.toFixed(0)}%)`, 
                                props.payload?.fullName || 'Score'
                              ]} 
                            />
                            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                              {categoryBySubjectData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 0 ? "#10b981" : index === categoryBySubjectData.length - 1 ? "#f59e0b" : "hsl(var(--primary))"} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {categoryBySubjectData.length > 0 && (
                        <div className="flex justify-between text-[10px] mt-2">
                          <span className="text-emerald-600">Best: {categoryBySubjectData[0]?.fullName}</span>
                          <span className="text-amber-600">Needs work: {categoryBySubjectData[categoryBySubjectData.length - 1]?.fullName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAverages} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Average']} />
                          <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Grade Distribution - Bar + Pie */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradeDistribution}>
                            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={20} />
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                              {gradeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.range as keyof typeof GRADE_COLORS]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs">Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={gradeDistribution.filter(d => d.count > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={45}
                              dataKey="count"
                              label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {gradeDistribution.filter(d => d.count > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.range as keyof typeof GRADE_COLORS]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value, 'Students']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
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

                {/* Class Report Generation */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Class Performance Report
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Auto-generated insights for {selectedClass} • {selectedYears.join(", ")} • {examPeriods.find(p => p.value === selectedPeriod)?.label}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="p-3 rounded-lg bg-background border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Summary</h4>
                      <p className="text-sm text-foreground">
                        Class {selectedClass} has <span className="font-semibold">{students.length} students</span> with 
                        an average score of <span className="font-semibold">{classAverage}%</span>. 
                        The pass rate is <span className="font-semibold text-emerald-600">{passRate}%</span> with 
                        <span className="font-semibold text-amber-600"> {aGradeRate}%</span> achieving A grades.
                      </p>
                    </div>

                    {/* Strengths */}
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <h4 className="text-xs font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Strengths
                      </h4>
                      <ul className="space-y-1.5 text-sm text-emerald-800">
                        {(() => {
                          const bestSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average > b.average ? a : b)
                            : null;
                          const bestCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage > b.percentage ? a : b)
                            : null;
                          const topCount = rankedStudents.filter(s => s.score && s.score >= 80).length;
                          
                          return (
                            <>
                              {bestSubject && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-emerald-600" />
                                  <span><span className="font-medium">{bestSubject.name}</span> is the strongest subject with {bestSubject.average.toFixed(0)}% average</span>
                                </li>
                              )}
                              {bestCategory && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-emerald-600" />
                                  <span><span className="font-medium">{bestCategory.name}</span> scores are consistently high at {bestCategory.percentage.toFixed(0)}%</span>
                                </li>
                              )}
                              {topCount > 0 && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-emerald-600" />
                                  <span><span className="font-medium">{topCount} students</span> achieved B grade or higher</span>
                                </li>
                              )}
                            </>
                          );
                        })()}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <h4 className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Areas for Improvement
                      </h4>
                      <ul className="space-y-1.5 text-sm text-amber-800">
                        {(() => {
                          const worstSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average < b.average ? a : b)
                            : null;
                          const worstCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage < b.percentage ? a : b)
                            : null;
                          
                          return (
                            <>
                              {worstSubject && (
                                <li className="flex items-start gap-2">
                                  <XCircle className="h-3.5 w-3.5 mt-0.5 text-amber-600" />
                                  <span><span className="font-medium">{worstSubject.name}</span> needs attention with {worstSubject.average.toFixed(0)}% average</span>
                                </li>
                              )}
                              {worstCategory && (
                                <li className="flex items-start gap-2">
                                  <XCircle className="h-3.5 w-3.5 mt-0.5 text-amber-600" />
                                  <span><span className="font-medium">{worstCategory.name}</span> is the weakest category at {worstCategory.percentage.toFixed(0)}%</span>
                                </li>
                              )}
                              {atRiskStudents.length > 0 && (
                                <li className="flex items-start gap-2">
                                  <XCircle className="h-3.5 w-3.5 mt-0.5 text-amber-600" />
                                  <span><span className="font-medium">{atRiskStudents.length} students</span> are at risk of failing (below 50%)</span>
                                </li>
                              )}
                            </>
                          );
                        })()}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Recommendations
                      </h4>
                      <ul className="space-y-1.5 text-sm text-blue-800">
                        {(() => {
                          const worstSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average < b.average ? a : b)
                            : null;
                          const worstCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage < b.percentage ? a : b)
                            : null;
                          
                          return (
                            <>
                              {worstSubject && (
                                <li className="flex items-start gap-2">
                                  <span className="font-medium text-blue-600">1.</span>
                                  <span>Schedule additional tutoring sessions for <span className="font-medium">{worstSubject.name}</span></span>
                                </li>
                              )}
                              {worstCategory && (
                                <li className="flex items-start gap-2">
                                  <span className="font-medium text-blue-600">2.</span>
                                  <span>Implement weekly <span className="font-medium">{worstCategory.name.toLowerCase()}</span> practice across all subjects</span>
                                </li>
                              )}
                              {atRiskStudents.length > 0 && (
                                <li className="flex items-start gap-2">
                                  <span className="font-medium text-blue-600">3.</span>
                                  <span>Arrange parent meetings for the {atRiskStudents.length} at-risk students</span>
                                </li>
                              )}
                              <li className="flex items-start gap-2">
                                <span className="font-medium text-blue-600">{atRiskStudents.length > 0 ? "4" : "3"}.</span>
                                <span>Celebrate class achievements to boost morale and motivation</span>
                              </li>
                            </>
                          );
                        })()}
                      </ul>
                    </div>

                    {/* Teacher Notes */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Teacher Notes (Optional)</label>
                      <Textarea 
                        placeholder="Add your own observations or notes to include in the report..."
                        className="min-h-[80px] text-sm resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const bestSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average > b.average ? a : b)
                            : null;
                          const worstSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average < b.average ? a : b)
                            : null;
                          const bestCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage > b.percentage ? a : b)
                            : null;
                          const worstCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage < b.percentage ? a : b)
                            : null;
                            
                          const report = `CLASS PERFORMANCE REPORT
========================
Class: ${selectedClass} | Year: ${selectedYears.join(", ")} | Period: ${examPeriods.find(p => p.value === selectedPeriod)?.label}
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
• Total Students: ${students.length}
• Class Average: ${classAverage}%
• Pass Rate: ${passRate}%
• A-Grade Rate: ${aGradeRate}%
• Highest Score: ${highestScore}%
• Lowest Score: ${lowestScore}%

STRENGTHS
---------
${bestSubject ? `• ${bestSubject.name} is the strongest subject (avg: ${bestSubject.average.toFixed(0)}%)` : ""}
${bestCategory ? `• ${bestCategory.name} scores are consistently high (${bestCategory.percentage.toFixed(0)}%)` : ""}
• ${rankedStudents.filter(s => s.score && s.score >= 80).length} students achieved B grade or higher

AREAS FOR IMPROVEMENT
---------------------
${worstSubject ? `• ${worstSubject.name} needs attention (avg: ${worstSubject.average.toFixed(0)}%)` : ""}
${worstCategory ? `• ${worstCategory.name} is the weakest category (${worstCategory.percentage.toFixed(0)}%)` : ""}
${atRiskStudents.length > 0 ? `• ${atRiskStudents.length} students are at risk of failing` : ""}

RECOMMENDATIONS
---------------
${worstSubject ? `1. Schedule additional tutoring sessions for ${worstSubject.name}` : ""}
${worstCategory ? `2. Implement weekly ${worstCategory.name.toLowerCase()} practice across all subjects` : ""}
${atRiskStudents.length > 0 ? `3. Arrange parent meetings for at-risk students` : ""}
4. Celebrate class achievements to boost morale`;

                          navigator.clipboard.writeText(report);
                          toast({
                            title: "Report Copied",
                            description: "Class report has been copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Print
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Generate CSV content
                          const csvRows = [
                            ["Class Performance Report"],
                            [`Class: ${selectedClass}`, `Year: ${selectedYears.join(", ")}`, `Period: ${examPeriods.find(p => p.value === selectedPeriod)?.label}`],
                            [`Generated: ${new Date().toLocaleDateString()}`],
                            [],
                            ["Summary Statistics"],
                            ["Metric", "Value"],
                            ["Total Students", students.length.toString()],
                            ["Class Average", `${classAverage}%`],
                            ["Pass Rate", `${passRate}%`],
                            ["A-Grade Rate", `${aGradeRate}%`],
                            ["Highest Score", `${highestScore}%`],
                            ["Lowest Score", `${lowestScore}%`],
                            [],
                            ["Category Performance"],
                            ["Category", "Average", "Max", "Percentage"],
                            ...categoryAverages.map(cat => [cat.name, cat.average.toFixed(1), cat.max.toString(), `${cat.percentage.toFixed(0)}%`]),
                            [],
                            ["Subject Performance"],
                            ["Subject", "Average"],
                            ...subjectAverages.map(sub => [sub.fullName, sub.average.toFixed(1)]),
                            [],
                            ["Grade Distribution"],
                            ["Grade", "Count"],
                            ...gradeDistribution.map(g => [g.range, g.count.toString()]),
                            [],
                            ["Student Rankings"],
                            ["Rank", "Name", "Score"],
                            ...rankedStudents.map((s, i) => [(i + 1).toString(), s.name, s.score ? `${s.score}%` : "N/A"]),
                          ];
                          
                          if (atRiskStudents.length > 0) {
                            csvRows.push([]);
                            csvRows.push(["At-Risk Students"]);
                            csvRows.push(["Name", "Score"]);
                            atRiskStudents.forEach(s => csvRows.push([s.name, s.score ? `${s.score}%` : "N/A"]));
                          }
                          
                          const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `class_report_${selectedClass}_${selectedYears.join("-")}_${selectedPeriod}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          
                          toast({
                            title: "CSV Downloaded",
                            description: "Class report has been downloaded as CSV",
                          });
                        }}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                        CSV
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          // Generate PDF using browser print
                          const bestSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average > b.average ? a : b)
                            : null;
                          const worstSubject = subjectAverages.length > 0 
                            ? subjectAverages.reduce((a, b) => a.average < b.average ? a : b)
                            : null;
                          const bestCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage > b.percentage ? a : b)
                            : null;
                          const worstCategory = categoryAverages.length > 0
                            ? categoryAverages.reduce((a, b) => a.percentage < b.percentage ? a : b)
                            : null;
                          
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) {
                            toast({
                              title: "Pop-up Blocked",
                              description: "Please allow pop-ups to download PDF",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Class Report - ${selectedClass}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 24px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
    .stat-card { background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
    .stat-label { font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    .section { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .section.strength { background: #ecfdf5; border-left: 4px solid #10b981; }
    .section.weakness { background: #fffbeb; border-left: 4px solid #f59e0b; }
    .section.recommendation { background: #eff6ff; border-left: 4px solid #3b82f6; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>📊 Class Performance Report</h1>
  <div class="meta">
    <strong>Class:</strong> ${selectedClass} | 
    <strong>Year:</strong> ${selectedYears.join(", ")} | 
    <strong>Period:</strong> ${examPeriods.find(p => p.value === selectedPeriod)?.label}<br/>
    <strong>Generated:</strong> ${new Date().toLocaleDateString()}
  </div>
  
  <h2>Summary Statistics</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${students.length}</div><div class="stat-label">Students</div></div>
    <div class="stat-card"><div class="stat-value">${classAverage}%</div><div class="stat-label">Average</div></div>
    <div class="stat-card"><div class="stat-value">${passRate}%</div><div class="stat-label">Pass Rate</div></div>
    <div class="stat-card"><div class="stat-value">${aGradeRate}%</div><div class="stat-label">A-Grade</div></div>
    <div class="stat-card"><div class="stat-value">${highestScore}%</div><div class="stat-label">Highest</div></div>
    <div class="stat-card"><div class="stat-value">${lowestScore}%</div><div class="stat-label">Lowest</div></div>
  </div>
  
  <h2>Category Performance</h2>
  <table>
    <tr><th>Category</th><th>Average</th><th>Max</th><th>Percentage</th></tr>
    ${categoryAverages.map(cat => `<tr><td>${cat.name}</td><td>${cat.average.toFixed(1)}</td><td>${cat.max}</td><td>${cat.percentage.toFixed(0)}%</td></tr>`).join('')}
  </table>
  
  <h2>Subject Performance</h2>
  <table>
    <tr><th>Subject</th><th>Average</th></tr>
    ${subjectAverages.map(sub => `<tr><td>${sub.fullName}</td><td>${sub.average.toFixed(1)}%</td></tr>`).join('')}
  </table>
  
  <h2>Grade Distribution</h2>
  <table>
    <tr><th>Grade</th><th>Count</th></tr>
    ${gradeDistribution.map(g => `<tr><td>${g.range}</td><td>${g.count}</td></tr>`).join('')}
  </table>
  
  <div class="section strength">
    <h3>✅ Strengths</h3>
    <ul>
      ${bestSubject ? `<li><strong>${bestSubject.fullName}</strong> is the strongest subject (avg: ${bestSubject.average.toFixed(0)}%)</li>` : ''}
      ${bestCategory ? `<li><strong>${bestCategory.name}</strong> scores are consistently high (${bestCategory.percentage.toFixed(0)}%)</li>` : ''}
      <li><strong>${rankedStudents.filter(s => s.score && s.score >= 80).length} students</strong> achieved B grade or higher</li>
    </ul>
  </div>
  
  <div class="section weakness">
    <h3>⚠️ Areas for Improvement</h3>
    <ul>
      ${worstSubject ? `<li><strong>${worstSubject.fullName}</strong> needs attention (avg: ${worstSubject.average.toFixed(0)}%)</li>` : ''}
      ${worstCategory ? `<li><strong>${worstCategory.name}</strong> is the weakest category (${worstCategory.percentage.toFixed(0)}%)</li>` : ''}
      ${atRiskStudents.length > 0 ? `<li><strong>${atRiskStudents.length} students</strong> are at risk of failing</li>` : ''}
    </ul>
  </div>
  
  <div class="section recommendation">
    <h3>💡 Recommendations</h3>
    <ul>
      ${worstSubject ? `<li>Schedule additional tutoring sessions for <strong>${worstSubject.fullName}</strong></li>` : ''}
      ${worstCategory ? `<li>Implement weekly <strong>${worstCategory.name.toLowerCase()}</strong> practice across all subjects</li>` : ''}
      ${atRiskStudents.length > 0 ? `<li>Arrange parent meetings for the ${atRiskStudents.length} at-risk students</li>` : ''}
      <li>Celebrate class achievements to boost morale and motivation</li>
    </ul>
  </div>
  
  <h2>Top Performers</h2>
  <table>
    <tr><th>Rank</th><th>Name</th><th>Score</th></tr>
    ${rankedStudents.slice(0, 5).map((s, i) => `<tr><td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td><td>${s.name}</td><td>${s.score}%</td></tr>`).join('')}
  </table>
  
  ${atRiskStudents.length > 0 ? `
  <h2>At-Risk Students</h2>
  <table>
    <tr><th>Name</th><th>Score</th></tr>
    ${atRiskStudents.map(s => `<tr><td>${s.name}</td><td>${s.score}%</td></tr>`).join('')}
  </table>
  ` : ''}
</body>
</html>
                          `;
                          
                          printWindow.document.write(htmlContent);
                          printWindow.document.close();
                          printWindow.focus();
                          setTimeout(() => {
                            printWindow.print();
                          }, 250);
                          
                          toast({
                            title: "PDF Ready",
                            description: "Use 'Save as PDF' in the print dialog",
                          });
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ==================== TRENDS SUB-TAB ==================== */}
              <TabsContent value="trends" className="space-y-4">
                {/* Class Selector */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherProfile.classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Year-Over-Year Trend Comparison */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Year-Over-Year Trend
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Class average performance across years</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Score Trend */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Overall Score</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={yearOverYearData[selectedClass as keyof typeof yearOverYearData] || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line 
                              type="monotone" 
                              dataKey="midYear" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))", r: 4 }}
                              name="Mid-Year"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="yearEnd" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={{ fill: "#10b981", r: 4 }}
                              name="Year-End"
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Trend */}
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Category Breakdown</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={categoryYearOverYear[selectedClass as keyof typeof categoryYearOverYear] || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} width={30} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line 
                              type="monotone" 
                              dataKey="attitude" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name="Attitude (/10)"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="homework" 
                              stroke="#f59e0b" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name="Homework (/10)"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="quiz" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name="Quiz (/10)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Trend insight */}
                      {(() => {
                        const data = categoryYearOverYear[selectedClass as keyof typeof categoryYearOverYear] || [];
                        if (data.length < 2) return null;
                        const latest = data[data.length - 1];
                        const previous = data[data.length - 2];
                        const attitudeChange = latest.attitude - previous.attitude;
                        const homeworkChange = latest.homework - previous.homework;
                        const quizChange = latest.quiz - previous.quiz;
                        
                        const improvements = [];
                        if (attitudeChange > 0) improvements.push(`Attitude +${attitudeChange.toFixed(1)}`);
                        if (homeworkChange > 0) improvements.push(`Homework +${homeworkChange.toFixed(1)}`);
                        if (quizChange > 0) improvements.push(`Quiz +${quizChange.toFixed(1)}`);
                        
                        return improvements.length > 0 ? (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 mt-3">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <p className="text-xs text-emerald-700">
                              <span className="font-medium">Improvements:</span> {improvements.join(", ")}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
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

// Grade colors for charts
const GRADE_COLORS = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};
