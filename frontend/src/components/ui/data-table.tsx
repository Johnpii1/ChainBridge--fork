"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key for this column */
  key: string;
  /** Header label */
  header: string;
  /** Accessor: key of T or custom render fn */
  accessor?: keyof T;
  /** Custom cell renderer – receives the row value */
  cell?: (row: T) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Whether this column is filterable (used by built-in filter) */
  filterable?: boolean;
  /** Tailwind class(es) for the <th> / <td> */
  className?: string;
  /** Hide on small screens */
  hideOnMobile?: boolean;
}

// ─── Sort state ───────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

interface SortState {
  key: string;
  dir: SortDir;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Row key extractor */
  rowKey: (row: T) => string;
  /** Enable row selection */
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  /** Controlled filter string (searches all filterable columns) */
  filterValue?: string;
  /** Empty state message */
  emptyMessage?: string;
  className?: string;
  /** Show a loading skeleton */
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />;
  if (dir === "desc") return <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  onSelectionChange,
  filterValue = "",
  emptyMessage = "No results found.",
  className,
  loading = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: "", dir: null });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!filterValue.trim()) return data;
    const q = filterValue.toLowerCase();
    const filterableCols = columns.filter((c) => c.filterable !== false);
    return data.filter((row) =>
      filterableCols.some((col) => {
        const val = col.accessor ? String(row[col.accessor] ?? "") : "";
        return val.toLowerCase().includes(q);
      })
    );
  }, [data, filterValue, columns]);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.accessor) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[col.accessor!];
      const bv = b[col.accessor!];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleRow = useCallback(
    (row: T) => {
      const key = rowKey(row);
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        onSelectionChange?.(sorted.filter((r) => next.has(rowKey(r))));
        return next;
      });
    },
    [rowKey, sorted, onSelectionChange]
  );

  const toggleAll = useCallback(() => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(sorted.map(rowKey));
      setSelected(all);
      onSelectionChange?.(sorted);
    }
  }, [selected.size, sorted, rowKey, onSelectionChange]);

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return { key: "", dir: null };
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full min-w-[480px] border-collapse text-sm" role="grid">
        <thead>
          <tr className="border-b border-border bg-surface-raised">
            {selectable && (
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={sorted.length > 0 && selected.size === sorted.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-brand-500"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                onClick={() => handleSort(col)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted",
                  col.sortable && "cursor-pointer select-none hover:text-text-primary",
                  col.hideOnMobile && "hidden sm:table-cell",
                  col.className
                )}
                aria-sort={
                  sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon dir={sort.key === col.key ? sort.dir : null} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {selectable && (
                  <td className="px-3 py-3">
                    <div className="h-4 w-4 rounded bg-surface-overlay animate-pulse" />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3", col.hideOnMobile && "hidden sm:table-cell")}
                  >
                    <div className="h-4 rounded bg-surface-overlay animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-sm text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const key = rowKey(row);
              const isSelected = selected.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    "hover:bg-surface-raised/60",
                    isSelected && "bg-brand-500/5"
                  )}
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${key}`}
                        checked={isSelected}
                        onChange={() => toggleRow(row)}
                        className="h-4 w-4 rounded border-border accent-brand-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-text-secondary",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessor
                          ? String(row[col.accessor] ?? "—")
                          : "—"}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
