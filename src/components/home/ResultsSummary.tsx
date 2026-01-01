import { academicData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, Award, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ResultsSummary() {
  const navigate = useNavigate();
  const { averageScore, bestSubject, improvement } = academicData;

  const stats = [
    { 
      icon: Target, 
      label: "Average", 
      value: `${averageScore}%`, 
      color: "text-chart-1" 
    },
    { 
      icon: Award, 
      label: "Best Subject", 
      value: bestSubject, 
      color: "text-chart-2" 
    },
    { 
      icon: TrendingUp, 
      label: "Improvement", 
      value: improvement, 
      color: "text-chart-3" 
    },
  ];

  return (
    <section className="px-4 py-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Academic Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="flex flex-col items-center text-center p-3 rounded-lg bg-accent/50"
              >
                <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
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
