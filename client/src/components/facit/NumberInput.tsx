import React from "react";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";

export interface NumberInputProps {
  id?: string;
  value: string | number;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  /** Decimal places to round to on blur (e.g. 2 for currency, 3 for gram weights). */
  precision?: number;
}

const formatWithCommas = (val: string | number) => {
  if (val === "" || val === null || val === undefined) return "";
  const str = val.toString();
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Plain text input with live thousands-grouping and precision rounding on
 * blur — used for money/weight fields (loan amounts, redemption amounts,
 * item weight) where a native <input type="number"> reads poorly at scale.
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ id, value, onChange, onKeyDown, placeholder, className, disabled = false, required = false, precision }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "." ||
        e.key === "," ||
        (e.ctrlKey && (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
        (e.metaKey && (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
        e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End" ||
        e.key === "-"
      ) {
        onKeyDown?.(e);
        return;
      }

      if ((e.key < "0" || e.key > "9") && e.key !== ".") {
        e.preventDefault();
      }

      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/,/g, "");

      if (rawValue === "" || rawValue === "-") {
        onChange(rawValue);
        return;
      }

      if (/^-?\d*\.?\d*$/.test(rawValue)) {
        onChange(rawValue);
      }
    };

    const handleBlur = () => {
      if (precision !== undefined && value !== "") {
        const str = value.toString().replace(/,/g, "");
        const num = parseFloat(str);
        if (!isNaN(num)) {
          const parts = str.split(".");
          if (parts.length === 1 || parts[1].length !== precision) {
            onChange(num.toFixed(precision));
          }
        }
      }
    };

    const displayValue = React.useMemo(() => formatWithCommas(value), [value]);

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={className}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
