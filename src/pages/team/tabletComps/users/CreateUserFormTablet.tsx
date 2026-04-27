import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

import { getBaseGroups } from "../../../../api/baseGroups";
import type { CompanyBaseGroup, JsonError } from "../../../../interfaces";

import Input from "../../../../components/inputs/Input";
import PasswordInput from "../../../../components/inputs/PasswordInput";
import UserInfoCard from "./UserInfoCard";
import {
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
} from "../../../../features/baseGroupSlice";
import { roles } from "../..";
import { setUserInfo } from "../../../../features/usersSlice";

const CreateUserFormTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [formStep, setFormStep] = useState<number>(1);
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, userLevels, userCompanyIds } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const { baseGroups, selectedBaseGroups, company } = useAppSelector(
    (state) => state.baseGroup,
  );

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

  const handleNextStep = (x: number) => {
    setFormStep(x);
  };

  const handleBGSelect = (bg: CompanyBaseGroup) => {
    const filtered = [...baseGroups].filter((g) => g.id === bg.id);
    dispatch(setSelectedBaseGroups(filtered[0]));
  };

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-blue-200"
    }
    if (userCompanyIds.includes(id)) {
      return "bg-orange-200";
    }
    return 'bg-custom-white'
  };

  const handleSubmit = () => {};

  return (
    <div className="space-y-3">
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
          {/* <div className="grid grid-cols-2 gap-3">
          </div> */}
          <button className="btn-themeBlue">Clear Fields</button>
          <button className="btn-themeBlue" onClick={() => handleNextStep(2)}>
            Next
          </button>
        </div>
      ) : null}

      {/* Company/Base Group Assignments */}
      {formStep === 2 ? (
        <div className="p-3 bg-custom-white rounded-lg shadow-lg space-y-3">
          <div className="font-medium">
            <div>Companies and Base Groups</div>
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
                  className={`rounded-lg border border-content/60 ${selectedBaseGroups.includes(bg) ? "bg-orange-200" : "bg-bkg"} px-4 py-3 shadow-sm`}
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
            <button className="btn-themeBlue" onClick={() => handleNextStep(1)}>
              Prev
            </button>
            <button className="btn-themeGreen" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CreateUserFormTablet;
