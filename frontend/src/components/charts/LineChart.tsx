"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CHART_PAD, CHART_PALETTE, CHART_DEFAULT_HEIGHT } from "./chartTheme";
import { ChartNoData } from "./ChartNoData";

export interface LineDataPoint {
  x: string | number; // timestamp or label
  y: number;
}

export interface LineSeries {
  label: string;
  data: LineDataPoint[];
  color?: string;
}

interface LineChartProps {
  series: LineSeries[];
  height?: number;
  formatX?: (x: string | number) => string;
  formatY?: (y: number) => string;
  className?: string;
  noDataMessage?: string;
}

const SVG_W = 600;

export function LineChart({
  series,
  height = CHART_DEFAULT_HEIGHT,
  formatX,
  formatY,
  className,
  noDataMessage,
}: LineChartProps) {
  const hasData = series.some((s) => s.data.length > 0);

  const { paths, yTicks, xLabels } = useMemo(() => {
    if (!hasData) return { paths: [], yTicks: [], xLabels: [] };

    const inner = {
      w: SVG_W - CHART_PAD.left - CHART_PAD.right,
      h: height - CHART_PAD.top - CHART_PAD.bottom,
    };

    const allY = series.flatMap((s) => s.data.map((d) => d.y));
    const maxY = Math.max(...allY, 1);
    const minY = Math.min(...allY, 0);
    const rangeY = maxY - minY || 1;

    const allX = series.flatMap((s) => s.data.map((d) => Number(d.x)));
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX, minX + 1);
    const rangeX = maxX - minX;

    const toSvgX = (x: number) => CHART_PAD.left + ((x - minX) / rangeX) * inner.w;
    const toSvgY = (y: number) => CHART_PAD.top + (1 - (y - minY) / rangeY) * inner.h;

    const paths = series.map((s, si) => {
      const color = s.color ?? CHART_PALETTE[si % CHART_PALETTE.length];
      const pts = s.data.map((d) => `${toSvgX(Number(d.x))},${toSvgY(d.y)}`).join(" L ");
      const d = s.data.length > 1 ? `M ${pts}` : "";
      return { color, d, label: s.label };
    });

    const steps = 4;
    const yTicks = Array.from({ length: steps + 1 }, (_, i) => {
      const val = minY + (rangeY / steps) * i;
      return { value: val, y: toSvgY(val) };
    });

    const firstSeries = series.find((s) => s.data.length > 0)!;
    const stride = Math.max(1, Math.floor(firstSeries.data.length / 6));
    const xLabels = firstSeries.data
      .filter((_, i) => i % stride === 0)
      .map((d) => ({
        x: toSvgX(Number(d.x)),
        label: formatX ? formatX(d.x) : String(d.x),
      }));

    return { paths, yTicks, xLabels };
  }, [series, height, formatX, hasData]);

  if (!hasData) {
    return <ChartNoData message={noDataMessage} height={height} className={className} />;
  }

  const fmt = formatY ?? ((v: number) => v.toLocaleString());

  return (
    <div
      className={cn("w-full overflow-hidden rounded-xl border border-border bg-surface", className)}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${height}`}
        className="w-full"
        style={{ height }}
        aria-label="Line chart"
        role="img"
      >
        {/* Grid lines + Y ticks */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={CHART_PAD.left}
              y1={t.y}
              x2={SVG_W - CHART_PAD.right}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
            <text
              x={CHART_PAD.left - 6}
              y={t.y + 4}
              textAnchor="end"
              fontSize={9}
              className="fill-text-muted"
            >
              {fmt(t.value)}
            </text>
          </g>
        ))}

        {/* Lines */}
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          >
            <title>{p.label}</title>
          </path>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={9}
            className="fill-text-muted"
          >
            {l.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4 px-4 pb-3 pt-1">
          {series.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                className="inline-block h-2 w-4 rounded-full"
                style={{ background: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
