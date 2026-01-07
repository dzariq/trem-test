import { useState, useMemo, useRef } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Check, X, Clock, AlertCircle, Save, ChevronLeft, ChevronRight as ChevronRightIcon, Users, FileText, TrendingUp, Printer } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import collinzLogo from "@/assets/collinz-school-logo.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";
import { format, startOfWeek, endOfWeek, isToday, parseISO, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import { teacherProfile, classRosters, teacherAttendanceStats, DailyAttendanceDetail } from "@/data/teacherMockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type TabType = "take" | "statistics";

const chartConfig = {
  present: { label: "Present", color: "hsl(142, 76%, 36%)" },
  absent: { label: "Absent", color: "hsl(0, 84%, 60%)" },
  late: { label: "Late", color: "hsl(45, 93%, 47%)" },
  excused: { label: "Excused", color: "hsl(262, 83%, 58%)" },
};

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("take");
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  
  // Statistics state
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDayStats, setSelectedDayStats] = useState<DailyAttendanceDetail | null>(null);
  
  // Report states
  const [weeklyAbsentDialogOpen, setWeeklyAbsentDialogOpen] = useState(false);
  const [weeklyAbsentReportOpen, setWeeklyAbsentReportOpen] = useState(false);
  const [selectedReportWeek, setSelectedReportWeek] = useState<Date>(new Date());
  const [frequentAbsentReportOpen, setFrequentAbsentReportOpen] = useState(false);
  
  const weeklyReportRef = useRef<HTMLDivElement>(null);
  const frequentReportRef = useRef<HTMLDivElement>(null);
  

  const students = classRosters[selectedClass as keyof typeof classRosters] || [];
  const statsData = teacherAttendanceStats[selectedClass as keyof typeof teacherAttendanceStats];

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const getStatusButton = (studentId: string, status: AttendanceStatus, icon: React.ReactNode, label: string, activeColor: string) => {
    const isActive = attendance[studentId] === status;
    return (
      <button
        onClick={() => handleStatusChange(studentId, status)}
        className={cn(
          "w-12 h-10 rounded-lg transition-all duration-200 flex items-center justify-center",
          isActive ? activeColor : "bg-muted hover:bg-muted/80"
        )}
        title={label}
      >
        {icon}
      </button>
    );
  };

  const handleSubmit = () => {
    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length > 0) {
      toast({
        title: "Incomplete Attendance",
        description: `${unmarked.length} students haven't been marked yet.`,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Attendance Submitted",
      description: `Attendance for Class ${selectedClass} on ${format(selectedDate, "PPP")} has been saved.`,
    });
  };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const lateCount = Object.values(attendance).filter(s => s === "late").length;
  const excusedCount = Object.values(attendance).filter(s => s === "excused").length;

  // Statistics calculations
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const chartData = statsData?.monthly || [];

  const monthlySummary = useMemo(() => {
    if (!statsData) return { present: 0, absent: 0, late: 0, excused: 0 };
    const monthData = statsData.monthly[selectedMonth] || { present: 0, absent: 0, late: 0, excused: 0 };
    return monthData;
  }, [statsData, selectedMonth]);

  const dailyBreakdown = useMemo(() => {
    if (!statsData) return [];
    return statsData.dailyBreakdown;
  }, [statsData]);

  const groupByWeek = (items: typeof dailyBreakdown) => {
    const groups: Record<string, typeof items> = {};
    items.forEach(item => {
      const date = parseISO(item.date);
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      if (!groups[weekStart]) groups[weekStart] = [];
      groups[weekStart].push(item);
    });
    return Object.entries(groups).map(([weekStart, items]) => ({
      weekStart: parseISO(weekStart),
      weekEnd: endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }),
      items,
    }));
  };

  const weeklyGroups = groupByWeek(dailyBreakdown);

  const goToPrevMonth = () => setSelectedMonth(m => (m === 0 ? 11 : m - 1));
  const goToNextMonth = () => setSelectedMonth(m => (m === 11 ? 0 : m + 1));

  // Weekly Absent Report Data
  const weeklyAbsentData = useMemo(() => {
    const weekStart = startOfWeek(selectedReportWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedReportWeek, { weekStartsOn: 1 });
    
    const weekDays = dailyBreakdown.filter(day => {
      const date = parseISO(day.date);
      return date >= weekStart && date <= weekEnd;
    });
    
    const absentByDay = weekDays.map(day => ({
      date: day.date,
      absentStudents: day.students?.filter(s => 
        s.status === "absent" || s.status === "excused"
      ) || []
    }));

    const totalAbsences = absentByDay.reduce((sum, day) => sum + day.absentStudents.length, 0);
    const uniqueStudents = new Set(absentByDay.flatMap(d => d.absentStudents.map(s => s.id))).size;

    return { weekStart, weekEnd, absentByDay, totalAbsences, uniqueStudents };
  }, [dailyBreakdown, selectedReportWeek]);

  // Frequent Absent/Late Data
  const frequentAbsentLateData = useMemo(() => {
    const studentStats: Record<string, {
      name: string;
      absent: number;
      late: number;
      excused: number;
      totalDays: number;
    }> = {};
    
    dailyBreakdown.forEach(day => {
      day.students?.forEach(student => {
        if (!studentStats[student.id]) {
          studentStats[student.id] = {
            name: student.name,
            absent: 0,
            late: 0,
            excused: 0,
            totalDays: 0
          };
        }
        studentStats[student.id].totalDays++;
        if (student.status === "absent") studentStats[student.id].absent++;
        if (student.status === "late") studentStats[student.id].late++;
        if (student.status === "excused") studentStats[student.id].excused++;
      });
    });
    
    const students = Object.entries(studentStats).map(([id, stats]) => ({
      id,
      ...stats,
      absentRate: stats.totalDays > 0 ? (stats.absent / stats.totalDays) * 100 : 0,
      lateRate: stats.totalDays > 0 ? (stats.late / stats.totalDays) * 100 : 0
    }));
    
    return {
      topAbsent: [...students].sort((a, b) => b.absent - a.absent).slice(0, 10).filter(s => s.absent > 0),
      topLate: [...students].sort((a, b) => b.late - a.late).slice(0, 10).filter(s => s.late > 0)
    };
  }, [dailyBreakdown]);

  const handlePrintWeeklyReport = () => {
    const printContent = weeklyReportRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Weekly Absent Report</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;line-height:1.5;}@page{size:A4;margin:12mm;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handlePrintFrequentReport = () => {
    const printContent = frequentReportRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Attendance Concerns Report</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;line-height:1.5;}@page{size:A4;margin:12mm;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
          </div>
        }
      />

      {/* Tab Buttons */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("take")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === "take"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Take Attendance
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === "statistics"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "take" ? (
        <div className="px-4 space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {teacherProfile.classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="center" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center rounded-md border bg-emerald-50 border-emerald-200 py-2 px-1">
              <span className="text-xs font-medium text-emerald-700">Present</span>
              <span className="text-lg font-bold text-emerald-700">{presentCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-md border bg-red-50 border-red-200 py-2 px-1">
              <span className="text-xs font-medium text-red-700">Absent</span>
              <span className="text-lg font-bold text-red-700">{absentCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-md border bg-amber-50 border-amber-200 py-2 px-1">
              <span className="text-xs font-medium text-amber-700">Late</span>
              <span className="text-lg font-bold text-amber-700">{lateCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-md border bg-purple-50 border-purple-200 py-2 px-1">
              <span className="text-xs font-medium text-purple-700">Excused</span>
              <span className="text-lg font-bold text-purple-700">{excusedCount}</span>
            </div>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Class {selectedClass} ({students.length} students)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {students.map((student, index) => (
                <div 
                  key={student.id} 
                  className="flex flex-col p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">{index + 1}</span>
                    <span className="font-medium text-foreground text-sm">{student.name}</span>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {getStatusButton(
                      student.id,
                      "present",
                      <Check className="h-4 w-4 text-white" />,
                      "Present",
                      "bg-emerald-500"
                    )}
                    {getStatusButton(
                      student.id,
                      "absent",
                      <X className="h-4 w-4 text-white" />,
                      "Absent",
                      "bg-red-500"
                    )}
                    {getStatusButton(
                      student.id,
                      "late",
                      <Clock className="h-4 w-4 text-white" />,
                      "Late",
                      "bg-amber-500"
                    )}
                    {getStatusButton(
                      student.id,
                      "excused",
                      <AlertCircle className="h-4 w-4 text-white" />,
                      "Excused",
                      "bg-purple-500"
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
          >
            <Save className="h-4 w-4 mr-2" />
            Submit Attendance
          </Button>
        </div>
      ) : (
        <div className="px-4 space-y-4 mt-4 pb-4">
          {/* Class Selector for Statistics */}
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

          {/* Yearly Overview Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Yearly Overview</CardTitle>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="present" stackId="a" fill="hsl(142, 76%, 36%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" stackId="a" fill="hsl(45, 93%, 47%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="excused" stackId="a" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <CardTitle className="text-base">{monthNames[selectedMonth]} {selectedYear}</CardTitle>
                <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <span className="text-2xl font-bold text-emerald-600">{monthlySummary.present}</span>
                  <span className="text-xs text-emerald-600/80">Present</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-red-50 dark:bg-red-950/30">
                  <span className="text-2xl font-bold text-red-600">{monthlySummary.absent}</span>
                  <span className="text-xs text-red-600/80">Absent</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  <span className="text-2xl font-bold text-amber-600">{monthlySummary.late}</span>
                  <span className="text-xs text-amber-600/80">Late</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                  <span className="text-2xl font-bold text-purple-600">{monthlySummary.excused}</span>
                  <span className="text-xs text-purple-600/80">Excused</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weekly Groups */}
              {weeklyGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records found</p>
              ) : (
                <div className="space-y-4">
                  {weeklyGroups.map((week, idx) => (
                    <div key={idx} className="space-y-2">
                      {/* Week Separator */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          Week of {format(week.weekStart, "MMM d")}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      {/* Days - 2 per row */}
                      <div className="grid grid-cols-2 gap-2">
                        {week.items.map((item, itemIdx) => {
                          const itemDate = parseISO(item.date);
                          const isTodayItem = isToday(itemDate);
                          const total = item.present + item.absent + item.late + item.excused;
                          const attendanceRate = total > 0 ? Math.round((item.present / total) * 100) : 0;
                          const presentPct = total > 0 ? (item.present / total) * 100 : 0;
                          const absentPct = total > 0 ? (item.absent / total) * 100 : 0;
                          const latePct = total > 0 ? (item.late / total) * 100 : 0;
                          const excusedPct = total > 0 ? (item.excused / total) * 100 : 0;
                          
                          return (
                            <div
                              key={itemIdx}
                              onClick={() => setSelectedDayStats(item)}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                                isTodayItem 
                                  ? "ring-2 ring-primary/50 border-primary/30 bg-primary/5" 
                                  : "bg-card border-border/50 hover:border-border"
                              )}
                            >
                              {/* Date Header */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-foreground">
                                  {format(itemDate, "EEE, d")}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isTodayItem && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-0">
                                      Today
                                    </Badge>
                                  )}
                                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="h-2 rounded-full bg-muted overflow-hidden flex mb-3">
                                <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 transition-all" />
                                <div style={{ width: `${absentPct}%` }} className="bg-red-500 transition-all" />
                                <div style={{ width: `${latePct}%` }} className="bg-amber-500 transition-all" />
                                <div style={{ width: `${excusedPct}%` }} className="bg-purple-500 transition-all" />
                              </div>
                              
                              {/* Inline Stats */}
                              <div className="flex items-center justify-between text-[11px] mb-2">
                                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Check className="h-3 w-3" />{item.present}
                                </span>
                                <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400 font-medium">
                                  <X className="h-3 w-3" />{item.absent}
                                </span>
                                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                                  <Clock className="h-3 w-3" />{item.late}
                                </span>
                                <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                                  <AlertCircle className="h-3 w-3" />{item.excused}
                                </span>
                              </div>
                              
                              {/* Attendance Rate */}
                              <p className="text-xs text-muted-foreground">
                                {attendanceRate}% Attendance
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Reports Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Generate Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setWeeklyAbsentDialogOpen(true)}
                className="w-full p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Weekly Absent Report</p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Generate absence report for a selected week</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setFrequentAbsentReportOpen(true)}
                className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Frequent Absent/Late Report</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">View students with highest absence and late counts</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDayStats} onOpenChange={(open) => !open && setSelectedDayStats(null)}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] flex flex-col">
          {selectedDayStats && (() => {
            const dayDate = parseISO(selectedDayStats.date);
            const total = selectedDayStats.present + selectedDayStats.absent + selectedDayStats.late + selectedDayStats.excused;
            const attendanceRate = total > 0 ? Math.round((selectedDayStats.present / total) * 100) : 0;
            const presentPct = total > 0 ? (selectedDayStats.present / total) * 100 : 0;
            const absentPct = total > 0 ? (selectedDayStats.absent / total) * 100 : 0;
            const latePct = total > 0 ? (selectedDayStats.late / total) * 100 : 0;
            const excusedPct = total > 0 ? (selectedDayStats.excused / total) * 100 : 0;

            // Group students by status
            const studentsByStatus = {
              present: selectedDayStats.students?.filter(s => s.status === "present") || [],
              absent: selectedDayStats.students?.filter(s => s.status === "absent") || [],
              late: selectedDayStats.students?.filter(s => s.status === "late") || [],
              excused: selectedDayStats.students?.filter(s => s.status === "excused") || [],
            };
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    {format(dayDate, "EEEE, MMMM d, yyyy")}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-4 pb-4">
                    {/* Attendance Rate Highlight */}
                    <div className="text-center py-3 rounded-xl bg-muted/50">
                      <span className="text-3xl font-bold text-foreground">{attendanceRate}%</span>
                      <p className="text-xs text-muted-foreground mt-1">Attendance Rate</p>
                    </div>
                    
                    {/* Large Progress Bar */}
                    <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                      <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 transition-all" />
                      <div style={{ width: `${absentPct}%` }} className="bg-red-500 transition-all" />
                      <div style={{ width: `${latePct}%` }} className="bg-amber-500 transition-all" />
                      <div style={{ width: `${excusedPct}%` }} className="bg-purple-500 transition-all" />
                    </div>
                    
                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                        <Check className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-emerald-600">{selectedDayStats.present}</span>
                        <p className="text-[10px] text-emerald-600/80">Present</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                        <X className="h-4 w-4 text-red-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-red-600">{selectedDayStats.absent}</span>
                        <p className="text-[10px] text-red-600/80">Absent</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <Clock className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-amber-600">{selectedDayStats.late}</span>
                        <p className="text-[10px] text-amber-600/80">Late</p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                        <AlertCircle className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-purple-600">{selectedDayStats.excused}</span>
                        <p className="text-[10px] text-purple-600/80">Excused</p>
                      </div>
                    </div>
                    
                    {/* Student List by Status */}
                    {selectedDayStats.students && selectedDayStats.students.length > 0 && (
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="w-full grid grid-cols-5 h-9 bg-muted/50">
                          <TabsTrigger value="all" className="text-xs px-1">
                            <Users className="h-3 w-3 mr-1" />All
                          </TabsTrigger>
                          <TabsTrigger value="present" className="text-xs px-1">
                            <Check className="h-3 w-3 mr-1" />{studentsByStatus.present.length}
                          </TabsTrigger>
                          <TabsTrigger value="absent" className="text-xs px-1">
                            <X className="h-3 w-3 mr-1" />{studentsByStatus.absent.length}
                          </TabsTrigger>
                          <TabsTrigger value="late" className="text-xs px-1">
                            <Clock className="h-3 w-3 mr-1" />{studentsByStatus.late.length}
                          </TabsTrigger>
                          <TabsTrigger value="excused" className="text-xs px-1">
                            <AlertCircle className="h-3 w-3 mr-1" />{studentsByStatus.excused.length}
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="mt-3">
                          <div className="space-y-1.5">
                            {selectedDayStats.students.map((student, idx) => {
                              const statusConfig = {
                                present: { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", iconBg: "bg-emerald-100 dark:bg-emerald-900/50", iconColor: "text-emerald-600", Icon: Check },
                                absent: { bg: "bg-red-50/50 dark:bg-red-950/20", iconBg: "bg-red-100 dark:bg-red-900/50", iconColor: "text-red-600", Icon: X },
                                late: { bg: "bg-amber-50/50 dark:bg-amber-950/20", iconBg: "bg-amber-100 dark:bg-amber-900/50", iconColor: "text-amber-600", Icon: Clock },
                                excused: { bg: "bg-purple-50/50 dark:bg-purple-950/20", iconBg: "bg-purple-100 dark:bg-purple-900/50", iconColor: "text-purple-600", Icon: AlertCircle },
                              };
                              const config = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.present;
                              const StatusIcon = config.Icon;
                              return (
                                <div key={student.id} className={`flex items-center gap-2 p-2 rounded-lg ${config.bg}`}>
                                  <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                                  <div className={`h-6 w-6 rounded-full ${config.iconBg} flex items-center justify-center`}>
                                    <StatusIcon className={`h-3 w-3 ${config.iconColor}`} />
                                  </div>
                                  <span className="text-sm text-foreground flex-1">{student.name}</span>
                                  <span className={`text-xs capitalize ${config.iconColor}`}>{student.status}</span>
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="present" className="mt-3">
                          <div className="space-y-1.5">
                            {studentsByStatus.present.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No students</p>
                            ) : (
                              studentsByStatus.present.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  </div>
                                  <span className="text-sm text-foreground">{student.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="absent" className="mt-3">
                          <div className="space-y-1.5">
                            {studentsByStatus.absent.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No absent students</p>
                            ) : (
                              studentsByStatus.absent.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                                  <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                    <X className="h-3 w-3 text-red-600" />
                                  </div>
                                  <span className="text-sm text-foreground">{student.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="late" className="mt-3">
                          <div className="space-y-1.5">
                            {studentsByStatus.late.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No late students</p>
                            ) : (
                              studentsByStatus.late.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                  </div>
                                  <span className="text-sm text-foreground">{student.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="excused" className="mt-3">
                          <div className="space-y-1.5">
                            {studentsByStatus.excused.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No excused students</p>
                            ) : (
                              studentsByStatus.excused.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                                  <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                    <AlertCircle className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="text-sm text-foreground">{student.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                    
                    {/* Total */}
                    <div className="text-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Total Students: <span className="font-semibold text-foreground">{total}</span></span>
                    </div>
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Weekly Absent Report - Week Selection Dialog */}
      <Dialog open={weeklyAbsentDialogOpen} onOpenChange={setWeeklyAbsentDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Select Week for Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <button
                onClick={() => setSelectedReportWeek(subWeeks(selectedReportWeek, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {format(startOfWeek(selectedReportWeek, { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(selectedReportWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">Week of {format(startOfWeek(selectedReportWeek, { weekStartsOn: 1 }), "MMMM d")}</p>
              </div>
              <button
                onClick={() => setSelectedReportWeek(addWeeks(selectedReportWeek, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Class: <span className="font-semibold text-foreground">{selectedClass}</span>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => {
                setWeeklyAbsentDialogOpen(false);
                setWeeklyAbsentReportOpen(true);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Absent Report - Printable Dialog */}
      <Dialog open={weeklyAbsentReportOpen} onOpenChange={setWeeklyAbsentReportOpen}>
        <DialogContent className="w-full max-w-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
            <DialogTitle className="text-sm sm:text-base">Weekly Absent Report</DialogTitle>
            <Button onClick={handlePrintWeeklyReport} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 py-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
            <div className="flex justify-center">
              <div ref={weeklyReportRef} className="bg-white rounded-lg shadow-lg" style={{ width: 'min(100%, 210mm)', padding: '20px', fontSize: '11px', color: '#1a1a1a' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #065f46', paddingBottom: '12px', marginBottom: '16px' }}>
                  <img src={collinzLogo} alt="Collinz School" style={{ height: '45px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#065f46', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Weekly Absence Report</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>
                      {format(weeklyAbsentData.weekStart, "MMM d")} - {format(weeklyAbsentData.weekEnd, "MMM d, yyyy")}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Class {selectedClass}</div>
                  </div>
                  <img src={cambridgeLogo} alt="Cambridge Assessment" style={{ height: '40px', objectFit: 'contain' }} />
                </div>

                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{weeklyAbsentData.totalAbsences}</div>
                    <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: '500' }}>Total Absences</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>{weeklyAbsentData.uniqueStudents}</div>
                    <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '500' }}>Students Affected</div>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#065f46' }}>Daily Breakdown</span>
                  </div>
                  
                  {weeklyAbsentData.absentByDay.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No attendance data for selected week</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Student Name</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyAbsentData.absentByDay.flatMap((day, dayIdx) =>
                          day.absentStudents.length === 0 ? (
                            <tr key={`${day.date}-empty`} style={{ background: dayIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                                {format(parseISO(day.date), "EEE, MMM d")}
                              </td>
                              <td colSpan={2} style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', color: '#16a34a', fontStyle: 'italic' }}>
                                All students present
                              </td>
                            </tr>
                          ) : (
                            day.absentStudents.map((student, idx) => (
                              <tr key={`${day.date}-${student.id}`} style={{ background: dayIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                                  {idx === 0 ? format(parseISO(day.date), "EEE, MMM d") : ''}
                                </td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>{student.name}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                                  <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '9px', 
                                    fontWeight: '600',
                                    background: student.status === 'absent' ? '#fee2e2' : '#ede9fe',
                                    color: student.status === 'absent' ? '#dc2626' : '#7c3aed'
                                  }}>
                                    {student.status === 'absent' ? 'Absent' : 'Excused'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '16px', fontSize: '9px', color: '#9ca3af', textAlign: 'center' }}>
                  This is a computer-generated report. Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Frequent Absent/Late Report Dialog */}
      <Dialog open={frequentAbsentReportOpen} onOpenChange={setFrequentAbsentReportOpen}>
        <DialogContent className="w-full max-w-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
            <DialogTitle className="text-sm sm:text-base">Attendance Concerns Report</DialogTitle>
            <Button onClick={handlePrintFrequentReport} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 py-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
            <div className="flex justify-center">
              <div ref={frequentReportRef} className="bg-white rounded-lg shadow-lg" style={{ width: 'min(100%, 210mm)', padding: '20px', fontSize: '11px', color: '#1a1a1a' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #065f46', paddingBottom: '12px', marginBottom: '16px' }}>
                  <img src={collinzLogo} alt="Collinz School" style={{ height: '45px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#065f46', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Attendance Concerns Report</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>Class {selectedClass}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{selectedYear} Academic Year</div>
                  </div>
                  <img src={cambridgeLogo} alt="Cambridge Assessment" style={{ height: '40px', objectFit: 'contain' }} />
                </div>

                {/* Top Absent Students */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #dc2626' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>Top Absent Students</span>
                  </div>
                  
                  {frequentAbsentLateData.topAbsent.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#16a34a', background: '#f0fdf4', borderRadius: '8px' }}>
                      No students with absences recorded
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                      <thead>
                        <tr style={{ background: '#fef2f2' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fecaca', width: '50px' }}>Rank</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #fecaca' }}>Student Name</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fecaca' }}>Total Absences</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fecaca' }}>Absence Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frequentAbsentLateData.topAbsent.map((student, idx) => (
                          <tr key={student.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fef2f2' }}>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>{student.name}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#dc2626' }}>{student.absent}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{student.absentRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Top Late Students */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #d97706' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706' }}>Top Late Students</span>
                  </div>
                  
                  {frequentAbsentLateData.topLate.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#16a34a', background: '#f0fdf4', borderRadius: '8px' }}>
                      No students with late arrivals recorded
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                      <thead>
                        <tr style={{ background: '#fef3c7' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fde68a', width: '50px' }}>Rank</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #fde68a' }}>Student Name</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fde68a' }}>Total Late</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #fde68a' }}>Late Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frequentAbsentLateData.topLate.map((student, idx) => (
                          <tr key={student.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fef3c7' }}>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>{student.name}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#d97706' }}>{student.late}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{student.lateRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '16px', fontSize: '9px', color: '#9ca3af', textAlign: 'center' }}>
                  This is a computer-generated report. Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
}