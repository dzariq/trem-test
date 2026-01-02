import { useState, useMemo } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Check, X, Clock, AlertCircle, Save, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import schoolLogo from "@/assets/school-badge.png";
import { teacherProfile, classRosters, teacherAttendanceStats } from "@/data/teacherMockData";
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
  const [selectedDayStats, setSelectedDayStats] = useState<{
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  } | null>(null);
  

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
          "p-2 rounded-lg transition-all duration-200 flex items-center justify-center",
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

  return (
    <TeacherAppLayout>
      <AppHeader 
        showBack
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
          </div>
        }
      />

      {/* Tab Buttons */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Present: {presentCount}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Absent: {absentCount}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Late: {lateCount}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Excused: {excusedCount}
            </Badge>
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
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-medium text-primary">{index + 1}</span>
                    <span className="font-medium text-foreground">{student.name}</span>
                  </div>
                  <div className="flex gap-1.5">
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
                              <div className="flex items-center gap-3 text-xs mb-2">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Check className="h-3 w-3" /> {item.present}
                                </span>
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                  <X className="h-3 w-3" /> {item.absent}
                                </span>
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                  <Clock className="h-3 w-3" /> {item.late}
                                </span>
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                  <AlertCircle className="h-3 w-3" /> {item.excused}
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
        </div>
      )}

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDayStats} onOpenChange={(open) => !open && setSelectedDayStats(null)}>
        <DialogContent className="max-w-sm mx-auto">
          {selectedDayStats && (() => {
            const dayDate = parseISO(selectedDayStats.date);
            const total = selectedDayStats.present + selectedDayStats.absent + selectedDayStats.late + selectedDayStats.excused;
            const attendanceRate = total > 0 ? Math.round((selectedDayStats.present / total) * 100) : 0;
            const presentPct = total > 0 ? (selectedDayStats.present / total) * 100 : 0;
            const absentPct = total > 0 ? (selectedDayStats.absent / total) * 100 : 0;
            const latePct = total > 0 ? (selectedDayStats.late / total) * 100 : 0;
            const excusedPct = total > 0 ? (selectedDayStats.excused / total) * 100 : 0;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    {format(dayDate, "EEEE, MMMM d, yyyy")}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Attendance Rate Highlight */}
                  <div className="text-center py-4 rounded-xl bg-muted/50">
                    <span className="text-4xl font-bold text-foreground">{attendanceRate}%</span>
                    <p className="text-sm text-muted-foreground mt-1">Attendance Rate</p>
                  </div>
                  
                  {/* Large Progress Bar */}
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 transition-all" />
                    <div style={{ width: `${absentPct}%` }} className="bg-red-500 transition-all" />
                    <div style={{ width: `${latePct}%` }} className="bg-amber-500 transition-all" />
                    <div style={{ width: `${excusedPct}%` }} className="bg-purple-500 transition-all" />
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Check className="h-5 w-5 text-emerald-600" />
                        <span className="text-2xl font-bold text-emerald-600">{selectedDayStats.present}</span>
                      </div>
                      <p className="text-xs text-emerald-600/80">Present</p>
                      <p className="text-xs text-emerald-600/60 mt-0.5">{Math.round(presentPct)}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <X className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-600">{selectedDayStats.absent}</span>
                      </div>
                      <p className="text-xs text-red-600/80">Absent</p>
                      <p className="text-xs text-red-600/60 mt-0.5">{Math.round(absentPct)}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span className="text-2xl font-bold text-amber-600">{selectedDayStats.late}</span>
                      </div>
                      <p className="text-xs text-amber-600/80">Late</p>
                      <p className="text-xs text-amber-600/60 mt-0.5">{Math.round(latePct)}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <AlertCircle className="h-5 w-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">{selectedDayStats.excused}</span>
                      </div>
                      <p className="text-xs text-purple-600/80">Excused</p>
                      <p className="text-xs text-purple-600/60 mt-0.5">{Math.round(excusedPct)}%</p>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="text-center pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Total Students: <span className="font-semibold text-foreground">{total}</span></span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
}