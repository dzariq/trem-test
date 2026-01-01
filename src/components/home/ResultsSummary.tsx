import { useState } from "react";
import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, Award, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function ResultsSummary() {
  const navigate = useNavigate();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Calculate current average from mid-year current scores
  const currentAverage = Math.round(
    academicData.subjects.reduce((sum, s) => sum + s.midYearCurrent, 0) / academicData.subjects.length
  );

  // Calculate last year's year-end average
  const lastYearEndAverage = Math.round(
    academicData.subjects.reduce((sum, s) => sum + s.yearEndLast, 0) / academicData.subjects.length
  );

  // Calculate improvement from last year-end to current mid-year
  const improvementPoints = currentAverage - lastYearEndAverage;
  const improvementText = improvementPoints >= 0 ? `+${improvementPoints}%` : `${improvementPoints}%`;

  // Find best subject based on current mid-year scores
  const bestSubject = academicData.subjects.reduce((best, s) => 
    s.midYearCurrent > best.midYearCurrent ? s : best
  );

  // Performance level based on average
  const getPerformanceLevel = (avg: number) => {
    if (avg >= 80) return "Above Average";
    if (avg >= 65) return "Average";
    return "Needs Improvement";
  };
  const performanceLevel = getPerformanceLevel(currentAverage);

  // Distinct colors for each subject - varied hues
  const lineColors = [
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#ef4444", // red
  ];

  // Prepare chart data - always include all subjects for multi-line view
  const multiLineChartData = [
    { 
      period: "Mid 2024", 
      ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearLast]))
    },
    { 
      period: "End 2024", 
      ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.yearEndLast]))
    },
    { 
      period: "Mid 2025", 
      ...Object.fromEntries(academicData.subjects.map(s => [s.name, s.midYearCurrent]))
    },
  ];

  // Filtered subjects for lines
  const filteredSubjects = subjectFilter === "all" 
    ? academicData.subjects 
    : academicData.subjects.filter(s => s.name === subjectFilter);

  const stats = [
    { 
      icon: BookOpen, 
      label: "Current Avg", 
      value: `${currentAverage}%`,
      subtext: performanceLevel,
      color: "text-chart-1" 
    },
    { 
      icon: Award, 
      label: "Top Subject", 
      value: bestSubject.name,
      subtext: `${bestSubject.midYearCurrent}%`,
      color: "text-chart-2" 
    },
    { 
      icon: TrendingUp, 
      label: "vs Last Exam", 
      value: improvementText,
      subtext: improvementPoints >= 0 ? "Improved" : "Declined",
      color: improvementPoints >= 0 ? "text-chart-3" : "text-destructive" 
    },
  ];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Academic Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Subject Filter Chips */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <Badge 
              variant={subjectFilter === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap text-xs px-2 py-0.5"
              onClick={() => setSubjectFilter("all")}
            >
              All
            </Badge>
            {academicData.subjects.map((subject) => (
              <Badge
                key={subject.name}
                variant={subjectFilter === subject.name ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap text-xs px-2 py-0.5"
                onClick={() => setSubjectFilter(subject.name)}
              >
                {subject.name}
              </Badge>
            ))}
          </div>

          {/* Mini Chart */}
          <div className="h-28 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiLineChartData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[60, 100]}
                  hide
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px"
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                {filteredSubjects.map((subject, index) => (
                  <Line
                    key={subject.name}
                    type="monotone"
                    dataKey={subject.name}
                    stroke={lineColors[academicData.subjects.findIndex(s => s.name === subject.name) % lineColors.length]}
                    strokeWidth={2}
                    dot={{ fill: lineColors[academicData.subjects.findIndex(s => s.name === subject.name) % lineColors.length], strokeWidth: 0, r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50"
              >
                <stat.icon className={`h-5 w-5 mb-1 ${stat.color}`} />
                <span className="text-base font-bold text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
                <span className="text-[10px] text-muted-foreground/70">{stat.subtext}</span>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/academic")}
          >
            View Analysis <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
