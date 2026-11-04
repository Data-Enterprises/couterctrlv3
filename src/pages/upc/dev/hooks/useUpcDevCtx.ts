import { useAppSelector } from "../../../../hooks";

export const useUpcDevCtx = () => {
  const { url, token, apiEnv } = useAppSelector((s) => s.app);
  const { userid, assignedStores } = useAppSelector((s) => s.user);
  const live = useAppSelector((s) => s.search);
  const groups = useAppSelector((s) => s.group.groups);
  const dev = useAppSelector((s) => s.dev.upcDev);
  // The search the loaded data answers, not the one being edited: the search
  // card writes the app-wide dates, store and group as they're picked, and a
  // tab that read those would fetch new dates for the old store list. Before
  // the first search there is nothing saved, and the live search is the one
  // about to run.
  const searched = dev.searchedScope;
  const startDate = searched?.startDate ?? live.startDate;
  const endDate = searched?.endDate ?? live.endDate;
  const selectedStore = searched?.selectedStore ?? live.selectedStore;
  const selectedGroup = searched?.selectedGroup ?? live.selectedGroup;
  const searchType = searched?.type ?? live.type;

  return {
    url,
    token,
    apiEnv,
    /** The endpoint corrections (Trend direction/window/impact, Price Opt by
     *  weight, failed calls not recorded as empty). On in the dev tree, off in
     *  prod until this tree is promoted. Replaces upcFixes.ts, which keyed this
     *  off apiEnv while both environments shared one tree. */
    fixes: true,
    userid,
    assignedStores,
    startDate,
    endDate,
    selectedStore,
    selectedGroup,
    searchType,
    groups,
    ...dev,
  };
};
