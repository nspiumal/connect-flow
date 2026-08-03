import { ReactNode } from "react";
import classNames from "classnames";
import Icon from "@/vendor/facit/components/icon/Icon";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyField: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Controlled server-side sort — the backend, not this component, orders `data`. */
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
}

/**
 * Config-driven table: column definitions + sorting + loading/empty states.
 * Replaces the hand-rolled <TableHead>/.map() + magic-number colSpan pattern
 * duplicated across all 11 list pages. Sorting is server-side (onSort tells
 * the caller which column was clicked; the caller re-fetches) rather than
 * Facit's client-side useSortableData, since every list page here paginates
 * through the backend.
 */
export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = "No records found",
  sortBy,
  sortDir,
  onSort,
  className,
}: DataTableProps<T>) {
  return (
    <div className={classNames("table-responsive", className)}>
      <table className="table table-modern table-hover align-middle mb-0">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={classNames(
                  col.headerClassName,
                  col.align && `text-${col.align}`,
                  { "cursor-pointer user-select-none": col.sortable && onSort },
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="d-inline-flex align-items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <Icon icon={sortDir === "desc" ? "ArrowDownward" : "ArrowUpward"} size="sm" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-5">
                <Spinner isSmall className="me-2" />
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-5">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyField(row)}>
                {columns.map((col) => (
                  <td key={col.key} className={classNames(col.className, col.align && `text-${col.align}`)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
