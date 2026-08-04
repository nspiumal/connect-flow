import { configureStore } from "@reduxjs/toolkit";
import { itemTypesLookup, interestRatesLookup, branchesLookup, rolesLookup, patternConfigLookup } from "./lookupSlices";

export const store = configureStore({
  reducer: {
    itemTypes: itemTypesLookup.reducer,
    interestRates: interestRatesLookup.reducer,
    branches: branchesLookup.reducer,
    roles: rolesLookup.reducer,
    patternConfig: patternConfigLookup.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
