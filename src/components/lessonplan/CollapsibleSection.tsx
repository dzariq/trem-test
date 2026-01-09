import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  sectionNumber?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
  id?: string;
  badge?: ReactNode;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  sectionNumber,
  children,
  defaultOpen = true,
  headerAction,
  id,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card id={id} className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sectionNumber && (
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {sectionNumber}
                  </span>
                )}
                {Icon && <Icon className="h-4 w-4 text-primary" />}
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {badge}
              </div>
              <div className="flex items-center gap-2">
                {headerAction && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {headerAction}
                  </div>
                )}
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} 
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="px-4 pb-4 pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
