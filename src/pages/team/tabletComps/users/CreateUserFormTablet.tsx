import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

import { getBaseGroups } from "../../../../api/baseGroups";
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
} from "../../../../features/baseGroupSlice";
import { roles } from "../..";
import {
  resetUserInfo,
  setRefresh,
  setSelectedUserStores,
  setUserInfo,
} from "../../../../features/usersSlice";
import { assignBaseGroupToUser, createUser } from "../../../../api/team";
import { assignUserToCompany, getUserStores } from "../../../../api/user";
import AssignStoreCheckModal from "./AssignStoreCheckModal";
import AssignNewUserStores from "./AssignNewUserStors";

const CreateUserFormTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [formStep, setFormStep] = useState<number>(1);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, userLevels, userCompanyIds } =
    useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const { baseGroups, selectedBaseGroups, company } = useAppSelector(
    (state) => state.baseGroup,
  );

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

  const handleFormStep = (x: number) => {
    setFormStep(x);
  };

  const handleBGSelect = (bg: CompanyBaseGroup) => {
    const filtered = [...baseGroups].filter((g) => g.id === bg.id);
    dispatch(setSelectedBaseGroups(filtered[0]));
  };

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-blue-200";
    }
    if (userCompanyIds.includes(id)) {
      return "bg-orange-200";
    }
    return "bg-custom-white";
  };

  const handleSubmit = (isAssigning: boolean) => {
    createUser(url, token, userInfo)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const userid = j.new_userid;
          // Assigning the company(ies) to the user with their new user id
          assignUserToCompany(url, token, userid, userCompanyIds)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const groupid = [...selectedBaseGroups].map((bg) => bg.id);

                // Assigning the base group(s) to the user
                assignBaseGroupToUser(url, token, userid, groupid)
                  .then((resp) => {
                    const j = resp.data;
                    if (j.error === 0 && isAssigning) {
                      // If we're assigning stores, we move to the next step of the flow which is assigning stores to the user. Otherwise, we can end the flow here with a success message
                      getStores(userid);
                    } else if (j.error === 0 && !isAssigning) {
                      // If we're not assigning stores, we can just end the flow here
                      toast.success("User created successfully");
                      handleReset();
                    }
                    setOpenModal(false);
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

  const getStores = (userid: number) => {
    const filterNulls = (arr: Store[]) => {
      return arr.filter((store) => store.store_name !== null);
    };

    getUserStores(url, token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores).sort(
              (a: Store, b: Store) =>
                parseInt(a.store_number) - parseInt(b.store_number),
            ),
            unassigned: filterNulls(j.unassigned_stores).sort(
              (a: Store, b: Store) =>
                parseInt(a.store_number) - parseInt(b.store_number),
            ),
          };
          setFormStep(3);
          dispatch(setSelectedUserStores(stores));
          dispatch(setRefresh(true));
          toast.success(
            "User created, you can add or remove stores for the user",
          );
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
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

  const handleReset = () => {
    dispatch(setAllSelectedBaseGroups([]));
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
    dispatch(resetUserInfo());
  };

  return (
    <div className="space-y-3">
      <AssignStoreCheckModal
        isOpen={openModal}
        onClose={() => handleSubmit(false)}
        onConfirm={() => handleSubmit(true)}
      />
      <UserInfoCard />

      {/* Basic User Info */}
      {formStep === 1 ? (
        <div className="p-3 bg-custom-white rounded-lg shadow-lg grid grid-cols-2 gap-3">
          <div className="col-span-2 font-medium">
            <div>Basic Info</div>
            <div className="text-[13px] text-content/60">
              Ensure all fields are valid before proceeding to Company/Base
              Group Assignments
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
          <Input
            label="Username"
            value={userInfo.username}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "username", value: val }))
            }
          />
          <Input
            label="Email"
            value={userInfo.email}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "email", value: val }))
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
          <button className="btn-themeBlue" onClick={handleReset}>
            Clear Fields
          </button>
          <button
            className={`btn-themeBlue ${!isFormReady() ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handleFormStep(2)}
          >
            Next
          </button>
        </div>
      ) : null}

      {/* Company/Base Group Assignments */}
      {formStep === 2 ? (
        <div className="p-3 bg-custom-white rounded-lg shadow-lg space-y-3">
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
          <div className="grid grid-cols-3 gap-3 max-h-[35vh] overflow-y-auto">
            {baseGroups.map((bg) => {
              const company = user.companies.find(
                (c) => c.company === bg.company,
              );

              return (
                <div
                  key={bg.id}
                  className={`rounded-lg border border-content/60 ${selectedBaseGroups.some((b) => b.id === bg.id) ? "bg-orange-200" : "bg-bkg"} px-4 py-3 shadow-sm`}
                  onClick={() => handleBGSelect(bg)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-content break-words">
                        {bg.name}
                      </div>
                      <div className="text-sm text-content/60 break-words">
                        {company?.name ?? "Unknown company"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-themeBlue" onClick={() => handleFormStep(1)}>
              Prev
            </button>
            <button
              className="btn-themeGreen"
              onClick={() => setOpenModal(true)}
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}

      {formStep === 3 ? <AssignNewUserStores /> : null}
    </div>
  );
};

export default CreateUserFormTablet;
