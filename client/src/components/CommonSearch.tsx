import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export interface SearchField {
  name: string;
  label: string;
  type: "text" | "select" | "number" | "date";
  placeholder?: string;
  options?: { label: string; value: string }[];
  optional?: boolean;
}
export interface CommonSearchProps {
  fields: SearchField[];
  onSearch: (filters: Record<string, string | null>) => void;
  onClear: () => void;
  isLoading?: boolean;
  title?: string;
  showBorder?: boolean;
  borderColor?: string;
  backgroundColor?: string;
}
export function CommonSearch({
  fields,
  onSearch,
  onClear,
  isLoading = false,
  title = "Advanced Filters",
  showBorder = true,
  borderColor = "border-gray-300",
  backgroundColor = "bg-gray-100",
}: CommonSearchProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const handleInputChange = (fieldName: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };
  const handleSearch = () => {
    const filters = Object.entries(values).reduce(
      (acc, [key, value]) => {
        acc[key] = value === "" || value === "all" ? null : value;
        return acc;
      },
      {} as Record<string, string | null>
    );
    onSearch(filters);
  };
  const handleClear = () => {
    setValues({});
    onClear();
  };
  const hasActiveFilters = Object.values(values).some((v) => v !== "" && v !== "all");
  const borderClass = showBorder ? `border-2 ${borderColor}` : "";
  return (
    <Card className={`${backgroundColor} ${borderClass} rounded-lg shadow-sm`}>
      <div className="p-6 space-y-4">
        {title && <h3 className="text-sm font-semibold text-gray-700">{title}</h3>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div key={field.name}>
              <Label className="text-sm font-medium">
                {field.label}
                {field.optional && <span className="text-gray-400 ml-1">(Optional)</span>}
              </Label>
              {field.type === "text" && (
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    value={values[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    disabled={isLoading}
                    className="pl-9"
                  />
                </div>
              )}
              {field.type === "number" && (
                <Input
                  type="number"
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  value={values[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
              {field.type === "date" && (
                <Input
                  type="date"
                  value={values[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
              {field.type === "select" && (
                <Select
                  value={values[field.name] || "all"}
                  onValueChange={(value) => handleInputChange(field.name, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {field.label}s</SelectItem>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isLoading || !hasActiveFilters}
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleSearch} disabled={isLoading} size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </Card>
  );
}
