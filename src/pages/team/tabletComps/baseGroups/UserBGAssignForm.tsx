import { useEffect, useState } from "react";

import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type {
  BaseGroup,
  BaseGroupJsonResp,
  JsonError,
  UserCompany,
} from "../../../../interfaces";

import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
} from "../../../../api/team";

import {
  resetBgIds,
  setBgIdsToAssign,
  setBgIdsToUnassign,
  setUserBaseGroups,
  setUserCompany,
} from "../../../../features/baseGroupSlice";

import SearchUser from "../../forms/SearchUser";
import Input from "../../../../components/inputs/Input";
import { WarningIcon } from "../../../../components/toasts/Icons";
import { resetUserInfo } from "../../../../features/usersSlice";

const UserBGAssignForm = () => {
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

  const handleCompanySelect = (x: number) => {
    // Getting the base groups for the selected company
    const userCompanies = users.filter((u) => u.id === selectedUserId)[0]
      .companies;
    const company = userCompanies.filter((c) => c.company === x)[0];
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
      deleteUserBaseGroupLink(url, token, selectedUserId, ids)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            getData(userCompany!);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
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
    deleteUserBaseGroupLink(url, token, selectedUserId, bgIdsToUnassign)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(resetBgIds());
          getData(userCompany!);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
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

  const handleReset = () => {
    dispatch(resetUserInfo());
  };

  const companyBG = (id: number) => {
    if (userCompany && userCompany.id === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  if (isOutranked()) {
    return (
      <div
        data-testid="bg-assign-outrank-container"
        className="flex justify-center items-center bg-custom-white p-4 mt-4 rounded-lg shadow-lg"
      >
        <div className="font-medium text-sm flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div className="mb-2">We're sorry...</div>
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            data-testid="bg-assign-outrank-reset-btn"
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1.5 mt-2"
            onClick={() => handleReset()}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        data-testid="bg-assign-form-container"
        className="space-y-2 bg-custom-white p-2 shadow-lg rounded-lg"
      >
        <SearchUser />
        <div
          className={`${companies.length === 0 && "hidden"} text-[13px] font-medium mb-0.5 pl-1`}
        >
          Companies
        </div>
        <div
          className={` ${companies.length === 0 && "hidden"} flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1`}
        >
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

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
            <Input
              label="Unassigned"
              value={unassignedFilter}
              setValue={handleUnasignedFilterText}
            />

            <div className="mt-2 space-y-2 min-h-[52px] max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              {filtered(inactiveBaseGroups, unassignedFilter).map((bg, i) => (
                <button
                  key={bg.id}
                  data-testid={`unassigned-bg-${i}`}
                  onClick={() => handleBGToAssign(bg.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                    bgIdsToAssign.includes(bg.id)
                      ? "border-orange-300 bg-orange-100 shadow-md"
                      : "border-slate-200 bg-white/80 hover:border-orange-200 hover:bg-orange-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Group Name
                      </div>
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {bg.name}
                      </div>
                    </div>

                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      {bg.company_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                data-testid="bg-assign-form-assign-btn"
                className={`rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85 ${
                  bgIdsToAssign.length === 0 && "pointer-events-none opacity-50"
                }`}
                onClick={handleAssignClick}
              >
                Assign
              </button>
              <button
                data-testid="bg-assign-form-assign-all-btn"
                className="rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
                onClick={() => handleSubmitAll("assign_all")}
              >
                Assign All
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
            <Input
              label="Assigned"
              value={assignedFilter}
              setValue={handleAssignedFilterText}
            />

            <div className="mt-2 space-y-2 min-h-[52px] max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              {filtered(activeBaseGroups, assignedFilter).map((bg, i) => (
                <button
                  key={bg.id}
                  data-testid={`assigned-bg-${i}`}
                  onClick={() => handleBGToUnassign(bg.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                    bgIdsToUnassign.includes(bg.id)
                      ? "border-orange-300 bg-orange-100 shadow-md"
                      : "border-slate-200 bg-white/80 hover:border-orange-200 hover:bg-orange-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Group Name
                      </div>
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {bg.name}
                      </div>
                    </div>

                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      {bg.company_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                data-testid="bg-assign-form-unassign-btn"
                className={`rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85 ${
                  bgIdsToUnassign.length === 0 &&
                  "pointer-events-none opacity-50"
                }`}
                onClick={handleUnassignClick}
              >
                Unassign
              </button>
              <button
                data-testid="bg-assign-form-unassign-all-btn"
                className="rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
                onClick={() => handleSubmitAll("unassign_all")}
              >
                Unassign All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBGAssignForm;
