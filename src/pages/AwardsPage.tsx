import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Check, Calendar } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import { students } from "@/data/mockData";
import { awardTypes, getStudentAwards } from "@/data/awardsData";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AwardsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "1");
  const earnedAwards = getStudentAwards(selectedStudentId);

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-semibold text-foreground">Collinz Students Award</h1>
          </div>
        }
        rightContent={
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
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

      {/* Student's Earned Awards */}
      <section className="px-4 py-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              My Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnedAwards.length > 0 ? (
              <div className="space-y-3">
                {earnedAwards.map((earned, index) => {
                  const IconComponent = earned.award.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50"
                    >
                      <div className={`p-2 rounded-lg ${earned.award.color}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">
                          {earned.award.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {earned.term}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No awards earned yet. Keep up the great work!
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Award Categories */}
      <section className="px-4 pb-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Award Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              {awardTypes.map((award) => {
                const IconComponent = award.icon;
                const isEarned = earnedAwards.some(ea => ea.awardKey === award.key);
                
                return (
                  <AccordionItem key={award.key} value={award.key} className="border-border/50">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${award.color}`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground text-left">
                          {award.title}
                        </span>
                        {isEarned && (
                          <Badge className="bg-primary/10 text-primary text-[10px] ml-auto mr-2">
                            Earned
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="pl-11 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Criteria:</p>
                        {award.criteria.map((criterion, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground">{criterion}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
