import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { teacherHandbookData, sectionColors } from "@/data/teacherHandbookData";
import { cn } from "@/lib/utils";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import schoolBadge from "@/assets/school-badge.png";
import {
  Compass,
  Shield,
  BookOpen,
  Home,
  Users,
  Building,
  Clock,
  Briefcase,
  Calendar,
  Shirt,
  FileCheck,
  CheckCircle,
  FileText,
  Eye
} from "lucide-react";

// Import section images
import schoolDirectionImg from "@/assets/handbook/school-direction.png";
import teacherConductImg from "@/assets/handbook/teacher-conduct.png";
import teacherResponsibilitiesImg from "@/assets/handbook/teacher-responsibilities.png";
import homeroomResponsibilitiesImg from "@/assets/handbook/homeroom-responsibilities.png";
import classroomDisciplineImg from "@/assets/handbook/classroom-discipline.png";
import facilitiesCareImg from "@/assets/handbook/facilities-care.png";
import workingHoursImg from "@/assets/handbook/working-hours.png";
import leaveSalaryImg from "@/assets/handbook/leave-salary.png";
import dutyCcaImg from "@/assets/handbook/duty-cca.png";
import dressCodeImg from "@/assets/handbook/dress-code.png";
import keySopsImg from "@/assets/handbook/key-sops.png";
import acknowledgementImg from "@/assets/handbook/acknowledgement.png";

const sectionIcons: Record<string, React.ElementType> = {
  school_direction: Compass,
  teacher_conduct: Shield,
  teacher_responsibilities: BookOpen,
  homeroom_responsibilities: Home,
  classroom_discipline: Users,
  facilities_care: Building,
  working_hours: Clock,
  leave_salary: Briefcase,
  duty_cca: Calendar,
  dress_code: Shirt,
  key_sops: FileCheck,
  acknowledgement: CheckCircle
};

const sectionImages: Record<string, string> = {
  school_direction: schoolDirectionImg,
  teacher_conduct: teacherConductImg,
  teacher_responsibilities: teacherResponsibilitiesImg,
  homeroom_responsibilities: homeroomResponsibilitiesImg,
  classroom_discipline: classroomDisciplineImg,
  facilities_care: facilitiesCareImg,
  working_hours: workingHoursImg,
  leave_salary: leaveSalaryImg,
  duty_cca: dutyCcaImg,
  dress_code: dressCodeImg,
  key_sops: keySopsImg,
  acknowledgement: acknowledgementImg
};

export default function TeacherHandbookPage() {
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  return (
    <TeacherAppLayout>
      <AppHeader 
        showBack 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolBadge} alt="Collinz Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Teacher Handbook</h1>
          </div>
        }
      />
      
      <div className="px-4 py-4 space-y-4">
        {/* View Full PDF Button */}
        <Button 
          onClick={() => setIsPdfOpen(true)}
          className="w-full gap-2"
          size="lg"
        >
          <Eye className="h-5 w-5" />
          View Full Handbook PDF
        </Button>

        {/* Header Section */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-xl font-bold text-foreground">Handbook Summary</h1>
          <p className="text-sm text-muted-foreground">
            {teacherHandbookData.purpose}
          </p>
        </div>

        {/* Sections Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {teacherHandbookData.sections.map((section) => {
            const Icon = sectionIcons[section.key];
            const colors = sectionColors[section.key];
            const image = sectionImages[section.key];

            return (
              <AccordionItem 
                key={section.key} 
                value={section.key}
                className={cn(
                  "border rounded-xl px-4 bg-card",
                  colors.border
                )}
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      colors.bg
                    )}>
                      <Icon className={cn("h-4 w-4", colors.text)} />
                    </div>
                    <span className="font-medium text-foreground text-left text-sm">
                      {section.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {/* Section Image */}
                    <div className="flex justify-center">
                      <img 
                        src={image} 
                        alt={section.title}
                        className="w-32 h-32 object-cover rounded-xl border border-border"
                      />
                    </div>

                    {/* Main Points Nested Accordion */}
                    <Accordion type="single" collapsible className="space-y-2">
                      {section.main_points.map((mainPoint, idx) => (
                        <AccordionItem 
                          key={idx} 
                          value={`${section.key}-${idx}`}
                          className="border rounded-lg px-3 bg-muted/30"
                        >
                          <AccordionTrigger className="hover:no-underline py-2.5 text-sm">
                            <span className="font-medium text-foreground text-left">
                              {mainPoint.point}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-3">
                            <ul className="space-y-2">
                              {mainPoint.subpoints.map((subpoint, subIdx) => (
                                <li key={subIdx} className="flex items-start gap-2">
                                  <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", colors.dot)} />
                                  <span className="text-sm text-muted-foreground">{subpoint}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        pdfUrl="/documents/teacher-handbook.pdf"
        title="Teacher Handbook"
        downloadFileName="Teacher_Handbook_2026.pdf"
      />
    </TeacherAppLayout>
  );
}
