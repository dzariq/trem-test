import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, classGrades } from "@/data/teacherMockData";
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

  const gradeDistribution = [
    { range: "A", count: allGrades.filter(g => g >= 90).length },
    { range: "B", count: allGrades.filter(g => g >= 80 && g < 90).length },
    { range: "C", count: allGrades.filter(g => g >= 70 && g < 80).length },
    { range: "D", count: allGrades.filter(g => g >= 60 && g < 70).length },
    { range: "F", count: allGrades.filter(g => g < 60).length },
  ];

  const rankedStudents = students
    .map(s => ({
      ...s,
      score: existingGrades[s.id]?.midYear || null
    }))
    .filter(s => s.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

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

            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Minus className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{classAverage}</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                  <p className="text-lg font-bold text-foreground">{highestScore}</p>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-600" />
                  <p className="text-lg font-bold text-foreground">{lowestScore}</p>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rankedStudents.slice(0, 5).map((student, index) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-bold w-6",
                        index === 0 ? "text-amber-500" : 
                        index === 1 ? "text-slate-400" : 
                        index === 2 ? "text-amber-700" : "text-muted-foreground"
                      )}>
                        #{index + 1}
                      </span>
                      <span className="font-medium text-foreground text-sm">{student.name}</span>
                    </div>
                    <span className="font-bold text-primary">{student.score}</span>
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
