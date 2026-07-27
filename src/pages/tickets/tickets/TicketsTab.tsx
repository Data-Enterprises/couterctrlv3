import { useMemo, useState } from "react";
import { PlusIcon, XMarkIcon, LockClosedIcon } from "@heroicons/react/20/solid";
import { useTicketsCtx } from "../hooks";
import TextFilter from "../../../components/filters/TextFilter";
import SelectFilter from "../../../components/filters/SelectFilter";
import {
  setSearchText,
  setStatusFilter,
  setCompanyFilter,
  setQuickFilter,
  setSelectedTicketId,
  setReplyDraft,
  setReplyIsInternal,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  addMessage,
  type QuickFilter,
} from "../ticketsSlice";
import type { Ticket } from "../interfaces";
import { MOCK_COMPANIES } from "../mockData";
import NewTicketModal from "./NewTicketModal";

interface TicketsTabProps {
  isElevated: boolean;
}

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unassigned", label: "Unassigned" },
  { id: "mine", label: "Mine" },
  { id: "urgent", label: "Urgent" },
];

const PRIORITY_STYLES: Record<Ticket["priority"], string> = {
  low: "bg-gray-100 text-content",
  normal: "bg-amber-50 text-amber-800",
  high: "bg-red-50 text-red-800",
};

const STATUS_DOT: Record<Ticket["status"], string> = {
  open: "bg-amber-500",
  pending: "bg-blue-500",
  closed: "bg-green-600",
};

// Small relative-time formatter matching the screenshot's "4m"/"Jul 14" style
// — this feature has no shared date util in scope, so it's kept local.
const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const TicketsTab = ({ isElevated }: TicketsTabProps) => {
  const ctx = useTicketsCtx();
  const [showNewTicket, setShowNewTicket] = useState(false);

  // The working queue never shows closed tickets — those live on History.
  const scoped = useMemo(() => {
    const inScope = isElevated
      ? ctx.tickets
      : ctx.tickets.filter((t) =>
          ctx.companies.some((c) => c.company === t.company),
        );
    return inScope.filter((t) => t.status !== "closed");
  }, [ctx.tickets, ctx.companies, isElevated]);

  const counts = useMemo(
    () => ({
      all: scoped.length,
      unassigned: scoped.filter((t) => t.assignee_id === null).length,
      mine: scoped.filter((t) => t.assignee_id === ctx.userid).length,
      urgent: scoped.filter((t) => t.priority === "high").length,
    }),
    [scoped, ctx.userid],
  );

  const filtered = useMemo(() => {
    const q = ctx.searchText.trim().toLowerCase();
    return scoped.filter((t) => {
      if (ctx.quickFilter === "unassigned" && t.assignee_id !== null) return false;
      if (ctx.quickFilter === "mine" && t.assignee_id !== ctx.userid) return false;
      if (ctx.quickFilter === "urgent" && t.priority !== "high") return false;
      if (ctx.statusFilter && t.status !== ctx.statusFilter) return false;
      if (isElevated && ctx.companyFilter && t.company !== ctx.companyFilter) return false;
      if (q && !t.subject.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scoped, ctx.quickFilter, ctx.statusFilter, ctx.companyFilter, ctx.searchText, ctx.userid, isElevated]);

  const selectedTicket = ctx.tickets.find((t) => t.id === ctx.selectedTicketId) ?? null;

  const staffName = (id: number | null) =>
    id === null ? "Unassigned" : ctx.staff.find((s) => s.id === id)?.name ?? "Unassigned";
  const staffEmail = (id: number) =>
    ctx.staff.find((s) => s.id === id)?.email ?? "unknown";

  const handleStatusChange = (status: Ticket["status"]) => {
    if (!selectedTicket) return;
    console.log("API call: PUT tickets/update_status", { id: selectedTicket.id, status });
    ctx.dispatch(updateTicketStatus({ id: selectedTicket.id, status }));
  };
  const handlePriorityChange = (priority: Ticket["priority"]) => {
    if (!selectedTicket) return;
    console.log("API call: PUT tickets/update_priority", { id: selectedTicket.id, priority });
    ctx.dispatch(updateTicketPriority({ id: selectedTicket.id, priority }));
  };
  const handleAssigneeChange = (assignee_id: number | null) => {
    if (!selectedTicket) return;
    console.log("API call: PUT tickets/assign", { id: selectedTicket.id, assignee_id });
    ctx.dispatch(assignTicket({ id: selectedTicket.id, assignee_id }));
  };
  const handleAddAttachment = () => {
    console.log("API call: POST tickets/attachment");
  };
  const handleSendReply = () => {
    if (!selectedTicket || !ctx.replyDraft.trim()) return;
    console.log("API call: POST tickets/reply", {
      id: selectedTicket.id,
      body: ctx.replyDraft,
      is_internal_note: ctx.replyIsInternal,
    });
    ctx.dispatch(
      addMessage({
        ticket_id: selectedTicket.id,
        author_id: ctx.userid,
        body: ctx.replyDraft,
        is_internal_note: ctx.replyIsInternal,
      }),
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex-wrap">
        <div className="flex gap-1 flex-shrink-0">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => ctx.dispatch(setQuickFilter(f.id))}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
                ctx.quickFilter === f.id
                  ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                  : "bg-custom-white text-content border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label} {counts[f.id]}
            </button>
          ))}
        </div>
        <TextFilter
          value={ctx.searchText}
          onChange={(v) => ctx.dispatch(setSearchText(v))}
          placeholder="Search tickets…"
          className="flex-1 min-w-[140px]"
        />
        <SelectFilter
          options={[
            { value: "open", label: "Open" },
            { value: "pending", label: "Pending" },
          ]}
          value={ctx.statusFilter}
          onChange={(v) => ctx.dispatch(setStatusFilter(v as Ticket["status"] | ""))}
          placeholder="Any status"
          className="w-[110px] flex-shrink-0"
        />
        {isElevated ? (
          <SelectFilter
            options={MOCK_COMPANIES.map((c) => ({ value: String(c.id), label: c.name }))}
            value={ctx.companyFilter === "" ? "" : String(ctx.companyFilter)}
            onChange={(v) => ctx.dispatch(setCompanyFilter(v ? Number(v) : ""))}
            placeholder="Any company"
            className="w-[130px] flex-shrink-0"
          />
        ) : (
          <span className="text-[10.5px] text-content/85 px-2 flex-shrink-0">
            {ctx.companies.map((c) => c.name).join(", ") || "No company"}
          </span>
        )}
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New ticket
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[38%] border-r border-gray-100 bg-gray-50 flex-shrink-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {filtered.map((t) => {
            const isSelected = t.id === ctx.selectedTicketId;
            return (
              <button
                key={t.id}
                onClick={() => ctx.dispatch(setSelectedTicketId(t.id))}
                style={
                  isSelected
                    ? { boxShadow: "inset 3px 0 0 #1e2a4a", background: "rgba(30,42,74,0.04)" }
                    : undefined
                }
                className="w-full text-left px-3 py-2.5 hover:bg-gray-100 transition-colors even:bg-row_stripe"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                  <span className="text-[12.5px] font-medium text-content truncate">{t.subject}</span>
                </div>
                <div className="text-[10.5px] text-content/85 ml-3.5 mt-0.5">
                  {t.company_name} · {t.product}
                </div>
                <div className="flex items-center gap-2 ml-3.5 mt-1">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize ${PRIORITY_STYLES[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-[10.5px] text-content/85 flex-1 truncate">
                    {staffName(t.assignee_id)}
                  </span>
                  <span className="text-[10.5px] text-content/50 flex-shrink-0">
                    {formatRelative(t.updated_at)}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No tickets found
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-content">
              Select a ticket
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-content">
                    {selectedTicket.subject}
                  </span>
                  <button
                    onClick={() => ctx.dispatch(setSelectedTicketId(null))}
                    title="Close"
                    className="text-content/50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10.5px] text-content/50 mt-0.5">
                  #{selectedTicket.id} · opened by {staffEmail(selectedTicket.opened_by)} ·{" "}
                  {formatRelative(selectedTicket.created_at)} ago
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex-wrap">
                <SelectFilter
                  options={[
                    { value: "open", label: "Open" },
                    { value: "pending", label: "Pending" },
                    { value: "closed", label: "Closed" },
                  ]}
                  value={selectedTicket.status}
                  onChange={(v) => handleStatusChange(v as Ticket["status"])}
                  className="w-[100px]"
                />
                <SelectFilter
                  options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                  ]}
                  value={selectedTicket.priority}
                  onChange={(v) => handlePriorityChange(v as Ticket["priority"])}
                  className="w-[100px]"
                />
                <div className="flex-1" />
                <SelectFilter
                  options={ctx.staff.map((s) => ({ value: String(s.id), label: s.name }))}
                  value={selectedTicket.assignee_id === null ? "" : String(selectedTicket.assignee_id)}
                  onChange={(v) => handleAssigneeChange(v ? Number(v) : null)}
                  placeholder="Unassigned"
                  className="w-[130px]"
                />
              </div>

              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0">
                <span className="text-[10.5px] font-medium text-content/70 flex-1">
                  Attachments (0)
                </span>
                <button onClick={handleAddAttachment} className="text-[10.5px] text-blue-700 font-medium">
                  + Add
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar p-4 space-y-3">
                {ctx.messages
                  .filter((m) => m.ticket_id === selectedTicket.id)
                  .map((m) => {
                    const staffMember = ctx.staff.find((s) => s.id === m.author_id);
                    const initial = (staffMember?.name ?? "?").charAt(0).toUpperCase();
                    const isMine = m.author_id === ctx.userid;

                    const bubbleClass = m.is_internal_note
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : isMine
                        ? "bg-[#1e2a4a] text-custom-white"
                        : "bg-[#1e2a4a]/5 text-content";

                    if (isMine) {
                      return (
                        <div key={m.id} className="flex justify-end">
                          <div className="max-w-[72%] text-right">
                            <div
                              className={`text-[10px] mb-1 flex items-center justify-end gap-1 ${
                                m.is_internal_note ? "text-amber-800" : "text-content/85 font-medium"
                              }`}
                            >
                              {m.is_internal_note && (
                                <LockClosedIcon className="w-2.5 h-2.5 flex-shrink-0" />
                              )}
                              {m.is_internal_note ? "Internal note · " : ""}You ·{" "}
                              {formatRelative(m.created_at)} ago
                            </div>
                            <div
                              className={`inline-block text-left text-[12px] px-3 py-2 rounded-2xl rounded-br-md ${bubbleClass}`}
                            >
                              {m.body}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className="flex gap-2 items-end">
                        <div className="w-[22px] h-[22px] rounded-full bg-[#1e2a4a] text-custom-white flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                          {initial}
                        </div>
                        <div className="max-w-[72%]">
                          <div
                            className={`text-[10px] mb-1 flex items-center gap-1 font-medium ${
                              m.is_internal_note ? "text-amber-800" : "text-content/85"
                            }`}
                          >
                            {m.is_internal_note && (
                              <LockClosedIcon className="w-2.5 h-2.5 flex-shrink-0" />
                            )}
                            {staffMember?.name ?? "unknown"}
                            {m.is_internal_note ? " · Internal note" : ""} ·{" "}
                            {formatRelative(m.created_at)} ago
                          </div>
                          <div className={`text-[12px] px-3 py-2 rounded-2xl rounded-bl-md ${bubbleClass}`}>
                            {m.body}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {ctx.messages.filter((m) => m.ticket_id === selectedTicket.id).length === 0 && (
                  <div className="text-[11.5px] text-content/50">No replies yet.</div>
                )}
              </div>

              <div className="p-3 border-t border-gray-100 flex-shrink-0">
                <textarea
                  value={ctx.replyDraft}
                  onChange={(e) => ctx.dispatch(setReplyDraft(e.target.value))}
                  placeholder="Reply…"
                  rows={2}
                  className="w-full text-[12px] text-content border border-gray-200 rounded-md p-2 resize-none"
                  style={{ outline: "none" }}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <label className="flex items-center gap-1.5 text-[10.5px] text-content/70">
                    <input
                      type="checkbox"
                      checked={ctx.replyIsInternal}
                      onChange={(e) => ctx.dispatch(setReplyIsInternal(e.target.checked))}
                    />
                    Internal note
                  </label>
                  <button
                    onClick={handleSendReply}
                    disabled={!ctx.replyDraft.trim()}
                    className={`text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white ${
                      ctx.replyDraft.trim()
                        ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewTicket && (
        <NewTicketModal isElevated={isElevated} onClose={() => setShowNewTicket(false)} />
      )}
    </div>
  );
};

export default TicketsTab;
