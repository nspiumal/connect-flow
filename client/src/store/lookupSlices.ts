import apiClient from "@/integrations/api";
import { createLookupSlice } from "./createLookupSlice";

const FIVE_MINUTES = 5 * 60_000;

export interface InterestRate {
  id: string;
  name: string;
  ratePercent?: number;
  rate_percent?: number;
  firstMonthRatePercent?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export const itemTypesLookup = createLookupSlice<ItemType>({
  name: "itemTypes",
  fetcher: () => apiClient.itemTypes.getAll(),
  ttlMs: FIVE_MINUTES,
});

export const interestRatesLookup = createLookupSlice<InterestRate>({
  name: "interestRates",
  fetcher: () => apiClient.interestRates.getActive(),
  ttlMs: FIVE_MINUTES,
});

export const branchesLookup = createLookupSlice<Branch>({
  name: "branches",
  fetcher: () => apiClient.branches.getActive(),
  ttlMs: FIVE_MINUTES,
});

export const rolesLookup = createLookupSlice<Role>({
  name: "roles",
  fetcher: () => apiClient.roles.getAll(),
  ttlMs: FIVE_MINUTES,
});

// Server-side pattern-mode config (see `SPECIAL_PATTERN` env var, CLAUDE.md) —
// effectively immutable, so it never needs to be refetched once loaded.
export const patternConfigLookup = createLookupSlice<{ pattern: string }>({
  name: "patternConfig",
  fetcher: () => apiClient.pawnTransactions.getPatternConfig().then((c: { pattern?: string }) => [{ pattern: c?.pattern ?? "TND" }]),
  ttlMs: Infinity,
});
