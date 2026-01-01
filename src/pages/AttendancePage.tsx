import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(11);

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
          <CardContent className="space-y-2">
            {attendanceData.dailyBreakdown.map((day, index) => {
              const date = new Date(day.date);
              return (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    {day.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{day.reason}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(day.status)}>
                    {getStatusLabel(day.status)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
