import { useAppDispatch, useAppSelector } from "../../../hooks";
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

const UpdateUserGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, createInput } =
    useGroupCtx();
    const { isDesktop } = useAppSelector((state) => state.app);

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

  
  const containerStyle = isDesktop
    ? "bg-custom-white p-2 rounded-md shadow-md text-sm"
    : "bg-custom-white p-4 rounded-md shadow-md w-full text-sm";

  return (
    <div className={containerStyle}>
      <div className="font-medium text-sm">
        <div>Select group to update</div>
      </div>
      <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-52 overflow-y-auto select-none text-[13px]">
        {groups.map((g, i) => (
          <div
            key={g.id}
            data-testid={`update-group-option-${i}`}
            className={`${selectedGroup.id === g.id ? "bg-orange-200" : ""} px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-blue-200`}
            onClick={() => handleSelect(g)}
          >
            {g.group_name}
          </div>
        ))}
      </div>
      <div>
        <Input
          label="Group Name"
          value={createInput}
          className="py-1 text-[14px]"
          setValue={setText}
        />
        <button
          data-testid="create-usergroup-btn"
          className={`btn-themeBlue mt-2 w-full bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 text-[13px] ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
          onClick={handleUpdate}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default UpdateUserGroup;
