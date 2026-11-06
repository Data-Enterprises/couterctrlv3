// Hooks
import { useEffect, useMemo, useState } from "react";
import { useTicketsCtx } from "./hooks";

// Redux
import {
  clearFilters,
  openNew,
  setFilters,
  setSearch,
  setTab,
} from "../../../features/dev/devTicketsSlice";

// Utils
import { priorityCounts, statusCounts } from "./utils/ticketsUtils";
import { storesOnTickets } from "./utils";

// Componenets
import TicketInbox from "./components/TicketInbox";
import TicketDetail from "./components/TicketDetail";
import TicketSidebar from "./components/TicketSidebar";
import NewTicketModal from "./components/modals/NewTicketModal";
import CloseTicketModal from "./components/modals/CloseTicketModal";
import TechsModal from "./components/modals/TechsModal";

/**
 * The Client Help Desk — one page, two views.
 * Which view someone gets is decided by the server and arrives with the data:
 * `canViewAll` brings the queue, every company's tickets and the internal
 * notes; without it the page is the tickets the client may see, which `scope`
 * names: their own, also their stores', or also their companies'. Nothing here
 * derives that from a user level, because the rule lives server-side and the
 * two would drift the first time a level moved.
 */
const Tickets = () => {
  const ctx = useTicketsCtx();
  // Local because nothing else on the page needs to know it is up.
  const [techsOpen, setTechsOpen] = useState(false);

  useEffect(() => {
    // Once, on open: the queue and the pickers. Reloading is explicit.
    ctx.load();
  }, []);

  const byStatus = useMemo(() => statusCounts(ctx.tickets), [ctx.tickets]);
  const byPriority = useMemo(() => priorityCounts(ctx.tickets), [ctx.tickets]);
  const storeOptions = useMemo(
    () => storesOnTickets(ctx.tickets),
    [ctx.tickets],
  );

  const refresh = () => {
    // A poll has already fetched the newer queue, so applying it is instant
    // and costs no call. With nothing held, this is a real fetch as before.
    if (ctx.pending) ctx.applyPending();
    else ctx.load();
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-3 bg-bkg p-3">
      <TicketInbox
        rows={ctx.rows}
        selectedId={ctx.selectedId}
        onSelect={ctx.open}
        isTech={ctx.isTech}
        scope={ctx.scope}
        userid={ctx.userid}
        storeOptions={storeOptions}
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
         * A ticket takes its company from whoever opens it, so a tech filing
         * one on a client's behalf would file it under ours — the endpoint
         * refuses any other company outright. The button would be a way to
         * misfile rather than a way to help, so a tech does not get one.
         */
        onNew={ctx.isTech ? undefined : () => ctx.dispatch(openNew(true))}
        /*
         * The roster is the desk's own business.
         * A client has no use for it and no right to it — the endpoint
         * refuses them anyway, so a button would only be a 403 with a label.
         * Changing it still needs the programmer level; the sheet reads
         * `canManageTechs` and wears the right face.
         */
        onTechs={ctx.isTech ? () => setTechsOpen(true) : undefined}
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

      {techsOpen && (
        <TechsModal
          canManageTechs={ctx.canManageTechs}
          onClose={() => setTechsOpen(false)}
          /* The assignee picker is a list of active techs, so it is wrong
             the moment the roster changes. */
          onChanged={ctx.loadAssignees}
        />
      )}
      {ctx.newOpen && <NewTicketModal ctx={ctx} />}
      {ctx.closingOpen && <CloseTicketModal ctx={ctx} />}
    </div>
  );
};

export default Tickets;
