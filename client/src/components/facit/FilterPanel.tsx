import { useFormik } from "formik";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Label from "@/vendor/facit/components/bootstrap/forms/Label";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Checks from "@/vendor/facit/components/bootstrap/forms/Checks";
import Button from "@/vendor/facit/components/bootstrap/Button";

export interface SearchInputField {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "date";
  inline?: boolean;
}

export interface CheckboxGroupField {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  defaultChecked?: boolean;
  inline?: boolean;
}

export type FilterValue = string | string[] | number | boolean;

export interface FilterPanelProps {
  title?: string;
  subtitle?: string;
  inputFields: SearchInputField[];
  checkboxGroups?: CheckboxGroupField[];
  onSearch: (filters: Record<string, FilterValue>) => void;
  isLoading?: boolean;
  /**
   * Kept only for prop-shape compatibility with the old AdvancedSearchPanel
   * call sites (a Tailwind class like "bg-gray-50") — no longer meaningful
   * once the panel is a Facit Card, so it's accepted and ignored rather than
   * requiring every caller to drop it during migration.
   */
  backgroundColor?: string;
}

/**
 * Drop-in replacement for the old shadcn AdvancedSearchPanel — same props,
 * so the 7 pages that use it migrate with just an import swap.
 */
export function FilterPanel({
  title = "Search",
  subtitle = "Provide preferred filters",
  inputFields,
  checkboxGroups = [],
  onSearch,
  isLoading = false,
}: FilterPanelProps) {
  const initialValues: Record<string, FilterValue> = {
    ...Object.fromEntries(inputFields.map((f) => [f.name, ""])),
    ...Object.fromEntries(
      checkboxGroups.map((g) => [g.name, g.defaultChecked ? g.options.map((o) => o.value) : []]),
    ),
  };

  const formik = useFormik({
    initialValues,
    onSubmit: (values) => {
      const filters: Record<string, FilterValue> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length > 0) filters[key] = value;
        } else if (typeof value === "string" && value.trim() !== "") {
          filters[key] = value;
        }
      });
      onSearch(filters);
    },
  });

  const toggleCheckbox = (groupName: string, optionValue: string, checked: boolean) => {
    const current = (formik.values[groupName] as string[]) || [];
    formik.setFieldValue(
      groupName,
      checked ? [...current, optionValue] : current.filter((v) => v !== optionValue),
    );
  };

  return (
    <Card>
      <CardBody>
        {(title || subtitle) && (
          <div className="mb-3">
            {title && <div className="fw-bold">{title}</div>}
            {subtitle && <div className="text-muted small">{subtitle}</div>}
          </div>
        )}
        <form className="d-flex flex-wrap align-items-end gap-3" onSubmit={formik.handleSubmit}>
          <div className="d-flex flex-wrap align-items-end gap-3 flex-grow-1">
            {inputFields.map((field) => (
              <div key={field.name} style={{ minWidth: 160 }}>
                <Label htmlFor={field.name} size="sm">
                  {field.label}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formik.values[field.name] as string}
                  onChange={formik.handleChange}
                  disabled={isLoading}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      formik.handleSubmit();
                    }
                  }}
                />
              </div>
            ))}
            {checkboxGroups.map((group) => (
              <div key={group.name}>
                <Label size="sm">{group.label}</Label>
                <div className="d-flex flex-wrap gap-3">
                  {group.options.map((option) => (
                    <Checks
                      key={option.value}
                      id={`${group.name}-${option.value}`}
                      label={option.label}
                      isInline
                      checked={((formik.values[group.name] as string[]) || []).includes(option.value)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        toggleCheckbox(group.name, option.value, e.target.checked)
                      }
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button type="submit" color="primary" icon="Search" isDisable={isLoading}>
            Search
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
