import { useEffect, useMemo } from "react";
import CheckBox from "../../../components-dev/inputs/CheckBox";
import {
  clearFilters,
  openNew,
  setAsClient,
  setFilters,
  setSearch,
  setTab,
} from "../../../features/dev/devTicketsSlice";
import { useTicketsCtx } from "./hooks";
import { priorityCounts, statusCounts } from "./ticketsUtils";
import TicketRail from "./TicketRail";
import TicketInbox from "./TicketInbox";
import TicketDetail from "./TicketDetail";
import TicketSidebar from "./TicketSidebar";
import NewTicketModal from "./NewTicketModal";
import CloseTicketModal from "./CloseTicketModal";

/**
 * The Client Help Desk — one page, two views.
 *
 * Which view someone gets is decided by the server and arrives with the data:
 * `canViewAll` brings the queue, every company's tickets and the internal
 * notes; without it the page is a client's own tickets and the conversation on
 * them. Nothing here derives that from a user level, because the rule lives
 * server-side and the two would drift the first time a level moved.
 *
 * One route rather than two nav entries. The flags come back on every list and
 * detail response, so the page always knows which of itself to be, and there
 * is one screen to keep in step rather than two.
 *
 * LAYOUT
 * Four columns, in the order you use them: the rail picks a pile of work, the
 * inbox picks a ticket out of it, the thread is the ticket, and the sidebar is
 * who sent it. Nothing stacks above them — the page title and the tab strip
 * that used to sit there were spending two rows on what the rail now says down
 * the side, and the thread is the thing that wanted the height.
 *
 * The two outer columns give way first. The sidebar is the least load-bearing,
 * so it goes below `xl`; the rail belongs to a tech triaging a queue, so a
 * client never has one — their five folders would read All open and Closed and
 * nothing else. The status and priority pickers sit above the search box
 * rather than in the rail, so a client keeps them when the rail goes.
 */
const Tickets = () => {
  const ctx = useTicketsCtx();

  useEffect(() => {
    // Once, on open: the queue and the pickers. Reloading is explicit.
    ctx.load();
  }, []);

  useEffect(() => {
    // The assignee list is a tech's; asking for it without canManage is a 403.
    if (ctx.caps.canManage) ctx.loadAssignees();
  }, [ctx.caps.canManage]);

  /**
   * Ask after the queue every thirty seconds, and hold what comes back.
   *
   * Applying it would reorder the list under whoever is reaching for a row,
   * since it sorts by updated_at — so this only ever lights a bar. Email
   * already covers "a ticket arrived", which is the case that matters; this
   * is for the half hour somebody leaves the page open.
   */
  useEffect(() => {
    let inFlight = false;
    const tick = () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      void ctx.pollList().finally(() => {
        inFlight = false;
      });
    };
    const handle = window.setInterval(tick, 30000);
    return () => window.clearInterval(handle);
  }, []);

  const byStatus = useMemo(
    () => statusCounts(ctx.tickets),
    [ctx.tickets],
  );
  const byPriority = useMemo(
    () => priorityCounts(ctx.tickets),
    [ctx.tickets],
  );

  const refresh = () => {
    // A poll has already fetched the newer queue, so applying it is instant
    // and costs no call. With nothing held, this is a real fetch as before.
    if (ctx.pending) ctx.applyPending();
    else ctx.load();
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-bkg">
      {ctx.isTech && (
        <TicketRail
          tab={ctx.tab}
          counts={ctx.counts}
          onTab={(tab) => ctx.dispatch(setTab(tab))}
          footer={
            /*
             * Dev only, and a preview of the layout rather than of the rules:
             * the payload is still a tech's, because the filtering happens in
             * the query. The page is level 9 and both flags trip at 8, so
             * without this the client view is a screen nobody on the team can
             * look at.
             */
            ctx.caps.canViewAll ? (
              <CheckBox
                id={1}
                idExtension="as-client"
                label="View as a client"
                value={ctx.asClient}
                onChange={(value) =>
                  ctx.dispatch(setAsClient(Boolean(value)))
                }
                className="cursor-pointer select-none rounded-md px-1 text-[11.5px] text-content/85"
              />
            ) : undefined
          }
        />
      )}

      <TicketInbox
        rows={ctx.rows}
        selectedId={ctx.selectedId}
        onSelect={ctx.open}
        isTech={ctx.isTech}
        loading={ctx.loading}
        search={ctx.search}
        onSearch={(value) => ctx.dispatch(setSearch(value))}
        filters={ctx.filters}
        onFilters={(next) => ctx.dispatch(setFilters(next))}
        onClearFilters={() => ctx.dispatch(clearFilters())}
        statusCounts={byStatus}
        priorityCounts={byPriority}
        pending={Boolean(ctx.pending)}
        onRefresh={refresh}
        /*
         * Filing is the client's action.
         *
         * A ticket takes its company from whoever opens it, so a tech filing
         * one on a client's behalf would file it under ours — the endpoint
         * refuses any other company outright. The button would be a way to
         * misfile rather than a way to help, so a tech does not get one.
         */
        onNew={
          ctx.isTech ? undefined : () => ctx.dispatch(openNew(true))
        }
        error={ctx.error}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TicketDetail ctx={ctx} />
      </div>

      {ctx.detail && (
        <div className="hidden xl:flex">
          <TicketSidebar
            ticket={ctx.detail}
            tickets={ctx.tickets}
            onSelect={ctx.open}
          />
        </div>
      )}

      {ctx.newOpen && <NewTicketModal ctx={ctx} />}
      {ctx.closingOpen && <CloseTicketModal ctx={ctx} />}
    </div>
  );
};

export default Tickets;
