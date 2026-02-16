import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  getBaseGroups,
  createBaseGroup,
  updateBaseGroup,
  deleteBaseGroup,
} from "../../../api/baseGroups";
import type { JsonError, CompanyBaseGroup } from "../../../interfaces";
import { setBaseGroupModalOpen } from "../../../features/usersSlice";

import Modal from "../../../components/Modal";
import Input from "../../../components/inputs/Input";
import {
  setBaseGroups,
  setCompany,
  setGroupName,
  setIsDeleting,
  setSelectedGroup,
} from "../../../features/baseGroupSlice";

const AssignBaseGroupModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedCompanyId, baseGroupModalOpen } = useAppSelector(
    (state) => state.users,
  );
  const state = useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    if (!state.groupName) {
      dispatch(setSelectedGroup({ id: 0, name: "", company: 0 }));
    }
  }, [state.groupName]);

  useEffect(() => {
    if (selectedCompanyId > 0) {
      getData();
    }
  }, [selectedCompanyId]);

  const getData = () => {
    dispatch(setGroupName(""));
    dispatch(setSelectedGroup({ id: 0, name: "", company: 0 }));

    getBaseGroups(url, token, selectedCompanyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBaseGroups(j.groups));
          dispatch(setCompany(j.company[0]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleClose = () => {
    dispatch(setBaseGroupModalOpen(false));
  };

  const returnCompanyName = () => {
    if (state.company) {
      return state.company.name;
    } else {
      return "";
    }
  };

  const handleGroupSelect = (g: CompanyBaseGroup) => {
    if (g.id === state.selectedGroup.id) {
      dispatch(setGroupName(""));
      dispatch(setSelectedGroup({ id: 0, name: "", company: 0 }));
    } else {
      dispatch(setGroupName(g.name));
      dispatch(setSelectedGroup(g));
    }
  };

  const handleTextChange = (x: string) => {
    dispatch(setGroupName(x));
  };

  const handleDeleteBG = () => {
    deleteBaseGroup(url, token, state.selectedGroup.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Group Deleted");
          const filtered = state.baseGroups.filter(
            (g) => g.id !== state.selectedGroup.id,
          );
          dispatch(setBaseGroups(filtered));
          dispatch(setGroupName(""));
          dispatch(setSelectedGroup({ id: 0, name: "", company: 0 }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsDeleting(false)));
  };

  const createOrUpdateBG = () => {
    if (!state.selectedGroup.id && state.company) {
      const data: CompanyBaseGroup = {
        id: 0,
        name: state.groupName,
        company: state.company.id,
      };
      createBaseGroup(url, token, data)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            getData();
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      updateBaseGroup(url, token, state.selectedGroup)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const mapped = [...state.baseGroups].map((g) => {
              if (g.id === state.selectedGroup.id) {
                return {
                  ...g,
                  name: state.groupName,
                };
              }
              return g;
            });
            dispatch(setBaseGroups(mapped));
            dispatch(setGroupName(""));
            dispatch(setSelectedGroup({ id: 0, name: "", company: 0 }));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  return (
    <Modal
      isOpen={baseGroupModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white"
    >
      <div className="text-sm font-medium pl-0.5 flex justify-between">
        <div>Company: {returnCompanyName()}</div>
        <div>{state.baseGroups.length} Groups</div>
      </div>
      <div className="flex gap-2 items-end">
        <Input
          label="Group"
          value={state.groupName}
          setValue={handleTextChange}
          width="w-1/2"
        />
        <button
          className="btn-themeGreen py-1.5 w-1/4"
          onClick={createOrUpdateBG}
        >
          {state.selectedGroup.id === 0 ? "Create" : "Update"}
        </button>
        <button
          className={`btn-themeOrange py-1.5 w-1/4 ${state.selectedGroup.id === 0 && "opacity-50 pointer-events-none"}`}
          onClick={() => dispatch(setIsDeleting(true))}
        >
          Delete
        </button>
      </div>
      {state.isDeleting ? (
        <div className="my-2">
          <div className="text-sm font-medium text-center">
            Are you sure you want to delete this group?
          </div>
          <div className="flex justify-center gap-4">
            <button className="btn-themeOrange py-1" onClick={handleDeleteBG}>
              Delete
            </button>
            <button
              className="btn-themeBlue py-1"
              onClick={() => dispatch(setIsDeleting(false))}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-3 py-4 gap-2 min-h-[145px] max-h-[145px] min-w-[496px] overflow-y-scroll no-scrollbar">
        {state.baseGroups.map((g, i) => (
          <div
            key={i}
            className={`${state.selectedGroup.id === g.id ? "bg-orange-200" : "bg-custom-white"} rounded-lg text-sm font-medium shadow-lg px-1 py-1.5 hover:cursor-pointer hover:bg-blue-200 transition-all duration-200`}
            onClick={() => handleGroupSelect(g)}
          >
            <div>{g.name}</div>
          </div>
        ))}
      </div>
      <button
        className="btn-themeOrange py-1 w-1/2 translate-x-1/2"
        onClick={() => dispatch(setBaseGroupModalOpen(false))}
      >
        Close
      </button>
    </Modal>
  );
};

export default AssignBaseGroupModal;
