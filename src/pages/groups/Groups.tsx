import { useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getGroups } from "../../api/groups";
import { useAppSelector, useAppDispatch } from "../../hooks";
import type { JsonError } from "../../interfaces";
import {
  setGroups,
  setRefreshGroups,
  type Group,
} from "../../features/groupSlice";

// Components
import CreateGroup from "./CreateGroup";
import SelectGroup from "./SelectGroup";
import GroupList from "./GroupList";

const Groups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const group = useAppSelector((state) => state.group);

  useEffect(() => {
    if (!context.token) return;
    if (group.refreshGroups) getData();
  }, [context.token, group.refreshGroups]);

  const getData = () => {
    getGroups(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter(
            (g: Group) => g.userid === user.userid
          );
          dispatch(setGroups(groups));
          dispatch(setRefreshGroups(false));
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  };
  return (
    <div
      className="w-full h-[calc(100vh-3rem)] py-4 px-16 grid grid-cols-[40%_1fr] gap-4"
      data-testid="groups-page"
    >
      <div>
        <CreateGroup />
        <SelectGroup />
      </div>
      <GroupList />
    </div>
  );
};

export default Groups;
