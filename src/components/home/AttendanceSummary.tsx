import { useEffect, useState } from "react";
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
import { listMonthlyAttendanceSummary, type MonthlyAttendanceSummary } from "@/data/attendance";

export function AttendanceSummary() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<MonthlyAttendanceSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMonthlyAttendanceSummary();
        if (isMounted) {
          setSummary(data);
          if (data.length > 0 && !selectedMonth) {
            setSelectedMonth(data[0]);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load attendance summary.";
        if (isMounted) {
          setError(message);
          setSummary([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const monthData = selectedMonth;
  const total = monthData
    ? monthData.present + monthData.absent + monthData.late + monthData.excused
    : 0;

  const chartData = monthData && total > 0 ? [
    { name: "Present", value: Math.round((monthData.present / total) * 100), color: "hsl(160, 84%, 39%)" },
    { name: "Absent", value: Math.round((monthData.absent / total) * 100), color: "hsl(var(--destructive))" },
    { name: "Late", value: Math.round((monthData.late / total) * 100), color: "hsl(38, 92%, 50%)" },
    { name: "Excused", value: Math.round((monthData.excused / total) * 100), color: "hsl(271, 91%, 65%)" },
  ] : [];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            Attendance Overview
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-normal text-muted-foreground h-auto py-1 px-2"
                  disabled={loading || summary.length === 0}
                >
                  {selectedMonth?.month || "No data"}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {summary.map((month) => (
                  <DropdownMenuItem
                    key={month.month}
                    onClick={() => setSelectedMonth(month)}
                    className={selectedMonth?.month === month.month ? "bg-muted" : ""}
                  >
                    {month.month}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Loading attendance...
            </p>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive text-center py-6">
              {error}
            </p>
          )}
          {!loading && !error && chartData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No attendance data available yet.
            </p>
          )}
          {!loading && !error && chartData.length > 0 && (
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
