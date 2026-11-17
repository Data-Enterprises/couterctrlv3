// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useDevApi } from "../../../../../../hooks/useDevApi";
import { useTicketsCtx } from "../../../hooks";
import { useTicketScope } from ".";

// Redux
import { openNew } from "../../../../../../features/dev/devTicketsSlice";

// API
import { getStoresAssignedToUserGroup } from "../../../../../../api/groups";
import {
  getTicketStoreOptions,
  ticketFailed,
  type TicketPriority,
  type TicketStoreOption,
} from "../../../../../../api/tickets";

// Utils
import {
  consolidate,
  getPageCalls,
  withinBudget,
  type CallGroup,
} from "../../../../../../utils/pageCalls";
import { attachmentProblem } from "../../../utils/ticketsUtils";
import {
  assignedAsOptions,
  cleanStoreOptions,
  initialStorePicks,
  optionsForGroup,
} from "../../../utils";
import {
  originOf,
  pageUsesSearch,
  searchSummary,
  suggestedTitle,
} from "../utils/ticketOrigin";
import { searchForPage } from "../utils";

interface NewTicketFormInput {
  /** Where the reporter was when they raised it. Absent when the form is
   *  opened from the help desk itself, which is nowhere in particular. */
  from?: { from: string; page?: string; area?: string } | null;
  /** Filing from another page closes back to that page rather than to the
   *  queue, so the caller says what closing means. */
  onClose?: () => void;
}

/**
 * The new ticket form: what came from the page (the search and the evidence
 * to attach), the stores it is about, the title, description, priority,
 * category and files, and the send.
 */
export const useNewTicketForm = ({ from, onClose }: NewTicketFormInput) => {
  const ctx = useTicketsCtx();
  const { url, token } = useDevApi();

  const origin = from?.from
    ? originOf({ reportFrom: from.from, page: from.page, area: from.area })
    : null;
  // A page with its own store picker is about its own store, not the last one
  // searched on Sales; everything below reads `search`.
  const { shared, assignedStores, own } = useTicketScope(
    origin ? origin.href : null,
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

  return {
    ctx,
    origin,
    search,
    summary,
    list,
    optionsError,
    listed,
    narrowedTo,
    onlyStore,
    accessPage,
    chosen,
    picker,
    limits,
    addFiles,
    close,
    ready,
    priorities,
    categories,
    skip,
    setSkip,
    picked,
    setPicked,
    notAbout,
    setNotAbout,
    setShowAllStores,
    evidenceOpen,
    setEvidenceOpen,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    category,
    setCategory,
    files,
    setFiles,
    fileError,
    sendError,
    setSendError,
    kept,
    dropped,
  };
};
