import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartNoDataProps {
  message?: string;
  className?: string;
  height?: number;
}

/**
 * Empty / no-data placeholder rendered inside chart wrappers.
 * Uses role="img" + aria-label so screen readers understand the context.
 */
export function ChartNoData({
  message = "No data available",
  className,
  height = 220,
}: ChartNoDataProps) {
  return (
    <div
      role="img"
      aria-label={message}
      style={{ minHeight: height }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface text-text-muted",
        className
      )}
    >
      <BarChart2 className="h-8 w-8 opacity-30" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
