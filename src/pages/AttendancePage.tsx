import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { attendanceData, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, Clock, CalendarOff } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type StatusFilter = "all" | "present" | "absent" | "late" | "excused";
type ZoomLevel = 3 | 6 | 12;

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(11);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(100);
  const [isPinching, setIsPinching] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);

  const yearOptions = ["2025", "2024", "2023"];
  const zoomOptions: { value: ZoomLevel; label: string }[] = [
    { value: 3, label: "3 Months" },
    { value: 6, label: "6 Months" },
    { value: 12, label: "12 Months" },
  ];

  const goToPrevMonth = () => {
    const newIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;
    setCurrentMonthIndex(newIndex);
    setSelectedMonth(months[newIndex]);
  };

  const goToNextMonth = () => {
    const newIndex = currentMonthIndex < 11 ? currentMonthIndex + 1 : 0;
    setCurrentMonthIndex(newIndex);
    setSelectedMonth(months[newIndex]);
  };

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const delta = newDistance - lastPinchDistance.current;
      
      if (Math.abs(delta) > 30) {
        if (delta > 0) {
          // Pinch out - zoom in (show fewer months)
          setZoomLevel(prev => prev === 12 ? 6 : prev === 6 ? 3 : 3);
        } else {
          // Pinch in - zoom out (show more months)
          setZoomLevel(prev => prev === 3 ? 6 : prev === 6 ? 12 : 12);
        }
        lastPinchDistance.current = newDistance;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    lastPinchDistance.current = null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-emerald-500 text-white";
      case "absent": return "bg-destructive text-destructive-foreground";
      case "late": return "bg-amber-400 text-white";
      case "excused": return "bg-purple-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <Check className="h-3 w-3" />;
      case "absent": return <X className="h-3 w-3" />;
      case "late": return <Clock className="h-3 w-3" />;
      case "excused": return <CalendarOff className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const allChartData = attendanceData.monthly.map(item => ({
    ...item,
    total: item.present + item.absent + item.late + item.excused
  }));

  // Get visible chart data based on zoom level
  const chartData = zoomLevel === 12 
    ? allChartData 
    : allChartData.slice(-zoomLevel);

  // Scroll to end when zoom changes
  useEffect(() => {
    if (chartContainerRef.current && zoomLevel < 12) {
      chartContainerRef.current.scrollLeft = chartContainerRef.current.scrollWidth;
    }
  }, [zoomLevel]);

  // Calculate monthly summary
  const monthlySummary = {
    present: attendanceData.dailyBreakdown.filter(d => d.status === "present").length,
    absent: attendanceData.dailyBreakdown.filter(d => d.status === "absent").length,
    late: attendanceData.dailyBreakdown.filter(d => d.status === "late").length,
    excused: attendanceData.dailyBreakdown.filter(d => d.status === "excused").length,
  };

  // Filter daily breakdown by status
  const filteredBreakdown = statusFilter === "all" 
    ? attendanceData.dailyBreakdown 
    : attendanceData.dailyBreakdown.filter(d => d.status === statusFilter);

  // Group by week
  const groupByWeek = (days: typeof attendanceData.dailyBreakdown) => {
    const weeks: { weekStart: string; days: typeof days }[] = [];
    let currentWeek: typeof days = [];
    let currentWeekStart = "";

    days.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 1 || index === 0) {
        if (currentWeek.length > 0) {
          weeks.push({ weekStart: currentWeekStart, days: currentWeek });
        }
        currentWeek = [day];
        currentWeekStart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        currentWeek.push(day);
      }
    });

    if (currentWeek.length > 0) {
      weeks.push({ weekStart: currentWeekStart, days: currentWeek });
    }

    return weeks;
  };

  const weeklyBreakdown = groupByWeek(filteredBreakdown);

  // Check if date is today
  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  const filterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: attendanceData.dailyBreakdown.length },
    { value: "present", label: "Present", count: monthlySummary.present },
    { value: "absent", label: "Absent", count: monthlySummary.absent },
    { value: "late", label: "Late", count: monthlySummary.late },
    { value: "excused", label: "Excused", count: monthlySummary.excused },
  ];

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
          </div>
        }
        rightContent={
          <Select defaultValue={students[0]?.id}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      
      {/* Attendance Chart */}
      <section className="px-4 pt-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Yearly Overview</CardTitle>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Zoom Level Pills */}
            <div className="flex justify-center gap-1 mt-2">
              {zoomOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={zoomLevel === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setZoomLevel(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={chartContainerRef}
              className="h-64 overflow-x-auto touch-pan-x select-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div style={{ width: zoomLevel === 12 ? '100%' : `${Math.max(100, zoomLevel * 20)}%`, minWidth: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap={zoomLevel === 3 ? "20%" : zoomLevel === 6 ? "15%" : "10%"}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: zoomLevel === 12 ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={6}
                    />
                    <Bar dataKey="present" stackId="a" fill="hsl(160, 84%, 39%)" name="Present" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" stackId="a" fill="hsl(var(--destructive))" name="Absent" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" stackId="a" fill="hsl(38, 92%, 50%)" name="Late" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="excused" stackId="a" fill="hsl(271, 91%, 65%)" name="Excused" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly Summary with Month Selector */}
      <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-4 space-y-4">
            {/* Month Selector */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-foreground">{selectedMonth} 2025</span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <p className="text-2xl font-bold" style={{ color: "hsl(160, 84%, 39%)" }}>{monthlySummary.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{monthlySummary.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <p className="text-2xl font-bold" style={{ color: "hsl(38, 92%, 40%)" }}>{monthlySummary.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                <p className="text-2xl font-bold" style={{ color: "hsl(271, 91%, 55%)" }}>{monthlySummary.excused}</p>
                <p className="text-xs text-muted-foreground">Excused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Daily Breakdown */}
      <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 h-8 text-xs"
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                  <span className="ml-1.5 bg-background/20 px-1.5 py-0.5 rounded-full text-[10px]">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>

            {/* Weekly Groups */}
            {weeklyBreakdown.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-2">
                {/* Week Separator */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    Week of {week.weekStart}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Days - 2 per row */}
                <div className="grid grid-cols-2 gap-2">
                  {week.days.map((day, dayIndex) => {
                    const date = new Date(day.date);
                    const today = isToday(day.date);

                    return (
                      <div 
                        key={dayIndex}
                        className={`flex items-center gap-2 p-2 rounded-md transition-all border ${
                          today 
                            ? "ring-2 ring-primary/50 " 
                            : ""
                        }${
                          day.status === 'present' ? "bg-emerald-100 border-emerald-300" :
                          day.status === 'absent' ? "bg-destructive/20 border-destructive/40" :
                          day.status === 'late' ? "bg-amber-100 border-amber-300" :
                          day.status === 'excused' ? "bg-purple-100 border-purple-300" :
                          "bg-muted/30 border-border/50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(day.status)}`}>
                          {getStatusIcon(day.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-xs">
                            {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                          </p>
                          {day.reason && (
                            <p className="text-[9px] text-muted-foreground truncate">{day.reason}</p>
                          )}
                        </div>
                        {today && (
                          <span className="text-[8px] font-medium text-primary shrink-0">Today</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
