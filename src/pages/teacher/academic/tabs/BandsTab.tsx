import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Scale, X, Plus, Award, UserCheck, AlertTriangle, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { cn, formatClassDisplay } from "@/lib/utils";
import collinzLogo from "@/assets/collinz-school-logo.png";
import cambridgeLogo from "@/assets/cambridge-logo.jpg";
import { saveAndShareBlob } from "@/lib/export/nativeDownload";
import { toast } from "@/hooks/use-toast";
import { teacherProfile } from "@/data/teacherMockData";
import { IconBook, IconTrophy, IconTarget, IconBarChart } from "../icons";
import { academicYears, GRADE_COLORS } from "../constants";
import { getSelectionColor, getNextSelectionId } from "../helpers";
import type { useClassAnalysis } from "@/hooks/useClassAnalysis";

type ClassAnalysis = ReturnType<typeof useClassAnalysis>;

export interface BandsSelection {
  id: string;
  className: string;
  year: string;
  period: "midYear" | "yearEnd";
  subject: string;
}

interface BandsStudent {
  id: string;
  name: string;
  score: number;
}

interface BandsGradeBucket {
  range: string;
  count: number;
}

interface BandsSelectionData {
  gradeDistribution: BandsGradeBucket[];
  rankedStudents: BandsStudent[];
  topPerformers: BandsStudent[];
  middlePerformers: BandsStudent[];
  atRiskStudents: BandsStudent[];
}

interface BandsTabProps {
  classAnalysis: ClassAnalysis;
  isMobile: boolean;
  bandsCompareMode: boolean;
  setBandsCompareMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedClass: string | null;
  setSelectedClass: (v: string) => void;
  bandsAdditionalSelections: BandsSelection[];
  setBandsAdditionalSelections: React.Dispatch<React.SetStateAction<BandsSelection[]>>;
  bandsSelectedSubject: string;
  bandsGradeDistribution: BandsGradeBucket[];
  bandsComparisonChartData: Array<Record<string, number | string>>;
  bandsTopPerformers: BandsStudent[];
  bandsMiddlePerformers: BandsStudent[];
  bandsAtRiskStudents: BandsStudent[];
  bandsRankedStudents: BandsStudent[];
  bandsSelectionsData: BandsSelectionData[];
  performanceDialogOpen: boolean;
  setPerformanceDialogOpen: (v: boolean) => void;
  performanceDialogTab: "top" | "middle" | "atRisk";
  setPerformanceDialogTab: (v: "top" | "middle" | "atRisk") => void;
  bandsReportDialogOpen: boolean;
  setBandsReportDialogOpen: (v: boolean) => void;
  bandsReportRef: React.RefObject<HTMLDivElement>;
  selectedYear: string;
  selectedPeriod: "midYear" | "yearEnd";
  handleReportPdfExport: (
    reportRef: React.RefObject<HTMLDivElement>,
    filename: string
  ) => void;
}

export function BandsTab({
  classAnalysis,
  isMobile,
  bandsCompareMode,
  setBandsCompareMode,
  selectedClass,
  setSelectedClass,
  bandsAdditionalSelections,
  setBandsAdditionalSelections,
  bandsSelectedSubject,
  bandsGradeDistribution,
  bandsComparisonChartData,
  bandsTopPerformers,
  bandsMiddlePerformers,
  bandsAtRiskStudents,
  bandsRankedStudents,
  bandsSelectionsData,
  performanceDialogOpen,
  setPerformanceDialogOpen,
  performanceDialogTab,
  setPerformanceDialogTab,
  bandsReportDialogOpen,
  setBandsReportDialogOpen,
  bandsReportRef,
  selectedYear,
  selectedPeriod,
  handleReportPdfExport,
}: BandsTabProps) {
  return (
    <>
              <TabsContent value="distribution" className="space-y-4">
                {/* Comparison Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Compare Mode</span>
                  </div>
                  <button
                    onClick={() => setBandsCompareMode(!bandsCompareMode)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      bandsCompareMode ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-transform duration-200",
                        bandsCompareMode ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Filters Section - Stacked for mobile when comparing */}
                <div className={cn(
                  "space-y-4",
                  bandsCompareMode ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""
                )}>
                  {/* Primary Selection */}
                  <div className={cn(
                    "space-y-3 pb-3 border-b border-border",
                    bandsCompareMode && "p-3 rounded-lg bg-blue-50/50 border border-blue-200"
                  )}>
                    {bandsCompareMode && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-blue-700">Selection A</span>
                      </div>
                    )}
                    {/* Row 1: Class + Academic Period (unified with Overview) */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedClass || ""} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{formatClassDisplay(cls)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Academic Period Dropdown (same as Overview) */}
                      <Select 
                        value={classAnalysis.selectedPeriodId || ""} 
                        onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                          <SelectContent className="bg-card">
                            {classAnalysis.academicPeriodsForYear.map((period) => (
                              <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Subject Filter - use real subjects from classAnalysis */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Subject:</span>
                      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                        {classAnalysis.subjects.length > 0 ? classAnalysis.subjects.map((subject) => (
                          <button
                            key={subject.id}
                            onClick={() => classAnalysis.setBandsSelectedSubjectId(subject.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                              classAnalysis.bandsSelectedSubjectId === subject.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {subject.name.length > 15 ? subject.name.substring(0, 15) + "..." : subject.name}
                          </button>
                        )) : (
                          <span className="text-xs text-muted-foreground">Select a class first</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Additional Selections - Only show when compare mode is on */}
                  {bandsCompareMode && bandsAdditionalSelections.map((selection, index) => {
                    const color = getSelectionColor(index + 1);
                    return (
                      <div key={selection.id} className={cn("space-y-3 p-3 rounded-lg", color.bg, color.border, "border")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                            <span className={cn("text-xs font-semibold", color.text)}>Selection {selection.id}</span>
                          </div>
                          {bandsAdditionalSelections.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setBandsAdditionalSelections(prev => prev.filter(s => s.id !== selection.id))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {/* Row 1: Class + Year + Exam Period */}
                        <div className="flex items-center gap-2">
                          <Select 
                            value={selection.className} 
                            onValueChange={(v) => setBandsAdditionalSelections(prev => 
                              prev.map(s => s.id === selection.id ? {...s, className: v} : s)
                            )}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              {classAnalysis.classes.map((cls) => (
                                <SelectItem key={cls} value={cls}>{formatClassDisplay(cls)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Academic Period Dropdown */}
                          <Select 
                            value={classAnalysis.selectedPeriodId || ""} 
                            onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                          >
                            <SelectTrigger className="flex-1 h-9">
                              <SelectValue placeholder="Period" />
                            </SelectTrigger>
                              <SelectContent className="bg-card">
                                {classAnalysis.academicPeriodsForYear.map((period) => (
                                  <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Subject Filter - use real subjects */}
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-foreground">Subject:</span>
                          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                            {classAnalysis.subjects.map((subject) => {
                              const isSelected = selection.subject === subject.name;
                              return (
                                <button
                                  key={subject.id}
                                  onClick={() => {
                                    setBandsAdditionalSelections(prev => 
                                      prev.map(s => s.id === selection.id ? {...s, subject: subject.name} : s)
                                    );
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  )}
                                >
                                  {subject.name.length > 15 ? subject.name.substring(0, 15) + "..." : subject.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add Selection Button */}
                  {bandsCompareMode && bandsAdditionalSelections.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-dashed"
                      onClick={() => {
                        const existingIds = ["A", ...bandsAdditionalSelections.map(s => s.id)];
                        const newId = getNextSelectionId(existingIds);
                        const firstSubject = classAnalysis.subjects[0]?.name || "Mathematics";
                        setBandsAdditionalSelections(prev => [...prev, {
                          id: newId,
                          className: classAnalysis.classes[0] || "",
                          year: academicYears[0],
                          period: "midYear",
                          subject: firstSubject
                        }]);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Selection {getNextSelectionId(["A", ...bandsAdditionalSelections.map(s => s.id)])}
                    </Button>
                  )}
                </div>

                {/* Grade Distribution - Normal or Comparison View */}
                {!bandsCompareMode ? (
                  /* Normal Grade Distribution Cards */
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Grade Distribution
                      <span className="text-xs text-muted-foreground ml-2">({bandsSelectedSubject})</span>
                    </h4>
                    <div className="grid grid-cols-6 gap-1.5">
                      {bandsGradeDistribution.map(g => {
                        const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                        const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                        return (
                          <div 
                            key={g.range} 
                            className="flex flex-col items-center p-2 rounded-lg border border-border/50" 
                            style={{
                              backgroundColor: `${GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]}15`
                            }}
                          >
                            <span className="text-sm font-bold" style={{
                              color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                            }}>
                              {g.range}
                            </span>
                            <span className="text-lg font-semibold text-foreground">{g.count}</span>
                            <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Comparison View - Mobile Friendly Stacked Charts */
                  <div className="space-y-4">
                    {/* Comparison Bar Chart - Mobile Optimized */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Grade Comparison</h4>
                      </div>
                      {/* Dynamic Legend */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSelectionColor(0).hex }} />
                          <span className="text-[10px] text-muted-foreground">{selectedClass} - {bandsSelectedSubject}</span>
                        </div>
                        {bandsAdditionalSelections.map((selection, index) => {
                          const color = getSelectionColor(index + 1);
                          return (
                            <div key={selection.id} className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                              <span className="text-[10px] text-muted-foreground">{selection.className} - {selection.subject}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className={cn("h-[200px]", isMobile && "h-[160px]")}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bandsComparisonChartData} barGap={2} margin={{ left: isMobile ? -15 : 5, right: isMobile ? 5 : 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                            <XAxis dataKey="grade" tick={{ fontSize: isMobile ? 10 : 12, fill: "hsl(var(--foreground))" }} />
                            <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: "hsl(var(--muted-foreground))" }} width={isMobile ? 25 : 30} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                              formatter={(value: number, name: string) => {
                                if (name === "selectionA") {
                                  return [`${value} students`, `${selectedClass} - ${bandsSelectedSubject}`];
                                }
                                const selId = name.replace("selection", "");
                                const selection = bandsAdditionalSelections.find(s => s.id === selId);
                                return [`${value} students`, selection ? `${selection.className} - ${selection.subject}` : name];
                              }}
                            />
                            <Bar dataKey="selectionA" fill={getSelectionColor(0).hex} radius={[4, 4, 0, 0]} name="selectionA" />
                            {bandsAdditionalSelections.map((selection, index) => (
                              <Bar 
                                key={selection.id} 
                                dataKey={`selection${selection.id}`} 
                                fill={getSelectionColor(index + 1).hex} 
                                radius={[4, 4, 0, 0]} 
                                name={`selection${selection.id}`} 
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stacked Comparison Cards for Mobile - Dynamic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Selection A Distribution */}
                      <div className="space-y-2 p-3 rounded-lg" style={{
                        backgroundColor: `${getSelectionColor(0).hex}10`,
                        borderWidth: 1,
                        borderColor: `${getSelectionColor(0).hex}40`
                      }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSelectionColor(0).hex }} />
                          <span className="text-xs font-semibold" style={{ color: getSelectionColor(0).hex }}>{selectedClass} - {bandsSelectedSubject}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {bandsGradeDistribution.map(g => {
                            const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                            return (
                              <div 
                                key={g.range} 
                                className="flex flex-col items-center p-1.5 rounded-md border bg-background"
                                style={{ borderColor: `${getSelectionColor(0).hex}30` }}
                              >
                                <span className="text-xs font-bold" style={{
                                  color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                                }}>
                                  {g.range}
                                </span>
                                <span className="text-sm font-semibold text-foreground">{g.count}</span>
                                <span className="text-[9px] text-muted-foreground">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: `${getSelectionColor(0).hex}30` }}>
                          <span>Top: {bandsTopPerformers.length}</span>
                          <span>Middle: {bandsMiddlePerformers.length}</span>
                          <span>At-Risk: {bandsAtRiskStudents.length}</span>
                        </div>
                      </div>

                      {/* Dynamic Additional Selection Distribution Cards */}
                      {bandsAdditionalSelections.map((selection, index) => {
                        const color = getSelectionColor(index + 1);
                        const selectionData = bandsSelectionsData[index];
                        const gradeDistribution = selectionData?.gradeDistribution || [];
                        const topPerformers = selectionData?.topPerformers || [];
                        const middlePerformers = selectionData?.middlePerformers || [];
                        const atRiskStudents = selectionData?.atRiskStudents || [];

                        return (
                          <div 
                            key={selection.id} 
                            className="space-y-2 p-3 rounded-lg"
                            style={{
                              backgroundColor: `${color.hex}10`,
                              borderWidth: 1,
                              borderColor: `${color.hex}40`
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                              <span className="text-xs font-semibold" style={{ color: color.hex }}>{selection.className} - {selection.subject}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {gradeDistribution.map(g => {
                                const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                return (
                                  <div 
                                    key={g.range} 
                                    className="flex flex-col items-center p-1.5 rounded-md border bg-background"
                                    style={{ borderColor: `${color.hex}30` }}
                                  >
                                    <span className="text-xs font-bold" style={{
                                      color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]
                                    }}>
                                      {g.range}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">{g.count}</span>
                                    <span className="text-[9px] text-muted-foreground">{percentage}%</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: `${color.hex}30` }}>
                              <span>Top: {topPerformers.length}</span>
                              <span>Middle: {middlePerformers.length}</span>
                              <span>At-Risk: {atRiskStudents.length}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Student Performance Cards - Only show in non-compare mode */}
                {!bandsCompareMode && (
                <div className="space-y-3">
                  {/* Top Performers */}
                  <Card className="border-amber-200 bg-amber-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                        <Award className="h-4 w-4" />
                        Top Performers ({bandsTopPerformers.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">A*</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">A</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsTopPerformers.slice(0, 3).map((student, index) => (
                        <div key={student.id} className={cn(
                          "flex items-center justify-between p-2 rounded-lg bg-background",
                          index === 0 ? "border border-amber-300" : index === 1 ? "border border-slate-300" : "border border-orange-300"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                            <span className="text-sm font-medium truncate">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsTopPerformers.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                          onClick={() => {
                            setPerformanceDialogTab("top");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsTopPerformers.length - 3} more)
                        </Button>
                      )}
                      {bandsTopPerformers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Middle Performers */}
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <UserCheck className="h-4 w-4" />
                        Middle Performers ({bandsMiddlePerformers.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500 text-white">B</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500 text-white">C</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsMiddlePerformers.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-blue-200">
                          <span className="text-sm font-medium truncate">{student.name}</span>
                          <Badge className="text-xs bg-blue-100 text-blue-700 shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsMiddlePerformers.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => {
                            setPerformanceDialogTab("middle");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsMiddlePerformers.length - 3} more)
                        </Button>
                      )}
                      {bandsMiddlePerformers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* At-Risk Students */}
                  <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        At-Risk Students ({bandsAtRiskStudents.length})
                        <span className="ml-auto flex gap-1">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">D</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">E</span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bandsAtRiskStudents.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-red-200">
                          <span className="text-sm font-medium truncate">{student.name}</span>
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}
                      {bandsAtRiskStudents.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={() => {
                            setPerformanceDialogTab("atRisk");
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          View More ({bandsAtRiskStudents.length - 3} more)
                        </Button>
                      )}
                      {bandsAtRiskStudents.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No students</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                )}

                {/* Performance Dialog */}
                <Dialog open={performanceDialogOpen} onOpenChange={setPerformanceDialogOpen}>
                  <DialogContent className="w-[95vw] max-w-lg h-[100dvh] max-h-[85vh] rounded-2xl overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
                    <DialogHeader>
                      <DialogTitle>Student Performance</DialogTitle>
                    </DialogHeader>
                    
                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                      <button
                        onClick={() => setPerformanceDialogTab("top")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "top" 
                            ? "bg-amber-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>Top</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsTopPerformers.length})</span>
                      </button>
                      <button
                        onClick={() => setPerformanceDialogTab("middle")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "middle" 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          <span>Middle</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsMiddlePerformers.length})</span>
                      </button>
                      <button
                        onClick={() => setPerformanceDialogTab("atRisk")}
                        className={cn(
                          "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center justify-center gap-0.5",
                          performanceDialogTab === "atRisk" 
                            ? "bg-red-500 text-white shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>At-Risk</span>
                        </div>
                        <span className="text-[10px] opacity-90">({bandsAtRiskStudents.length})</span>
                      </button>
                    </div>

                    {/* Student list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {performanceDialogTab === "top" && bandsTopPerformers.map((student, index) => (
                        <div key={student.id} className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          index === 0 ? "bg-amber-50 border border-amber-200" 
                            : index === 1 ? "bg-slate-50 border border-slate-200" 
                            : index === 2 ? "bg-orange-50 border border-orange-200" 
                            : "bg-accent/30 border border-border"
                        )}>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-lg font-bold w-8 text-center",
                              index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-orange-400" : "text-muted-foreground"
                            )}>
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {performanceDialogTab === "middle" && bandsMiddlePerformers.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-8 text-center text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge className="text-xs bg-blue-100 text-blue-700">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {performanceDialogTab === "atRisk" && bandsAtRiskStudents.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold w-8 text-center text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium">{student.name}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {student.score}%
                          </Badge>
                        </div>
                      ))}

                      {/* Empty state */}
                      {performanceDialogTab === "top" && bandsTopPerformers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No top performers</p>
                      )}
                      {performanceDialogTab === "middle" && bandsMiddlePerformers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No middle performers</p>
                      )}
                      {performanceDialogTab === "atRisk" && bandsAtRiskStudents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No at-risk students</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Bands Report Dialog */}
                <Dialog open={bandsReportDialogOpen} onOpenChange={setBandsReportDialogOpen}>
                  <DialogContent className="w-[95vw] max-w-2xl h-[100dvh] max-h-[90vh] rounded-2xl overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
                    <DialogHeader className="flex flex-row items-center justify-between pr-10">
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Grade Distribution Report
                      </DialogTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={async () => {
                            // Generate CSV data for bands
                            const csvRows = [
                              ['Name', 'Score', 'Grade', 'Band'],
                              ...bandsRankedStudents.map(s => {
                                const band = s.score >= 80 ? 'Top' : s.score >= 50 ? 'Middle' : 'At-Risk';
                                const grade = s.score >= 90 ? 'A*' : s.score >= 80 ? 'A' : s.score >= 70 ? 'B' : s.score >= 60 ? 'C' : s.score >= 50 ? 'D' : 'E';
                                return [s.name, s.score.toString(), grade, band];
                              })
                            ];
                            const csvContent = csvRows.map(row => row.join(',')).join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const result = await saveAndShareBlob(
                              blob,
                              `grade-distribution-${selectedClass}-${bandsSelectedSubject}-${new Date().toISOString().split('T')[0]}.csv`,
                              "text/csv;charset=utf-8;"
                            );
                            if (!result.success) {
                              toast({
                                title: "Export failed. Please try again.",
                              });
                            } else if (result.savedToDevice) {
                              toast({ title: "Saved to Downloads" });
                            }
                          }}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            handleReportPdfExport(
                              bandsReportRef,
                              `grade-distribution-${selectedClass}-${bandsSelectedSubject}-${new Date().toISOString().split('T')[0]}`
                            );
                          }}
                        >
                          <Printer className="h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto" ref={bandsReportRef}>
                      {/* Report Content */}
                      <div className="space-y-4 p-2">
                        {/* Report Header - Dual Logo Style */}
                        <div className="report-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '10px', gap: '8px' }}>
                          <img src={collinzLogo} alt="Collinz School" crossOrigin="anonymous" style={{ height: '40px', objectFit: 'contain' }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Grade Distribution Report</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                              {bandsCompareMode ? "Class Comparison Analysis" : `${formatClassDisplay(selectedClass)} - ${bandsSelectedSubject}`}
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                              Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {' • '}{selectedYear} {selectedPeriod === 'midYear' ? 'Mid-Year' : 'Year-End'} Examination
                            </div>
                          </div>
                          <img src={cambridgeLogo} alt="Cambridge Assessment" crossOrigin="anonymous" style={{ height: '35px', objectFit: 'contain' }} />
                        </div>

                        {!bandsCompareMode ? (
                          /* Normal Report - Professional Redesign */
                          <>
                            {/* Grade Distribution Bar Chart - SVG for print */}
                            <div className="section" style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #065f46' }}>
                                <span style={{ color: '#065f46' }}><IconBarChart /></span>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>Grade Distribution - {bandsSelectedSubject}</h3>
                              </div>
                              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <svg width="100%" height="140" viewBox="0 0 500 140" preserveAspectRatio="xMidYMid meet">
                                  {/* Grid lines */}
                                  <line x1="40" y1="100" x2="460" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                                  {/* Bars */}
                                  {(() => {
                                    const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                    const maxCount = Math.max(...bandsGradeDistribution.map(d => d.count), 1);
                                    return bandsGradeDistribution.map((g, i) => {
                                      const barWidth = 60;
                                      const x = 50 + i * 70;
                                      const barHeight = (g.count / maxCount) * 75;
                                      const y = 100 - barHeight;
                                      const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                      return (
                                        <g key={g.range}>
                                          <defs>
                                            <linearGradient id={`gradeGradient${g.range}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                              <stop offset="0%" stopColor={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} stopOpacity="1" />
                                              <stop offset="100%" stopColor={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} stopOpacity="0.7" />
                                            </linearGradient>
                                          </defs>
                                          <rect x={x} y={y} width={barWidth} height={barHeight} fill={`url(#gradeGradient${g.range})`} rx="4" />
                                          <text x={x + barWidth / 2} y={y - 6} fontSize="11" fill="#374151" textAnchor="middle" fontWeight="700">{g.count}</text>
                                          <text x={x + barWidth / 2} y="115" fontSize="12" fill={GRADE_COLORS[g.range as keyof typeof GRADE_COLORS]} textAnchor="middle" fontWeight="700">{g.range}</text>
                                          <text x={x + barWidth / 2} y="128" fontSize="9" fill="#6b7280" textAnchor="middle">{percentage}%</text>
                                        </g>
                                      );
                                    });
                                  })()}
                                </svg>
                              </div>
                            </div>

                            {/* Summary Stats with Watermarks */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '14px', pageBreakInside: 'avoid' }}>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{bandsRankedStudents.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{bandsRankedStudents.length}</div>
                                  <div style={{ fontSize: '8px', color: '#1d4ed8' }}>Total</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#f3e8ff', border: '1px solid #d1d5db', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#9333ea', opacity: 0.15 }}>{bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#9333ea' }}>{bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%</div>
                                  <div style={{ fontSize: '8px', color: '#6b21a8' }}>Pass Rate</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#22c55e', opacity: 0.15 }}>{bandsTopPerformers.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{bandsTopPerformers.length}</div>
                                  <div style={{ fontSize: '8px', color: '#166534' }}>Top (A*/A)</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#3b82f6', opacity: 0.15 }}>{bandsMiddlePerformers.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{bandsMiddlePerformers.length}</div>
                                  <div style={{ fontSize: '8px', color: '#1d4ed8' }}>Middle (B/C)</div>
                                </div>
                              </div>
                              <div style={{ position: 'relative', padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: '2px', bottom: '-10px', fontSize: '36px', fontWeight: 800, color: '#ef4444', opacity: 0.15 }}>{bandsAtRiskStudents.length}</div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{bandsAtRiskStudents.length}</div>
                                  <div style={{ fontSize: '8px', color: '#991b1b' }}>At-Risk (D/E)</div>
                                </div>
                              </div>
                            </div>

                            {/* Student Lists - All students shown for printing */}
                            <div className="performers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '1px solid #fde047' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #fde047' }}>
                                  <span style={{ color: '#ca8a04' }}><IconTrophy /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#ca8a04', margin: 0 }}>Top Performers ({bandsTopPerformers.length})</h4>
                                </div>
                                <div className="student-list">
                                  {bandsTopPerformers.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fcd34d40' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsTopPerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                              
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #93c5fd' }}>
                                  <span style={{ color: '#2563eb' }}><IconBook /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#1d4ed8', margin: 0 }}>Middle Performers ({bandsMiddlePerformers.length})</h4>
                                </div>
                                <div className="student-list">
                                  {bandsMiddlePerformers.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #93c5fd40' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsMiddlePerformers.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                              
                              <div style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #fca5a5' }}>
                                  <span style={{ color: '#dc2626' }}><IconTarget /></span>
                                  <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', margin: 0 }}>At-Risk ({bandsAtRiskStudents.length})</h4>
                                </div>
                                <div className="student-list">
                                  {bandsAtRiskStudents.map((s, i) => (
                                    <div key={s.id} className="student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontSize: '9px', borderBottom: '1px solid #fca5a540' }}>
                                      <span>{i + 1}. {s.name}</span>
                                      <span style={{ fontWeight: 600 }}>{s.score}%</span>
                                    </div>
                                  ))}
                                  {bandsAtRiskStudents.length === 0 && <p style={{ fontSize: '9px', color: '#666' }}>No students</p>}
                                </div>
                              </div>
                            </div>

                            {/* Footer - Professional Style */}
                            <div className="footer" style={{ marginTop: '12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                              This is a computer-generated report. Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                            </div>
                          </>
                        ) : (
                          /* Comparison Report */
                          <>
                            {/* Grade Comparison Chart for Report */}
                            <div className="section" style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
                              <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #ddd' }}>
                                Grade Comparison Chart
                              </h3>
                              {/* Dynamic Legend */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getSelectionColor(0).hex }} />
                                  <span style={{ fontSize: '9px', color: '#666' }}>{selectedClass} - {bandsSelectedSubject}</span>
                                </div>
                                {bandsAdditionalSelections.map((selection, index) => {
                                  const color = getSelectionColor(index + 1);
                                  return (
                                    <div key={selection.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color.hex }} />
                                      <span style={{ fontSize: '9px', color: '#666' }}>{selection.className} - {selection.subject}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ height: '200px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={bandsComparisonChartData} barGap={2} margin={{ left: 5, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#374151" }} />
                                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} width={30} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px"
                                      }}
                                      formatter={(value: number, name: string) => {
                                        if (name === "selectionA") {
                                          return [`${value} students`, `${selectedClass} - ${bandsSelectedSubject}`];
                                        }
                                        const selId = name.replace("selection", "");
                                        const selection = bandsAdditionalSelections.find(s => s.id === selId);
                                        return [`${value} students`, selection ? `${selection.className} - ${selection.subject}` : name];
                                      }}
                                    />
                                    <Bar dataKey="selectionA" fill={getSelectionColor(0).hex} radius={[4, 4, 0, 0]} name="selectionA" />
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <Bar 
                                        key={selection.id} 
                                        dataKey={`selection${selection.id}`} 
                                        fill={getSelectionColor(index + 1).hex} 
                                        radius={[4, 4, 0, 0]} 
                                        name={`selection${selection.id}`} 
                                      />
                                    ))}
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(bandsAdditionalSelections.length + 1, 2)}, 1fr)`, gap: '12px' }}>
                              {/* Selection A - Primary */}
                              <div className="comparison-box" style={{ padding: '10px', borderRadius: '6px', backgroundColor: `${getSelectionColor(0).hex}15`, border: `1px solid ${getSelectionColor(0).hex}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getSelectionColor(0).hex }} />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: getSelectionColor(0).hex }}>
                                    {selectedClass} - {bandsSelectedSubject}
                                  </span>
                                </div>
                                <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '10px' }}>
                                  {bandsGradeDistribution.map(g => {
                                    const total = bandsGradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                    const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                    return (
                                      <div key={g.range} className="grade-card" style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                        <div className="grade" style={{ fontSize: '10px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>
                                          {g.range}
                                        </div>
                                        <div className="count" style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                                        <div className="percent" style={{ fontSize: '8px', color: '#666' }}>{percentage}%</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: `1px solid ${getSelectionColor(0).hex}40` }}>
                                  <span>Top: {bandsTopPerformers.length}</span>
                                  <span>Middle: {bandsMiddlePerformers.length}</span>
                                  <span>At-Risk: {bandsAtRiskStudents.length}</span>
                                </div>
                              </div>

                              {/* Dynamic Additional Selections */}
                              {bandsAdditionalSelections.map((selection, index) => {
                                const color = getSelectionColor(index + 1);
                                const selectionData = bandsSelectionsData[index];
                                const gradeDistribution = selectionData?.gradeDistribution || [];
                                const topPerformers = selectionData?.topPerformers || [];
                                const middlePerformers = selectionData?.middlePerformers || [];
                                const atRiskStudents = selectionData?.atRiskStudents || [];

                                return (
                                  <div key={selection.id} className="comparison-box" style={{ padding: '10px', borderRadius: '6px', backgroundColor: `${color.hex}15`, border: `1px solid ${color.hex}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color.hex }} />
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: color.hex }}>
                                        {selection.className} - {selection.subject}
                                      </span>
                                    </div>
                                    <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '10px' }}>
                                      {gradeDistribution.map(g => {
                                        const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0);
                                        const percentage = total > 0 ? Math.round(g.count / total * 100) : 0;
                                        return (
                                          <div key={g.range} className="grade-card" style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                                            <div className="grade" style={{ fontSize: '10px', fontWeight: 700, color: GRADE_COLORS[g.range as keyof typeof GRADE_COLORS] }}>
                                              {g.range}
                                            </div>
                                            <div className="count" style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{g.count}</div>
                                            <div className="percent" style={{ fontSize: '8px', color: '#666' }}>{percentage}%</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', paddingTop: '6px', borderTop: `1px solid ${color.hex}40` }}>
                                      <span>Top: {topPerformers.length}</span>
                                      <span>Middle: {middlePerformers.length}</span>
                                      <span>At-Risk: {atRiskStudents.length}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Comparison Summary */}
                            <div className="stats-box" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px', marginTop: '12px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>Comparison Summary</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 6px', backgroundColor: '#e5e5e5' }}>Metric</th>
                                    <th style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: getSelectionColor(0).hex }}>{selectedClass}</th>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <th key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', backgroundColor: '#e5e5e5', color: getSelectionColor(index + 1).hex }}>{selection.className}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Total Students</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsRankedStudents.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600 }}>{bandsSelectionsData[index]?.rankedStudents?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Top Performers (A*/A)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsTopPerformers.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#059669' }}>{bandsSelectionsData[index]?.topPerformers?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>Middle Performers (B/C)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsMiddlePerformers.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#2563eb' }}>{bandsSelectionsData[index]?.middlePerformers?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '4px 6px' }}>At-Risk (D/E)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsAtRiskStudents.length}</td>
                                    {bandsAdditionalSelections.map((selection, index) => (
                                      <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 600, color: '#dc2626' }}>{bandsSelectionsData[index]?.atRiskStudents?.length || 0}</td>
                                    ))}
                                  </tr>
                                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Passing Rate (≥50%)</td>
                                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                      {bandsRankedStudents.length > 0 ? Math.round((bandsRankedStudents.filter(s => s.score >= 50).length / bandsRankedStudents.length) * 100) : 0}%
                                    </td>
                                    {bandsAdditionalSelections.map((selection, index) => {
                                      const rankedStudents = bandsSelectionsData[index]?.rankedStudents || [];
                                      const passingRate = rankedStudents.length > 0 ? Math.round((rankedStudents.filter(s => s.score >= 50).length / rankedStudents.length) * 100) : 0;
                                      return (
                                        <td key={selection.id} style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 700, color: '#7c3aed' }}>
                                          {passingRate}%
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {/* Footer */}
                        <div className="footer" style={{ textAlign: 'center', fontSize: '9px', color: '#666', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                          <p style={{ margin: 0 }}>Prepared by: {teacherProfile.name} • {teacherProfile.email}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Generate Report Button - at bottom */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setBandsReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
    </>
  );
}
