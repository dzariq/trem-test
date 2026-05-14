import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCcaTypesByCampus } from "@/hooks/useCcaTypes";

interface CcaFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypeId: string;
  onSelectType: (typeId: string) => void;
  campusCode?: string | null;
}

function pillStyle(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("indoor talks") || n.includes("workshop"))
    return "bg-teal-100 text-teal-700 border-teal-200";
  if (n.includes("indoor")) return "bg-sky-100 text-sky-700 border-sky-200";
  if (n.includes("outdoor")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (n.includes("sport")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (n.includes("event")) return "bg-purple-100 text-purple-700 border-purple-200";
  if (n.includes("competition")) return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-muted text-muted-foreground border-border";
}

export function CcaFilterSheet({
  open,
  onOpenChange,
  selectedTypeId,
  onSelectType,
  campusCode = null,
}: CcaFilterSheetProps) {
  const { types } = useCcaTypesByCampus(campusCode);
  const isAll = selectedTypeId === "all";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[100] rounded-t-2xl h-[75dvh] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-2 shrink-0">
          <SheetTitle>Filter CCA</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center min-h-11 rounded-full px-4 text-xs font-medium border transition-colors mb-3 [touch-action:manipulation]",
              isAll
                ? "bg-foreground text-background border-foreground"
                : "bg-muted/40 text-muted-foreground border-border",
            )}
            onClick={() => onSelectType("all")}
          >
            All categories
          </button>

          <div className="flex flex-col gap-2">
            {types.map((type) => {
              const isSelected = selectedTypeId === type.id;
              return (
                <div
                  key={type.id}
                  className={cn(
                    "rounded-xl border border-border bg-card transition-colors p-2",
                    isSelected && "border-primary/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectType(type.id)}
                    className={cn(
                      "inline-flex items-center gap-1 min-h-11 rounded-full px-4 text-xs font-medium border transition-colors [touch-action:manipulation]",
                      pillStyle(type.name),
                      isSelected ? "ring-2 ring-primary/30" : "opacity-70",
                    )}
                  >
                    {type.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-border bg-background shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSelectType("all")}
            className="flex-1"
          >
            Reset
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} className="flex-1">
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}