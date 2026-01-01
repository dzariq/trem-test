import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, Clock, CalendarOff, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type StatusFilter = "all" | "present" | "absent" | "late" | "excused";

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(11);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-chart-1 text-card";
      case "absent": return "bg-destructive text-destructive-foreground";
      case "late": return "bg-chart-4 text-card";
      case "excused": return "bg-chart-5 text-card";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <Check className="h-3.5 w-3.5" />;
      case "absent": return <X className="h-3.5 w-3.5" />;
      case "late": return <Clock className="h-3.5 w-3.5" />;
      case "excused": return <CalendarOff className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const chartData = attendanceData.monthly.map(item => ({
    ...item,
    total: item.present + item.absent + item.late + item.excused
  }));

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
        title="Attendance" 
        rightContent={
          <Select defaultValue="emma">
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="emma">Emma J.</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      
      {/* Month Selector */}
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between bg-card rounded-lg p-3 border border-border shadow-sm">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground">{selectedMonth} 2025</span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Attendance Chart */}
      <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Yearly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="15%">
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
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
                  <Bar dataKey="present" stackId="a" fill="hsl(var(--chart-1))" name="Present" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="absent" stackId="a" fill="hsl(var(--destructive))" name="Absent" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="late" stackId="a" fill="hsl(var(--chart-4))" name="Late" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="excused" stackId="a" fill="hsl(var(--chart-5))" name="Excused" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly Summary */}
      <section className="px-4 pb-2">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-chart-1/10">
                <p className="text-2xl font-bold text-chart-1">{monthlySummary.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{monthlySummary.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-chart-4/10">
                <p className="text-2xl font-bold text-chart-4">{monthlySummary.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-chart-5/10">
                <p className="text-2xl font-bold text-chart-5">{monthlySummary.excused}</p>
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

                {/* Days */}
                {week.days.map((day, dayIndex) => {
                  const date = new Date(day.date);
                  const globalIndex = weekIndex * 7 + dayIndex;
                  const isExpanded = expandedDay === globalIndex;
                  const today = isToday(day.date);

                  return (
                    <Collapsible
                      key={dayIndex}
                      open={isExpanded}
                      onOpenChange={() => setExpandedDay(isExpanded ? null : globalIndex)}
                    >
                      <CollapsibleTrigger asChild>
                        <div 
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                            today 
                              ? "bg-primary/10 border-2 border-primary/30" 
                              : "bg-accent/30 border border-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(day.status)}`}>
                              {getStatusIcon(day.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </p>
                                {today && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary text-primary">
                                    Today
                                  </Badge>
                                )}
                              </div>
                              {day.reason && (
                                <p className="text-xs text-muted-foreground mt-0.5">{day.reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(day.status)}>
                              {getStatusLabel(day.status)}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 ml-11 p-3 bg-muted/50 rounded-lg border border-border/30 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Time In</p>
                              <p className="font-medium">
                                {day.status === "present" ? "7:45 AM" : 
                                 day.status === "late" ? "8:15 AM" : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Time Out</p>
                              <p className="font-medium">
                                {day.status === "present" || day.status === "late" ? "3:30 PM" : "—"}
                              </p>
                            </div>
                          </div>
                          {(day.status === "absent" || day.status === "late") && !day.reason?.includes("Holiday") && (
                            <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                              Submit Excuse / MC
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
