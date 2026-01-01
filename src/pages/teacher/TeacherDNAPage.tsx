import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { dnaCoreValues, valueColors, DNAValue } from "@/data/dnaCoreValues";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  Flame, 
  MessageCircle, 
  Users, 
  Shield, 
  TrendingUp, 
  HandHeart, 
  Star, 
  Sun, 
  Brain 
} from "lucide-react";

const valueIcons: Record<string, React.ElementType> = {
  love_the_school: Heart,
  passion_to_teach: Flame,
  respect_and_communication: MessageCircle,
  unity_team_before_self: Users,
  responsibility_and_reliability: Shield,
  growth_mindset: TrendingUp,
  care_for_students: HandHeart,
  role_model_behaviour: Star,
  positive_energy: Sun,
  self_reflection_and_improvement: Brain
};

function ValueContent({ value }: { value: DNAValue }) {
  const colors = valueColors[value.key];

  if (value.sections) {
    return (
      <div className="space-y-4">
        {value.sections.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-sm font-semibold text-foreground mb-2">{section.title}</h4>
            <ul className="space-y-2">
              {section.points.map((point, pointIdx) => (
                <li key={pointIdx} className="flex items-start gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", colors.dot)} />
                  <span className="text-sm text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {value.points?.map((point, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", colors.dot)} />
          <span className="text-sm text-muted-foreground">{point}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TeacherDNAPage() {
  return (
    <TeacherAppLayout>
      <AppHeader title="Collinz DNA" showBack />
      
      <div className="px-4 py-4 space-y-4">
        {/* Header Section */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-xl font-bold text-foreground">Our Core Values</h1>
          <p className="text-sm text-muted-foreground">
            The principles that guide everything we do
          </p>
        </div>

        {/* Values Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {dnaCoreValues.values.map((value) => {
            const Icon = valueIcons[value.key];
            const colors = valueColors[value.key];

            return (
              <AccordionItem 
                key={value.key} 
                value={value.key}
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
                    <span className="font-medium text-foreground text-left">
                      {value.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ValueContent value={value} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </TeacherAppLayout>
  );
}
