import { useEffect, useMemo } from "react";
import {
  clearFilters,
  openNew,
  setFilters,
  setSearch,
  setTab,
} from "../../../features/dev/devTicketsSlice";
import { useTicketsCtx } from "./hooks";
import { priorityCounts, statusCounts } from "./ticketsUtils";
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
 * Three columns, in the order you use them: the inbox picks a ticket, the
 * thread is the ticket, and the sidebar is who sent it. Nothing stacks above
 * them — the page title and the tab strip that used to sit there were spending
 * two rows on what the inbox header now says in one, and the thread is the
 * thing that wanted the height.
 *
 * The queue, its two narrowing pickers and the search box all live in the
 * inbox header. They were briefly a rail of their own, which cost a whole
 * column to say five short words and left the thread narrower than the list
 * beside it.
 *
 * The sidebar is the least load-bearing column, so it is the one that goes
 * below `xl`.
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

  const byStatus = useMemo(() => statusCounts(ctx.tickets), [ctx.tickets]);
  const byPriority = useMemo(() => priorityCounts(ctx.tickets), [ctx.tickets]);

  const refresh = () => {
    // A poll has already fetched the newer queue, so applying it is instant
    // and costs no call. With nothing held, this is a real fetch as before.
    if (ctx.pending) ctx.applyPending();
    else ctx.load();
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-bkg">
      <TicketInbox
        rows={ctx.rows}
        selectedId={ctx.selectedId}
        onSelect={ctx.open}
        isTech={ctx.isTech}
        loading={ctx.loading}
        tab={ctx.tab}
        counts={ctx.counts}
        onTab={(tab) => ctx.dispatch(setTab(tab))}
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
        onNew={ctx.isTech ? undefined : () => ctx.dispatch(openNew(true))}
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
