import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./Skeletons";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  getRowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowKey: (row: T, index: number) => string;
  caption?: string;
}) {
  if (isLoading) return <TableSkeleton />;
  if (!rows.length)
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription ? { description: emptyDescription } : {})}
      />
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[640px] text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "label-eyebrow px-4 py-3",
                  col.align === "right" && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className="border-b border-border/70 last:border-0 hover:bg-muted/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 text-sm text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
