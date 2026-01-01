import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Award, Calendar } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import { students } from "@/data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const studentAwards = [
  {
    id: 1,
    title: "Academic Excellence Award",
    category: "Academic",
    date: "2025-12-15",
    description: "Outstanding performance in Mid-Year Examinations 2025",
    icon: Star,
    color: "bg-chart-1",
  },
  {
    id: 2,
    title: "Best Sportsmanship",
    category: "Sports",
    date: "2025-11-20",
    description: "Inter-School Basketball Tournament 2025",
    icon: Medal,
    color: "bg-chart-2",
  },
  {
    id: 3,
    title: "Science Fair Gold Medal",
    category: "Academic",
    date: "2025-10-10",
    description: "1st Place in Regional Science Fair Competition",
    icon: Trophy,
    color: "bg-chart-3",
  },
  {
    id: 4,
    title: "Perfect Attendance",
    category: "Achievement",
    date: "2025-09-30",
    description: "100% attendance for Term 1 2025",
    icon: Award,
    color: "bg-chart-4",
  },
  {
    id: 5,
    title: "Best Public Speaker",
    category: "Co-Curricular",
    date: "2025-08-15",
    description: "Debate Club Regional Competition 2025",
    icon: Trophy,
    color: "bg-chart-5",
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Academic":
      return "bg-emerald-100 text-emerald-700";
    case "Sports":
      return "bg-blue-100 text-blue-700";
    case "Achievement":
      return "bg-amber-100 text-amber-700";
    case "Co-Curricular":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AwardsPage() {
  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Student Awards</h1>
          </div>
        }
        rightContent={
          <Select defaultValue={students[0]?.id}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Summary Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-chart-1/10 border-chart-1/30">
            <CardContent className="p-3 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-1 text-chart-1" />
              <p className="text-2xl font-bold text-foreground">{studentAwards.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Awards</p>
            </CardContent>
          </Card>
          <Card className="bg-chart-2/10 border-chart-2/30">
            <CardContent className="p-3 text-center">
              <Star className="h-6 w-6 mx-auto mb-1 text-chart-2" />
              <p className="text-2xl font-bold text-foreground">
                {studentAwards.filter(a => a.category === "Academic").length}
              </p>
              <p className="text-[10px] text-muted-foreground">Academic</p>
            </CardContent>
          </Card>
          <Card className="bg-chart-3/10 border-chart-3/30">
            <CardContent className="p-3 text-center">
              <Medal className="h-6 w-6 mx-auto mb-1 text-chart-3" />
              <p className="text-2xl font-bold text-foreground">
                {studentAwards.filter(a => a.category === "Sports").length}
              </p>
              <p className="text-[10px] text-muted-foreground">Sports</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Awards List */}
      <section className="px-4 pb-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              All Awards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentAwards.map((award) => {
              const IconComponent = award.icon;
              return (
                <div 
                  key={award.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border/50"
                >
                  <div className={`p-2.5 rounded-lg ${award.color}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-foreground text-sm">{award.title}</h3>
                      <Badge className={`${getCategoryColor(award.category)} text-[10px] shrink-0`}>
                        {award.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{award.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(award.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}