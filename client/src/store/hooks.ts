import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Pre-typed hooks — import these everywhere instead of the bare react-redux
// hooks so selectors never re-annotate `(state: RootState)` and dispatch
// correctly types thunks via AppDispatch.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
