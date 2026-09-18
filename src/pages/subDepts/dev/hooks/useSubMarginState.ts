import { useAppSelector } from "../../../../hooks";

export const useSubMarginState = () =>
  useAppSelector((state) => state.dev.subMargin);
