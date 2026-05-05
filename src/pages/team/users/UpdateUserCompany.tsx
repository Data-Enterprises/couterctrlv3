import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
// import { getBaseGroups } from "../../../api/baseGroups";
// import {
//   setActiveBaseGroups,
//   setBaseGroups,
//   setCompany,
//   setInactiveBaseGroups,
// } from "../../../features/baseGroupSlice";
import type { JsonError, UserCompany } from "../../../interfaces";
// import { getBaseGroupsAssignedToUser } from "../../../api/team";
import { useState } from "react";
import { assignUserToCompany } from "../../../api/user";
import { setRefresh, setUserCompanyIds } from "../../../features/usersSlice";

const UpdateCompanyBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.user);
  const { url, token } = useAppSelector((state) => state.app);
  const { userCompanyIds, selectedUserId } = useAppSelector(
    (state) => state.users,
  );
  // const { company } = useAppSelector((state) => state.baseGroup);

  const [companiesToAssign, setCompaniesToAssign] = useState<number[]>([]);
  const [companiesToUnassign, setCompaniesToUnassign] = useState<number[]>([]);

  // const handleCompanySelect = (x: number) => {
  //   // Getting the active/inactive base groups for the user based on the selected company
  //   getBaseGroupsAssignedToUser(url, token, selectedUserId)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         dispatch(setActiveBaseGroups(j.active));
  //         dispatch(setInactiveBaseGroups(j.inactive));
  //       }
  //     })
  //     .catch((err: JsonError) => toast.error(err.message));

  //   getBaseGroups(url, token, x)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         dispatch(setBaseGroups(j.groups));
  //         dispatch(setCompany(j.company[0]));
  //       }
  //     })
  //     .catch((err: JsonError) => toast.error(err.message));
  // };

  const companyBG = (id: number, type: 'active' | 'inactive') => {
    if (type === 'active' && companiesToUnassign.includes(id)) {
      return "bg-red-200 text-content";
    }

    if (type === 'inactive' && companiesToAssign.includes(id)) {
      return "bg-[rgb(30,45,80)]/75 text-custom-white";
    }
    // if (userCompanyIds.includes(id)) {
    //   return "bg-[rgb(30,45,80)]/50 text-custom-white";
    // }
    return "text-content/85 bg-content/10";
  };

  const handleCompanyToAssign = (id: number) => {
    setCompaniesToAssign((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      return [...prev, id];
    });
  };

  const handleCompanyToUnassign = (id: number) => {
    setCompaniesToUnassign((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      return [...prev, id];
    });
  };

  // const handleBGSelect = (bg: CompanyBaseGroup) => {
  //   const filtered = [...baseGroups].filter((g) => g.id === bg.id);
  //   dispatch(setSelectedBaseGroups(filtered[0]));
  // };

  // const canSubmit = () => {
  //   if (
  //     userInfo.confirm_password !== userInfo.password ||
  //     userInfo.password.length === 0 ||
  //     userInfo.username.length === 0 ||
  //     userInfo.email.length === 0 ||
  //     userInfo.first_name.length === 0 ||
  //     userInfo.last_name.length === 0 ||
  //     userInfo.role < 1 ||
  //     userInfo.user_level < 1
  //   ) {
  //     return false;
  //   }
  //   return true;
  // };

  // const handleClearAllCompaniesAndBG = () => {
  //   dispatch(setAllSelectedBaseGroups([]));
  // };

  // const handleClearBGForSelectedCompany = () => {
  //   if (!company) return;

  //   const filtered = [...selectedBaseGroups].filter(
  //     (bg) => bg.company !== company.id,
  //   );
  //   dispatch(setAllSelectedBaseGroups(filtered));
  // };

  // const getStores = (userid: number) => {
  //   const filterNulls = (arr: Store[]) => {
  //     return arr.filter((store) => store.store_name !== null);
  //   };
  //   getUserStores(url, token, userid)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         const stores = {
  //           assigned: filterNulls(j.assigned_stores).sort(
  //             (a: Store, b: Store) =>
  //               parseInt(a.store_number) - parseInt(b.store_number),
  //           ),
  //           unassigned: filterNulls(j.unassigned_stores).sort(
  //             (a: Store, b: Store) =>
  //               parseInt(a.store_number) - parseInt(b.store_number),
  //           ),
  //         };
  //         dispatch(setSelectedUserStores(stores));
  //         dispatch(setRefresh(true));
  //         toast.success(
  //           "User updated, you can add or remove stores for the user",
  //         );
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       toast.error("Error fetching available stores " + err.message);
  //     });
  // };

  // const handleSubmit = () => {
  //   const selectedBGIds = [...selectedBaseGroups].map((bg) => bg.id);
  //   const activeIds = [...activeBaseGroups].map((bg) => bg.id);
  //   const inactiveIds = [...inactiveBaseGroups].map((bg) => bg.id);

  //   const idsToAssign: number[] = [];
  //   const idsToUnassign: number[] = [];

  //   activeIds.forEach((id) => {
  //     const isActive = selectedBGIds.includes(id);
  //     if (!isActive) {
  //       idsToUnassign.push(id);
  //     }
  //   });

  //   inactiveIds.forEach((id) => {
  //     const isInactive = selectedBGIds.includes(id);
  //     if (isInactive) {
  //       idsToAssign.push(id);
  //     }
  //   });

  //   console.log("selected", selectedBGIds);
  //   console.log(idsToAssign, "to assign");
  //   console.log(idsToUnassign, "to unassign");
  //   return;

  //   if (idsToAssign.length > 0) {
  //     assignUserToCompany(url, token, selectedUserId, userCompanyIds)
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           assignBaseGroupToUser(url, token, selectedUserId, idsToAssign)
  //             .then((resp) => {
  //               const j = resp.data;
  //               if (j.error === 0) {
  //                 getStores(selectedUserId);
  //               }
  //             })
  //             .catch((err: JsonError) => toast.error(err.message));
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   }

  //   if (idsToUnassign.length > 0) {
  //     deleteUserBaseGroupLink(url, token, selectedUserId, idsToUnassign)
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           getStores(selectedUserId);
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   }
  // };

  const active = () => {
    return companies.filter((c) => userCompanyIds.includes(c.company));
  };

  const inactive = () => {
    return companies.filter((c) => !userCompanyIds.includes(c.company));
  };

  const handleSubmit = (type: string) => {
    let ids: number[] = [];
    switch (type) {
      case "assign":
        ids = [...companiesToAssign, ...userCompanyIds];
        break;
      case "assign_all":
        ids = [...companies].map((c) => c.company);
        break;
      case "unassign":
        ids = [...companiesToAssign, ...userCompanyIds].filter((id) => !companiesToUnassign.includes(id));
        break;
      default:
        ids = [];
    }

    assignUserToCompany(url, token, selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setCompaniesToAssign([]);
          setCompaniesToUnassign([]);
          dispatch(setRefresh(true));
          const companyIds = j.companies.map((c: UserCompany) => c.company);
          dispatch(setUserCompanyIds(companyIds));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="text-[13.5px]">
      {/* Headers */}
      <div className="leading-tight mb-2">
        <div className="font-medium">Companies and Base Groups</div>
        <div className="text-content/60 text-[12px]">
          Select a company to assign/unassign its base groups
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 select-none">
        {/* Inactive Companies */}
        <div className="space-y-1.5 text-[11.5px] leading-tight mb-1">
          {inactive().map((c) => (
            <div
              key={c.id}
              className={`p-2 rounded-full flex justify-between items-center relative ${companyBG(c.company, "inactive")} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
              onClick={() => handleCompanyToAssign(c.company)}
            >
              <div className="text-[12px]">{c.name}</div>
              <div
                className={`absolute right-2 z-10 bg-[rgb(30,45,80)] text-custom-white px-2 py-[1px] rounded-full`}
              >
                Assign
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${companiesToAssign.length === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5`}
              onClick={() => handleSubmit("assign")}
            >
              Assign
            </button>
            <button
              className={`btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5`}
              onClick={() => handleSubmit("assign_all")}
            >
              Assign All
            </button>
          </div>
        </div>
        {/* Active Companies */}
        <div className="space-y-1.5 text-[11.5px] leading-tight mb-1">
          {active().map((c) => (
            <div
              key={c.id}
              className={`p-2 rounded-full flex justify-between items-center relative cursor-pointer transition-all duration-200 ${companyBG(c.company, "active")} hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
              onClick={() => handleCompanyToUnassign(c.company)}
            >
              <div className="text-[12px]">{c.name}</div>
              <div
                className={`absolute right-2 z-10 bg-red-600 text-custom-white px-2 py-[1px] rounded-full`}
              >
                Unassign
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${companiesToUnassign.length === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5`}
              onClick={() => handleSubmit("unassign")}
            >
              Unassign
            </button>
            <button
              className={`btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5`}
              onClick={() => handleSubmit("unassign_all")}
            >
              Unassign All
            </button>
          </div>
        </div>
        {/* Base Groups */}
        {/* <div>
          <div className="grid gap-2 max-h-[50vh] overflow-y-auto text-[11.5px] leading-tight">
            {baseGroups.map((bg) => {
              const company = user.companies.find(
                (c) => c.company === bg.company,
              );

              return (
                <div
                  key={bg.id}
                  className={`rounded-lg border border-content/25 
                ${selectedBaseGroups.some((b) => b.id === bg.id) ? "bg-[rgb(30,45,80)]/90 text-custom-white" : "text-content/60 bg-content/5"} 
                px-2.5 py-2 shadow-md cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                  onClick={() => handleBGSelect(bg)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium break-words">{bg.name}</div>
                      <div className="text-xs break-words">
                        {company?.name ?? "Unknown company"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}
      </div>
      {/* <div className="grid grid-cols-3 gap-4 mt-4">
        <button
          className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-sm"
          onClick={handleClearBGForSelectedCompany}
        >
          Clear Base Groups
        </button>
        <button
          className={`btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-sm 
            ${!canSubmit() ? "opacity-50 pointer-events-none" : ""}`}
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div> */}
    </div>
  );
};

export default UpdateCompanyBG;
