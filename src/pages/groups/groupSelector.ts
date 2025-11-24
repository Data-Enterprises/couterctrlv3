import { useAppSelector } from "../../hooks";

export const useGroupSelector = () => {
  const { groups, refreshGroups, createInput } = useAppSelector(
    (state) => state.group
  );
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);

  return { groups, refreshGroups, createInput, url, userid, token };
};
