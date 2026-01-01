import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function TeacherAcademicPage() {
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [selectedSubject, setSelectedSubject] = useState(teacherProfile.subjects[0]);
  const [selectedExam, setSelectedExam] = useState<"midYear" | "yearEnd">("midYear");
  const [grades, setGrades] = useState<Record<string, string>>({});

  const students = classRosters[selectedClass as keyof typeof classRosters] || [];
  const existingGrades = classGrades[selectedClass as keyof typeof classGrades] || {};

  const handleGradeChange = (studentId: string, value: string) => {
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) <= 100)) {
      setGrades(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSaveGrades = () => {
    const filledGrades = Object.entries(grades).filter(([_, v]) => v !== "");
    if (filledGrades.length === 0) {
      toast({
        title: "No Grades to Save",
        description: "Please enter at least one grade before saving.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Grades Saved",
      description: `${filledGrades.length} grades saved for Class ${selectedClass} - ${selectedSubject}.`,
    });
    setGrades({});
  };

  // Calculate class statistics
  const allGrades = Object.values(existingGrades)
    .map(g => g.midYear)
    .filter((g): g is number => g !== null);
  
  const classAverage = allGrades.length > 0 
    ? Math.round(allGrades.reduce((a, b) => a + b, 0) / allGrades.length) 
    : 0;
  const highestScore = allGrades.length > 0 ? Math.max(...allGrades) : 0;
  const lowestScore = allGrades.length > 0 ? Math.min(...allGrades) : 0;

  // Grade distribution for chart
  const gradeDistribution = [
    { range: "A (90-100)", count: allGrades.filter(g => g >= 90).length, color: "hsl(var(--chart-1))" },
    { range: "B (80-89)", count: allGrades.filter(g => g >= 80 && g < 90).length, color: "hsl(var(--chart-2))" },
    { range: "C (70-79)", count: allGrades.filter(g => g >= 70 && g < 80).length, color: "hsl(var(--chart-3))" },
    { range: "D (60-69)", count: allGrades.filter(g => g >= 60 && g < 70).length, color: "hsl(var(--chart-4))" },
    { range: "F (<60)", count: allGrades.filter(g => g < 60).length, color: "hsl(var(--chart-5))" },
  ];

  // Student ranking
  const rankedStudents = students
    .map(s => ({
      ...s,
      score: existingGrades[s.id]?.midYear || null
    }))
    .filter(s => s.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

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

      <div className="px-4 mt-4">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="entry">Grade Entry</TabsTrigger>
            <TabsTrigger value="analysis">Class Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-3 gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherProfile.classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {teacherProfile.subjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedExam} onValueChange={(v) => setSelectedExam(v as "midYear" | "yearEnd")}>
                <SelectTrigger>
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midYear">Mid-Year</SelectItem>
                  <SelectItem value="yearEnd">Year-End</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Entry List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Enter Grades - {selectedSubject} ({selectedExam === "midYear" ? "Mid-Year" : "Year-End"})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.map((student, index) => {
                  const existing = existingGrades[student.id]?.[selectedExam];
                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <span className="font-medium text-foreground">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {existing && (
                          <span className="text-sm text-muted-foreground">
                            Current: {existing}
                          </span>
                        )}
                        <Input
                          type="text"
                          placeholder="0-100"
                          value={grades[student.id] || ""}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-20 text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={handleSaveGrades}>
              <Save className="h-4 w-4 mr-2" />
              Save Grades
            </Button>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Class Selector */}
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

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Minus className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{classAverage}</p>
                  <p className="text-xs text-muted-foreground">Class Average</p>
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

            {/* Grade Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis allowDecimals={false} className="text-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Student Ranking */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Student Ranking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rankedStudents.slice(0, 5).map((student, index) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${
                        index === 0 ? "text-amber-500" : 
                        index === 1 ? "text-slate-400" : 
                        index === 2 ? "text-amber-700" : "text-muted-foreground"
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="font-medium text-foreground">{student.name}</span>
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
