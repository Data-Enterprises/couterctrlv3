import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError, UserCompany } from "../../../interfaces";

import {
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
} from "../../../features/companySlice";
import { resetUserInfo, setRefresh } from "../../../features/usersSlice";

import { assignUserToCompany } from "../../../api/user";
import Input from "../../../components/inputs/Input";
import SearchUser from "../forms/SearchUser";
import { WarningIcon } from "../../../components/toasts/Icons";

const AssignCompanyToUser = () => {
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
    <div>
      <SearchUser />
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="bg-custom-white rounded-lg shadow-lg space-y-2 p-2">
          <Input
            label={`Unassigned - ${filtered(userUnassignedCompanies, unassignedFilter).length}`}
            value={unassignedFilter}
            setValue={handleUnassignedFilterText}
          />
          <div className="space-y-2 h-[50vh] max-h-[50vh] overflow-hidden overflow-y-auto no-scrollbar">
            {filtered(userUnassignedCompanies, unassignedFilter).map((c) => (
              <div
                key={c.id}
                className={`${companiesToAssign.includes(c.company) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleCompanyToAssign(c.company)}
              >
                <div>
                  <div className="font-medium">Company</div>
                  <div>{c.name}</div>
                </div>
                <div className="text-orange-500 font-medium">
                  Inactive
                  {/* <div className="font-medium">Id</div>
                  <div>{c.company}</div> */}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn-themeGreen ${companiesToAssign.length === 0 && "opacity-50 pointer-events-none"}`}
              onClick={() => handleSubmit("assign")}
            >
              Assign
            </button>
            <button
              className="btn-themeGreen"
              onClick={() => handleSubmit("assign_all")}
            >
              Assign All
            </button>
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg space-y-2 p-2">
          <Input
            label={`Assigned - ${filtered(userAssignedCompanies, assignedFilter).length}`}
            value={assignedFilter}
            setValue={handleAssignedFilterText}
          />
          <div className="space-y-2 h-[50vh] max-h-[50vh] overflow-hidden overflow-y-auto no-scrollbar">
            {filtered(userAssignedCompanies, assignedFilter).map((c) => (
              <div
                key={c.id}
                className={`${companiesToUnassign.includes(c.company) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleCompanyToUnassign(c.company)}
              >
                <div>
                  <div className="font-medium">Company</div>
                  <div>{c.name}</div>
                </div>
                <div className="text-emerald-500 font-medium">
                  Active
                  {/* <div className="font-medium">Id</div>
                  <div>{c.company}</div> */}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn-themeGreen ${companiesToUnassign.length === 0 && "opacity-50 pointer-events-none"}`}
              onClick={() => handleSubmit("unassign")}
            >
              Unassign
            </button>
            <button
              className="btn-themeGreen"
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

export default AssignCompanyToUser;
