import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { itemTypesLookup, interestRatesLookup, branchesLookup, rolesLookup, patternConfigLookup } from "@/store/lookupSlices";

// A fresh store per test — reusing a shared store would leak cached lookup
// data and `fetchedAt` stamps between tests, making TTL/condition assertions
// pass spuriously. Mirrors the reducer composition in store/index.ts.
export const buildTestStore = () =>
  configureStore({
    reducer: {
      itemTypes: itemTypesLookup.reducer,
      interestRates: interestRatesLookup.reducer,
      branches: branchesLookup.reducer,
      roles: rolesLookup.reducer,
      patternConfig: patternConfigLookup.reducer,
    },
  });

export function renderWithStore(ui: ReactElement, store: ReturnType<typeof buildTestStore> = buildTestStore()) {
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
