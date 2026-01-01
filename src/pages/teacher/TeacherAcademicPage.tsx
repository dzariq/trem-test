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
import { 
  Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, 
  Users, Target, Award, AlertTriangle, BookOpen, BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, classGrades, detailedClassGrades } from "@/data/teacherMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {teacherProfile.classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
