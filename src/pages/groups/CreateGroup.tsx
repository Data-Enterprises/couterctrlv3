import { useState } from "react";
import { useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useGroupSelector } from "./groupSelector";
import type { JsonError } from "../../interfaces";
import { createGroup, deleteGroup } from "../../api/groups";
import { setCreateInput, setRefreshGroups } from "../../features/groupSlice";
import Modal from "../../components/Modal";

const CreateGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useGroupSelector();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const openModal = () => {
    if (!context.createInput) {
      toast.warn("Please enter a group name to delete");
      return;
    }

    const found = context.groups.find(
      (g) => g.group_name === context.createInput
    );
    if (!found) {
      toast.warn("User group does not exist");
      return;
    }

    // Otherwise we have a selected group that exists, then ask them if they actually want to delete
    setIsModalOpen(true);
  };

  const groupId = () => {
    return context.groups.find((g) => g.group_name === context.createInput)?.id;
  };

  // Once all the checks have passed and the user actually want to delete the group
  const handleDelete = () => {
    if (!context.token || !context.url) return;
    const id = groupId();
    if (!id) return;

    deleteGroup(context.url, context.token, id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setCreateInput(""));
          dispatch(setRefreshGroups(true));
          toast.success("Group deleted successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex gap-4 mb-4 items-end" data-testid="create-group">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center">
          Are you sure you want to delete this group?
          <div className="font-medium mt-2">
            {groupId()} -{context.createInput}
          </div>
        </div>
        <div className="w-full flex gap-4 mt-4">
          <button
            className="btn-themeOrange w-full"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </button>
          <button data-testid="modal-confirm-btn" className="btn-themeGreen w-full" onClick={handleDelete}>
            Confirm
          </button>
        </div>
      </Modal>
      <div className="w-1/2">
        <label className="block text-sm mb-0.5 ml-0.5 font-medium">
          Create Group
        </label>
        <input
          data-testid="create-group-input"
          type="text"
          className="basic-input focus:border bg-custom-white w-full"
          placeholder="Group Name"
          value={context.createInput}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-end gap-4 w-1/2">
        <button data-testid="group-delete-btn" className="btn-themeOrange w-1/2" onClick={openModal}>
          Delete
        </button>
        <button className="btn-themeBlue w-1/2" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
