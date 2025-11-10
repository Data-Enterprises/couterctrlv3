import { setCreateInput, setRefreshGroups } from "../../features/groupSlice";
import { useAppDispatch } from "../../hooks";
import { useGroupSelector } from "./groupSelector";
import { createGroup } from "../../api/groups";
import type { JsonError } from "../../interfaces";
import { useToast } from "../../components/toasts/hooks/useToast";

const CreateGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useGroupSelector();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCreateInput(e.currentTarget.value));
  };

  const handleCreate = () => {
    if (!context.token || !context.url) return;
    if (!context.createInput) {
      toast.warn("Please enter a group name");
      return;
    }
    createGroup(context.url, context.token, context.userid, context.createInput)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          console.log(j);
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex gap-4 mb-4 items-end" data-testid="create-group">
      <div className="w-1/2">
        <label className="block text-sm mb-0.5 ml-0.5 font-medium">
          Create Group
        </label>
        <input
          type="text"
          className="basic-input focus:border bg-custom-white w-full"
          placeholder="Group Name"
          value={context.createInput}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-end gap-4 w-1/2">
        <button className="btn-themeOrange w-1/2">Delete</button>
        <button className="btn-themeBlue w-1/2" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
