import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, BookOpen, BarChart3, TrendingUp, TrendingDown, Award, Users, Target, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { cn, formatClassDisplay } from "@/lib/utils";
import { SubjectPerformanceChart } from "@/components/SubjectPerformanceChart";
import { SUBJECT_COLORS } from "../constants";
import type { useClassAnalysis } from "@/hooks/useClassAnalysis";

type ClassAnalysis = ReturnType<typeof useClassAnalysis>;

interface SubjectAverage {
  name: string;
  fullName: string;
  average: number;
  cohortAvg?: number | null;
}

interface TrendItem {
  name: string;
  change?: number;
  decline?: number;
  improvement?: number;
  first: number;
  last: number;
}

interface OverviewTabProps {
  classAnalysis: ClassAnalysis;
  gradeEntryRef: React.RefObject<HTMLDivElement>;
  fallingSubjects: TrendItem[];
  subjectAverages: SubjectAverage[];
  classAverage: number;
  risingSubjects: TrendItem[];
  rosterCount: number;
  passCount: number;
  passRate: number;
  onGenerateReport: () => void;
}

export function OverviewTab({
  classAnalysis,
  gradeEntryRef,
  fallingSubjects,
  subjectAverages,
  classAverage,
  risingSubjects,
  rosterCount,
  passCount,
  passRate,
  onGenerateReport,
}: OverviewTabProps) {
  return (
    <>
                {/* Loading State */}
                {classAnalysis.loading && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Loading class analysis data...</p>
                    </CardContent>
                  </Card>
                )}

                {/* Error State */}
                {classAnalysis.error && (
                  <Card className="border-destructive">
                    <CardContent className="p-6 text-center">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
                      <p className="text-sm text-destructive">{classAnalysis.error}</p>
                    </CardContent>
                  </Card>
                )}

                {!classAnalysis.loading && !classAnalysis.error && (
                  <>
                    {/* Filters Row - Class and Period selectors */}
                    <div className="flex gap-2">
                      {/* Class Dropdown */}
                      <Select 
                        value={classAnalysis.selectedClass || ""} 
                        onValueChange={(v) => classAnalysis.setSelectedClass(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.classes.length === 0 ? (
                            <SelectItem value="_none" disabled>No classes found</SelectItem>
                          ) : (
                            classAnalysis.classes.map((cls) => (
                              <SelectItem key={cls} value={cls}>{formatClassDisplay(cls)}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Academic Period Dropdown */}
                      <Select
                        value={classAnalysis.selectedPeriodId || ""}
                        onValueChange={(v) => classAnalysis.setSelectedPeriodId(v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {classAnalysis.academicPeriodsForYear.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Empty State */}
                    {!classAnalysis.selectedClass && (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Select a class to view analysis</p>
                        </CardContent>
                      </Card>
                    )}

                    {classAnalysis.selectedClass && !classAnalysis.hasData && !classAnalysis.loadingData && (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center space-y-3">
                          <BarChart3 className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {classAnalysis.hasYearGrades
                              ? "No grades recorded for this exam period yet."
                              : "No grades recorded for the selected academic year yet."}
                          </p>
                          {!classAnalysis.hasYearGrades && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => gradeEntryRef.current?.scrollIntoView({ behavior: "smooth" })}
                            >
                              Go to Grade Entry
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {classAnalysis.selectedClass && classAnalysis.hasData && (
                      <>
                        {/* Subject Selector - Toggle Chips */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">Subjects ({classAnalysis.subjects.length})</h4>
                            <div className="flex gap-2">
                              <button
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                onClick={() => classAnalysis.selectAllSubjects()}
                              >
                                Select All
                              </button>
                              <button
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                onClick={() => classAnalysis.clearSubjects()}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-background">
                            {classAnalysis.subjects.map((subject) => {
                              const isSelected = classAnalysis.selectedSubjectIds.includes(subject.id);
                              return (
                                <button
                                  key={subject.id}
                                  onClick={() => classAnalysis.toggleSubject(subject.id)}
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

                {/* Rising Subjects - Star pattern design like student page */}
                {classAnalysis.risingSubjects.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" style={{
                    color: '#d97706'
                  }} /> Rising Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Biggest improvements from previous exam</p>
                    <div className="grid grid-cols-3 gap-2">
                      {classAnalysis.risingSubjects.map(item => <div key={item.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
                    borderColor: 'rgba(251, 191, 36, 0.5)'
                  }}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.25) 0%, transparent 40%)'
                    }} />
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
                            <svg className="absolute bottom-2 left-0 w-5 h-5 opacity-30" fill="#fde68a" stroke="#fcd34d" strokeWidth="0.5" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowUpRight className="h-3 w-3" style={{
                        color: '#d97706'
                      }} />
                            <span className="text-sm font-bold" style={{
                        color: '#d97706'
                      }}>+{item.change}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}>
                              {item.first}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff'
                      }}>
                              {item.last}%
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* At-Risk Subjects */}
                {fallingSubjects.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" style={{ color: '#dc2626' }} /> At-Risk Subjects
                    </h4>
                    <p className="text-[10px] text-muted-foreground -mt-1">Subjects that need extra attention</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fallingSubjects.slice(0, 3).map(item => <div key={item.name} className="relative flex flex-col items-center p-2.5 rounded-lg border overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #f87171 100%)',
                    borderColor: 'rgba(248, 113, 113, 0.5)'
                  }}>
                          {/* Inner shine effect */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 40%)'
                    }} />
                          {/* Warning pattern background */}
                          <div className="absolute inset-0 pointer-events-none">
                            <AlertTriangle className="absolute top-1 -left-1 w-7 h-7 opacity-20" style={{ color: '#dc2626' }} />
                            <AlertTriangle className="absolute bottom-1 -right-1 w-6 h-6 opacity-15" style={{ color: '#ef4444' }} />
                          </div>
                          <span className="text-xs font-medium text-foreground text-center relative z-10">{item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name}</span>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <ArrowDownRight className="h-3 w-3" style={{ color: '#dc2626' }} />
                            <span className="text-sm font-bold" style={{ color: '#dc2626' }}>-{item.decline}%</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 relative z-10">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#fef2f2',
                        color: '#991b1b'
                      }}>
                              {item.first}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff'
                      }}>
                              {item.last}%
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* Subject Performance Bar Chart - Using real data from classAnalysis */}
                {!classAnalysis.hasData ? (
                  <div className="p-6 text-center border rounded-lg bg-muted/30">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {classAnalysis.hasYearGrades
                          ? "No grades recorded for this exam period yet."
                          : "No grades recorded for the selected academic year yet."}
                      </p>
                  </div>
                ) : subjectAverages.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg bg-muted/30">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No subject data available
                    </p>
                  </div>
                ) : (
                  <SubjectPerformanceChart 
                    data={subjectAverages.map((s, index) => ({
                      name: s.name,
                      fullName: s.fullName,
                      score: isNaN(s.average) ? 0 : Math.round(s.average),
                      goal: isNaN(s.average) ? 0 : Math.round(s.average),
                      cohortAvg:
                        typeof s.cohortAvg === "number" ? Math.round(s.cohortAvg) : undefined
                    }))}
                    lineColors={SUBJECT_COLORS}
                    showGoalBadge={false}
                    showCohortDot={true}
                    cohortLabel={classAnalysis.cohortYearLevel}
                    classLabel={classAnalysis.selectedClass}
                  />
                )}

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Average */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}>
                    <BookOpen className="h-5 w-5 mb-1.5" style={{
                    color: '#3b82f6'
                  }} />
                    <span className="text-lg font-bold text-foreground">
                      {classAverage}%
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Average</span>
                    <span className="text-[9px] text-muted-foreground/70">Class Average</span>
                  </div>
                  
                  {/* Best Subject */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.1)'
                }}>
                    <Award className="h-5 w-5 mb-1.5" style={{
                    color: '#f59e0b'
                  }} />
                    <span className={cn(
                      "font-bold text-foreground leading-tight",
                      (subjectAverages[0]?.name || '').length > 8 ? "text-xs" : "text-sm"
                    )}>
                      {subjectAverages[0]?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Best Subject</span>
                    <span className="text-[9px] text-muted-foreground/70">
                      {subjectAverages[0]?.average != null && !isNaN(subjectAverages[0].average) 
                        ? `${Math.round(subjectAverages[0].average)}%` 
                        : '0%'}
                    </span>
                  </div>
                  
                  {/* Improvement */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)'
                }}>
                    <TrendingUp className="h-5 w-5 mb-1.5" style={{
                    color: '#22c55e'
                  }} />
                    <span className="text-lg font-bold text-foreground">
                      {risingSubjects[0]?.improvement ? `+${risingSubjects[0].improvement}%` : '+0%'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Improvement</span>
                    <span className="text-[9px] text-muted-foreground/70">Top Growth</span>
                  </div>
                  
                  {/* Students */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.1)'
                }}>
                    <Users className="h-5 w-5 mb-1.5" style={{
                    color: '#a855f7'
                  }} />
                      <span className="text-lg font-bold text-foreground">{rosterCount}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Students</span>
                    <span className="text-[9px] text-muted-foreground/70">In Class</span>
                  </div>
                  
                  {/* Passing */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.1)'
                }}>
                    <Target className="h-5 w-5 mb-1.5" style={{
                    color: '#14b8a6'
                  }} />
                      <span className="text-lg font-bold text-foreground">
                        {passCount}/{rosterCount}
                      </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Passing</span>
                    <span className="text-[9px] text-muted-foreground/70">{passRate}%</span>
                  </div>
                  
                  {/* Needs Focus */}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <AlertTriangle className="h-5 w-5 mb-1.5" style={{
                    color: '#ef4444'
                  }} />
                    <span className={cn(
                      "font-bold text-foreground leading-tight",
                      (subjectAverages[subjectAverages.length - 1]?.name || '').length > 8 ? "text-xs" : "text-sm"
                    )}>
                      {subjectAverages[subjectAverages.length - 1]?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Needs Focus</span>
                    <span className="text-[9px] text-muted-foreground/70">
                      {subjectAverages[subjectAverages.length - 1]?.average != null && !isNaN(subjectAverages[subjectAverages.length - 1].average) 
                        ? `${Math.round(subjectAverages[subjectAverages.length - 1].average)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Top Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Award className="h-4 w-4" style={{
                      color: '#22c55e'
                    }} /> Top Subjects
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(0, 3).map((sub, index) => <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.2)'
                    }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#16a34a'
                      }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{
                          backgroundColor: '#22c55e'
                        }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Subjects Needing Attention - Red color */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" style={{
                      color: '#ef4444'
                    }} /> Needs Attention
                    </h4>
                    <div className="space-y-2">
                      {subjectAverages.slice(-3).reverse().map((sub, index) => <div key={sub.fullName} className="flex items-center gap-2 p-2.5 rounded-lg border min-h-[50px]" style={{
                      backgroundColor: 'rgba(254, 202, 202, 0.3)',
                      borderColor: 'rgba(248, 113, 113, 0.3)'
                    }}>
                          <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: 'rgba(254, 202, 202, 0.5)',
                        color: '#dc2626'
                      }}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground leading-tight truncate">{sub.name}</span>
                            <Badge className="text-[10px] font-semibold w-fit mt-0.5 text-white" style={{
                          backgroundColor: '#f87171'
                        }}>{sub.average.toFixed(0)}%</Badge>
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>

                {/* Generate Report Button - at bottom */}
                <Button
                  size="sm"
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onGenerateReport()}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                      </>
                    )}
                  </>
                )}
    </>
  );
}
