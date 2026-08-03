import Pagination, { PaginationItem } from "@/vendor/facit/components/bootstrap/Pagination";
import { CardFooter, CardFooterLeft, CardFooterRight } from "@/vendor/facit/components/bootstrap/Card";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface TablePaginationProps {
  /** 0-indexed, matching this app's apiClient.*.getPaginated(page, ...) convention. */
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  label?: string;
  pageSizeOptions?: number[];
}

/**
 * Server-side pagination footer. Facit's own PaginationButtons/dataPagination
 * slices a client-held array (1-indexed) — this app paginates via the
 * backend's getPaginated(page, size) -> {content, totalPages, totalElements}
 * (0-indexed), so this is a purpose-built variant rather than a reuse of
 * Facit's component. Replaces the ~45-line pagination footer previously
 * copy-pasted across every list page.
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  setCurrentPage,
  setPageSize,
  label = "items",
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  const start = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  const pageButtons = () => {
    const items = [];
    const lo = Math.max(0, currentPage - 1);
    const hi = Math.min(totalPages - 1, currentPage + 1);
    for (let i = lo; i <= hi; i += 1) {
      items.push(
        <PaginationItem key={i} isActive={i === currentPage} onClick={() => setCurrentPage(i)}>
          {i + 1}
        </PaginationItem>,
      );
    }
    return items;
  };

  return (
    <CardFooter>
      <CardFooterLeft>
        <span className="text-muted small">
          Showing {start} to {end} of {totalElements} {label}
        </span>
      </CardFooterLeft>
      <CardFooterRight className="d-flex align-items-center gap-3">
        {totalPages > 1 && (
          <Pagination ariaLabel={label}>
            <PaginationItem isFirst isDisabled={isFirstPage} onClick={() => setCurrentPage(0)} />
            <PaginationItem isPrev isDisabled={isFirstPage} onClick={() => setCurrentPage(currentPage - 1)} />
            {currentPage - 1 > 0 && <PaginationItem onClick={() => setCurrentPage(currentPage - 2)}>...</PaginationItem>}
            {pageButtons()}
            {currentPage + 1 < totalPages - 1 && (
              <PaginationItem onClick={() => setCurrentPage(currentPage + 2)}>...</PaginationItem>
            )}
            <PaginationItem isNext isDisabled={isLastPage} onClick={() => setCurrentPage(currentPage + 1)} />
            <PaginationItem isLast isDisabled={isLastPage} onClick={() => setCurrentPage(totalPages - 1)} />
          </Pagination>
        )}
        <Select
          size="sm"
          ariaLabel="Rows per page"
          onChange={(e: { target: { value: string } }) => {
            setPageSize(parseInt(e.target.value, 10));
            setCurrentPage(0);
          }}
          value={pageSize.toString()}
        >
          {pageSizeOptions.map((n) => (
            <Option key={n} value={n}>
              {String(n)}
            </Option>
          ))}
        </Select>
      </CardFooterRight>
    </CardFooter>
  );
}
