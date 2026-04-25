/**
 * Chart theme tokens aligned with the app's CSS design system.
 * These map to the Tailwind/CSS variable palette so charts stay
 * consistent across light and dark modes.
 */

export const CHART_PALETTE = [
  "#14b8a6", // brand-500 (teal)
  "#6366f1", // ethereum / indigo
  "#f97316", // bitcoin / orange
  "#a855f7", // solana / purple
  "#22d3ee", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
] as const;

export type ChartPaletteColor = (typeof CHART_PALETTE)[number];

/** Chain-specific colors matching the tailwind `chain.*` tokens */
export const CHAIN_CHART_COLORS: Record<string, string> = {
  stellar: "#14b8a6",
  bitcoin: "#f97316",
  ethereum: "#6366f1",
  solana: "#a855f7",
};

/** Shared SVG padding used across chart wrappers */
export const CHART_PAD = { top: 16, right: 12, bottom: 32, left: 52 } as const;

/** Default chart height */
export const CHART_DEFAULT_HEIGHT = 220;
