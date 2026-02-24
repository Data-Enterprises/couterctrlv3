import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type {
  BaseGroup,
  BaseGroupJsonResp,
  JsonError,
  UserCompany,
} from "../../../interfaces";

import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
} from "../../../api/team";

import {
  resetBgIds,
  setBgIdsToAssign,
  setBgIdsToUnassign,
  setUserBaseGroups,
  setUserCompany,
} from "../../../features/baseGroupSlice";

import SearchUser from "../forms/SearchUser";
import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";
import { useEffect, useState } from "react";
import { WarningIcon } from "../../../components/toasts/Icons";
import { resetUserInfo } from "../../../features/usersSlice";

const AssignUserToBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");

  const { url, token } = useAppSelector((state) => state.app);
  const { users, selectedUserId } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const {
    activeBaseGroups,
    inactiveBaseGroups,
    bgIdsToAssign,
    bgIdsToUnassign,
    userCompany,
  } = useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    dispatch(setUserBaseGroups({ active: [], inactive: [] }));
    dispatch(setUserCompany(null));
  }, [selectedUserId]);

  const companies = selectedUserId
    ? users.filter((u) => u.id === selectedUserId)[0].companies
    : [];

  const handleCompanySelect = (x: string | number) => {
    // Getting the base groups for the selected company
    const userCompanies = users.filter((u) => u.id === selectedUserId)[0]
      .companies;
    const company = userCompanies.filter((c) => c.company === Number(x))[0];
    dispatch(setUserCompany(company));
    getData(company);
  };

  const getData = (company: UserCompany) => {
    getBaseGroupsAssignedToUser(url, token, selectedUserId)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          const active = j.active.filter(
            (bg) => bg.company === company.company,
          );
          const inactive = j.inactive.filter(
            (bg) => bg.company === company.company,
          );

          dispatch(setUserBaseGroups({ active: active, inactive: inactive }));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching user's base groups " + err.message);
      });
  };

  const handleBGToAssign = (id: number) => {
    dispatch(setBgIdsToAssign(id));
  };

  const handleBGToUnassign = (id: number) => {
    dispatch(setBgIdsToUnassign(id));
  };

  const handleSubmitAll = (type: string) => {
    if (type === "assign_all") {
      const ids = inactiveBaseGroups.map((bg) => bg.id);
      assignBaseGroupToUser(url, token, selectedUserId, ids)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(resetBgIds());
            getData(userCompany!);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      // we are unassigning
      const ids = activeBaseGroups.map((bg) => bg.id);
      deleteUserBaseGroupLink(url, token, selectedUserId, ids).then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getData(userCompany!);
        }
      });
    }
  };

  const handleAssignClick = () => {
    assignBaseGroupToUser(url, token, selectedUserId, bgIdsToAssign)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(resetBgIds());
          getData(userCompany!);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassignClick = () => {
    deleteUserBaseGroupLink(url, token, selectedUserId, bgIdsToUnassign).then(
      (resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(resetBgIds());
          getData(userCompany!);
        }
      },
    );
  };

  const filtered = (data: BaseGroup[], filter: string) => {
    return data.filter((x) =>
      x.name.toLowerCase().includes(filter.toLowerCase()),
    );
  };

  const handleAssignedFilterText = (x: string) => {
    setAssignedFilter(x);
  };

  const handleUnasignedFilterText = (x: string) => {
    setUnassignedFilter(x);
  };

  const isOutranked = () => {
    const found = users.find((u) => u.id === selectedUserId);

    if (found) {
      return found.user_level > user.userLevel;
    }
    return false;
  };

  const handleReset = ()=> {
    dispatch(resetUserInfo());
  };

  if (isOutranked()) {
    return (
      <div className="flex justify-center items-center bg-custom-white p-4 mt-4 rounded-lg shadow-lg">
        <div className="font-medium text-sm flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div className="mb-2">We're sorry...</div>
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            className="btn-themeBlue py-1.5 mt-2"
            onClick={() => handleReset()}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SearchUser />
      <SingleSelect
        label="Select Company"
        data={companies}
        displayKey="name"
        valueKey="company"
        onSelect={handleCompanySelect}
        defaultQuery={companies.length === 0 ? "Select a user" : ""}
      />

      <div className="grid grid-cols-2 py-2 gap-4 text-sm">
        <div className="bg-custom-white rounded-lg shadow-lg space-y-2 p-2">
          <Input
            label="Unassigned"
            value={unassignedFilter}
            setValue={handleUnasignedFilterText}
          />
          <div className="space-y-2 h-[40vh] max-h-[40vh] overflow-hidden overflow-y-auto no-scrollbar">
            {filtered(inactiveBaseGroups, unassignedFilter).map((bg) => (
              <div
                key={bg.id}
                className={`${bgIdsToAssign.includes(bg.id) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleBGToAssign(bg.id)}
              >
                <div>
                  <div className="font-medium">Group Name</div>
                  <div>{bg.name}</div>
                </div>
                <div>
                  <div className="font-medium">Company</div>
                  <div>{bg.company_name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn-themeGreen ${bgIdsToAssign.length === 0 && "opacity-50 pointer-events-none"}`}
              onClick={() => handleAssignClick()}
            >
              Assign
            </button>
            <button
              className="btn-themeGreen"
              onClick={() => handleSubmitAll("assign_all")}
            >
              Assign All
            </button>
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg space-y-2 p-2">
          <Input
            label="Assigned"
            value={assignedFilter}
            setValue={handleAssignedFilterText}
          />
          <div className="space-y-2 h-[40vh] max-h-[40vh] overflow-hidden overflow-y-auto no-scrollbar">
            {filtered(activeBaseGroups, assignedFilter).map((bg) => (
              <div
                key={bg.id}
                className={`${bgIdsToUnassign.includes(bg.id) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleBGToUnassign(bg.id)}
              >
                <div>
                  <div className="font-medium">Group Name</div>
                  <div>{bg.name}</div>
                </div>
                <div>
                  <div className="font-medium">Company</div>
                  <div>{bg.company_name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn-themeGreen ${bgIdsToUnassign.length === 0 && "opacity-50 pointer-events-none"}`}
              onClick={() => handleUnassignClick()}
            >
              Unassign
            </button>
            <button
              className="btn-themeGreen"
              onClick={() => handleSubmitAll("unassign_all")}
            >
              Unassign All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUserToBG;
