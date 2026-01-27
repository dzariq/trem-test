import { Check, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusIconVariant = "achieved" | "pending" | "warning";

type StatusIconProps = {
  variant: StatusIconVariant;
  size?: number;
  className?: string;
};

const ICON_STROKE_WIDTH = 2;

const variantStyles: Record<StatusIconVariant, { bg: string; border: string; icon: string }> = {
  achieved: {
    bg: "#22c55e",
    border: "#22c55e",
    icon: "#ffffff",
  },
  pending: {
    bg: "#3b82f6",
    border: "#3b82f6",
    icon: "#ffffff",
  },
  warning: {
    bg: "#f97316",
    border: "#f97316",
    icon: "#ffffff",
  },
};

export function StatusIcon({ variant, size = 20, className }: StatusIconProps) {
  const colors = variantStyles[variant];
  const innerSize = Math.max(14, Math.round(size * 0.8));

  const Icon = variant === "achieved" ? Check : variant === "warning" ? AlertTriangle : Circle;

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
        color: colors.icon,
      }}
      aria-hidden="true"
    >
      <Icon width={innerSize} height={innerSize} strokeWidth={ICON_STROKE_WIDTH} />
    </span>
  );
}

export default StatusIcon;