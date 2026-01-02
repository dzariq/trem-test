import { useState, useMemo } from "react";
import { academicData, attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, Award, BookOpen, Calendar, Target, AlertTriangle, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceDot,
} from "recharts";

// Helper to get score from new data structure
const getScore = (subject: typeof academicData.subjects[0], year: string, examType: "midYear" | "yearEnd") => {
  const yearData = subject.scores[year as keyof typeof subject.scores];
  return yearData ? yearData[examType] : null;
};

// Helper to shorten long subject names
const shortenSubjectName = (name: string): string => {
  const abbreviations: Record<string, string> = {
    "Mathematics": "Math",
    "Physical Education": "PE",
    "Social Studies": "Social St.",
    "Information Technology": "IT",
    "Computer Science": "Comp Sci",
    "Computer Studies": "Comp St.",
  };
  return abbreviations[name] || name;
};

export function ResultsSummary() {
  const navigate = useNavigate();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Subject colors matching AcademicPage chart colors (per subject)
  const subjectColors: Record<string, string> = {
    "English": "#3b82f6",       // blue
    "Mathematics": "#f59e0b",   // amber/orange
    "Science": "#10b981",       // emerald/green
    "History": "#8b5cf6",       // violet/purple
    "Geography": "#ef4444",     // red
    "Art": "#06b6d4",           // cyan
    "Music": "#ec4899",         // pink
    "Physical Education": "#84cc16", // lime
    "Mandarin": "#f59e0b",      // amber
    "Computer Studies": "#3b82f6", // blue
    "French": "#8b5cf6",        // violet
    "Chemistry": "#ef4444",     // red
    "Physics": "#10b981",       // green
  };

  // Line colors array for indexed access
  const lineColors = [
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#ef4444", // red
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#84cc16", // lime
  ];

  // Calculate current average from mid-year 2025 scores
  const currentAverage = Math.round(
    academicData.subjects.reduce((sum, s) => sum + (getScore(s, "2025", "midYear") ?? 0), 0) / academicData.subjects.length
  );

  // Calculate last year's year-end average (2024)
  const lastYearEndAverage = Math.round(
    academicData.subjects.reduce((sum, s) => sum + (getScore(s, "2024", "yearEnd") ?? 0), 0) / academicData.subjects.length
  );

  // Calculate improvement from last year-end to current mid-year
  const improvementPoints = currentAverage - lastYearEndAverage;
  const improvementText = improvementPoints >= 0 ? `+${improvementPoints}%` : `${improvementPoints}%`;

  // Find best subject based on current mid-year scores
  const bestSubject = academicData.subjects.reduce((best, s) => {
    const currentScore = getScore(s, "2025", "midYear") ?? 0;
    const bestScore = getScore(best, "2025", "midYear") ?? 0;
    return currentScore > bestScore ? s : best;
  });

  // Find weakest subject based on current mid-year scores
  const weakestSubject = academicData.subjects.reduce((worst, s) => {
    const currentScore = getScore(s, "2025", "midYear") ?? 100;
    const worstScore = getScore(worst, "2025", "midYear") ?? 100;
    return currentScore < worstScore ? s : worst;
  });
  const weakestScore = getScore(weakestSubject, "2025", "midYear") ?? 0;

  // Calculate attendance rate from all months
  const totalAttendance = attendanceData.monthly.reduce(
    (acc, month) => ({
      present: acc.present + month.present,
      absent: acc.absent + month.absent,
      late: acc.late + month.late,
      excused: acc.excused + month.excused,
    }),
    { present: 0, absent: 0, late: 0, excused: 0 }
  );
  const totalDays = totalAttendance.present + totalAttendance.absent + totalAttendance.late + totalAttendance.excused;
  const attendanceRate = totalDays > 0 ? Math.round((totalAttendance.present / totalDays) * 100) : 0;

  // Calculate subjects passing (score >= 50)
  const passingSubjects = academicData.subjects.filter(s => (getScore(s, "2025", "midYear") ?? 0) >= 50);
  const passingCount = passingSubjects.length;
  const totalSubjects = academicData.subjects.length;
  const passingPercentage = Math.round((passingCount / totalSubjects) * 100);

  // Performance level based on average
  const getPerformanceLevel = (avg: number) => {
    if (avg >= 80) return "Above Average";
    if (avg >= 65) return "Average";
    return "Needs Improvement";
  };
  const performanceLevel = getPerformanceLevel(currentAverage);

  // Subject performance data for bar chart (sorted best to worst), filtered by selection
  const subjectPerformance = useMemo(() => {
    const subjects = subjectFilter === "all" 
      ? academicData.subjects 
      : academicData.subjects.filter(s => s.name === subjectFilter);
    
    return subjects
      .map(s => ({
        name: shortenSubjectName(s.name),
        fullName: s.name,
        score: getScore(s, "2025", "midYear") ?? 0,
        goal: Math.min((getScore(s, "2025", "midYear") ?? 70) + 5, 100)
      }))
      .sort((a, b) => b.score - a.score);
  }, [subjectFilter]);

  // Rising stars - subjects with biggest improvement from previous exam (2024 year-end to 2025 mid-year)
  const risingStars = useMemo(() => {
    const improvements = academicData.subjects.map(s => {
      const current = getScore(s, "2025", "midYear") ?? 0;
      const prev = getScore(s, "2024", "yearEnd") ?? 0;
      return {
        name: s.name,
        current,
        prev,
        improvement: current - prev
      };
    }).filter(item => item.improvement > 0 && item.current > 0 && item.prev > 0);

    return improvements.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, []);

  const stats = [
    {
      icon: BookOpen, 
      label: "Current Avg", 
      value: `${currentAverage}%`,
      subtext: performanceLevel,
      iconColor: "#3b82f6", // blue
      bgColor: "rgba(59, 130, 246, 0.08)"
    },
    { 
      icon: Award, 
      label: "Top Subject", 
      value: bestSubject.name,
      subtext: `${getScore(bestSubject, "2025", "midYear")}%`,
      iconColor: "#f59e0b", // amber
      bgColor: "rgba(245, 158, 11, 0.08)"
    },
    { 
      icon: TrendingUp, 
      label: "vs Last Exam", 
      value: improvementText,
      subtext: improvementPoints >= 0 ? "Improved" : "Declined",
      iconColor: improvementPoints >= 0 ? "#10b981" : "#ef4444", // emerald or red
      bgColor: improvementPoints >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
    },
    { 
      icon: Calendar, 
      label: "Attendance", 
      value: `${attendanceRate}%`,
      subtext: "This Term",
      iconColor: "#8b5cf6", // violet
      bgColor: "rgba(139, 92, 246, 0.08)"
    },
    { 
      icon: Target, 
      label: "Passing", 
      value: `${passingCount}/${totalSubjects}`,
      subtext: `${passingPercentage}%`,
      iconColor: "#06b6d4", // cyan
      bgColor: "rgba(6, 182, 212, 0.08)"
    },
    { 
      icon: AlertTriangle, 
      label: "Needs Focus", 
      value: shortenSubjectName(weakestSubject.name),
      subtext: `${weakestScore}%`,
      iconColor: "#ef4444", // red
      bgColor: "rgba(239, 68, 68, 0.08)"
    },
  ];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Academic Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Rising Stars - First */}
          {risingStars.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-4 w-4" style={{ color: '#d97706' }} /> Rising Stars
              </h4>
              <p className="text-[10px] text-muted-foreground mb-2">Biggest improvements from previous exam</p>
              <div className="grid grid-cols-3 gap-2">
                {risingStars.map((item) => (
                  <div 
                    key={item.name} 
                    className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden animate-glow"
                    style={{ 
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)', 
                      borderColor: 'rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    {/* Inner shine effect - lighter */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 40%)',
                      }}
                    />
                    {/* Star pattern background */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="absolute -top-1 -left-1 w-8 h-8 opacity-40" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <svg className="absolute top-0 right-0 w-6 h-6 opacity-35" fill="#fde68a" stroke="#fbbf24" strokeWidth="0.5" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <svg className="absolute -bottom-2 -right-1 w-7 h-7 opacity-45" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-foreground text-center relative z-10">{shortenSubjectName(item.name)}</span>
                    <div className="flex items-center gap-1 mt-1 relative z-10">
                      <ArrowUp className="h-3 w-3" style={{ color: '#d97706' }} />
                      <span className="text-sm font-bold" style={{ color: '#d97706' }}>+{item.improvement}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 relative z-10">
                      <span 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                      >
                        {item.prev}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <span 
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                      >
                        {item.current}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                {shortenSubjectName(subject.name)}
              </Badge>
            ))}
          </div>

          {/* Subject Performance Bar Chart */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              Subject Performance
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: "hsl(var(--foreground))" }}
                />
                Goal
              </Badge>
            </h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                    width={70}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))", 
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`, 
                      name === "score" ? "Score" : name === "goal" ? "Goal" : name
                    ]}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {subjectPerformance.map((entry, index) => {
                      const color = subjectColors[entry.fullName] || lineColors[index % lineColors.length];
                      return <Cell key={index} fill={color} />;
                    })}
                  </Bar>

                  {subjectPerformance.map((entry) => (
                    <ReferenceDot
                      key={`goal-${entry.name}`}
                      x={entry.goal}
                      y={entry.name}
                      r={4}
                      fill="hsl(var(--foreground))"
                      stroke="hsl(var(--background))"
                      strokeWidth={1}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="flex flex-col items-center text-center p-3 rounded-lg border"
                style={{ backgroundColor: stat.bgColor, borderColor: 'transparent' }}
              >
                <stat.icon className="h-5 w-5 mb-1" style={{ color: stat.iconColor }} />
                <span className="text-base font-bold text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
                <span className="text-[10px] text-muted-foreground/70">{stat.subtext}</span>
              </div>
            ))}
          </div>

          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/parent/academic")}
          >
            View Analysis <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}