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
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Search Fields Row — inputs, checkboxes, and Search button all in one row */}
        <div className="flex flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          {/* Input Fields + Checkbox Groups — grouped together so they sit side by side */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {inputFields.map((field) => (
              <div key={field.name} className={field.inline ? "flex items-center gap-1 sm:gap-2 min-w-0" : "min-w-0 w-full sm:w-auto"}>
                <Label className={`text-xs sm:text-sm font-medium text-gray-700 ${field.inline ? "whitespace-nowrap shrink-0" : "mb-1 block"}`}>
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
                  className="bg-white min-w-0 w-32 sm:w-40"
                />
              </div>
            ))}

            {/* Checkbox Groups — sit directly after input fields */}
            {checkboxGroups.map((group) => (
              <div key={group.name} className={group.inline ? "flex items-center gap-1 sm:gap-2" : undefined}>
                <Label className={`text-xs sm:text-sm font-medium text-gray-700 ${group.inline ? "whitespace-nowrap shrink-0" : "mb-2 block"}`}>
                  {group.label}:
                </Label>
                <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-2">
                  {group.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-1.5 sm:space-x-2">
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
                        className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Search Button — pushed to the far right */}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 sm:px-6 shrink-0 ml-auto"
            size="default"
          >
            <Search className="h-4 w-4 mr-1 sm:mr-2" />
            <span>Search</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
