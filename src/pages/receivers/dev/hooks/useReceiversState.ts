import { useAppSelector } from "../../../../hooks";

export const useReceiversState = () =>
  useAppSelector((state) => state.dev.receivers);
