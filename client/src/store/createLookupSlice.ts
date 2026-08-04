import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LookupStatus = "idle" | "loading" | "succeeded" | "failed";

export interface LookupState<T> {
  data: T[];
  status: LookupStatus;
  error: string | null;
  fetchedAt: number | null;
}

const initialLookupState = <T>(): LookupState<T> => ({
  data: [],
  status: "idle",
  error: null,
  fetchedAt: null,
});

interface CreateLookupSliceOptions<T> {
  /** Slice name, also used as the async thunk type prefix. */
  name: string;
  /** Wraps an existing apiClient method — no new transport code. */
  fetcher: () => Promise<T[]>;
  /** How long a successful fetch is considered fresh; skip refetching within this window. */
  ttlMs: number;
}

/**
 * One shared shape for read-mostly reference/lookup data (item types, interest
 * rates, branches, roles, ...). `condition` is what actually cuts request
 * count — it skips the thunk entirely while a fetch is in flight or the
 * cached data is still within `ttlMs`, mirroring the RTK docs' manual-cache
 * pattern (createAsyncThunk `condition` option).
 */
export function createLookupSlice<T>({ name, fetcher, ttlMs }: CreateLookupSliceOptions<T>) {
  // Deliberately untyped `state` generic (defaults to `unknown`): a per-slice state
  // shape here can't be unified with the app's real RootState (defined later in
  // store/index.ts from the composed reducer), which would otherwise make this
  // thunk incompatible with AppDispatch. condition() casts locally instead.
  const thunk = createAsyncThunk<T[], void>(`${name}/fetch`, fetcher, {
    condition: (_arg, { getState }) => {
      const sliceState = (getState() as Record<string, LookupState<T>>)[name];
      if (!sliceState) return true;
      if (sliceState.status === "loading") return false;
      if (sliceState.status === "succeeded" && sliceState.fetchedAt !== null) {
        return Date.now() - sliceState.fetchedAt >= ttlMs;
      }
      return true;
    },
  });

  const slice = createSlice({
    name,
    initialState: initialLookupState<T>(),
    reducers: {
      invalidate: (state) => {
        state.status = "idle";
        state.fetchedAt = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action: PayloadAction<T[]>) => {
          state.status = "succeeded";
          // Immer's Draft<T> can't be unified with a bare generic T — safe cast,
          // the runtime value is a plain array from the fetcher either way.
          state.data = action.payload as typeof state.data;
          state.fetchedAt = Date.now();
        })
        .addCase(thunk.rejected, (state, action) => {
          // Keep any previously-good `data` so a transient failure doesn't blank a dropdown.
          state.status = "failed";
          state.error = action.error.message ?? "Failed to fetch";
        });
    },
  });

  return {
    name,
    reducer: slice.reducer,
    thunk,
    invalidate: slice.actions.invalidate,
    selectData: (sliceState: LookupState<T>): T[] => sliceState.data,
    selectStatus: (sliceState: LookupState<T>): LookupStatus => sliceState.status,
  };
}
