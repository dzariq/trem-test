import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useStudentAttendanceSummary } from "@/hooks/useStudentAttendanceSummary";

const PERIOD_OPTIONS = [
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
];

export function AttendanceSummary() {
  const navigate = useNavigate();
  const {
    linkedStudents,
    loading: studentsLoading,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);

  const {
    totals,
    loading: attendanceLoading,
    error: attendanceError,
  } = useStudentAttendanceSummary(selectedStudentId, selectedPeriod.days);

  const loading = studentsLoading || attendanceLoading;
  const total = totals.total;

  const chartData = total > 0 ? [
    { name: "Present", value: Math.round((totals.present / total) * 100), color: "hsl(160, 84%, 39%)" },
    { name: "Absent", value: Math.round((totals.absent / total) * 100), color: "hsl(var(--destructive))" },
    { name: "Late", value: Math.round((totals.late / total) * 100), color: "hsl(38, 92%, 50%)" },
    { name: "Excused", value: Math.round((totals.excused / total) * 100), color: "hsl(271, 91%, 65%)" },
  ] : [];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Attendance Overview</span>
            <div className="flex items-center gap-2">
              {/* Student Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-normal text-muted-foreground h-auto py-1 px-2"
                    disabled={studentsLoading || linkedStudents.length === 0}
                  >
                    <span className="truncate max-w-[100px]">{selectedStudent?.name ?? "Select Student"}</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  {linkedStudents.map((student) => (
                    <DropdownMenuItem
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={selectedStudentId === student.id ? "bg-muted" : ""}
                    >
                      {student.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Period Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-normal text-muted-foreground h-auto py-1 px-2"
                    disabled={loading}
                  >
                    {selectedPeriod.label}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  {PERIOD_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.days}
                      onClick={() => setSelectedPeriod(option)}
                      className={selectedPeriod.days === option.days ? "bg-muted" : ""}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Loading attendance...
            </p>
          )}
          {!loading && attendanceError && (
            <p className="text-sm text-destructive text-center py-6">
              {attendanceError}
            </p>
          )}
          {!loading && !attendanceError && !selectedStudentId && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No linked students found.
            </p>
          )}
          {!loading && !attendanceError && selectedStudentId && chartData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No attendance records for this period.
            </p>
          )}
          {!loading && !attendanceError && chartData.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex-1 space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate("/parent/attendance")}
          >
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
