import { cn } from "@/lib/utils";
import { WifiOff, AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "./button";

// ─── Error type discrimination ────────────────────────────────────────────────

export type ErrorKind = "network" | "validation" | "generic";

function detectKind(error?: Error | string | null): ErrorKind {
  if (!error) return "generic";
  const msg = typeof error === "string" ? error : error.message;
  const lower = msg.toLowerCase();
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("timeout") ||
    lower.includes("offline") ||
    lower.includes("econnrefused") ||
    lower.includes("failed to fetch")
  )
    return "network";
  if (
    lower.includes("invalid") ||
    lower.includes("validation") ||
    lower.includes("required") ||
    lower.includes("format")
  )
    return "validation";
  return "generic";
}

// ─── Shared meta ─────────────────────────────────────────────────────────────

const KIND_META: Record<ErrorKind, { icon: typeof WifiOff; label: string; defaultMsg: string }> = {
  network: {
    icon: WifiOff,
    label: "Network error",
    defaultMsg: "Unable to reach the server. Check your connection and try again.",
  },
  validation: {
    icon: ShieldAlert,
    label: "Validation error",
    defaultMsg: "The submitted data is invalid. Please review and correct the fields.",
  },
  generic: {
    icon: AlertCircle,
    label: "Something went wrong",
    defaultMsg: "An unexpected error occurred. Please try again.",
  },
};

// ─── Full-page error state ────────────────────────────────────────────────────

interface FullPageErrorProps {
  error?: Error | string | null;
  /** Override auto-detected kind */
  kind?: ErrorKind;
  title?: string;
  message?: string;
  /** Optional retry callback – if omitted the retry button is hidden */
  onRetry?: (() => void) | null;
  className?: string;
}

export function FullPageError({
  error,
  kind,
  title,
  message,
  onRetry,
  className,
}: FullPageErrorProps) {
  const resolvedKind = kind ?? detectKind(error);
  const meta = KIND_META[resolvedKind];
  const Icon = meta.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          resolvedKind === "network" && "bg-amber-500/10 text-amber-400",
          resolvedKind === "validation" && "bg-red-500/10 text-red-400",
          resolvedKind === "generic" && "bg-surface-overlay text-text-muted"
        )}
        aria-hidden="true"
      >
        <Icon className="h-8 w-8" />
      </span>

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-text-primary">{title ?? meta.label}</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          {message ?? (typeof error === "string" ? error : error?.message) ?? meta.defaultMsg}
        </p>
      </div>

      {onRetry && (
        <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Inline error state ───────────────────────────────────────────────────────

interface InlineErrorProps {
  error?: Error | string | null;
  kind?: ErrorKind;
  message?: string;
  /** Optional retry callback */
  onRetry?: (() => void) | null;
  className?: string;
}

export function InlineError({ error, kind, message, onRetry, className }: InlineErrorProps) {
  const resolvedKind = kind ?? detectKind(error);
  const meta = KIND_META[resolvedKind];
  const Icon = meta.icon;

  const displayMsg =
    message ?? (typeof error === "string" ? error : error?.message) ?? meta.defaultMsg;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        resolvedKind === "network" && "border-amber-500/20 bg-amber-500/5 text-amber-400",
        resolvedKind === "validation" && "border-red-500/20 bg-red-500/5 text-red-400",
        resolvedKind === "generic" && "border-border bg-surface-raised text-text-muted",
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{meta.label}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{displayMsg}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-lg p-1 hover:bg-surface-overlay transition"
          aria-label="Retry"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
