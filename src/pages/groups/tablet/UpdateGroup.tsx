import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCreateInput,
  setRefreshGroups,
  setSelectedGroup,
  type Group,
} from "../../../features/groupSlice";
import Input from "../../../components/inputs/Input";
import type { JsonError } from "../../../interfaces";
import { updateGroup } from "../../../api/groups";
import { useGroupCtx } from "..";

const UpdateGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, createInput } =
    useGroupCtx();

  const groupNames = groups.map((g) => g.group_name);

  const handleSelect = (g: Group) => {
    dispatch(setSelectedGroup(g));
    dispatch(setCreateInput(g.group_name));
  };

  const handleUpdate = () => {
    updateGroup(url, token, userid, selectedGroup.id, createInput)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setSelectedGroup({ id: 0, group_name: "", userid: 0 }));
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group updated successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const canSubmit = () => {
    return (
      createInput.trim() !== "" &&
      selectedGroup.id > 0 &&
      !groupNames.some(
        (g) => g.toLowerCase() === createInput.trim().toLowerCase(),
      )
    );
  };

  const setText = (x: string) => {
    dispatch(setCreateInput(x));
  };

  return (
    <div>
      <div className="bg-custom-white p-3 rounded-xl shadow-md w-full">
        <div className="font-medium text-sm">
          <div>Select group to update</div>
        </div>
        <div className="text-sm p-3 bg-bkg rounded-lg grid grid-cols-3 gap-2 max-h-[50vh] shadow overflow-y-auto select-none">
          {groups.map((g, i) => (
            <div
              key={g.id}
              data-testid={`update-group-option-${i}`}
              className={`${selectedGroup.id === g.id ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"} rounded-full px-2 py-1 shadow-md border-b transition-all duration-200 cursor-pointer hover:bg-blue-200`}
              onClick={() => handleSelect(g)}
            >
              {g.group_name}
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-[67%_1fr] gap-3 items-end mt-4">
          <Input
            label="Group Name"
            value={createInput}
            setValue={setText}
            className="py-1.5"
          />
          <button
            data-testid="create-usergroup-btn"
            className={`bg-[rgb(30,45,80)] text-custom-white py-1.5 rounded-xl border-2 border-[rgb(30,45,80)] mt-2 w-full ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
            onClick={handleUpdate}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateGroup;
