import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setAssignBaseGroups,
  setSelectedCompanyId,
} from "../../../features/usersSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { BaseGroup, JsonError, UserCompany } from "../../../interfaces";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
} from "../../../api/team";
import { handleRipple } from "../../../utils";
import SingleSelect from "../../../components/SingleSelect";
import { useEffect, useState } from "react";

const BaseGroupAssign = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { selectedUserId, baseGroups, selectedCompanyId, users } =
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
        .catch((err: JsonError) => {
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
        .catch((err: JsonError) => {
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

  // const resetPassword = () => {
  //   if (userInfo.password !== userInfo.confirm_password) {
  //     toast.warn("Passwords do not match");
  //     return;
  //   }
  //   setTempPassword(
  //     context.url,
  //     context.token,
  //     userInfo.username,
  //     userInfo.password,
  //   )
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         toast.success(j.msg);
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       toast.error("Error resetting password: " + err.message);
  //     });
  // };

  // const resetSecurity = () => {
  //   resetUserSecurityQuestion(context.url, context.token, selectedUserId)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         toast.success(j.msg);
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       toast.error("Error resetting security question: " + err.message);
  //     });
  // };

  const handleCompanySelect = (companyId: string | number) => {
    dispatch(setSelectedCompanyId(companyId as number));
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
    <div className="select-none min-h-[300px] max-h-[300px]">
      <div
        className={`grid grid-cols-4 gap-4 place-items-end mb-2 ${!selectedUserId ? "opacity-50 pointer-events-none" : ""}`}
      >
        <SingleSelect
          label="Company"
          data={selectedUserCompanies()}
          displayKey="name"
          valueKey="company"
          className={`${companies.length < 2 && "hidden"} col-span-2 w-full`}
          innerClass="py-1"
          defaultQuery="All"
          defaultValue={0}
          onSelect={handleCompanySelect}
        />
        <button
          className={`btn-themeGreen py-1 px-0 w-full`}
          onClick={() => toggleActiveGroups("active")}
        >
          Active
        </button>
        <button
          className={` btn-themeOrange py-1 px-0 w-full`}
          onClick={() => toggleActiveGroups("inactive")}
        >
          Inactive
        </button>
      </div>
      <div className="w-full rounded-lg border-2 border-content/10">
        <div
          data-testid="base-groups-panels"
          className="w-full max-h-[240px] p-2 overflow-hidden grid grid-cols-3 
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
      </div>
    </div>
  );
};

export default BaseGroupAssign;
