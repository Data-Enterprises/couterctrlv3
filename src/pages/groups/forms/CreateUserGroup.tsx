import { useGroupCtx } from "..";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import { setCreateInput, setRefreshGroups } from "../../../features/groupSlice";

import { createGroup } from "../../../api/groups";
import Input from "../../../components/inputs/Input";

const CreateUserGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, createInput } = useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

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

  const containerStyle = isDesktop
    ? "bg-custom-white p-4 rounded-md shadow-md w-[30%]"
    : "bg-custom-white p-4 rounded-md shadow-md w-full";

  return (
    <div data-testid="create-usergroup-form" className={containerStyle}>
      <div className="bg-custom-white text-sm">
        <div className="font-medium">Existing Groups</div>
        <div className="p-2 bg-bkg/80 rounded-lg grid grid-cols-2 max-h-36 overflow-y-auto select-none">
          {groupNames.map((g, i) => (
            <div
              key={i}
              className={`${createInput.trim().toLowerCase() === g.toLowerCase() ? "bg-orange-200" : ""} px-2 py-0.5 rounded-full`}
            >
              {g}
            </div>
          ))}
        </div>
      </div>
      {groupNames.some(
        (g) => g.toLowerCase() === createInput.trim().toLowerCase(),
      ) ? (
        <div className="font-medium text-orange-500 text-sm text-center my-2">
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
        className={`btn-themeBlue mt-2 w-full ${canSubmit() ? "" : "opacity-50 pointer-events-none"}`}
        onClick={handleCreate}
      >
        Submit
      </button>
    </div>
  );
};

export default CreateUserGroup;
