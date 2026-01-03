import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface SubjectVariant {
  name: string;
  shortName: string;
}

interface SubjectGroupPillProps {
  baseName: string;
  shortName: string;
  variants: SubjectVariant[];
  selectedSubjects: string[];
  onToggle: (subjectName: string) => void;
  /** Single-select mode - only one subject can be selected at a time, closes after selection */
  singleSelect?: boolean;
}

export function SubjectGroupPill({
  baseName,
  shortName,
  variants,
  selectedSubjects,
  onToggle,
  singleSelect = false,
}: SubjectGroupPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get selected variants for this group
  const selectedVariants = variants.filter((v) =>
    selectedSubjects.includes(v.name)
  );
  const hasSelection = selectedVariants.length > 0;

  // Get display text - compact format with count for multi-select, or selected name for single-select
  const getDisplayText = () => {
    if (selectedVariants.length === 0) {
      return shortName;
    }
    if (singleSelect) {
      return selectedVariants[0].shortName;
    }
    return `${shortName} (${selectedVariants.length})`;
  };

  const handleSelect = (variantName: string) => {
    onToggle(variantName);
    if (singleSelect) {
      setIsOpen(false);
    }
  };

  const PillButton = (
    <button
      onClick={() => !isMobile && setIsOpen(!isOpen)}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
        hasSelection
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {getDisplayText()}
      <ChevronDown
        className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );

  const VariantsList = (
    <>
      {variants.map((variant) => {
        const isSelected = selectedSubjects.includes(variant.name);
        return (
          <button
            key={variant.name}
            onClick={() => handleSelect(variant.name)}
            className={cn(
              "w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors",
              isSelected
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-accent"
            )}
          >
            {singleSelect ? (
              // Radio button style for single select
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-primary"
                    : "border-muted-foreground"
                )}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            ) : (
              // Checkbox style for multi select
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
              </div>
            )}
            {variant.shortName}
          </button>
        );
      })}
      
      {/* Select All / Clear for this group - only show for multi-select */}
      {!singleSelect && (
        <div className="border-t border-border mt-2 pt-3 px-4 flex gap-4">
          <button
            onClick={() => {
              variants.forEach((v) => {
                if (!selectedSubjects.includes(v.name)) {
                  onToggle(v.name);
                }
              });
            }}
            className="text-sm text-muted-foreground hover:text-primary font-medium"
          >
            Select All
          </button>
          <button
            onClick={() => {
              variants.forEach((v) => {
                if (selectedSubjects.includes(v.name)) {
                  onToggle(v.name);
                }
              });
            }}
            className="text-sm text-muted-foreground hover:text-primary font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {PillButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{baseName}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-6">
            {VariantsList}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use dropdown
  return (
    <div className="relative">
      {PillButton}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-card border border-border rounded-lg shadow-lg py-2">
            {VariantsList}
          </div>
        </>
      )}
    </div>
  );
}
