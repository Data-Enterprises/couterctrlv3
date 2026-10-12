import { useState } from "react";
import ColFilter from "../../../components-dev/filters/ColFilter";
import TextFilter from "../../../components-dev/filters/TextFilter";
import MultiSelectFilter from "../../../components-dev/filters/MultiSelectFilter";
import type { Ticket, TicketStatus } from "../../../api/tickets";
import {
  noFilters,
  type TicketFilters,
} from "../../../features/dev/devTicketsSlice";
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  whenText,
} from "./ticketsUtils";

interface Props {
  rows: Ticket[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Company, opener and assignee are a tech's columns. A client reading
   *  "assigned to Alex" invites a question the page cannot answer. */
  isTech: boolean;
  loading: boolean;
  filters: TicketFilters;
  onFilters: (next: Partial<TicketFilters>) => void;
  onClearFilters: () => void;
}

/**
 * The tracks, by how much room there is.
 *
 * A grid of eight fixed columns crushes the title on a laptop — the one column
 * people actually read. So the ones that answer "which ticket" keep their
 * room, and the ones that answer "whose" drop off as the window narrows:
 * opened-by first, then company. Assignee stays longest, because a queue is
 * triaged by who is on what.
 *
 * The cells carry the matching `hidden` classes; the two must stay in step or
 * the grid allocates a track for something nobody can see.
 */
const TECH_COLS =
  "grid-cols-[96px_76px_minmax(0,1fr)_86px_118px_72px] " +
  "xl:grid-cols-[100px_80px_minmax(0,1fr)_128px_86px_122px_76px] " +
  "2xl:grid-cols-[110px_84px_minmax(0,1fr)_140px_140px_88px_130px_84px]";

const CLIENT_COLS = "grid-cols-[100px_80px_minmax(0,1fr)_88px_100px]";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting", label: "Waiting" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const TicketList = ({
  rows,
  selectedId,
  onSelect,
  isTech,
  loading,
  filters,
  onFilters,
  onClearFilters,
}: Props) => {
  /**
   * The draft the popover edits, committed on Apply.
   *
   * The house pattern from the item grids: filtering on every keystroke made
   * typing into one feel like wading, and a column filter is a sentence
   * somebody finishes before they mean it.
   */
  const [draft, setDraft] = useState<TicketFilters>(filters);
  const edit = (next: Partial<TicketFilters>) =>
    setDraft((d) => ({ ...d, ...next }));

  const cols = isTech ? TECH_COLS : CLIENT_COLS;
  const filtering = JSON.stringify(filters) !== JSON.stringify(noFilters);

  return (
    <div className="flex-1 min-h-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden">
      <div
        className={`grid gap-3 px-4 py-2.5 bg-custom-white border-b border-brand_line flex-shrink-0 items-center ${cols}`}
      >
        <ColFilter
          label="Status"
          active={filters.status.length > 0}
          onApply={() => onFilters({ status: draft.status })}
          onClear={() => {
            edit({ status: [] });
            onFilters({ status: [] });
          }}
        >
          <MultiSelectFilter
            options={STATUS_OPTIONS}
            values={draft.status}
            onChange={(status) => edit({ status })}
            placeholder="Any status"
            noun="statuses"
          />
        </ColFilter>

        <span className="text-[9px] font-semibold uppercase tracking-wide text-content">
          Ticket
        </span>

        <ColFilter
          label="Title"
          active={filters.title.trim() !== ""}
          onApply={() => onFilters({ title: draft.title })}
          onClear={() => {
            edit({ title: "" });
            onFilters({ title: "" });
          }}
        >
          <TextFilter
            value={draft.title}
            onChange={(title) => edit({ title })}
            placeholder="Words in the title"
          />
        </ColFilter>

        {isTech && (
          <span className="hidden xl:flex">
            <ColFilter
              label="Company"
              active={filters.company.trim() !== ""}
              onApply={() => onFilters({ company: draft.company })}
              onClear={() => {
                edit({ company: "" });
                onFilters({ company: "" });
              }}
            >
              <TextFilter
                value={draft.company}
                onChange={(company) => edit({ company })}
                placeholder="Company name"
              />
            </ColFilter>
          </span>
        )}

        {isTech && (
          <span className="hidden 2xl:flex">
            <ColFilter
              label="Opened by"
              active={filters.openedBy.trim() !== ""}
              onApply={() => onFilters({ openedBy: draft.openedBy })}
              onClear={() => {
                edit({ openedBy: "" });
                onFilters({ openedBy: "" });
              }}
            >
              <TextFilter
                value={draft.openedBy}
                onChange={(openedBy) => edit({ openedBy })}
                placeholder="Who filed it"
              />
            </ColFilter>
          </span>
        )}

        <ColFilter
          label="Priority"
          active={filters.priority.length > 0}
          onApply={() => onFilters({ priority: draft.priority })}
          onClear={() => {
            edit({ priority: [] });
            onFilters({ priority: [] });
          }}
        >
          <MultiSelectFilter
            options={PRIORITY_OPTIONS}
            values={draft.priority}
            onChange={(priority) => edit({ priority })}
            placeholder="Any priority"
            noun="priorities"
          />
        </ColFilter>

        {isTech && (
          <span className="flex">
            <ColFilter
              label="Assignee"
              active={filters.assignee.trim() !== ""}
              onApply={() => onFilters({ assignee: draft.assignee })}
              onClear={() => {
                edit({ assignee: "" });
                onFilters({ assignee: "" });
              }}
            >
              <TextFilter
                value={draft.assignee}
                onChange={(assignee) => edit({ assignee })}
                placeholder="Tech, or Unassigned"
              />
            </ColFilter>
          </span>
        )}

        <span className="text-[9px] font-semibold uppercase tracking-wide text-content">
          Updated
        </span>
      </div>

      {filtering && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 bg-filter_active border-b border-brand_line">
          <span className="text-[11.5px] text-brand_navy_hover">
            {rows.length} of these match the column filters.
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(noFilters);
              onClearFilters();
            }}
            className="text-[11.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
          >
            Clear them
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {rows.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelect(ticket.id)}
            className={`w-full grid gap-3 px-4 py-3 text-left items-center border-b border-brand_line text-[13px] transition-colors ${cols} ${
              ticket.id === selectedId
                ? "bg-row_selected border-l-2 border-l-brand_navy_hover"
                : "hover:bg-custom-white border-l-2 border-l-transparent"
            }`}
          >
            <span>
              <span
                className={`inline-block text-[11.5px] font-semibold rounded px-2 py-0.5 ${STATUS_CLASS[ticket.status]}`}
              >
                {STATUS_LABEL[ticket.status]}
              </span>
            </span>
            <span className="font-mono text-[12px] text-content/85">
              {ticket.ticket_number}
            </span>
            <span
              className="font-semibold truncate"
              title={ticket.title}
            >
              {ticket.title}
            </span>
            {isTech && (
              <span className="hidden xl:block text-content/85 truncate">
                {ticket.company_name ?? "—"}
              </span>
            )}
            {isTech && (
              <span className="hidden 2xl:block text-content/85 truncate">
                {ticket.opened_by_name}
              </span>
            )}
            <span>
              <span
                className={`inline-block text-[11.5px] font-semibold rounded px-2 py-0.5 ${
                  PRIORITY_CLASS[ticket.priority] ?? PRIORITY_CLASS.normal
                }`}
              >
                {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
              </span>
            </span>
            {isTech && (
              <span
                className={`truncate ${
                  ticket.assignee_id === null
                    ? "text-brand_danger font-semibold"
                    : "text-content/85"
                }`}
              >
                {ticket.assigned_tech ?? "Unassigned"}
              </span>
            )}
            <span className="text-content/85">{whenText(ticket.updated_at)}</span>
          </button>
        ))}

        {rows.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-[13px] font-semibold">
              {loading ? "Reading the queue..." : "Nothing here"}
            </div>
            <div className="text-[12.5px] text-content/85 mt-1.5 max-w-[46ch] mx-auto">
              {loading
                ? "One call for the tickets, one for the pickers."
                : filtering
                  ? "No ticket matches the column filters. Clearing them brings the queue back."
                  : "No ticket matches this tab and search. Closed ones have their own tab."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
