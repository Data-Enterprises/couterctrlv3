import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import {
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
} from "../../../features/companySlice";
import { setRefresh } from "../../../features/usersSlice";

import { assignUserToCompany } from "../../../api/user";
import Input from "../../../components/inputs/Input";
import SearchUser from "../forms/SearchUser";

const AssignCompanyToUser = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { selectedUserId, users } = useAppSelector((state) => state.users);
  const { userUnassignedCompanies, userAssignedCompanies } = useAppSelector(
    (state) => state.company,
  );

  const [companiesToAssign, setCompaniesToAssign] = useState<number[]>([]);
  const [companiesToUnassign, setCompaniesToUnassign] = useState<number[]>([]);

  useEffect(() => {
    // Initial setting of the data for both columns
    // Each column is responsible for maintaining the state after it is set
    if (selectedUserId) {
      const assigned = users.filter((u) => u.id === selectedUserId)[0]
        .companies;
      const assignedIds = assigned.map((c) => c.company);
      const unassigned = companies.filter(
        (c) => !assignedIds.includes(c.company),
      );

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

    // make api call
    // update redux => then refresh users => reset useState arrays
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

  return (
    <div>
      <SearchUser />
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="bg-custom-white rounded-lg shadow-lg space-y-2 p-2">
          <Input label="Unassigned" value="" setValue={() => {}} />
          <div className="space-y-2 h-[50vh] max-h-[50vh] overflow-hidden overflow-y-auto no-scrollbar">
            {userUnassignedCompanies.map((c) => (
              <div
                key={c.id}
                className={`${companiesToAssign.includes(c.company) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleCompanyToAssign(c.company)}
              >
                <div>
                  <div className="font-medium">Company</div>
                  <div>{c.name}</div>
                </div>
                <div>
                  <div className="font-medium">Id</div>
                  <div>{c.company}</div>
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
          <Input label="Assigned" value="" setValue={() => {}} />
          <div className="space-y-2 h-[50vh] max-h-[50vh] overflow-hidden overflow-y-auto no-scrollbar">
            {userAssignedCompanies.map((c) => (
              <div
                key={c.id}
                className={`${companiesToUnassign.includes(c.company) && "bg-emerald-200"} px-2 py-3 rounded-lg shadow-lg flex justify-between items-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
                onClick={() => handleCompanyToUnassign(c.company)}
              >
                <div>
                  <div className="font-medium">Company</div>
                  <div>{c.name}</div>
                </div>
                <div>
                  <div className="font-medium">Id</div>
                  <div>{c.company}</div>
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
