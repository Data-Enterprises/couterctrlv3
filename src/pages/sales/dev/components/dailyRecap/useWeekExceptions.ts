import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { exceptionsByDay } from "./recapExceptions";
import { loadWeekExceptions } from "./recapExceptionsLoad";
import type { WeekExceptionsState } from "./recapTypes";

/**
 * The week's exceptions for the open store, read once when the tab opens.
 *
 * One read covers every day, so picking a day finds its exceptions already in
 * hand. Kept in the hook, not in Redux: it belongs to this tab for this store,
 * and nothing needs it after the popup closes, so there is nothing for
 * sign-out to clear. A new store or week starts over, and an answer for the
 * one before it that lands late is dropped.
 */
export const useWeekExceptions = (
  storeId: number,
  storeNumber: string,
  startDate: string,
  endDate: string,
): WeekExceptionsState => {
  const { url, token } = useAppSelector((s) => s.app);
  const [state, setState] = useState<WeekExceptionsState>({ status: "idle" });

  useEffect(() => {
    if (!startDate || !endDate) return;
    let live = true;
    setState({ status: "loading" });
    loadWeekExceptions(url, token, storeId, storeNumber, startDate, endDate)
      .then((lines) => {
        if (live) setState({ status: "ready", byDay: exceptionsByDay(lines) });
      })
      .catch(() => {
        if (live) setState({ status: "error" });
      });
    return () => {
      live = false;
    };
  }, [url, token, storeId, storeNumber, startDate, endDate]);

  return state;
};
