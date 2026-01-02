import { useState, useMemo } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, X, Clock, AlertCircle, Save, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Timer, FileCheck } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");

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

  const filteredBreakdown = useMemo(() => {
    if (!statsData) return [];
    return statsData.dailyBreakdown.filter(item => 
      statusFilter === "all" || item.status === statusFilter
    );
  }, [statsData, statusFilter]);

  const groupByWeek = (items: typeof filteredBreakdown) => {
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

  const weeklyGroups = groupByWeek(filteredBreakdown);

  const goToPrevMonth = () => setSelectedMonth(m => (m === 0 ? 11 : m - 1));
  const goToNextMonth = () => setSelectedMonth(m => (m === 11 ? 0 : m + 1));

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present": return "bg-emerald-500";
      case "absent": return "bg-red-500";
      case "late": return "bg-amber-500";
      case "excused": return "bg-purple-500";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "absent": return <XCircle className="h-4 w-4 text-red-600" />;
      case "late": return <Timer className="h-4 w-4 text-amber-600" />;
      case "excused": return <FileCheck className="h-4 w-4 text-purple-600" />;
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusCounts = useMemo(() => {
    if (!statsData) return { present: 0, absent: 0, late: 0, excused: 0 };
    return statsData.dailyBreakdown.reduce((acc, item) => {
      acc[item.status]++;
      return acc;
    }, { present: 0, absent: 0, late: 0, excused: 0 });
  }, [statsData]);

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
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
              {/* Filter Chips */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "present", "absent", "late", "excused"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      statusFilter === status
                        ? status === "all"
                          ? "bg-primary text-primary-foreground"
                          : status === "present"
                          ? "bg-emerald-500 text-white"
                          : status === "absent"
                          ? "bg-red-500 text-white"
                          : status === "late"
                          ? "bg-amber-500 text-white"
                          : "bg-purple-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {status === "all" ? "All" : getStatusLabel(status)} ({status === "all" 
                      ? filteredBreakdown.length 
                      : statusCounts[status as AttendanceStatus]})
                  </button>
                ))}
              </div>

              {/* Weekly Groups */}
              {weeklyGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records found</p>
              ) : (
                <div className="space-y-4">
                  {weeklyGroups.map((week, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        {format(week.weekStart, "MMM d")} - {format(week.weekEnd, "MMM d, yyyy")}
                      </h4>
                      <div className="space-y-2">
                        {week.items.map((item, itemIdx) => {
                          const itemDate = parseISO(item.date);
                          const isTodayItem = isToday(itemDate);
                          return (
                            <div
                              key={itemIdx}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card",
                                isTodayItem && "ring-2 ring-primary/20"
                              )}
                            >
                              <div className={cn("w-1 h-10 rounded-full", getStatusColor(item.status))} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-foreground truncate">{item.studentName}</span>
                                  {isTodayItem && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">Today</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{format(itemDate, "EEE, MMM d")}</span>
                                  {item.reason && <span>• {item.reason}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                <span className={cn(
                                  "text-xs font-medium",
                                  item.status === "present" && "text-emerald-600",
                                  item.status === "absent" && "text-red-600",
                                  item.status === "late" && "text-amber-600",
                                  item.status === "excused" && "text-purple-600",
                                )}>
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
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
    </TeacherAppLayout>
  );
}