import { useEffect } from "react";
import CheckBox from "../../../components-dev/inputs/CheckBox";
import {
  clearFilters,
  openNew,
  setAsClient,
  setFilters,
  setSearch,
  setTab,
  type QueueTab,
} from "../../../features/dev/devTicketsSlice";
import { useTicketsCtx } from "./hooks";
import TicketList from "./TicketList";
import TicketDetail from "./TicketDetail";
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

  const tabs: { key: QueueTab; label: string; count: number }[] = ctx.isTech
    ? [
        { key: "all", label: "All", count: ctx.counts.all },
        { key: "unassigned", label: "Unassigned", count: ctx.counts.unassigned },
        { key: "mine", label: "Mine", count: ctx.counts.mine },
        { key: "urgent", label: "Urgent", count: ctx.counts.urgent },
        { key: "closed", label: "Closed", count: ctx.counts.closed },
      ]
    : [
        { key: "all", label: "Open", count: ctx.counts.all },
        { key: "closed", label: "Closed", count: ctx.counts.closed },
      ];

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-3 px-4 py-4 bg-bkg">

      <div className="flex items-end gap-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight">
            {ctx.isTech ? "Client Help Desk" : "Support"}
          </h1>
          <p className="text-[12.5px] text-content/85 mt-0.5">
            {ctx.isTech
              ? "Every company's tickets, newest activity first."
              : "Your company's tickets, and any you opened yourself."}
          </p>
        </div>

        {/*
          * Dev only, and a preview of the layout rather than of the rules:
          * the payload is still a tech's, because the filtering happens in the
          * query. The page is level 9 and both flags trip at 8, so without
          * this the client view is a screen nobody on the team can look at.
          */}
        {ctx.caps.canViewAll && (
          <CheckBox
            id={1}
            idExtension="as-client"
            label="View as a client"
            value={ctx.asClient}
            onChange={(value) => ctx.dispatch(setAsClient(Boolean(value)))}
            className="text-[12px] text-content/85 bg-custom-white border border-brand_line rounded-lg px-3 py-2.5 cursor-pointer select-none"
          />
        )}

        <button
          type="button"
          onClick={() => ctx.dispatch(openNew(true))}
          className="text-[13px] font-semibold px-4 py-2.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors"
        >
          New ticket
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        <div className="flex bg-card_bg border border-brand_line rounded-lg overflow-hidden">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => ctx.dispatch(setTab(tab.key))}
              className={`text-[12.5px] px-3.5 py-2.5 transition-colors ${
                i > 0 ? "border-l border-brand_line" : ""
              } ${
                ctx.tab === tab.key
                  ? "bg-brand_slate text-custom-white font-semibold"
                  : "hover:bg-custom-white"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        <label htmlFor="ticket-search" className="sr-only">
          Search tickets
        </label>
        <input
          id="ticket-search"
          type="search"
          value={ctx.search}
          onChange={(e) => ctx.dispatch(setSearch(e.target.value))}
          placeholder={
            ctx.isTech
              ? "Search title, number, company or person"
              : "Search your tickets"
          }
          className="flex-1 min-w-[220px] border border-brand_line rounded-lg px-3 py-2.5 text-[13px] bg-custom-white"
        />

        <button
          type="button"
          onClick={ctx.load}
          disabled={ctx.loading}
          className="text-[12.5px] font-medium px-3 py-2.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
        >
          {ctx.loading ? "Reading..." : "Refresh"}
        </button>
      </div>

      {ctx.error && (
        <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12.5px] text-amber-900">
          {ctx.error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 min-w-0 flex flex-col">
          <TicketList
            rows={ctx.rows}
            selectedId={ctx.selectedId}
            onSelect={ctx.open}
            isTech={ctx.isTech}
            loading={ctx.loading}
            filters={ctx.filters}
            onFilters={(next) => ctx.dispatch(setFilters(next))}
            onClearFilters={() => ctx.dispatch(clearFilters())}
          />
        </div>
        <div className="w-[380px] xl:w-[460px] 2xl:w-[560px] flex-shrink-0 flex flex-col">
          <TicketDetail ctx={ctx} />
        </div>
      </div>

      {ctx.newOpen && <NewTicketModal ctx={ctx} />}
      {ctx.closingOpen && <CloseTicketModal ctx={ctx} />}
    </div>
  );
};

export default Tickets;
