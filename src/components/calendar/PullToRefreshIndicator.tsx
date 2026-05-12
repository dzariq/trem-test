import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullDistance, refreshing, threshold = 70 }: Props) {
  const visible = pullDistance > 0 || refreshing;
  if (!visible) return null;
  const ready = pullDistance >= threshold;
  return (
    <div
      className="flex items-center justify-center overflow-hidden text-muted-foreground"
      style={{ height: Math.max(0, pullDistance), transition: refreshing ? "height 200ms" : undefined }}
      aria-hidden="true"
    >
      {refreshing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <ArrowDown
          className={cn(
            "h-5 w-5 transition-transform",
            ready ? "rotate-180 text-primary" : "text-muted-foreground",
          )}
        />
      )}
    </div>
  );
}