import { useState, useMemo } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { subjectGroups, SubjectGroup } from "@/data/subjectsConfig";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubjectFilterDropdownProps {
  selectedSubjects: string[];
  onToggle: (subjectName: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  totalSubjects: number;
}

export function SubjectFilterDropdown({
  selectedSubjects,
  onToggle,
  onSelectAll,
  onClear,
  totalSubjects,
}: SubjectFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Get selection count per group
  const groupCounts = useMemo(() => {
    const counts: Record<string, { selected: number; total: number }> = {};
    subjectGroups.forEach(group => {
      const variants = group.variants || [];
      const selected = variants.filter(v => selectedSubjects.includes(v.name)).length;
      counts[group.baseName] = { selected, total: variants.length };
    });
    return counts;
  }, [selectedSubjects]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroup(prev => prev === groupName ? null : groupName);
  };

  const selectAllInGroup = (group: SubjectGroup) => {
    group.variants?.forEach(v => {
      if (!selectedSubjects.includes(v.name)) {
        onToggle(v.name);
      }
    });
  };

  const clearGroup = (group: SubjectGroup) => {
    group.variants?.forEach(v => {
      if (selectedSubjects.includes(v.name)) {
        onToggle(v.name);
      }
    });
  };

  const TriggerButton = (
    <button
      onClick={() => !isMobile && setIsOpen(!isOpen)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all",
        "bg-background border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filter Subjects</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
          {selectedSubjects.length}/{totalSubjects}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>
    </button>
  );

  const GroupsList = (
    <div className="space-y-1">
      {/* Global Select All / Clear */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          {selectedSubjects.length} of {totalSubjects} selected
        </span>
        <div className="flex gap-3">
          <button
            onClick={onSelectAll}
            className="text-sm text-primary font-medium hover:underline"
          >
            All
          </button>
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground font-medium hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Categories */}
      <ScrollArea className="max-h-[60vh]">
        <div className="py-1">
          {subjectGroups.map(group => {
            const counts = groupCounts[group.baseName];
            const isExpanded = expandedGroup === group.baseName;
            const allSelected = counts.selected === counts.total;
            const someSelected = counts.selected > 0 && counts.selected < counts.total;

            return (
              <div key={group.baseName} className="border-b border-border/50 last:border-b-0">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.baseName)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        allSelected
                          ? "bg-primary border-primary"
                          : someSelected
                          ? "bg-primary/30 border-primary"
                          : "border-muted-foreground/50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allSelected) {
                          clearGroup(group);
                        } else {
                          selectAllInGroup(group);
                        }
                      }}
                    >
                      {(allSelected || someSelected) && (
                        <Check className={cn(
                          "h-3.5 w-3.5",
                          allSelected ? "text-primary-foreground" : "text-primary"
                        )} />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{group.baseName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {counts.selected}/{counts.total}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Expanded Subjects */}
                {isExpanded && (
                  <div className="bg-muted/30 py-1">
                    {group.variants?.map(variant => {
                      const isSelected = selectedSubjects.includes(variant.name);
                      return (
                        <button
                          key={variant.name}
                          onClick={() => onToggle(variant.name)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 pl-12 transition-colors",
                            isSelected
                              ? "bg-primary/10"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/50"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className={cn(
                            "text-sm",
                            isSelected ? "text-primary font-medium" : "text-foreground"
                          )}>
                            {variant.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Subjects</DrawerTitle>
          </DrawerHeader>
          <div className="pb-6">
            {GroupsList}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use dropdown
  return (
    <div className="relative">
      {TriggerButton}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {GroupsList}
          </div>
        </>
      )}
    </div>
  );
}
