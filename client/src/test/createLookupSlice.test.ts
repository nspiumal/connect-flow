import { describe, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { createLookupSlice } from "@/store/createLookupSlice";

interface Row {
  id: string;
}

const buildStore = (fetcher: () => Promise<Row[]>, ttlMs = 5 * 60_000) => {
  const lookup = createLookupSlice<Row>({ name: "test", fetcher, ttlMs });
  const store = configureStore({ reducer: { test: lookup.reducer } });
  return { store, lookup };
};

describe("createLookupSlice condition", () => {
  it("skips a second dispatch while the first fetch is still in flight", async () => {
    let resolveFetch!: (rows: Row[]) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<Row[]>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const { store, lookup } = buildStore(fetcher);

    const first = store.dispatch(lookup.thunk());
    store.dispatch(lookup.thunk());
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch([{ id: "1" }]);
    await first;
  });

  it("skips a dispatch while cached data is still within the TTL", async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: "1" }]);
    const { store, lookup } = buildStore(fetcher, 60_000);

    await store.dispatch(lookup.thunk());
    await store.dispatch(lookup.thunk());

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has elapsed", async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: "1" }]);
    const { store, lookup } = buildStore(fetcher, 10);

    await store.dispatch(lookup.thunk());
    await new Promise((resolve) => setTimeout(resolve, 25));
    await store.dispatch(lookup.thunk());

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("refetches after invalidate() even within the TTL window", async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: "1" }]);
    const { store, lookup } = buildStore(fetcher, 60_000);

    await store.dispatch(lookup.thunk());
    store.dispatch(lookup.invalidate());
    await store.dispatch(lookup.thunk());

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps previously-good data when a refetch fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce([{ id: "1" }])
      .mockRejectedValueOnce(new Error("network error"));
    const { store, lookup } = buildStore(fetcher, 0);

    await store.dispatch(lookup.thunk());
    await store.dispatch(lookup.thunk());

    const state = store.getState().test;
    expect(state.status).toBe("failed");
    expect(state.data).toEqual([{ id: "1" }]);
  });
});
