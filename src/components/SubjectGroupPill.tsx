import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function SubjectGroupPill({
  baseName,
  shortName,
  variants,
  selectedSubjects,
  onToggle,
}: SubjectGroupPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected variants for this group
  const selectedVariants = variants.filter((v) =>
    selectedSubjects.includes(v.name)
  );
  const hasSelection = selectedVariants.length > 0;
  const allSelected = selectedVariants.length === variants.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get display text - compact format with count
  const getDisplayText = () => {
    if (selectedVariants.length === 0) {
      return shortName;
    }
    // Always show base name with count to save space
    return `${shortName} (${selectedVariants.length})`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-card border border-border rounded-lg shadow-lg py-1">
          {variants.map((variant) => {
            const isSelected = selectedSubjects.includes(variant.name);
            return (
              <button
                key={variant.name}
                onClick={() => {
                  onToggle(variant.name);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                {variant.shortName}
              </button>
            );
          })}
          
          {/* Select All / Clear for this group */}
          <div className="border-t border-border mt-1 pt-1 px-2 flex gap-2">
            <button
              onClick={() => {
                variants.forEach((v) => {
                  if (!selectedSubjects.includes(v.name)) {
                    onToggle(v.name);
                  }
                });
              }}
              className="text-[10px] text-muted-foreground hover:text-primary"
            >
              All
            </button>
            <button
              onClick={() => {
                variants.forEach((v) => {
                  if (selectedSubjects.includes(v.name)) {
                    onToggle(v.name);
                  }
                });
              }}
              className="text-[10px] text-muted-foreground hover:text-primary"
            >
              None
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
