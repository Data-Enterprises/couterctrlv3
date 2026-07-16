import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type { JsonError, UserCompany } from "../../../../interfaces";

import {
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
} from "../../../../features/companySlice";
import { resetUserInfo, setRefresh } from "../../../../features/usersSlice";

import { assignUserToCompany } from "../../../../api/user";
import Input from "../../../../components/inputs/Input";
import SearchUser from "../../forms/SearchUser";
import { WarningIcon } from "../../../../components/toasts/Icons";

const UserCompanyAssignForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const companyState = useAppSelector((state) => state.company);
  const { selectedUserId, users } = useAppSelector((state) => state.users);
  const { userUnassignedCompanies, userAssignedCompanies } = useAppSelector(
    (state) => state.company,
  );
  const user = useAppSelector((state) => state.user);

  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");
  const [companiesToAssign, setCompaniesToAssign] = useState<number[]>([]);
  const [companiesToUnassign, setCompaniesToUnassign] = useState<number[]>([]);

  useEffect(() => {
    // Initial setting of the data for both columns
    // Each column is responsible for maintaining the state after it is set
    if (selectedUserId) {
      const assigned = users.filter((u) => u.id === selectedUserId)[0]
        .companies;

      const assignedIds = assigned.map((c) => c.company);

      // Checking to see if the logged in user is a DCR user
      // if so,then we want to see all companies, otherwise we show only the companies the logged in user is assigned to
      const isDCRUser =
        companies.filter(
          (c) => c.company === 5 || c.name.toLowerCase() === "dcr",
        ).length > 0;

      let unassigned = companies.filter(
        (c) => !assignedIds.includes(c.company),
      );

      if (isDCRUser) {
        const formatted = [...companyState.companies].map((c, i) => {
          return {
            id: i,
            company: c.id,
            name: c.name,
            userid: user.userid,
            username: user.username,
          };
        });

        unassigned = formatted.filter((c) => !assignedIds.includes(c.company));
      } else {
        unassigned = companies.filter((c) => !assignedIds.includes(c.company));
      }

      dispatch(setUserAssignedCompanies(assigned));
      dispatch(setUserUnassignedCompanies(unassigned));
    }
  }, [selectedUserId, users]);

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

  // Make the api call, on success update the redux, and refresh the users
  const handleSubmit = (type: string) => {
    const assignedIds = userAssignedCompanies.map((c) => c.company);
    let ids: number[] = [];
    switch (type) {
      case "assign":
        ids = [...companiesToAssign, ...assignedIds];
        break;
      case "assign_all":
        ids = [...userAssignedCompanies, ...userUnassignedCompanies].map(
          (c) => c.company,
        );
        break;
      case "unassign":
        ids = assignedIds.filter((c) => !companiesToUnassign.includes(c));
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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const filtered = (data: UserCompany[], filter: string) => {
    return data.filter((x) =>
      x.name.toLowerCase().includes(filter.toLowerCase()),
    );
  };

  const handleAssignedFilterText = (x: string) => {
    setAssignedFilter(x);
  };

  const handleUnassignedFilterText = (x: string) => {
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
    dispatch(setUserAssignedCompanies([]));
    dispatch(setUserUnassignedCompanies([]));
  };

  if (isOutranked()) {
    return (
      <div
        data-testid="outranked-message-container"
        className="flex justify-center items-center"
      >
        <div className="bg-custom-white rounded-lg shadow-lg p-3 font-medium text-sm flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div className="mb-2">We're sorry...</div>
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            data-testid="company-assign-reset-btn"
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] py-1.5 mt-2"
            onClick={() => handleReset()}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <SearchUser />

      <div
        data-testid="company-assign-container"
        className="mt-2 grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-slate-800">
              Unassigned
            </div>
            <div className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              {filtered(userUnassignedCompanies, unassignedFilter).length}
            </div>
          </div>

          <Input
            label="Search companies"
            value={unassignedFilter}
            setValue={handleUnassignedFilterText}
          />

          <div className="mt-3 h-[50vh] max-h-[50vh] space-y-2 overflow-y-auto pr-1 no-scrollbar text-[12px]">
            {filtered(userUnassignedCompanies, unassignedFilter).map((c, i) => (
              <button
                key={c.id}
                data-testid={`unassigned-company-${i}`}
                onClick={() => handleCompanyToAssign(c.company)}
                className={`group relative flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                  companiesToAssign.includes(c.company)
                    ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                    : "bg-custom-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide">
                    Company
                  </div>
                  <div className="truncate text-[13px] font-semibold">
                    {c.name}
                  </div>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[rgb(30,45,80)] px-2.5 py-1 text-[11px] font-medium text-custom-white shadow-sm">
                  Assign
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              data-testid="company-assign-btn"
              className={`rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-custom-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85 ${
                companiesToAssign.length === 0 &&
                "pointer-events-none opacity-50"
              }`}
              onClick={() => handleSubmit("assign")}
            >
              Assign
            </button>
            <button
              data-testid="company-assign-all-btn"
              className="rounded-xl border bg-[rgb(30,45,80)] text-custom-white border-[rgb(30,45,80)] py-2 text-[13px] font-medium shadow-sm transition-all duration-200"
              onClick={() => handleSubmit("assign_all")}
            >
              Assign All
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-slate-800">
              Assigned
            </div>
            <div className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              {filtered(userAssignedCompanies, assignedFilter).length}
            </div>
          </div>

          <Input
            label="Search companies"
            value={assignedFilter}
            setValue={handleAssignedFilterText}
          />

          <div className="mt-3 h-[50vh] max-h-[50vh] space-y-2 overflow-y-auto pr-1 no-scrollbar text-[12px]">
            {filtered(userAssignedCompanies, assignedFilter).map((c, i) => (
              <button
                key={c.id}
                data-testid={`assigned-company-${i}`}
                onClick={() => handleCompanyToUnassign(c.company)}
                className={`group relative flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                  companiesToUnassign.includes(c.company)
                    ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                    : "bg-custom-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide">
                    Company
                  </div>
                  <div className="truncate text-[13px] font-semibold">
                    {c.name}
                  </div>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-medium text-custom-white shadow-sm">
                  Unassign
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              data-testid="company-unassign-btn"
              className={`rounded-xl bg-[rgb(30,45,80)] py-2 text-[13px] font-medium text-custom-white shadow-sm transition-all duration-200 hover:bg-[rgb(30,45,80)]/85 ${
                companiesToUnassign.length === 0 &&
                "pointer-events-none opacity-50"
              }`}
              onClick={() => handleSubmit("unassign")}
            >
              Unassign
            </button>
            <button
              data-testid="company-unassign-all-btn"
              className="rounded-xl border bg-[rgb(30,45,80)] text-custom-white border-[rgb(30,45,80)] py-2 text-[13px] font-medium shadow-sm transition-all duration-200"
              onClick={() => handleSubmit("unassign_all")}
            >
              Unassign All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCompanyAssignForm;
