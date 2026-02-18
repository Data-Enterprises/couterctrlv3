import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { createUser, updateUser } from "../../../api/team";
import {
  resetUserInfo,
  setAssignModalOpen,
  setRefresh,
  setNextFormIdx,
  type UserFormType,
} from "../../../features/usersSlice";

interface UserFormButtonsProps {
  formType: UserFormType;
}

const UserFormButtons = ({ formType }: UserFormButtonsProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, users, userFormIdx } = useAppSelector(
    (state) => state.users,
  );

  const handleCreateClick = () => {
    createUser(url, token, userInfo)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User created successfully");
          dispatch(resetUserInfo());
          dispatch(setRefresh(true));
        }
      })
      .catch((err) => {
        toast.error("Error creating user " + err.message);
      });
  };

  const handleUpdateClick = async () => {
    const found = users.find((u) => u.username === userInfo.username);
    if (!found) return;
    // const resp = await updateUser(url, token, userInfo, found.security  || 0,found.template || 0);
    updateUser(url, token, userInfo, found.security || 0, found.template || 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User updated successfully");
          dispatch(resetUserInfo());
          dispatch(setRefresh(true));
        }
      })
      .catch((err) => {
        toast.error("Error updating user " + err.message);
      });
  };

  const handleCreateOrUpdate = () => {
    if (formType === "create") {
      handleCreateClick();
    } else {
      handleUpdateClick();
    }
  };

  const handleStoresModal = () => {
    dispatch(setAssignModalOpen(true));
  };

  const handleReset = () => {
    dispatch(resetUserInfo());
  };

  const goToNext = () => {
    dispatch(setNextFormIdx());
  };

  if (userFormIdx === 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {/* <button className="btn-themeBlue px-0" onClick={handleCreateOrUpdate}>
          Submit
        </button>
        <button className="btn-themeBlue px-0" onClick={handleStoresModal}>
          Stores
        </button> */}
        <button className="btn-themeBlue px-0" onClick={goToNext}>Next</button>
        <button className="btn-themeBlue px-0" onClick={handleReset}>
          Clear Fields
        </button>
      </div>
    );
  }
};

export default UserFormButtons;
