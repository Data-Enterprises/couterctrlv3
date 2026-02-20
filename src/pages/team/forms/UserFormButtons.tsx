import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  assignBaseGroupToUser,
  createUser,
  deleteUserBaseGroupLink,
  updateUser,
} from "../../../api/team";
import {
  resetUserInfo,
  setIsDeletingUser,
  setRefresh,
  setSelectedUserId,
  setSelectedUserStores,
  type UserFormType,
} from "../../../features/usersSlice";
import { assignUserToCompany, getUserStores } from "../../../api/user";
import type { JsonError, Store } from "../../../interfaces";

interface UserFormButtonsProps {
  formType: UserFormType;
}

const UserFormButtons = ({ formType }: UserFormButtonsProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, users, userCompanyIds, selectedUserId } = useAppSelector(
    (state) => state.users,
  );
  const base = useAppSelector((state) => state.baseGroup);

  const filterNulls = (arr: Store[]) => {
    return arr.filter((store) => store.store_name !== null);
  };

  const handleCreateClick = () => {
    createUser(url, token, userInfo)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const userid = j.new_userid;
          dispatch(setSelectedUserId(userid));
          assignUserToCompany(url, token, userid, userCompanyIds)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const groupid = [...base.selectedBaseGroups].map((bg) => bg.id);
                assignBaseGroupToUser(url, token, userid, groupid)
                  .then((resp) => {
                    const j = resp.data;
                    if (j.error === 0) {
                      getStores(userid);
                    }
                  })
                  .catch((err: JsonError) => toast.error(err.message));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error creating user " + err.message);
      });
  };

  const handleUpdateClick = async () => {
    const found = users.find((u) => u.id === selectedUserId);
    if (!found) return;
    updateUser(url, token, userInfo, found.security || 0, found.template || 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          assignUserToCompany(url, token, selectedUserId, userCompanyIds)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                if (base.bgsToAssign.length) {
                  assignBaseGroupToUser(
                    url,
                    token,
                    selectedUserId,
                    base.bgsToAssign,
                  )
                    .then((resp) => {
                      const j = resp.data;
                      if (j.error === 0) {
                        if (base.bgsToUnassign.length) {
                          unassignBG(base.bgsToUnassign);
                        } else {
                          getStores(selectedUserId);
                        }
                      }
                    })
                    .catch((err: JsonError) => toast.error(err.message));
                } else if (base.bgsToUnassign.length) {
                  unassignBG(base.bgsToUnassign);
                } else {
                  getStores(selectedUserId);
                }
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err) => {
        toast.error("Error updating user " + err.message);
      });
  };

  const unassignBG = (bgs: number[]) => {
    deleteUserBaseGroupLink(url, token, selectedUserId, bgs).then((resp) => {
      const j = resp.data;
      if (j.error === 0) {
        getStores(selectedUserId);
      }
    });
  };

  const getStores = (userid: number) => {
    getUserStores(url, token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores),
            unassigned: filterNulls(j.unassigned_stores),
          };
          dispatch(setSelectedUserStores(stores));
          dispatch(setRefresh(true));
          toast.success(
            "User updated, you can add or remove stores for the user",
          );
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
  };

  const handleCreateOrUpdate = () => {
    if (formType === "create") {
      handleCreateClick();
    } else {
      handleUpdateClick();
    }
  };

  const handleReset = () => {
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
    dispatch(resetUserInfo());
  };

  const isFormReady = () => {
    if (
      userInfo.password !== userInfo.confirm_password ||
      !userInfo.password.length ||
      !userInfo.confirm_password.length ||
      !userInfo.first_name.length ||
      !userInfo.last_name.length ||
      !userInfo.username.length ||
      !userInfo.email.length ||
      !userInfo.role ||
      !userInfo.user_level
    ) {
      return false;
    }

    return true;
  };

  const gridLayout = formType === "delete" ? "" : "grid-cols-2";

  const handleDeleteFlag = () => {
    dispatch(setIsDeletingUser(true));
  };

  return (
    <div className={`grid ${gridLayout} gap-2`}>
      {formType !== "delete" && (
        <button className="btn-themeBlue px-0" onClick={handleReset}>
          Clear Fields
        </button>
      )}
      {formType === "create" ? (
        <button
          className={`btn-themeBlue px-0 ${selectedUserId > 0 || !isFormReady() ? "opacity-50 pointer-events-none" : ""}`}
          onClick={handleCreateOrUpdate}
        >
          Create
        </button>
      ) : formType === "update" ? (
        <button
          className={`btn-themeBlue px-0 ${selectedUserId == 0 ? "opacity-50 pointer-events-none" : ""}`}
          onClick={handleCreateOrUpdate}
        >
          Update
        </button>
      ) : (
        <button
          className={`btn-themeOrange px-0 ${selectedUserId == 0 ? "opacity-50 pointer-events-none" : ""}`}
          onClick={handleDeleteFlag}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default UserFormButtons;
