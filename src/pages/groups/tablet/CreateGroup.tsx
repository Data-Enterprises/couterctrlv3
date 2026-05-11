import { useGroupCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import { setCreateInput, setRefreshGroups } from "../../../features/groupSlice";

import { createGroup } from "../../../api/groups";
import Input from "../../../components/inputs/Input";

const CreateGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, createInput } = useGroupCtx();
  const groupNames = groups.map((g) => g.group_name);

  const handleTextChange = (x: string) => {
    dispatch(setCreateInput(x));
  };

  const canSubmit = () => {
    return (
      createInput.trim() !== "" &&
      !groupNames.some(
        (g) => g.toLowerCase() === createInput.trim().toLowerCase(),
      )
    );
  };

  const handleCreate = () => {
    createGroup(url, token, userid, createInput)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div data-testid="create-usergroup-form">
      <div className="bg-custom-white rounded-xl shadow-lg text-sm p-3">
        <div className="font-medium">Existing Groups</div>
        <div className="p-3 bg-bkg rounded-lg grid grid-cols-3 gap-2 max-h-[50vh] shadow overflow-y-auto select-none">
          {groupNames.map((g, i) => (
            <div
              key={i}
              className={`${createInput.trim().toLowerCase() === g.toLowerCase() ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"} px-2 py-1 shadow-md rounded-full`}
            >
              {g}
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-[67%_1fr] gap-3 items-end mt-4">
          {groupNames.some(
            (g) => g.toLowerCase() === createInput.trim().toLowerCase(),
          ) ? (
            <div className="absolute top-0 -translate-y-[75%] pl-0.5 font-medium text-red-600 text-[12.5px]">
              User Group already exists. Please use another name
            </div>
          ) : null}
          <Input
            label="Group Name"
            value={createInput}
            setValue={handleTextChange}
          />
          <button
            data-testid="create-usergroup-btn"
            className={`bg-[rgb(30,45,80)] text-custom-white py-1.5 rounded-xl border-2 border-[rgb(30,45,80)] mt-2 w-full ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
            onClick={handleCreate}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
