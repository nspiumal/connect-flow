import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import Icon from "@/vendor/facit/components/icon/Icon";

describe("Icon", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the mapped lucide component for a known Facit/Material icon name", () => {
    const { container } = render(<Icon icon="Person" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("data-name", "Icon--Person");
  });

  it("applies the svg-icon size/color classes the SCSS depends on", () => {
    const { container } = render(<Icon icon="Edit" size="lg" color="success" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("svg-icon", "svg-icon-lg", "text-success");
  });

  it("falls back to a default icon and warns once for an unmapped name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<Icon icon={"TotallyUnknownIconName" as never} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when no icon name is given", () => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
