import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "0.00";
  const str = value.toString().replace(/,/g, "");
  const num = parseFloat(str);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatWeight(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "0.000";
  const str = value.toString().replace(/,/g, "");
  const num = parseFloat(str);
  if (isNaN(num)) return "0.000";
  return num.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
