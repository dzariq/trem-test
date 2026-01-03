import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import dnaBanner from "@/assets/dna-banner.png";
import { students } from "@/data/mockData";
import { awardTypes, awardColors, getStudentAwards } from "@/data/awardsData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
export default function AwardsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "1");
  const earnedAwards = getStudentAwards(selectedStudentId);
  return <AppLayout>
      <AppHeader leftContent={<div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-lg font-semibold text-foreground">Students Award</h1>
          </div>} rightContent={<Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map(student => <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>)}
            </SelectContent>
          </Select>} />

      <div className="px-4 py-4 space-y-4">
        {/* Banner Image */}
        <div className="rounded-xl overflow-hidden">
          <img src={dnaBanner} alt="Students collaborating and creating together" className="w-full h-auto object-cover" />
        </div>

        {/* Header Section */}
        <div className="text-center space-y-2 pb-2">
          <h2 className="text-xl font-bold text-foreground">Student Awards</h2>
          <p className="text-sm text-muted-foreground">
            Recognizing excellence and growth in our students
          </p>
        </div>

        {/* Student's Earned Awards */}
        {earnedAwards.length > 0 && <div className="space-y-2">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              My Achievements
            </h3>
            <div className="space-y-2">
              {earnedAwards.map((earned, index) => {
            const IconComponent = earned.award.icon;
            const colors = awardColors[earned.awardKey];
            return <div key={index} className={cn("flex items-center gap-3 p-3 rounded-xl border bg-card", colors.border)}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.bg)}>
                      <IconComponent className={cn("h-4 w-4", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {earned.award.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {earned.term}
                      </div>
                    </div>
                    <Badge className={cn("text-[10px]", colors.bg, colors.text)}>
                      Earned
                    </Badge>
                  </div>;
          })}
            </div>
          </div>}

        {/* Award Categories */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Award Categories</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {awardTypes.map(award => {
            const IconComponent = award.icon;
            const colors = awardColors[award.key];
            const isEarned = earnedAwards.some(ea => ea.awardKey === award.key);
            return <AccordionItem key={award.key} value={award.key} className={cn("border rounded-xl px-4 bg-card", colors.border)}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.bg)}>
                        <IconComponent className={cn("h-4 w-4", colors.text)} />
                      </div>
                      <span className="font-medium text-foreground text-left text-sm">
                        {award.title}
                      </span>
                      {isEarned && <Badge className={cn("text-[10px] ml-auto mr-2", colors.bg, colors.text)}>
                          Earned
                        </Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="pl-12 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium mb-2">Criteria:</p>
                      {award.criteria.map((criterion, idx) => <div key={idx} className="flex items-start gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", colors.dot)} />
                          <span className="text-sm text-muted-foreground">{criterion}</span>
                        </div>)}
                    </div>
                  </AccordionContent>
                </AccordionItem>;
          })}
          </Accordion>
        </div>
      </div>
    </AppLayout>;
}