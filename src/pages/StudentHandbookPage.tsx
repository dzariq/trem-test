import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { FileText, Target, BookOpen, HandHeart, Backpack, Clock, Shirt, Users, Utensils, ClipboardList, Scale, FileSignature } from "lucide-react";
import { HandbookReportDialog } from "@/components/HandbookReportDialog";
import { studentHandbookData } from "@/data/studentHandbookData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// Import handbook images
import missionVisionImg from "@/assets/handbook/primary-girl.png";
import learnerSkillsImg from "@/assets/handbook/pre-girl.png";
import studentPledgeImg from "@/assets/handbook/acknowledgement.png";
import belongingsImg from "@/assets/handbook/key-sops.png";
import attendanceImg from "@/assets/handbook/working-hours.png";
import attireImg from "@/assets/handbook/sec-guy.png";
import behaviourImg from "@/assets/handbook/classroom-discipline.png";
import mealsImg from "@/assets/handbook/school-meal.png";
import examImg from "@/assets/handbook/duty-cca.png";
import disciplineImg from "@/assets/handbook/teacher-conduct.png";
import contractImg from "@/assets/handbook/leave-salary.png";

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mission_vision: Target,
  learner_skills: BookOpen,
  student_pledge: HandHeart,
  rules_belongings: Backpack,
  rules_attendance: Clock,
  rules_attire: Shirt,
  rules_behaviour: Users,
  rules_meals: Utensils,
  exam_rules: ClipboardList,
  discipline: Scale,
  behaviour_contract: FileSignature,
};

const sectionImages: Record<string, string> = {
  mission_vision: missionVisionImg,
  learner_skills: learnerSkillsImg,
  student_pledge: studentPledgeImg,
  rules_belongings: belongingsImg,
  rules_attendance: attendanceImg,
  rules_attire: attireImg,
  rules_behaviour: behaviourImg,
  rules_meals: mealsImg,
  exam_rules: examImg,
  discipline: disciplineImg,
  behaviour_contract: contractImg,
};

// Build section image map by index
const studentSectionImageMap: Record<number, string> = {};
studentHandbookData.sections.forEach((section, idx) => {
  if (sectionImages[section.key]) {
    studentSectionImageMap[idx] = sectionImages[section.key];
  }
});

// Transform student handbook data into the format expected by HandbookReportDialog
const studentHandbookSections = studentHandbookData.sections.map((section) => ({
  title: section.title,
  items: section.subsections.map((sub) => ({
    heading: sub.subtitle,
    points: sub.points,
  })),
}));

export default function StudentHandbookPage() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <AppLayout>
      <AppHeader title="Student Handbook" showBack />

      <section className="px-4 pt-4 pb-8 space-y-4">
        {/* PDF View Button */}
        <Button 
          onClick={() => setReportOpen(true)} 
          className="w-full gap-2"
          variant="outline"
        >
          <FileText className="h-4 w-4" />
          View Full Handbook PDF
        </Button>

        {/* Summary Card */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <h3 className="font-semibold text-foreground mb-2">📚 Handbook Summary</h3>
          <p className="text-sm text-muted-foreground">
            This handbook outlines the school's vision, mission, core values, and all rules and regulations 
            that students must follow. It covers attendance, attire, behaviour, exams, and discipline policies.
          </p>
        </div>

        {/* Sections Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {studentHandbookData.sections.map((section) => {
            const Icon = sectionIcons[section.key] || FileText;
            const sectionImage = sectionImages[section.key];
            
            return (
              <AccordionItem 
                key={section.key} 
                value={section.key}
                className="border rounded-xl overflow-hidden bg-card"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-3 text-left">
                    <div className={cn("p-2 rounded-lg", section.lightBg)}>
                      <Icon className={cn("h-5 w-5", section.color)} />
                    </div>
                    <span className="font-medium text-sm">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {sectionImage && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={sectionImage} 
                        alt={section.title}
                        className="h-24 w-auto object-contain"
                      />
                    </div>
                  )}
                  <Accordion type="single" collapsible className="space-y-2">
                    {section.subsections.map((subsection, subIdx) => (
                      <AccordionItem 
                        key={subIdx} 
                        value={`${section.key}-${subIdx}`}
                        className={cn("border rounded-lg overflow-hidden", section.lightBg)}
                      >
                        <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm font-medium">
                          <span className={section.color}>{subsection.subtitle}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <ul className="space-y-1.5">
                            {subsection.points.map((point, pointIdx) => (
                              <li key={pointIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0", section.color.replace('text-', 'bg-'))} />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* Handbook Report Dialog — uses same HTML→PDF pattern as Class Analysis */}
      <HandbookReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        title="Student Handbook 2026"
        subtitle="School vision, mission, core values, rules, and discipline policies"
        sections={studentHandbookSections}
        downloadFileName="Student_Handbook_2026.pdf"
        sectionImages={studentSectionImageMap}
        originalPdfUrl="/documents/student-handbook.pdf"
      />
    </AppLayout>
  );
}
