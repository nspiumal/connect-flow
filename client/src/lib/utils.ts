import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "0.000";
  const str = value.toString().replace(/,/g, "");
  const num = parseFloat(str);
  if (isNaN(num)) return "0.000";
  
  const parts = str.split(".");
  if (parts.length === 1 || parts[1].length < 3) {
    return num.toFixed(3);
  }
  
  return str;
}
