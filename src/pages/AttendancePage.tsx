import { useState, useRef, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, Clock, CalendarOff, Bug, Inbox } from "lucide-react";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Separator } from "@/components/ui/separator";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useParentAttendance, useRollingAttendance } from "@/hooks/useParentAttendance";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type StatusFilter = "all" | "present" | "absent" | "late" | "excused";
type ZoomLevel = 3 | 6 | 12;
type DayRecord = { date: string; status: string; reason: string | null; remarks: string | null; studentName?: string };

// DEV Debug Panel Component - only visible if import.meta.env.DEV && localStorage.dev_debug === '1'
function DebugPanel({ 
  debugInfo, 
  rollingDebugInfo,
  zoomLevel,
}: { 
  debugInfo: { selectedStudentId: string | null; queryStart: string; queryEnd: string; rowsReturned: number; supabaseError: string | null; lastFetchTime: string };
  rollingDebugInfo: { selectedStudentId: string | null; queryStart: string; queryEnd: string; rowsReturned: number; supabaseError: string | null; lastFetchTime: string };
  zoomLevel: ZoomLevel;
}) {
  // Only render if DEV mode AND explicit localStorage flag
  const shouldShow = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('dev_debug') === '1';
  if (!shouldShow) return null;
  
  const activeDebug = zoomLevel === 12 ? debugInfo : rollingDebugInfo;
  
  return (
    <div className="mx-4 mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg text-xs font-mono">
      <div className="flex items-center gap-2 mb-2">
        <Bug className="h-4 w-4 text-yellow-600" />
        <span className="font-bold text-yellow-800 dark:text-yellow-200">DEV DEBUG PANEL</span>
      </div>
      <div className="space-y-1 text-yellow-900 dark:text-yellow-100">
        <p><strong>Student ID:</strong> {activeDebug.selectedStudentId || "none"}</p>
        <p><strong>Query Mode:</strong> {zoomLevel === 12 ? "Yearly" : `Rolling ${zoomLevel} months`}</p>
        <p><strong>Date Range:</strong> {activeDebug.queryStart} → {activeDebug.queryEnd}</p>
        <p><strong>Rows Returned:</strong> {activeDebug.rowsReturned}</p>
        {activeDebug.supabaseError && (
          <p className="text-red-600"><strong>Error:</strong> {activeDebug.supabaseError}</p>
        )}
        <p className="text-[10px] text-yellow-700 dark:text-yellow-300">
          Last fetch: {activeDebug.lastFetchTime ? new Date(activeDebug.lastFetchTime).toLocaleTimeString() : "never"}
        </p>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(3); // Default to 3-month view
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayRecord | null>(null);

  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
  } = useStudentSelection();

  // Local scope: "all" for aggregated view across all linked children, or a specific student id
  const [scope, setScope] = useState<string>("all");
  const isMultiChild = linkedStudents.length > 1;
  const allStudentIds = useMemo(() => linkedStudents.map((s) => s.id), [linkedStudents]);
  const effectiveScope: string | string[] | null = useMemo(() => {
    if (!isMultiChild) return selectedStudentId;
    return scope === "all" ? allStudentIds : scope;
  }, [isMultiChild, scope, allStudentIds, selectedStudentId]);
  const isAggregated = isMultiChild && scope === "all";

  // Use yearly attendance data (for 12-month view and monthly breakdown)
  const {
    records,
    loading: attendanceLoading,
    error: attendanceError,
    chartData: yearlyChartData,
    getMonthlySummary,
    getDailyBreakdown,
    debugInfo,
  } = useParentAttendance(effectiveScope, selectedYear);

  // Use rolling window attendance (for 3/6 month views)
  const {
    chartData: rollingChartData,
    loading: rollingLoading,
    debugInfo: rollingDebugInfo,
  } = useRollingAttendance(effectiveScope, zoomLevel === 12 ? 12 : zoomLevel);
  
  // Swipe navigation state
  const [monthOffset, setMonthOffset] = useState(0); // 0 = most recent months
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const swipeDistanceRef = useRef(0);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(String);
  const zoomOptions: { value: ZoomLevel; label: string }[] = [
    { value: 3, label: "3 Months" },
    { value: 6, label: "6 Months" },
    { value: 12, label: "Yearly" },
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

  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Calculate max offset based on zoom level
  const maxMonthOffset = Math.max(0, 12 - zoomLevel);

  // Touch handlers with smart gesture detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      e.preventDefault();
      setIsPinching(true);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      // Single touch - prepare for swipe detection
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      swipeDirectionRef.current = null;
      swipeDistanceRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      // Pinch zoom handling
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const delta = newDistance - lastPinchDistance.current;
      
      if (Math.abs(delta) > 40) {
        let newZoom: ZoomLevel | null = null;
        if (delta > 0) {
          // Pinch out - zoom in (show fewer months)
          if (zoomLevel === 12) newZoom = 6;
          else if (zoomLevel === 6) newZoom = 3;
        } else {
          // Pinch in - zoom out (show more months)
          if (zoomLevel === 3) newZoom = 6;
          else if (zoomLevel === 6) newZoom = 12;
        }
        
        if (newZoom && newZoom !== zoomLevel) {
          triggerHaptic();
          setZoomLevel(newZoom);
          // Adjust offset when zooming out to ensure valid range
          setMonthOffset(prev => Math.min(prev, Math.max(0, 12 - newZoom!)));
        }
        lastPinchDistance.current = newDistance;
      }
    } else if (e.touches.length === 1 && touchStartRef.current) {
      // Single touch swipe detection
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      
      // Determine swipe direction on first significant movement
      if (swipeDirectionRef.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical swipe - allow page scrolling
          swipeDirectionRef.current = 'vertical';
        } else {
          // Horizontal swipe - handle chart navigation
          swipeDirectionRef.current = 'horizontal';
        }
      }
      
      // Handle horizontal swipe
      if (swipeDirectionRef.current === 'horizontal') {
        e.preventDefault();
        swipeDistanceRef.current = deltaX;
      }
    }
  };

  const handleTouchEnd = () => {
    // Handle pinch end
    if (isPinching) {
      setIsPinching(false);
      lastPinchDistance.current = null;
    }
    
    // Handle horizontal swipe end
    if (swipeDirectionRef.current === 'horizontal' && Math.abs(swipeDistanceRef.current) > 50) {
      const swipeThreshold = 50;
      if (swipeDistanceRef.current > swipeThreshold) {
        // Swipe right - go to earlier months
        setMonthOffset(prev => {
          const newOffset = Math.min(prev + 1, maxMonthOffset);
          if (newOffset !== prev) triggerHaptic();
          return newOffset;
        });
      } else if (swipeDistanceRef.current < -swipeThreshold) {
        // Swipe left - go to later months
        setMonthOffset(prev => {
          const newOffset = Math.max(prev - 1, 0);
          if (newOffset !== prev) triggerHaptic();
          return newOffset;
        });
      }
    }
    
    // Reset touch state
    touchStartRef.current = null;
    swipeDirectionRef.current = null;
    swipeDistanceRef.current = 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-emerald-100 text-emerald-700";
      case "absent": return "bg-destructive/15 text-destructive";
      case "late": return "bg-amber-100 text-amber-700";
      case "excused": return "bg-purple-100 text-purple-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusTileClasses = (status: string) => {
    switch (status) {
      case "present":
        return "bg-emerald-50 border-emerald-200";
      case "absent":
        return "bg-red-50 border-red-200";
      case "late":
        return "bg-amber-50 border-amber-200";
      case "excused":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-card border-border/70";
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

  // Use rolling data for 3/6 month views, yearly data for 12-month view
  const allChartData = zoomLevel === 12 ? yearlyChartData : rollingChartData;

  const chartDataWithTotal = allChartData.map(item => ({
    ...item,
    total: item.present + item.absent + item.late + item.excused
  }));

  // Get visible chart data based on zoom level and offset
  const chartData = (() => {
    if (zoomLevel === 12) return chartDataWithTotal;
    // For rolling windows (3/6), show all data (already filtered by date range)
    return chartDataWithTotal;
  })();

  // Reset offset when zoom level changes
  useEffect(() => {
    setMonthOffset(0);
  }, [zoomLevel]);

  // Calculate monthly summary from real data
  const monthlySummary = getMonthlySummary(currentMonthIndex);

  // Get daily breakdown from real data
  const dailyBreakdown = getDailyBreakdown(currentMonthIndex);

  // Filter daily breakdown by status
  const filteredBreakdown = statusFilter === "all" 
    ? dailyBreakdown 
    : dailyBreakdown.filter(d => d.status === statusFilter);

  // Group by week
  const groupByWeek = (days: typeof dailyBreakdown) => {
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

  // Multi-child daily breakdown: group records by date, list per-child status entries
  type ChildEntry = { studentId: string; studentName: string; status: string; reason: string | null; remarks: string | null };
  type MultiDay = { date: string; entries: ChildEntry[] };

  const multiDailyBreakdown = useMemo<MultiDay[]>(() => {
    if (!isAggregated) return [];
    const nameMap: Record<string, string> = {};
    linkedStudents.forEach((s) => { nameMap[s.id] = s.name; });
    const monthRecords = records.filter((r) => new Date(r.date).getMonth() === currentMonthIndex);
    const byDate: Record<string, ChildEntry[]> = {};
    monthRecords.forEach((r) => {
      const status = r.status.toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return;
      const entry: ChildEntry = {
        studentId: r.student_id,
        studentName: nameMap[r.student_id] ?? r.student_name ?? "Student",
        status,
        reason: status !== "present" && r.remarks ? r.remarks : null,
        remarks: r.remarks,
      };
      (byDate[r.date] ||= []).push(entry);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => a.studentName.localeCompare(b.studentName)),
      }));
  }, [isAggregated, records, currentMonthIndex, statusFilter, linkedStudents]);

  const multiWeeklyBreakdown = useMemo(() => {
    if (!isAggregated) return [] as { weekStart: string; days: MultiDay[] }[];
    const sorted = [...multiDailyBreakdown].sort((a, b) => (a.date < b.date ? -1 : 1));
    const weeks: { weekStart: string; days: MultiDay[] }[] = [];
    let cur: MultiDay[] = [];
    let curStart = "";
    sorted.forEach((d, idx) => {
      const date = new Date(d.date);
      const dow = date.getDay();
      if (dow === 1 || idx === 0) {
        if (cur.length > 0) weeks.push({ weekStart: curStart, days: cur });
        cur = [d];
        curStart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        cur.push(d);
      }
    });
    if (cur.length > 0) weeks.push({ weekStart: curStart, days: cur });
    return weeks.reverse();
  }, [isAggregated, multiDailyBreakdown]);

  // Filter chip counts — in aggregated mode use full record totals for the month
  const monthRecordsAll = useMemo(
    () => records.filter((r) => new Date(r.date).getMonth() === currentMonthIndex),
    [records, currentMonthIndex]
  );
  const aggregatedCounts = useMemo(() => ({
    present: monthRecordsAll.filter((r) => r.status.toLowerCase() === "present").length,
    absent: monthRecordsAll.filter((r) => r.status.toLowerCase() === "absent").length,
    late: monthRecordsAll.filter((r) => r.status.toLowerCase() === "late").length,
    excused: monthRecordsAll.filter((r) => r.status.toLowerCase() === "excused").length,
  }), [monthRecordsAll]);

  // Check if date is today
  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  const filterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: dailyBreakdown.length },
    { value: "present", label: "Present", count: monthlySummary.present },
    { value: "absent", label: "Absent", count: monthlySummary.absent },
    { value: "late", label: "Late", count: monthlySummary.late },
    { value: "excused", label: "Excused", count: monthlySummary.excused },
  ];

  const isLoading = studentsLoading || attendanceLoading || (zoomLevel !== 12 && rollingLoading);

  // Empty-state detection: no records returned for this scope after loading completes
  const hasAnyData = records.length > 0;
  const scopeStudent = isMultiChild
    ? (scope !== "all" ? linkedStudents.find((s) => s.id === scope) : null)
    : linkedStudents.find((s) => s.id === selectedStudentId);
  const scopeStudentName = scopeStudent?.name?.split(" ")[0] ?? "your child";
  const hasAnyStudent = isMultiChild ? allStudentIds.length > 0 : !!selectedStudentId;
  const showEmptyState = !isLoading && hasAnyStudent && !hasAnyData;

  // Build per-student lookup for multi-child views
  const studentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    linkedStudents.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [linkedStudents]);

  const EmptyStateBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "py-10"} px-4`}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">No attendance recorded yet</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        {isAggregated
          ? "Your children's teachers haven't marked any attendance yet. Records will appear here once class attendance starts being taken."
          : scopeStudent
            ? `${scopeStudentName}'s teacher hasn't marked any attendance yet. Records will appear here once class attendance starts being taken.`
            : "Records will appear here once class attendance starts being taken."}
      </p>
    </div>
  );

  return (
    <AppLayout>
      {/* DEV Debug Panel - only shown in dev mode with explicit flag */}
      <DebugPanel 
        debugInfo={debugInfo} 
        rollingDebugInfo={rollingDebugInfo}
        zoomLevel={zoomLevel}
      />
      
      <AppHeader
        showChildSelector={!isMultiChild}
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
          </div>
        }
      />

      {/* Local scope selector for multi-child parents */}
      {isMultiChild && (
        <section className="px-4 pt-3">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-full h-10 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card z-[100]">
              <SelectItem value="all">All Children ({linkedStudents.length})</SelectItem>
              {linkedStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {/* Attendance Chart */}
      <section className="px-4 pt-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
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
            <div className="flex gap-1 mt-2">
              {zoomOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={zoomLevel === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3 flex-1"
                  onClick={() => setZoomLevel(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Swipe indicators */}
            {zoomLevel < 12 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className={monthOffset < maxMonthOffset ? "opacity-100" : "opacity-30"}>
                  ← Earlier
                </span>
                <span className={monthOffset > 0 ? "opacity-100" : "opacity-30"}>
                  Later →
                </span>
              </div>
            )}
            <div 
              ref={chartContainerRef}
              className="h-64 select-none transition-all duration-300 ease-out"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: isPinching ? 'none' : swipeDirectionRef.current === 'horizontal' ? 'none' : 'pan-y'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => {
                // Dismiss tooltip when clicking on empty space
                const target = e.target as HTMLElement;
                if (!target.closest('.recharts-bar-rectangle')) {
                  setActiveTooltip(null);
                }
              }}
            >
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Loading attendance data...</p>
                </div>
              ) : showEmptyState ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyStateBlock />
                </div>
              ) : (
                <div 
                  className="transition-all duration-300 ease-out"
                  style={{ 
                    width: '100%', 
                    height: '100%' 
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData} 
                      barCategoryGap={zoomLevel === 3 ? "20%" : zoomLevel === 6 ? "15%" : "10%"}
                      onClick={(data) => {
                        if (data && data.activeLabel) {
                          setActiveTooltip(prev => prev === data.activeLabel ? null : data.activeLabel);
                        }
                      }}
                    >
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
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                        }}
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        active={activeTooltip !== null}
                        payload={activeTooltip ? chartData.filter(d => d.month === activeTooltip).map(d => [
                          { name: 'Present', value: d.present, color: 'hsl(160, 84%, 39%)' },
                          { name: 'Absent', value: d.absent, color: 'hsl(var(--destructive))' },
                          { name: 'Late', value: d.late, color: 'hsl(38, 92%, 50%)' },
                          { name: 'Excused', value: d.excused, color: 'hsl(271, 91%, 65%)' }
                        ]).flat() : undefined}
                        label={activeTooltip || undefined}
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
              )}
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
              <span className="font-semibold text-foreground">{selectedMonth} {selectedYear}</span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Summary Stats */}
            {showEmptyState ? (
              <EmptyStateBlock compact />
            ) : (
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 min-h-[72px]">
                <p className="text-2xl font-bold leading-none" style={{ color: "hsl(160, 84%, 39%)" }}>{monthlySummary.present}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Present</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-destructive/10 min-h-[72px]">
                <p className="text-2xl font-bold leading-none text-destructive">{monthlySummary.absent}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Absent</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 min-h-[72px]">
                <p className="text-2xl font-bold leading-none" style={{ color: "hsl(38, 92%, 40%)" }}>{monthlySummary.late}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Late</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 min-h-[72px]">
                <p className="text-2xl font-bold leading-none" style={{ color: "hsl(271, 91%, 55%)" }}>{monthlySummary.excused}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Excused</p>
              </div>
            </div>
            )}
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
            <div className="flex flex-wrap gap-1 pb-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`inline-flex items-center gap-1 h-7 px-compact rounded-full border text-xs font-medium transition-colors ${
                    statusFilter === option.value
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-white border-border text-foreground/80 hover:bg-muted/50"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`ml-0.5 inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[11px] leading-none ${
                      statusFilter === option.value
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Loading / Empty State */}
            {isLoading && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            )}

            {!isLoading && weeklyBreakdown.length === 0 && (
              showEmptyState ? (
                <EmptyStateBlock compact />
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <CalendarOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No records for {selectedMonth}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Try a different month or status filter.</p>
                </div>
              )
            )}

            {/* Weekly Groups */}
            {weeklyBreakdown.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-1">
                {/* Week Separator */}
                <div className="flex items-center gap-3 mt-3 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Week of {week.weekStart}
                  </span>
                  <div className="h-px flex-1 bg-border/70" />
                </div>

                {/* Days - 2 per row */}
                <div className="grid grid-cols-2 gap-2">
                  {week.days.map((day, dayIndex) => {
                    const date = new Date(day.date);
                    const today = isToday(day.date);

                    return (
                      <div 
                        key={dayIndex}
                        onClick={() => setSelectedDay(day as DayRecord)}
                        className={`flex items-center gap-2 h-9 px-3 rounded-xl transition-all border cursor-pointer active:scale-[0.98] ${
                          today ? "ring-1 ring-primary/40" : ""
                        } ${getStatusTileClasses(day.status)}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(day.status)}`}>
                          {getStatusIcon(day.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm leading-none">
                            {date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                          </p>
                          {day.reason && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {day.reason}
                            </p>
                          )}
                        </div>
                        {today && (
                          <span className="text-[9px] font-semibold text-primary shrink-0">Today</span>
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

      {/* Attendance Details Bottom Sheet */}
      <BottomSheet
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        snapPoints={[0, 0.55]}
        defaultSnapPoint={0.55}
        showHandle={true}
      >
        {selectedDay && (
          <div className="px-5 py-5 space-y-4">
            {/* Date - full width, larger */}
            <p className="text-xl font-bold text-foreground">
              {new Date(selectedDay.date).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            {/* Status pill - full width */}
            <div className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-base font-bold tracking-wide ${
              selectedDay.status === 'present' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
              selectedDay.status === 'absent' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
              selectedDay.status === 'late' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
              selectedDay.status === 'excused' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" :
              "bg-muted text-muted-foreground"
            }`}>
              {getStatusIcon(selectedDay.status)}
              {getStatusLabel(selectedDay.status)}
            </div>

            <Separator />

            {/* Remarks */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground italic">
                {selectedDay.status === 'present'
                  ? "Your child arrived on time today. Great job! 🎉"
                  : selectedDay.status === 'absent'
                  ? "Your child was absent today. Please ensure to inform the school for any absences."
                  : selectedDay.status === 'late'
                  ? "Your child arrived late today. Please try to ensure punctuality going forward."
                  : selectedDay.status === 'excused'
                  ? "Your child's absence has been excused for this day."
                  : "No additional remarks for this day."}
              </p>

              {selectedDay.remarks && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Teacher's Remark
                  </p>
                  <p className="text-sm text-foreground leading-relaxed break-words">
                    {selectedDay.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
