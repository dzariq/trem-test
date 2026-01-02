import { useState } from "react";
import { attendanceData } from "@/data/mockData";
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

const monthOptions = [
  { label: "January", value: "Jan" },
  { label: "December", value: "Dec" },
  { label: "November", value: "Nov" },
  { label: "October", value: "Oct" },
  { label: "September", value: "Sep" },
  { label: "August", value: "Aug" },
];

export function AttendanceSummary() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  
  // Find the data for the selected month
  const monthData = attendanceData.monthly.find(m => m.month === selectedMonth.value);
  
  const total = monthData 
    ? monthData.present + monthData.absent + monthData.late + monthData.excused 
    : 100;
  
  // Colors matching AttendancePage: Present=emerald, Absent=red, Late=amber, Excused=purple
  const chartData = monthData ? [
    { name: "Present", value: Math.round((monthData.present / total) * 100), color: "hsl(160, 84%, 39%)" },
    { name: "Absent", value: Math.round((monthData.absent / total) * 100), color: "hsl(var(--destructive))" },
    { name: "Late", value: Math.round((monthData.late / total) * 100), color: "hsl(38, 92%, 50%)" },
    { name: "Excused", value: Math.round((monthData.excused / total) * 100), color: "hsl(271, 91%, 65%)" },
  ] : [
    { name: "Present", value: 89, color: "hsl(160, 84%, 39%)" },
    { name: "Absent", value: 7, color: "hsl(var(--destructive))" },
    { name: "Late", value: 3, color: "hsl(38, 92%, 50%)" },
    { name: "Excused", value: 1, color: "hsl(271, 91%, 65%)" },
  ];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            Attendance Overview
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm font-normal text-muted-foreground h-auto py-1 px-2">
                  {selectedMonth.label}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {monthOptions.map((month) => (
                  <DropdownMenuItem 
                    key={month.value}
                    onClick={() => setSelectedMonth(month)}
                    className={selectedMonth.value === month.value ? "bg-muted" : ""}
                  >
                    {month.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
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
