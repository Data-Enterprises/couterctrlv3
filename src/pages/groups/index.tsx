import { useAppSelector, useAppDispatch } from "../../hooks";

export const useGroupCtx = () => {
  const dispatch = useAppDispatch();
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
    dispatch,
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
