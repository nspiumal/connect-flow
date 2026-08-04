import { useEffect } from "react";
import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { itemTypesLookup, interestRatesLookup, branchesLookup, rolesLookup, patternConfigLookup } from "@/store/lookupSlices";
import type { ItemType, InterestRate, Branch, Role } from "@/store/lookupSlices";

export type { ItemType, InterestRate, Branch, Role };

/**
 * Dispatches on every mount; `condition` on the thunk (see createLookupSlice)
 * is what actually decides whether a request goes out — an in-flight or
 * still-fresh fetch is skipped, so concurrent/repeat mounts dedupe for free.
 */
export const useItemTypes = (): ItemType[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(itemTypesLookup.thunk());
  }, [dispatch]);
  return useAppSelector((state) => itemTypesLookup.selectData(state.itemTypes));
};

export const useActiveInterestRates = (): InterestRate[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(interestRatesLookup.thunk());
  }, [dispatch]);
  return useAppSelector((state) => interestRatesLookup.selectData(state.interestRates));
};

export const useActiveBranches = (): Branch[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(branchesLookup.thunk());
  }, [dispatch]);
  return useAppSelector((state) => branchesLookup.selectData(state.branches));
};

/** All roles (active + inactive) — mirrors apiClient.roles.getAll(). */
export const useRoles = (): Role[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(rolesLookup.thunk());
  }, [dispatch]);
  return useAppSelector((state) => rolesLookup.selectData(state.roles));
};

export const usePatternConfig = (): string => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(patternConfigLookup.thunk());
  }, [dispatch]);
  const rows = useAppSelector((state) => patternConfigLookup.selectData(state.patternConfig));
  return rows[0]?.pattern ?? "TND";
};

// Derived selectors declared at module scope and memoized via createSelector —
// useSelector compares with strict `===`, so an inline `.map`/`.filter` inside
// the hook body would return a new array reference on every dispatch and
// force a re-render loop.
const selectActiveRoleOptions = createSelector(
  (state: RootState) => state.roles.data,
  (roles) => roles.filter((r) => r.isActive).map((r) => ({ name: r.name, label: r.label }))
);

/** Active roles only, shaped as {name,label} — for role-select dropdowns. */
export const useActiveRoleOptions = (): { name: string; label: string }[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(rolesLookup.thunk());
  }, [dispatch]);
  return useAppSelector(selectActiveRoleOptions);
};

const selectBranchOptions = createSelector(
  (state: RootState) => state.branches.data,
  (branches) => branches.map((b) => ({ id: b.id, name: b.name }))
);

/** Active branches shaped as {id,name} — for branch-select dropdowns. */
export const useBranchOptions = (): { id: string; name: string }[] => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(branchesLookup.thunk());
  }, [dispatch]);
  return useAppSelector(selectBranchOptions);
};
