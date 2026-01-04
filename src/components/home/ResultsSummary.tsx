import { useState, useMemo } from "react";
import { academicData, attendanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, Award, BookOpen, Calendar, Target, AlertTriangle, ArrowUp, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubjectPerformanceChart } from "@/components/SubjectPerformanceChart";

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

// Get grade from score
const getGradeFromScore = (score: number) => {
  if (score >= 90) return "A*";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
};

export function ResultsSummary() {
  const navigate = useNavigate();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

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
  const bestScore = getScore(bestSubject, "2025", "midYear") ?? 0;

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

  // Subject performance data for bar chart (sorted best to worst), filtered by selection
  const allSubjectPerformance = useMemo(() => {
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

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const grades = { "A*": 0, "A": 0, "B": 0, "C": 0, "D": 0, "E": 0 };
    academicData.subjects.forEach(s => {
      const score = getScore(s, "2025", "midYear");
      if (score !== null) {
        const grade = getGradeFromScore(score);
        grades[grade as keyof typeof grades]++;
      }
    });
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }, []);

  // Top 3 performers
  const top3 = useMemo(() => {
    return [...academicData.subjects]
      .sort((a, b) => (getScore(b, "2025", "midYear") ?? 0) - (getScore(a, "2025", "midYear") ?? 0))
      .slice(0, 3);
  }, []);

  // Needs attention - only subjects below 50%
  const needsAttention = useMemo(() => {
    return [...academicData.subjects]
      .filter(s => (getScore(s, "2025", "midYear") ?? 0) < 50)
      .sort((a, b) => (getScore(a, "2025", "midYear") ?? 0) - (getScore(b, "2025", "midYear") ?? 0))
      .slice(0, 3);
  }, []);

  // Rising stars - subjects with biggest improvement from previous exam (2024 year-end to 2025 mid-year)
  const risingStars = useMemo(() => {
    const improvements = academicData.subjects.map(s => {
      const current = getScore(s, "2025", "midYear") ?? 0;
      const prev = getScore(s, "2024", "yearEnd") ?? 0;
      return {
        subject: s,
        name: s.name,
        current,
        prev,
        improvement: current - prev
      };
    }).filter(item => item.improvement > 0 && item.current > 0 && item.prev > 0);

    return improvements.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
  }, []);

  // Grade card colors matching Academic Page
  const gradeCardColors: Record<string, { bg: string; text: string }> = {
    "A*": { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
    "A": { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
    "B": { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
    "C": { bg: 'rgba(234, 179, 8, 0.12)', text: '#ca8a04' },
    "D": { bg: 'rgba(249, 115, 22, 0.12)', text: '#ea580c' },
    "E": { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626' }
  };

  const stats = [
    {
      icon: BookOpen, 
      label: "Average", 
      value: `${currentAverage}%`,
      subtext: currentAverage >= 70 ? "Above Average" : currentAverage >= 50 ? "Average" : "Below Average",
      iconColor: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.08)"
    },
    { 
      icon: Award, 
      label: "Best Subject", 
      value: shortenSubjectName(bestSubject.name),
      subtext: `${bestScore}%`,
      iconColor: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.08)"
    },
    { 
      icon: TrendingUp, 
      label: "Improvement", 
      value: improvementText,
      subtext: improvementPoints >= 0 ? "Improved" : "Declined",
      iconColor: improvementPoints >= 0 ? "#10b981" : "#ef4444",
      bgColor: improvementPoints >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
    },
    { 
      icon: Calendar, 
      label: "Attendance", 
      value: `${attendanceRate}%`,
      subtext: "This Term",
      iconColor: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.08)"
    },
    { 
      icon: Target, 
      label: "Passing", 
      value: `${passingCount}/${totalSubjects}`,
      subtext: `${passingPercentage}%`,
      iconColor: "#06b6d4",
      bgColor: "rgba(6, 182, 212, 0.08)"
    },
    { 
      icon: AlertTriangle, 
      label: "Needs Focus", 
      value: shortenSubjectName(weakestSubject.name),
      subtext: `${weakestScore}%`,
      iconColor: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.08)"
    },
  ];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Academic Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-4">
          {/* Grade Distribution - Matching Academic Page */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Grade Distribution</h4>
            <div className="grid grid-cols-6 gap-2">
              {gradeDistribution.map(g => {
                const percentage = totalSubjects > 0 ? Math.round((g.count / totalSubjects) * 100) : 0;
                const colors = gradeCardColors[g.grade] || { bg: 'rgba(156, 163, 175, 0.12)', text: '#6b7280' };
                return (
                  <div 
                    key={g.grade} 
                    className="flex flex-col items-center text-center p-2 rounded-lg"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <span className="text-xs font-semibold" style={{ color: colors.text }}>{g.grade}</span>
                    <span className="text-xl font-bold text-foreground">{g.count}</span>
                    <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rising Stars - Matching Academic Page */}
          {risingStars.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" style={{ color: '#d97706' }} /> Rising Stars
              </h4>
              <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
              <div className="grid grid-cols-3 gap-2">
                {risingStars.map((item) => (
                  <div 
                    key={item.name} 
                    className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden"
                    style={{ 
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)', 
                      borderColor: 'rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    {/* Inner shine effect */}
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

          {/* Subject Performance Bar Chart */}
          <SubjectPerformanceChart 
            data={allSubjectPerformance} 
            lineColors={lineColors}
          />

          {/* Stats Cards Grid - Matching Academic Page */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, index) => {
              const valueLength = String(stat.value).length;
              const textSizeClass = valueLength > 12 ? "text-xs" : valueLength > 8 ? "text-sm" : "text-lg";
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center p-3 rounded-xl border min-h-[100px]"
                  style={{ backgroundColor: stat.bgColor, borderColor: 'transparent' }}
                >
                  <stat.icon className="h-5 w-5 mb-1" style={{ color: stat.iconColor }} />
                  <span className={`${textSizeClass} font-bold text-foreground text-center leading-tight line-clamp-2`}>{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</span>
                  <span className="text-[9px] text-muted-foreground/70">{stat.subtext}</span>
                </div>
              );
            })}
          </div>

          {/* Top 3 Performers & Needs Attention - Matching Academic Page */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top 3 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Trophy className="h-4 w-4" style={{ color: '#22c55e' }} /> Top Performers
              </h4>
              <div className="space-y-2">
                {top3.map((s, index) => {
                  const score = getScore(s, "2025", "midYear");
                  return (
                    <div 
                      key={s.name} 
                      className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      <span 
                        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground leading-tight">{shortenSubjectName(s.name)}</span>
                        <Badge 
                          className="text-xs font-semibold w-fit mt-1 text-white"
                          style={{ backgroundColor: '#22c55e' }}
                        >
                          {score}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Needs Attention - only subjects below 50% */}
            {needsAttention.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} /> Needs Attention
                </h4>
                <div className="space-y-2">
                  {needsAttention.map((s, index) => {
                    const score = getScore(s, "2025", "midYear");
                    return (
                      <div 
                        key={s.name} 
                        className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[60px]"
                        style={{
                          backgroundColor: 'rgba(254, 202, 202, 0.3)',
                          borderColor: 'rgba(248, 113, 113, 0.3)'
                        }}
                      >
                        <span 
                          className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(254, 202, 202, 0.5)', color: '#dc2626' }}
                        >
                          {index + 1}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground leading-tight">{shortenSubjectName(s.name)}</span>
                          <Badge 
                            className="text-xs font-semibold w-fit mt-1 text-white"
                            style={{ backgroundColor: '#f87171' }}
                          >
                            {score}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/parent/academic?section=analysis")}
          >
            View Analysis <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}