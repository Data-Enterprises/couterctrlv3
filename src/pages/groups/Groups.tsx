import { useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getGroups } from "../../api/groups";
import { useAppSelector } from "../../hooks";
import type { Group, JsonError } from "../../interfaces";

// Components
import CreateGroup from "./CreateGroup";
import SelectGroup from "./SelectGroup";
import GroupList from "./GroupList";

const Groups = () => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!context.token) return;
    getData();
  }, []);

  const getData = () => {
    getGroups(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter(
            (g: Group) => g.userid === user.userid
          );
          console.log(groups);
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
      className="w-full h-[calc(100vh-3rem)] p-4 grid grid-cols-[40%_1fr] gap-4"
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
