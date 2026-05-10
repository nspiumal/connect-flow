import React from "react";
import { Input } from "@/components/ui/input";

// CSS to hide input arrows/spinners
const inputArrowStyles = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

// Inject styles once
if (typeof document !== "undefined") {
  const existingStyle = document.getElementById("number-input-styles");
  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = "number-input-styles";
    style.textContent = inputArrowStyles;
    document.head.appendChild(style);
  }
}

export interface NumberInputProps {
  id?: string;
  value: string | number;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  step?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  required?: boolean;
  precision?: number;
}

const formatWithCommas = (val: string | number) => {
  if (val === "" || val === null || val === undefined) return "";
  const str = val.toString();
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      id,
      value,
      onChange,
      onKeyDown,
      placeholder,
      className = "",
      step = "0.01",
      disabled = false,
      min,
      max,
      required = false,
      precision,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point, comma
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "." ||
        e.key === "," ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.ctrlKey && (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
        // Allow: Cmd+A, Cmd+C, Cmd+V, Cmd+X (Mac)
        (e.metaKey && (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
        // Allow: home, end, left, right, up, down arrows
        (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End") ||
        // Allow minus sign for negative numbers
        e.key === "-"
      ) {
        if (onKeyDown) {
          onKeyDown(e);
        }
        return;
      }

      // Ensure that it is a number and stop the keypress if not
      if ((e.key < "0" || e.key > "9") && e.key !== ".") {
        e.preventDefault();
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawValue = inputValue.replace(/,/g, "");

      // Allow empty value
      if (rawValue === "" || rawValue === "-") {
        onChange(rawValue);
        return;
      }

      // Validate that the input is a valid number
      // Allow numbers with decimals and negative numbers
      const regex = /^-?\d*\.?\d*$/;
      if (regex.test(rawValue)) {
        onChange(rawValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (precision !== undefined && value !== "") {
        const str = value.toString().replace(/,/g, "");
        const num = parseFloat(str);
        if (!isNaN(num)) {
          const parts = str.split(".");
          if (parts.length === 1 || parts[1].length < precision) {
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
        step={step}
        min={min}
        max={max}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`h-8 text-sm ${className}`}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;

