import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  getAllStoresInBaseGroup,
  getBaseGroups,
} from "../../../api/baseGroups";
import {
  setAllSelectedBaseGroups,
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
  setSelectedNewUserStores,
  setStoresWithBGID,
} from "../../../features/baseGroupSlice";
import type { CompanyBaseGroup, JsonError, Store } from "../../../interfaces";
import {
  assignBaseGroupToUser,
  assignUserToStore,
  checkUsername,
  createUser,
} from "../../../api/team";
import {
  resetUserInfo,
  setRefresh,
  setSelectedUserId,
} from "../../../features/usersSlice";
import { assignUserToCompany } from "../../../api/user";

const UserCompanyBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.user);
  const { url, token } = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const { userCompanyIds, userInfo } = useAppSelector((state) => state.users);
  const {
    baseGroups,
    selectedBaseGroups,
    company,
    storesWithBGID,
    selectedNewUserStores,
  } = useAppSelector((state) => state.baseGroup);

  const handleCompanySelect = (x: number) => {
    getBaseGroups(url, token, x)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBaseGroups(j.groups));
          dispatch(setCompany(j.company[0]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    if (userCompanyIds.includes(id)) {
      return "bg-[rgb(30,45,80)]/50 text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  const handleBGSelect = (bg: CompanyBaseGroup) => {
    const filtered = [...baseGroups].filter((g) => g.id === bg.id);
    dispatch(setSelectedBaseGroups(filtered[0]));
    const found = storesWithBGID.find((b) => b.base_group === bg.id);
    if (!found) {
      getAllStoresInBaseGroup(url, token, bg.id)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const withBGID = [...j.assigned_stores].map((s: Store) => {
              return { ...s, base_group: bg.id };
            });

            dispatch(setStoresWithBGID([...storesWithBGID, ...withBGID]));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const canSubmit = () => {
    if (
      userInfo.confirm_password !== userInfo.password ||
      userInfo.password.length === 0 ||
      userInfo.username.length === 0 ||
      userInfo.email.length === 0 ||
      userInfo.first_name.length === 0 ||
      userInfo.last_name.length === 0 ||
      userInfo.role < 1 ||
      userInfo.user_level < 1
    ) {
      return false;
    }
    return true;
  };

  const handleClearAllCompaniesAndBG = () => {
    dispatch(setAllSelectedBaseGroups([]));
    dispatch(setSelectedNewUserStores([]));
  };

  const handleClearBGForSelectedCompany = () => {
    if (!company) return;

    const filtered = [...selectedBaseGroups].filter(
      (bg) => bg.company !== company.id,
    );

    const filteredSelectedStores = selectedNewUserStores.filter((s) => {
      const bgForStore = baseGroups.find((bg) => bg.id === s.base_group);
      if (bgForStore) {
        return bgForStore.company !== company.id;
      }
      return true;
    });

    const filteredStoresWithBGID = storesWithBGID.filter((s) => {
      const bgForStore = baseGroups.find((bg) => bg.id === s.base_group);
      if (bgForStore) {
        return bgForStore.company !== company.id;
      }
      return true;
    });

    // If toggling off a company, remove all stores with that company's 
    // base groups => avoids store assignments without a base group/company
    dispatch(setAllSelectedBaseGroups(filtered));
    dispatch(setSelectedNewUserStores(filteredSelectedStores));
    dispatch(setStoresWithBGID(filteredStoresWithBGID));
  };

  const handleSubmit = () => {
    checkUsername(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          createUser(url, token, userInfo)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const userid = j.new_userid;
                const companyIds = Array.from(
                  new Set([...selectedNewUserStores].map((s) => s.company)),
                );
                const bgIds = Array.from(
                  new Set([...selectedNewUserStores].map((s) => s.base_group)),
                );
                dispatch(setSelectedUserId(userid));
                assignUserToCompany(url, token, userid, companyIds)
                  .then((resp) => {
                    const j = resp.data;
                    if (j.error === 0) {
                      assignBaseGroupToUser(url, token, userid, bgIds)
                        .then((resp) => {
                          const j = resp.data;
                          if (j.error === 0) {
                            const storeIds = selectedNewUserStores.map(
                              (s) => s.storeid,
                            );
                            assignUserToStore(url, token, userid, storeIds)
                              .then((resp) => {
                                const j = resp.data;
                                if (j.error === 0) {
                                  toast.success(
                                    "User created and assigned to selected companies, base groups, and stores",
                                  );
                                  dispatch(resetUserInfo());
                                  dispatch(setRefresh(true));
                                } else {
                                  toast.warn(
                                    "Error assigning user to stores " + j.msg,
                                  );
                                }
                              })
                              .catch((err: JsonError) =>
                                toast.error(
                                  "Error assigning user to stores " +
                                    err.message,
                                ),
                              );
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
        } else {
          toast.warn(
            `Error with username check: ${userInfo.username}, ${j.msg}`,
          );
        }
      })
      .catch((err: JsonError) =>
        toast.error(
          `Error with username check: ${userInfo.username}, ${err.message}`,
        ),
      );
  };

  return (
    <div className="text-[13.5px]">
      {/* Headers */}
      <div className="leading-tight mb-2">
        <div className="font-medium">Companies and Base Groups</div>
        <div className="text-content/60 text-[12.5px]">
          Select a company to assign/unassign its base groups
        </div>
      </div>

      {/* Companies */}
      <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
        {companies.map((c) => (
          <div
            key={c.id}
            className={`px-2 py-0.5 rounded-full ${companyBG(c.company)} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
            onClick={() => handleCompanySelect(c.company)}
          >
            {c.name}
          </div>
        ))}
      </div>
      {/* Base Groups */}
      <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto text-[11.5px] leading-tight">
        {baseGroups.map((bg) => {
          const company = user.companies.find((c) => c.company === bg.company);

          return (
            <div
              key={bg.id}
              className={`rounded-lg border border-content/25 
                ${selectedBaseGroups.some((b) => b.id === bg.id) ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "text-content/60 bg-content/5"} 
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
      <div className="grid grid-cols-3 gap-4 mt-4">
        <button
          className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-sm"
          onClick={handleClearAllCompaniesAndBG}
        >
          Clear All
        </button>
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
      </div>
    </div>
  );
};

export default UserCompanyBG;
