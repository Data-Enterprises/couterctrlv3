// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { useDevApi } from "../../../../../hooks/useDevApi";
import { useTicketsCtx } from "../../hooks";

// Redux
import { shallowEqual } from "react-redux";
import { openNew } from "../../../../../features/dev/devTicketsSlice";

// API
import { getStoresAssignedToUserGroup } from "../../../../../api/groups";
import {
  getTicketStoreOptions,
  ticketFailed,
  type TicketPriority,
  type TicketStoreOption,
} from "../../../../../api/tickets";

// Utils
import {
  consolidate,
  getPageCalls,
  groupAsFile,
  withinBudget,
  type CallGroup,
} from "../../../../../utils/pageCalls";
import { attachmentProblem } from "../../utils/ticketsUtils";
import {
  assignedAsOptions,
  cleanStoreOptions,
  initialStorePicks,
  optionsForGroup,
} from "../../utils";
import {
  originOf,
  pageUsesSearch,
  scopeLine,
  scopeOf,
  searchSummary,
  suggestedTitle,
} from "./utils/ticketOrigin";
import { pageStoreOf, searchForPage } from "./utils";

// Components
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Modal from "../../../../../components-dev/Modal";
import Checkbox from "../../../../../components-dev/Checkbox";
import TextField from "../../../../../components-dev/inputs/TextField";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import StoreChecklist from "../StoreChecklist";
import NewTicketAttachments from "./components/NewTicketAttachments";

interface NewTicketModalProps {
  /** Where the reporter was when they raised it. Absent when the form is
   *  opened from the help desk itself, which is nowhere in particular. */
  from?: { from: string; page?: string; area?: string } | null;
  /** Filing from another page closes back to that page rather than to the
   *  queue, so the caller says what closing means. */
  onClose?: () => void;
}

/**
 * Filing: two fields are required and the queue works out the rest. No
 * company picker: the server takes the filer's company and refuses any other.
 */
const NewTicketModal = ({ from, onClose }: NewTicketModalProps) => {
  const ctx = useTicketsCtx();
  const { url, token } = useDevApi();

  const origin = from?.from
    ? originOf({ reportFrom: from.from, page: from.page, area: from.area })
    : null;
  const shared = useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  // A page with its own store picker is about its own store, not the last one
  // searched on Sales; everything below reads `search`.
  const own = useAppSelector(
    (state) => (origin ? pageStoreOf(state, origin.href) : undefined),
    shallowEqual,
  );
  const search = useMemo(
    () => searchForPage(shared, own, assignedStores),
    [shared, own, assignedStores],
  );
  const summary = origin ? searchSummary(search, origin.href) : null;
  /**
   * The page's captured calls, read once (calls the form makes are not
   * evidence) and grouped per endpoint, since a paged fetch is several calls.
   */
  const [{ kept, dropped }] = useState(() =>
    from?.from
      ? withinBudget(consolidate(getPageCalls()))
      : { kept: [] as CallGroup[], dropped: [] as CallGroup[] },
  );
  const [skip, setSkip] = useState<Set<string>>(new Set());

  /**
   * Required on every ticket, because the server scopes by store. The list is
   * the filer's own stores (a tech, filing for a client, gets every store);
   * the page's search only decides where it starts.
   */
  const searchedStoreId =
    origin && pageUsesSearch(origin.href) && search.type === "Store"
      ? (search.selectedStore?.storeid ?? null)
      : null;
  // Read once, like the evidence: the form is about the moment it opened.
  // Null while a tech's every-store list loads.
  const [options, setOptions] = useState<TicketStoreOption[] | null>(() =>
    ctx.isTech ? null : assignedAsOptions(assignedStores),
  );
  const [start] = useState(() =>
    ctx.isTech
      ? { picked: [] as number[], ask: true }
      : initialStorePicks({
          options: assignedAsOptions(assignedStores),
          isTech: false,
          searchedStoreId,
        }),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>(start.picked);
  const [notAbout, setNotAbout] = useState(false);
  const askStores = start.ask;
  const list = options ?? [];
  const optionsError =
    loadError ??
    (options !== null && options.length === 0
      ? "You have no stores of your own, so this ticket will be filed as not about a store."
      : null);

  useEffect(() => {
    if (!ctx.isTech) return;
    let live = true;
    const unread =
      "The stores could not be read, so this ticket will be filed as not about a store.";
    getTicketStoreOptions(url, token)
      .then((resp) => {
        if (!live) return;
        if (ticketFailed(resp.data)) {
          setLoadError(unread);
          setOptions([]);
          return;
        }
        const stores = cleanStoreOptions(resp.data.stores ?? []);
        setOptions(stores);
        setPicked(
          initialStorePicks({ options: stores, isTech: true, searchedStoreId })
            .picked,
        );
      })
      .catch(() => {
        if (!live) return;
        setLoadError(unread);
        setOptions([]);
      });
    return () => {
      live = false;
    };
  }, []);
  const [showAllStores, setShowAllStores] = useState(false);

  /**
   * A group search lists the group's stores first, none ticked, and only
   * those that are also the reader's own (a shared group is search-only).
   */
  const groupId =
    origin && pageUsesSearch(origin.href) && search.type !== "Store"
      ? (search.selectedGroup?.id ?? 0)
      : 0;
  const [groupStores, setGroupStores] = useState<
    { storeid: number; store_number: string; store_name: string }[]
  >([]);
  /**
   * Whether the group's stores are in. The list waits for them rather than
   * drawing every store and then narrowing.
   */
  const [groupRead, setGroupRead] = useState(!groupId);

  useEffect(() => {
    if (!groupId) return;
    let live = true;
    getStoresAssignedToUserGroup(url, token, ctx.userid, groupId)
      .then((res) => {
        if (!live) return;
        const rows = (res.data?.stores ?? []).filter(
          (s: { active: number }) => s.active === 1,
        );
        setGroupStores(rows);
      })
      // The list simply is not narrowed; every store of theirs is offered.
      .catch(() => undefined)
      .finally(() => {
        if (live) setGroupRead(true);
      });
    return () => {
      live = false;
    };
  }, [groupId]);

  const listed =
    !groupRead || options === null
      ? null
      : groupStores.length && !showAllStores
        ? optionsForGroup(
            options,
            groupStores.map((s) => s.storeid),
          )
        : options;
  const storesAnswered = optionsError !== null || picked.length > 0 || notAbout;
  // For a group search, the stores inside it they ticked, which the line at
  // the foot of the first message names as "seen on".
  const narrowedTo = groupStores.filter((s) => picked.includes(s.storeid));
  const onlyStore = !askStores && list.length === 1 ? list[0] : null;
  // Access problems are about a person, and a person works at a store.
  // Ticking it is what lets that store's manager see the ticket too.
  const accessPage =
    origin?.href === "user-management" || origin?.href === "groups";

  // Open when there is little to read, folded when the list would push the
  // fields people actually have to fill in off the screen.
  const [evidenceOpen, setEvidenceOpen] = useState(kept.length <= 3);
  const chosen = kept.filter((g) => !skip.has(g.key));

  const [title, setTitle] = useState(origin ? suggestedTitle(origin) : "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [category, setCategory] = useState(() => {
    if (!origin?.category) return "";
    const match = ctx.lookups?.categories?.find(
      (c) => c.name === origin.category,
    );
    return match ? String(match.id) : "";
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const limits = ctx.lookups?.attachments;

  /**
   * De-duplicated by name (a picker can be opened repeatedly), and checked here
   * as well as by the endpoint, so a ticket is not filed with evidence missing.
   */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const chosen = Array.from(list);
    const problem = chosen
      .map((f) => attachmentProblem(f, limits))
      .find(Boolean);
    setFileError(problem ?? null);
    const good = chosen.filter((f) => !attachmentProblem(f, limits));
    setFiles((have) => {
      const names = new Set(have.map((f) => f.name));
      return [...have, ...good.filter((f) => !names.has(f.name))];
    });
    // Without this, picking the same file twice fires no change event.
    if (picker.current) picker.current.value = "";
  };

  const close = () => (onClose ? onClose() : ctx.dispatch(openNew(false)));
  const [sendError, setSendError] = useState<string | null>(null);
  const ready =
    title.trim() !== "" && description.trim() !== "" && storesAnswered;

  const priorities = (
    ctx.lookups?.priorities ?? ["low", "normal", "high", "urgent"]
  ).map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }));

  // No empty row here: SelectFilter draws one from `placeholder` already.
  const categories = (ctx.lookups?.categories ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[620px] max-w-[94vw] max-h-[88vh] flex flex-col"
    >
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[17px] font-semibold">New ticket</h2>
        <p className="text-[12.5px] text-content/95 mt-1">
          {origin?.page
            ? `About ${origin.page}. Two fields are needed; the rest is filled in.`
            : "Two fields are needed. Everything else the help desk works out."}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/** What came with you from the page. */}
        {origin && (summary || kept.length > 0) && (
          <div className="rounded-lg border border-brand_line bg-bkg px-3 py-2.5">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-content/95">
              From {origin.area ? `${origin.area} · ` : ""}
              {origin.page ?? origin.href}
            </div>

            {summary && (
              <div className="mt-1 text-[12.5px] font-medium">{summary}</div>
            )}

            {kept.length > 0 && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setEvidenceOpen((v) => !v)}
                  aria-expanded={evidenceOpen}
                  className="flex w-full items-center gap-1.5 text-left text-[11.5px] text-content/95"
                >
                  <span className="flex-1">
                    Attach what this page loaded ({chosen.length} of{" "}
                    {kept.length})
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 flex-none transition-transform duration-200 motion-reduce:transition-none ${
                      evidenceOpen ? "" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Its own capped scroll, so many datasets never push the
                    description field out of reach. */}
                {evidenceOpen && (
                  <div className="mt-1.5 flex max-h-[168px] flex-col gap-1 overflow-y-auto thin-scrollbar pr-1">
                    {kept.map((group) => (
                      <Checkbox
                        key={group.key}
                        checked={!skip.has(group.key)}
                        onChange={(on) =>
                          setSkip((have) => {
                            const next = new Set(have);
                            if (on) next.delete(group.key);
                            else next.add(group.key);
                            return next;
                          })
                        }
                        label={
                          <span className="min-w-0 truncate text-[12px] text-content">
                            {group.label}
                          </span>
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Named rather than silently dropped, so a tech knows something
                    was too big to send. */}
                {dropped.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-content/95">
                    Too large to send — {dropped.map((g) => g.label).join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <TextField
          label="Title"
          value={title}
          placeholder="Printer jam at lane 3"
          onChange={setTitle}
        />

        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Priority</span>
            <SelectFilter
              plain
              options={priorities}
              value={priority}
              onChange={(value) =>
                setPriority((value || "normal") as TicketPriority)
              }
              className="w-full"
            />
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Category</span>
            <SelectFilter
              plain
              searchable
              searchPlaceholder="Find a category..."
              placeholder="None"
              options={categories}
              value={category}
              onChange={setCategory}
              className="w-full"
            />
          </label>
        </div>

        {onlyStore ? (
          <p className="m-0 text-[12.5px] text-content/95">
            About{" "}
            <span className="font-medium text-content">
              #{onlyStore.store_number} {onlyStore.store_name}
            </span>
            , your store.
          </p>
        ) : (
          <StoreChecklist
            options={listed}
            picked={picked}
            onPicked={setPicked}
            notAbout={notAbout}
            onNotAbout={setNotAbout}
            searchable={list.length > 12}
            loadError={optionsError}
            extra={
              <>
                {listed && listed.length < list.length && (
                  <button
                    type="button"
                    onClick={() => setShowAllStores(true)}
                    className="self-start text-[11.5px] font-medium text-brand_navy_hover underline underline-offset-2"
                  >
                    Showing the stores in this group. Show all {list.length} of
                    yours
                  </button>
                )}
                {accessPage && (
                  <span className="text-[11.5px] text-content/95">
                    About someone&apos;s access? Tick the store they work at, so
                    its manager sees this too.
                  </span>
                )}
              </>
            }
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">What is happening</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Receipt printer stops after about ten receipts..."
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
          <span className="text-[11px] text-content/95">
            This becomes the first message in the thread, so the tech reads it
            where the conversation is.
          </span>
        </label>

        <NewTicketAttachments
          picker={picker}
          limits={limits}
          addFiles={addFiles}
          files={files}
          setFiles={setFiles}
          fileError={fileError}
        />

        <p className="text-[11.5px] text-content/95 bg-custom-white border border-brand_line rounded-lg px-3 py-2 m-0">
          It files under your own company and lands in the queue unassigned.
        </p>
      </div>

      {/* Section: Send/Cancel Buttons, own components? */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-brand_line px-4 py-3">
        <button
          type="button"
          onClick={close}
          className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
        >
          Cancel
        </button>
        {sendError && (
          <p role="alert" className="mr-auto text-[11.5px] text-brand_danger m-0">
            {sendError}
          </p>
        )}
        <button
          type="button"
          onClick={async () => {
            setSendError(null);
            const why = await ctx.file(
              {
                title,
                /** The scope goes under what they wrote, not over it. It is the first message in the thread, so a tech reads. */
                description: origin
                  ? `${description}

—
${scopeLine(search, origin, narrowedTo)}`
                  : description,
                priority,
                category_id: category ? Number(category) : null,
                // The stores are on the ticket as data now
                storeids: notAbout ? [] : picked,
              },
              origin
                ? [
                    ...files,
                    ...chosen.map(groupAsFile),
                    // The page, the search and the dates as a record. The
                    // stores ride on the ticket; this says what was on screen.
                    new File(
                      [
                        JSON.stringify(
                          scopeOf(search, origin, narrowedTo),
                          null,
                          2,
                        ),
                      ],
                      "scope.json",
                      { type: "application/json" },
                    ),
                  ]
                : files,
              // Filed from another page: there is no pane here to open it into, so the form closes and the toast is the receipt.
              onClose,
            );
            // A user with no company is told why, and that a manager can fix it (the server's own words).
            if (why) setSendError(why);
          }}
          disabled={!ready || ctx.working}
          className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ctx.working
            ? files.length
              ? "Sending and attaching..."
              : "Sending..."
            : "Send it"}
        </button>
      </div>
    </Modal>
  );
};

export default NewTicketModal;
