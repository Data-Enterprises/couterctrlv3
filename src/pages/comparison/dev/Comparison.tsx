import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setInvestigation } from "../../../features/dev/devSalesLedgerSlice";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../utils";
import { isGroupSearch } from "../../../features/searchSlice";
import SearchCard from "../../../components-dev/SearchCard";
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import DeptMatrixPanel from "../../sales/dev/components/DeptMatrixPanel";
import DeptInvestigation from "../../sales/dev/components/DeptInvestigation";
import type { Store } from "../../../interfaces";
import type { MatrixStore } from "../../sales/dev/hooks/useDeptMatrix";

/**
 * Comparison: stores against each other, department by department.
 *
 * Its own page because it is its own question. It grew inside Sales for a
 * while and ended up as five states there — a ledger, a store report, two
 * group views and two full-page takeovers reached from buttons tucked into
 * headers. Sales is one store's week; this is every store against every
 * other, and the walkthrough is short once it is not sharing a page:
 *
 *   1. Pick a group and a week.
 *   2. The matrix — every store against every department, indexed so 100 is
 *      the contribution that store usually makes there.
 *   3. Click a cell — the investigation for that store and department,
 *      against whoever is doing it best, down to the item and its evidence.
 *
 * Two screens and one click between them. The panels themselves are the ones
 * built on Sales and are imported rather than copied: the arithmetic, the
 * grading bands and the fetch behaviour have to stay one implementation.
 */

/**
 * The three weeks, from the week-ending date the search card holds.
 *
 * Last year shifts every DAY and takes the min and max rather than shifting
 * the two endpoints — the same reason Sales does: a fixed-date holiday snaps
 * one endpoint and not the other, and the range desyncs from the per-day
 * lookups underneath.
 */
const windowsFor = (singleDate: string) => {
  const twEnd = formatGoliathDate(singleDate);
  const twStart = addDays(singleDate, -6).toISOString().split("T")[0];
  const lwEnd = addDays(singleDate, -7).toISOString().split("T")[0];
  const lwStart = addDays(singleDate, -13).toISOString().split("T")[0];
  const lyDates = Array.from({ length: 7 }, (_, i) =>
    addDays(twStart, i).toISOString().split("T")[0],
  )
    .map((d) => sameWeekDayLastYear(d).date)
    .sort();
  return {
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart: lyDates[0],
    lyEnd: lyDates[lyDates.length - 1],
  };
};

type Windows = ReturnType<typeof windowsFor>;

const Comparison = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const userid = useAppSelector((state) => state.user.userid);
  // Shared with Sales on purpose: one threshold and one metric govern the
  // ledger's severity dots and this page's bands, so the two cannot grade the
  // same store differently. 9 is the fallback for a cleared input, the same
  // number Sales falls back to.
  const { gradingMetric, threshold, investigation } = useAppSelector(
    (state) => state.dev.salesLedger,
  );

  const [stores, setStores] = useState<MatrixStore[] | null>(null);
  const [windows, setWindows] = useState<Windows | null>(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!isGroupSearch(search.type) || !search.lastGroup) {
      // One store is not a comparison, and saying so here beats loading a
      // matrix whose every cell reads 100 by construction.
      setProblem("Pick a group — a comparison needs more than one store.");
      setStores(null);
      return;
    }

    setLoading(true);
    setProblem(null);
    dispatch(setInvestigation(null));

    try {
      const resp = await getStoresAssignedToUserGroup(
        context.url,
        context.token,
        userid,
        search.lastGroup,
      );
      if (resp.data.error !== 0) {
        setProblem(resp.data.msg ?? "That group could not be loaded.");
        setStores(null);
        return;
      }
      const active: Store[] = (resp.data.stores ?? []).filter(
        (s: Store & { active?: boolean }) => s.active,
      );
      if (active.length === 0) {
        setProblem("No active stores in that group.");
        setStores(null);
        return;
      }
      setStores(
        active.map((s) => ({
          storeid: s.storeid,
          storeNumber: s.store_number,
          storeName: s.store_name,
        })),
      );
      setWindows(windowsFor(search.singleDate));
    } catch {
      setProblem("That group could not be loaded.");
      setStores(null);
    } finally {
      setLoading(false);
    }
  }, [
    context.url, context.token, userid,
    search.type, search.lastGroup, search.singleDate,
    dispatch,
  ]);

  const ready = stores !== null && windows !== null;

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {loading ? (
        <div className="relative h-[calc(100vh-5rem)]">
          <LoadingIndicator message="Finding the stores in this group" />
        </div>
      ) : !ready ? (
        <div className="max-w-sm mx-auto mt-10">
          <SearchCard
            title="Compare stores"
            description="Pick a group and a week. Every store comes back against every department, and a cell opens why."
            buttonLabel="Compare"
            singleDate
            onSearch={run}
            loading={loading}
            loadingMessage="Finding the stores..."
            notice={problem ?? undefined}
          />
        </div>
      ) : investigation ? (
        <div className="h-[calc(100vh-5rem)]">
          <DeptInvestigation
            gradingMetric={gradingMetric}
            {...(windows as Windows)}
          />
        </div>
      ) : (
        <div className="h-[calc(100vh-5rem)]">
          <DeptMatrixPanel
            stores={stores as MatrixStore[]}
            gradingMetric={gradingMetric}
            threshold={threshold?.amount ?? 9}
            expanded
            onBack={() => setStores(null)}
            backLabel="New search"
            {...(windows as Windows)}
          />
        </div>
      )}
    </div>
  );
};

export default Comparison;
