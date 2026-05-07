import { useAppSelector, useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import type { JsonError, UserCompany } from "../../../../../interfaces";
import { useState } from "react";
import { assignUserToCompany } from "../../../../../api/user";
import {
  setRefresh,
  setUserCompanyIds,
} from "../../../../../features/usersSlice";

const UserCompanyUpdate = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.user);
  const { url, token } = useAppSelector((state) => state.app);
  const { userCompanyIds, selectedUserId } = useAppSelector(
    (state) => state.users,
  );

  const [companiesToAssign, setCompaniesToAssign] = useState<number[]>([]);
  const [companiesToUnassign, setCompaniesToUnassign] = useState<number[]>([]);

  const companyBG = (id: number, type: "active" | "inactive") => {
    if (type === "active" && companiesToUnassign.includes(id)) {
      return "bg-red-200 text-content";
    }

    if (type === "inactive" && companiesToAssign.includes(id)) {
      return "bg-[rgb(30,45,80)]/75 text-custom-white";
    }

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
        ids = [...companiesToAssign, ...userCompanyIds].filter(
          (id) => !companiesToUnassign.includes(id),
        );
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
    <div className="p-3 bg-custom-white rounded-xl shadow-lg">
      {/* Headers */}
      <div className="leading-tight mb-2">
        <div className="font-medium">Companies</div>
        <div className="text-content/60 text-[12px]">
          Select one or more companies to assign/unassign to this user
        </div>
      </div>

      <div className="h-[1.5px] grid grid-cols-2 mb-3">
        <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
        <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
      </div>

      <div className="text-[13.5px] grid grid-cols-2 gap-4 select-none">
        {/* Inactive Companies */}
        <div className="space-y-1.5 text-[11.5px] leading-tight mb-1">
          <div className="max-h-[23.5vh] overflow-y-auto space-y-1.5">
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
          </div>
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
          <div className="max-h-[23.5vh] overflow-y-auto space-y-1.5">
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
          </div>
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
      </div>
    </div>
  );
};

export default UserCompanyUpdate;
