import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface SearchInputField {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "date";
}

export interface CheckboxGroupField {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  defaultChecked?: boolean;
}

export type FilterValue = string | string[] | number | boolean;

export interface AdvancedSearchPanelProps {
  title?: string;
  subtitle?: string;
  inputFields: SearchInputField[];
  checkboxGroups?: CheckboxGroupField[];
  onSearch: (filters: Record<string, FilterValue>) => void;
  isLoading?: boolean;
  backgroundColor?: string;
}

export function AdvancedSearchPanel({
  title = "Search",
  subtitle = "Provide Preferred filters",
  inputFields,
  checkboxGroups = [],
  onSearch,
  isLoading = false,
  backgroundColor = "bg-gray-50",
}: AdvancedSearchPanelProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    checkboxGroups.forEach((group) => {
      if (group.defaultChecked) {
        initial[group.name] = group.options.map((opt) => opt.value);
      } else {
        initial[group.name] = [];
      }
    });
    return initial;
  });

  const handleInputChange = (fieldName: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleCheckboxChange = (groupName: string, optionValue: string, checked: boolean) => {
    setCheckboxValues((prev) => {
      const currentValues = prev[groupName] || [];
      if (checked) {
        return {
          ...prev,
          [groupName]: [...currentValues, optionValue],
        };
      } else {
        return {
          ...prev,
          [groupName]: currentValues.filter((v) => v !== optionValue),
        };
      }
    });
  };

  const handleSearch = () => {
    const filters: Record<string, FilterValue> = {};

    // Add input values
    Object.entries(inputValues).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filters[key] = value;
      }
    });

    // Add checkbox values
    Object.entries(checkboxValues).forEach(([key, values]) => {
      if (values.length > 0) {
        filters[key] = values;
      }
    });

    onSearch(filters);
  };

  return (
    <Card className={`${backgroundColor} rounded-lg shadow-sm border border-gray-200 mb-6`}>
      <div className="p-4 lg:p-6">
        {/* Search Fields Row — inputs, checkboxes, and Search button all in one row */}
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-4">
          {/* Input Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            {inputFields.map((field) => (
              <div key={field.name}>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  {field.label}
                </Label>
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={inputValues[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  disabled={isLoading}
                  className="w-full bg-white"
                />
              </div>
            ))}
          </div>

          {/* Status Checkbox Groups — displayed horizontally to the right of inputs */}
          {checkboxGroups.length > 0 && (
            <div className="shrink-0 space-y-2">
              {checkboxGroups.map((group) => (
                <div key={group.name}>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    {group.label}:
                  </Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {group.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${group.name}-${option.value}`}
                          checked={checkboxValues[group.name]?.includes(option.value) || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(group.name, option.value, checked as boolean)
                          }
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`${group.name}-${option.value}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Button — positioned on the right side of all search fields */}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 shrink-0 self-end"
            size="default"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </Card>
  );
}
