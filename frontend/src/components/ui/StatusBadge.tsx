"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Circle,
  Pause,
  Ban,
} from "lucide-react";

export type StatusVariant =
  | "success"
  | "pending"
  | "error"
  | "warning"
  | "info"
  | "processing"
  | "idle"
  | "paused"
  | "cancelled";

export type StatusSize = "sm" | "md" | "lg";

interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant: StatusVariant;
  size?: StatusSize;
  label?: string;
  showIcon?: boolean;
  pulse?: boolean;
}

interface StatusPillProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  variant: StatusVariant;
  size?: StatusSize;
  label: string;
  description?: string;
  showIcon?: boolean;
  pulse?: boolean;
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  info: "bg-brand-500/10 text-brand-500 border-brand-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  idle: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  paused: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const VARIANT_ICONS: Record<StatusVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  pending: Clock,
  error: XCircle,
  warning: AlertCircle,
  info: Circle,
  processing: Loader2,
  idle: Circle,
  paused: Pause,
  cancelled: Ban,
};

const SIZE_STYLES = {
  sm: {
    badge: "px-2 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
    pill: "px-3 py-1.5 gap-2",
  },
  md: {
    badge: "px-2.5 py-1 text-sm gap-1.5",
    icon: "h-4 w-4",
    pill: "px-4 py-2 gap-2.5",
  },
  lg: {
    badge: "px-3 py-1.5 text-base gap-2",
    icon: "h-5 w-5",
    pill: "px-5 py-3 gap-3",
  },
};

/**
 * StatusBadge - Compact status indicator with optional icon
 */
export function StatusBadge({
  variant,
  size = "md",
  label,
  showIcon = true,
  pulse = false,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = VARIANT_ICONS[variant];
  const isAnimated = variant === "processing" || pulse;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size].badge,
        isAnimated && "animate-pulse",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon className={cn(SIZE_STYLES[size].icon, variant === "processing" && "animate-spin")} />
      )}
      {label && <span>{label}</span>}
    </span>
  );
}

/**
 * StatusPill - Larger status indicator with label and optional description
 */
export function StatusPill({
  variant,
  size = "md",
  label,
  description,
  showIcon = true,
  pulse = false,
  className,
  ...props
}: StatusPillProps) {
  const Icon = VARIANT_ICONS[variant];
  const isAnimated = variant === "processing" || pulse;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border font-medium",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size].pill,
        isAnimated && "animate-pulse",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className={cn(
            SIZE_STYLES[size].icon,
            "flex-shrink-0",
            variant === "processing" && "animate-spin"
          )}
        />
      )}
      <div className="flex flex-col">
        <span className={cn(size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base")}>
          {label}
        </span>
        {description && (
          <span className={cn("font-normal opacity-80", size === "sm" ? "text-xs" : "text-xs")}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * StatusDot - Minimal dot indicator
 */
export function StatusDot({
  variant,
  size = "md",
  pulse = false,
  className,
}: {
  variant: StatusVariant;
  size?: StatusSize;
  pulse?: boolean;
  className?: string;
}) {
  const dotSize = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }[size];

  const dotColor = {
    success: "bg-emerald-400",
    pending: "bg-yellow-400",
    error: "bg-red-400",
    warning: "bg-orange-400",
    info: "bg-brand-500",
    processing: "bg-blue-400",
    idle: "bg-gray-400",
    paused: "bg-purple-400",
    cancelled: "bg-slate-400",
  }[variant];

  return (
    <span
      className={cn(
        "inline-block rounded-full",
        dotSize,
        dotColor,
        (pulse || variant === "processing") && "animate-pulse",
        className
      )}
    />
  );
}
