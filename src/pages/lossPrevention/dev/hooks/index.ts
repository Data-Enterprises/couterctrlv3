// Hooks
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

/** The Loss Prevention slice, read where it is used instead of passed down. */
export const useLossPreventionCtx = () =>
  useAppSelector((s) => s.dev.lossPrevention, shallowEqual);
