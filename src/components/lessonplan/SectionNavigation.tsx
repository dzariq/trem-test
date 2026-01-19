import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  shortTitle: string;
}

interface SectionNavigationProps {
  sections: Section[];
  activeSection?: string;
  onSectionClick: (sectionId: string) => void;
}

export function SectionNavigation({ sections, activeSection, onSectionClick }: SectionNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section, index) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-2 rounded-full text-xs font-medium transition-colors w-[calc(50%-0.5rem)] sm:w-auto",
            activeSection === section.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-background/20 text-[10px]">
            {index + 1}
          </span>
          <span className="leading-tight">{section.shortTitle}</span>
        </button>
      ))}
    </div>
  );
}
