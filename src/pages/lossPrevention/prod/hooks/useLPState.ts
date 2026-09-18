import { useAppSelector } from "../../../../hooks";

export const useLPState = () =>
  useAppSelector((state) => state.prod.lossPrevention);
