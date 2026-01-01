import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, Award, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function ResultsSummary() {
  const navigate = useNavigate();

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

  // Calculate class rank simulation (position out of total)
  const classRank = "5/32";

  // Prepare mini chart data - averages per exam period
  const chartData = [
    { 
      period: "Mid 2024", 
      avg: Math.round(academicData.subjects.reduce((sum, s) => sum + s.midYearLast, 0) / academicData.subjects.length)
    },
    { 
      period: "End 2024", 
      avg: lastYearEndAverage
    },
    { 
      period: "Mid 2025", 
      avg: currentAverage
    },
  ];

  const stats = [
    { 
      icon: BookOpen, 
      label: "Current Avg", 
      value: `${currentAverage}%`,
      subtext: `Rank: ${classRank}`,
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
          {/* Mini Chart */}
          <div className="h-24 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [`${value}%`, "Average"]}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 4 }}
                />
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
