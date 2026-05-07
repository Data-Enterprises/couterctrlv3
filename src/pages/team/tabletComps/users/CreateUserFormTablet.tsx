import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

import {
  getAllStoresInBaseGroup,
  getBaseGroups,
} from "../../../../api/baseGroups";
import type {
  CompanyBaseGroup,
  JsonError,
  Store,
} from "../../../../interfaces";

import Input from "../../../../components/inputs/Input";
import PasswordInput from "../../../../components/inputs/PasswordInput";
import UserInfoCard from "./UserInfoCard";
import {
  setAllSelectedBaseGroups,
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
  setSelectedNewUserStores,
  setStoresWithBGID,
} from "../../../../features/baseGroupSlice";
import { roles } from "../..";
import {
  resetUserInfo,
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setRefresh,
  setSelectedUserId,
  setSelectedUserStores,
  setUserInfo,
} from "../../../../features/usersSlice";
import {
  assignBaseGroupToUser,
  assignUserToStore,
  checkEmail,
  checkUsername,
  createUser,
} from "../../../../api/team";
import { assignUserToCompany } from "../../../../api/user";
import StoresWithBG from "./innerForms/StoresWithBG";

const CreateUserFormTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [formStep, setFormStep] = useState<number>(1);
  const { url, token } = useAppSelector((state) => state.app);
  const {
    userInfo,
    userLevels,
    userCompanyIds,
    availableUsernameText,
    usernameTextColor,
    emailTextColor,
    availableEmailText,
  } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const {
    baseGroups,
    selectedBaseGroups,
    company,
    storesWithBGID,
    selectedNewUserStores,
  } = useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    if (formStep === 2) {
      getBaseGroups(url, token, user.companies[0].company)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setBaseGroups(j.groups));
            dispatch(setCompany(j.company[0]));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [formStep]);

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

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    if (userCompanyIds.includes(id)) {
      return "bg-[rgb(30,45,80)]/75 text-custom-white";
    }
    return "bg-custom-white";
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

  const handleSubmit = () => {
    checkUsername(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          checkEmail(url, token, userInfo.email)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                createUser(url, token, userInfo)
                  .then((resp) => {
                    const j = resp.data;
                    if (j.error === 0) {
                      const userid = j.new_userid;
                      const companyIds = Array.from(
                        new Set(
                          [...selectedNewUserStores].map((s) => s.company),
                        ),
                      );
                      const bgIds = Array.from(
                        new Set(
                          [...selectedNewUserStores].map((s) => s.base_group),
                        ),
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
                                  assignUserToStore(
                                    url,
                                    token,
                                    userid,
                                    storeIds,
                                  )
                                    .then((resp) => {
                                      const j = resp.data;
                                      if (j.error === 0) {
                                        toast.success(
                                          "User created and assigned to selected companies, base groups, and stores",
                                        );
                                        dispatch(resetUserInfo());
                                        dispatch(setStoresWithBGID([]));
                                        dispatch(setSelectedNewUserStores([]));
                                        dispatch(setRefresh(true));
                                      } else {
                                        toast.warn(
                                          "Error assigning user to stores " +
                                            j.msg,
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
                              .catch((err: JsonError) =>
                                toast.error(err.message),
                              );
                          }
                        })
                        .catch((err: JsonError) => toast.error(err.message));
                    }
                  })
                  .catch((err: JsonError) => {
                    toast.error("Error creating user " + err.message);
                  });
              } else {
                toast.warn("Email unavailable: " + j.msg);
              }
            })
            .catch((err: JsonError) =>
              toast.error("Error validating email " + err.message),
            );
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

  const handleReset = () => {
    dispatch(setAllSelectedBaseGroups([]));
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
    dispatch(resetUserInfo());
  };

  const handleValidateClick = () => {
    checkEmail(url, token, userInfo.email)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(
            setAvailableEmailDetails({
              availableEmailText: "- Available",
              emailTextColor: "text-green-600",
            }),
          );
        } else {
          dispatch(
            setAvailableEmailDetails({
              availableEmailText: "- Unavailable",
              emailTextColor: "text-red-600",
            }),
          );
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error validating email " + err.message),
      );

    checkUsername(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(
            setAvailableUsernameDetails({
              availableUsernameText: "- Available",
              usernameTextColor: "text-green-600",
            }),
          );
        } else {
          dispatch(
            setAvailableUsernameDetails({
              availableUsernameText: "- Unavailable",
              usernameTextColor: "text-red-600",
            }),
          );
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error validating username " + err.message),
      );
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

  return (
    <div className="space-y-3">
      <UserInfoCard />

      {/* Basic User Info */}
      {formStep === 1 ? (
        <div className="p-3 bg-custom-white rounded-lg shadow-lg grid grid-cols-2 gap-3 relative">
          <div className="absolute flex gap-2 right-3 top-3">
            <div
              className={`rounded-full px-3 py-0.5 border border-content/25 bg-[rgb(30,45,80)] text-custom-white`}
            >
              User Info
            </div>
            <div
              className={`rounded-full px-3 py-0.5 border border-content/25 text-content bg-content/10`}
              onClick={() => setFormStep(2)}
            >
              Company/Base Groups
            </div>
          </div>
          <div className="col-span-2 font-medium">
            <div>Basic Info</div>
            <div className="text-[13px] text-content/60">
              Ensure all fields are valid
            </div>
            <div className="grid grid-cols-2">
              <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
              <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
            </div>
          </div>
          <div className="col-span-2">
            <div className="mb-2 font-medium">User Role</div>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`min-h-11 rounded-full border border-content/60 px-4 py-2 text-sm md:text-base transition
                    ${userInfo.role === r.value ? "bg-orange-200" : "bg-custom-white"}
                  `}
                  onClick={() =>
                    dispatch(setUserInfo({ key: "role", value: r.value }))
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <div className="mb-2 font-medium">User Level</div>
            <div className="flex gap-4">
              {userLevels.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className={`min-h-11 rounded-full border border-content/60 px-4 py-1 
                    ${userInfo.user_level === r.id ? "bg-orange-200" : "bg-custom-white"} 
                    `}
                  onClick={() =>
                    dispatch(setUserInfo({ key: "user_level", value: r.id }))
                  }
                >
                  <div>{r.name}</div>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Username"
            value={userInfo.username}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "username", value: val }))
            }
            availableText={availableUsernameText}
            textColor={usernameTextColor}
          />
          <Input
            label="Email"
            value={userInfo.email}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "email", value: val }))
            }
            availableText={availableEmailText}
            textColor={emailTextColor}
          />
          <Input
            label="First Name"
            value={userInfo.first_name}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "first_name", value: val }))
            }
          />
          <Input
            label="Last Name"
            value={userInfo.last_name}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "last_name", value: val }))
            }
          />
          <PasswordInput
            label="Password"
            name="password"
            setText={(val) =>
              dispatch(setUserInfo({ key: "password", value: val }))
            }
            text={userInfo.password}
            leftCompare={userInfo.password}
            rightCompare={userInfo.confirm_password}
          />
          <PasswordInput
            label="Confirm Password"
            name="confirm_password"
            setText={(val) =>
              dispatch(setUserInfo({ key: "confirm_password", value: val }))
            }
            text={userInfo.confirm_password}
            leftCompare={userInfo.password}
            rightCompare={userInfo.confirm_password}
          />
          <button
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"
            onClick={handleReset}
          >
            Clear Fields
          </button>
          <button
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"
            onClick={handleValidateClick}
          >
            Validate Username/Email
          </button>
        </div>
      ) : null}

      {/* Company/Base Group Assignments */}
      {formStep === 2 ? (
        <div className="p-3 bg-custom-white rounded-lg shadow-lg space-y-3 relative">
          <div className="absolute flex gap-2 right-3 top-3">
            <div
              className={`rounded-full px-3 py-0.5 border border-content/25 text-content bg-content/10`}
              onClick={() => setFormStep(1)}
            >
              User Info
            </div>
            <div
              className={`rounded-full px-3 py-0.5 border border-content/25 bg-[rgb(30,45,80)] text-custom-white`}
            >
              Company/Base Groups
            </div>
          </div>
          <div>
            <div className="font-medium">Companies and Base Groups</div>
            <div className="text-sm text-content/60">
              Select a company to assign/unassign its base groups
            </div>
            <div className="grid grid-cols-2">
              <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
              <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {user.companies.map((c, i) => (
              <div
                key={i}
                className={`rounded-full shadow-md border border-content/60 px-4 py-1 ${companyBG(c.company)}`}
                onClick={() => handleCompanySelect(c.company)}
              >
                {c.name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 max-h-[20vh] overflow-y-auto">
            {baseGroups.map((bg) => {
              const company = user.companies.find(
                (c) => c.company === bg.company,
              );

              return (
                <div
                  key={bg.id}
                  className={`rounded-lg border border-content/60 ${selectedBaseGroups.some((b) => b.id === bg.id) ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-bkg"} px-3 py-2 shadow-sm`}
                  onClick={() => handleBGSelect(bg)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium break-words">{bg.name}</div>
                      <div className="text-sm opacity-90 break-words">
                        {company?.name ?? "Unknown company"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Base Group Stores */}
          <StoresWithBG />
          {/* Form/Submit Buttons */}
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
      ) : null}
    </div>
  );
};

export default CreateUserFormTablet;
