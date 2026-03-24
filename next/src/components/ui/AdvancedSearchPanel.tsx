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
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Input Fields */}
          <div className="lg:col-span-7 space-y-4">
            {inputFields.map((field) => (
              <div key={field.name} className="grid grid-cols-12 gap-4 items-center">
                <Label className="col-span-3 text-sm font-medium text-gray-700 text-right">
                  {field.label}
                </Label>
                <div className="col-span-9">
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={inputValues[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Checkbox Groups */}
          {checkboxGroups.length > 0 && (
            <div className="lg:col-span-5 space-y-4">
              {checkboxGroups.map((group) => (
                <div key={group.name}>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    {group.label} :
                  </Label>
                  <div className="space-y-2">
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
                          className="text-sm font-medium text-gray-700 cursor-pointer"
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
        </div>

        {/* Search Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6"
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

