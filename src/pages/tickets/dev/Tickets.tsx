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

// Components
import TicketInbox from "./components/ticketInbox/TicketInbox";
import TicketDetail from "./components/ticketDetail/TicketDetail";
import TicketSidebar from "./components/TicketSidebar";
import NewTicketModal from "./components/modals/NewTicketModal";
import CloseTicketModal from "./components/modals/CloseTicketModal";
import TechsModal from "./components/modals/techsModal/TechsModal";

/**
 * The Client Help Desk: one page, two views, and the server picks which
 * (`canViewAll` or `scope`). Never derive it from a user level.
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
    // and costs no call. With nothing held, it fetches.
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
         * Filing is the client's action: a ticket takes the filer's company,
         * so a tech filing for a client would misfile it. Techs get no button.
         */
        onNew={ctx.isTech ? undefined : () => ctx.dispatch(openNew(true))}
        /*
         * The roster is the desk's own business; the endpoint refuses clients.
         * Changing it needs the programmer level (`canManageTechs`).
         */
        onTechs={ctx.isTech ? () => setTechsOpen(true) : undefined}
        error={ctx.error}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TicketDetail />
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
      {ctx.newOpen && <NewTicketModal />}
      {ctx.closingOpen && <CloseTicketModal />}
    </div>
  );
};

export default Tickets;
