import { useAppSelector } from "../../hooks";

export const useGroupCtx = () => {
  const { url, token, isDesktop } = useAppSelector((state) => state.app);
  const {userid} = useAppSelector((state) => state.user);
  const {
    groups,
    selectedGroup,
    selectedForm,
    refreshGroups,
    storesWithGroupStatus,
    createInput,
  } = useAppSelector((state) => state.group);

  return {
    groups,
    selectedGroup,
    selectedForm,
    refreshGroups,
    storesWithGroupStatus,
    url,
    token,
    userid,
    isDesktop,
    createInput,
  };
};
