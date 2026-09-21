import { useAppSelector } from "../../hooks";

export const useStorePickerContext = () => {
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const { type, lastGroup, selectedStore, lastStore, selectedGroup } = useAppSelector(
    (state) => state.search
  );
  const { userid, assignedStores } = useAppSelector((state) => state.user);
  const { lastRoute } = useAppSelector((state) => state.nav);
  const { groups } = useAppSelector((state) => state.group);

  return {
    url,
    token,
    isMobile,
    type,
    lastGroup,
    userid,
    assignedStores,
    lastRoute,
    groups,
    selectedStore,
    lastStore,
    selectedGroup,
  };
};
