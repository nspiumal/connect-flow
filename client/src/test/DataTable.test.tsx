import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";

interface Row {
  id: string;
  name: string;
  amount: number;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "amount", header: "Amount", render: (row) => `$${row.amount}` },
];

const rows: Row[] = [
  { id: "1", name: "Alice", amount: 10 },
  { id: "2", name: "Bob", amount: 20 },
];

describe("DataTable", () => {
  it("renders rows with column render overrides", () => {
    render(<DataTable columns={columns} data={rows} keyField={(r) => r.id} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  it("shows the empty message when data is empty", () => {
    render(<DataTable columns={columns} data={[]} keyField={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows a loading state instead of rows or empty message", () => {
    render(<DataTable columns={columns} data={[]} keyField={(r) => r.id} isLoading emptyMessage="Nothing here" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("calls onSort with the column key when a sortable header is clicked", () => {
    const onSort = vi.fn();
    render(
      <DataTable columns={columns} data={rows} keyField={(r) => r.id} sortBy="name" sortDir="asc" onSort={onSort} />,
    );
    fireEvent.click(screen.getByText("Name"));
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("does not attach a click handler to non-sortable headers", () => {
    const onSort = vi.fn();
    render(<DataTable columns={columns} data={rows} keyField={(r) => r.id} onSort={onSort} />);
    fireEvent.click(screen.getByText("Amount"));
    expect(onSort).not.toHaveBeenCalled();
  });
});
