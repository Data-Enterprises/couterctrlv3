import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setAssignModalOpen,
  setBaseGroupModalOpen,
  setAssignBaseGroups,
  setDeleteModalOpen,
  setSelectedCompanyId,
} from "../../features/usersSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
// import type { FilterOption } from "../../features/groupSlice";
import type { BaseGroup, JsonError, UserCompany } from "../../interfaces";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  resetUserSecurityQuestion,
} from "../../api/team";
import { handleRipple } from "../../utils";
import { setTempPassword } from "../../api/security";
import SingleSelect from "../../components/SingleSelect";
import { useEffect, useState } from "react";

const BaseGroups = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { selectedUserId, baseGroups, userInfo, selectedCompanyId, users } =
    useAppSelector((state) => state.users);
  const { companies } = useAppSelector((state) => state.user);
  const [filteredBaseGroups, setFilteredBaseGroups] = useState<BaseGroup[]>([]);

  useEffect(() => {
    if (!baseGroups.length) return;

    if (selectedCompanyId === 0) {
      setFilteredBaseGroups(baseGroups);
    } else {
      const filtered = [...baseGroups].filter(
        (bg) => bg.company === selectedCompanyId,
      );
      setFilteredBaseGroups(filtered);
    }
  }, [selectedCompanyId, baseGroups]);

  const selectedUserCompanies = () => {
    const allOption: UserCompany = {
      id: 0,
      company: 0,
      name: "All",
      userid: selectedUserId,
      username: "",
    };
    const found = users.find((u) => u.id === selectedUserId);
    if (found) {
      return [allOption, ...found.companies];
    }
    return [];
  };

  const handlePanelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    group: BaseGroup,
  ) => {
    handleRipple(e);
    const copy: BaseGroup[] = [...baseGroups].map((g) => {
      if (g.id === group.id) {
        return { ...g, active: g.active === 1 ? 0 : 1 };
      } else {
        return g;
      }
    });

    // remove the group
    if (group.active === 1) {
      deleteUserBaseGroupLink(
        context.url,
        context.token,
        selectedUserId,
        group.id,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setAssignBaseGroups(copy));
          }
        })
        .catch((err) => {
          toast.error("Error removing group " + err.message);
        });

      // assign the group
    } else {
      assignBaseGroupToUser(
        context.url,
        context.token,
        selectedUserId,
        group.id,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setAssignBaseGroups(copy));
          }
        })
        .catch((err) => {
          toast.error("Error assigning group " + err.message);
        });
    }
  };

  const canSelect = () => {
    return baseGroups.length > 0 && selectedUserId > 0;
  };

  // const renderGroupAmount = (arg: FilterOption) => {
  //   if (!canSelect()) return "";
  //   if (arg === "active")
  //     return filteredBaseGroups.filter((group) => group.active).length;
  //   if (arg === "inactive")
  //     return filteredBaseGroups.filter((group) => !group.active).length;
  // };

  const isInteractive = () => {
    return canSelect() ? "" : "opacity-50 pointer-events-none";
  };

  const openDeleteUserModal = () => {
    dispatch(setDeleteModalOpen(true));
  };

  const openAssignStoreModal = () => {
    dispatch(setAssignModalOpen(true));
  };

  const resetPassword = () => {
    if (userInfo.password !== userInfo.confirm_password) {
      toast.warn("Passwords do not match");
      return;
    }
    setTempPassword(
      context.url,
      context.token,
      userInfo.username,
      userInfo.password,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error resetting password: " + err.message);
      });
  };

  const resetSecurity = () => {
    resetUserSecurityQuestion(context.url, context.token, selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error resetting security question: " + err.message);
      });
  };

  const handleCompanySelect = (companyId: string | number) => {
    dispatch(setSelectedCompanyId(companyId as number));
  };

  const handleBaseGroupModalOpen = () => {
    dispatch(setBaseGroupModalOpen(true));
  };

  const toggleActiveGroups = (type: "active" | "inactive") => {
    const flag = type === "active" ? 1 : 0;
    const allCheck = filteredBaseGroups.every((bg) => bg.active === flag);

    if (allCheck) {
      // reset
      setFilteredBaseGroups(baseGroups);
    } else {
      // filter by the type (active, or inactive)
      const filtered = baseGroups.filter((bg) => {
        if (selectedCompanyId) {
          return bg.active === flag && bg.company === selectedCompanyId;
        }
        return bg.active === flag;
      });
      setFilteredBaseGroups(filtered);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`grid grid-cols-4 gap-4 place-items-end mb-2 ${!selectedUserId ? "opacity-50 pointer-events-none" : ""}`}
      >
        <SingleSelect
          label="Company"
          data={selectedUserCompanies()}
          displayKey="name"
          valueKey="company"
          className={`${companies.length < 2 && "hidden"}`}
          innerClass="py-1"
          defaultQuery="All"
          defaultValue={0}
          onSelect={handleCompanySelect}
        />
        <button
          className={`btn-themeBlue px-0 w-full py-1 ${!selectedCompanyId && "opacity-50 pointer-events-none"}`}
          onClick={handleBaseGroupModalOpen}
        >
          Edit Groups
        </button>
        <button
          className={`btn-themeGreen py-1 px-0 w-full`}
          onClick={() => toggleActiveGroups("active")}
        >
          {/* {renderGroupAmount("active")} Active */}
          Active
        </button>
        <button
          className={` btn-themeOrange py-1 px-0 w-full`}
          onClick={() => toggleActiveGroups("inactive")}
        >
          {/* {renderGroupAmount("inactive")} Inactive */}
          Inactive
        </button>
      </div>
      <div className="w-full min-h-[87.5%] max-h-[87.5%] rounded-lg px-4 border-2 border-content/10 relative">
        <div
          data-testid="base-groups-panels"
          className="absolute w-full pr-8 top-4 max-h-[77%] overflow-hidden grid grid-cols-3 
            text gap-2 overflow-y-scroll no-scrollbar rounded-lg text-sm"
        >
          {canSelect()
            ? filteredBaseGroups.map((group, i) => (
                <div
                  key={i}
                  data-testid={`base-group-panel-${group.id}`}
                  className="flex justify-between items-center bg-custom-white rounded-lg shadow-md hover:shadow-inner 
                     transition-all duration-200 cursor-pointer ripple-button"
                  onClick={(e) => handlePanelClick(e, group)}
                >
                  <div className="p-2">
                    <div className="font-medium underline">
                      {group.company_name}
                    </div>
                    <div>{group.name}</div>
                  </div>
                  <div
                    className={`status ${
                      group.active ? "text-emerald-500" : "text-orange-500"
                    } font-medium p-2`}
                  >
                    {group.active ? "Active" : "Inactive"}
                  </div>
                </div>
              ))
            : null}
        </div>
        <div className="grid grid-cols-4 gap-4 absolute w-full pr-8 bottom-4">
          <button
            data-testid="team-assign-stores-btn"
            className={`btn-themeBlue px-0 py-1.5 ${isInteractive()}`}
            onClick={openAssignStoreModal}
          >
            Assign Stores
          </button>
          <button
            data-testid="team-reset-security-btn"
            className={`btn-themeGreen px-0 py-1.5 ${isInteractive()}`}
            onClick={resetSecurity}
          >
            Reset Security
          </button>
          <button
            data-testid="team-reset-pw-btn"
            className={`btn-themeGreen px-0 py-1.5 ${isInteractive()}`}
            onClick={resetPassword}
          >
            Reset Password
          </button>
          <button
            data-testid="team-delete-user-btn"
            className={`btn-themeOrange px-0 py-1.5 ${isInteractive()}`}
            onClick={openDeleteUserModal}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaseGroups;
