import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setBgIdsToAssign,
  setBgIdsToUnassign,
  setUserBaseGroups,
  setUserCompany,
} from "../../../features/baseGroupSlice";
import type {
  BaseGroup,
  BaseGroupJsonResp,
  JsonError,
  UserCompany,
} from "../../../interfaces";

const UpdateUserBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const {
    company,
    activeBaseGroups,
    inactiveBaseGroups,
    bgIdsToAssign,
    bgIdsToUnassign,
  } = useAppSelector((state) => state.baseGroup);
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId, users } = useAppSelector((state) => state.users);

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  const handleBGToAssign = (id: number) => {
    dispatch(setBgIdsToAssign(id));
  };

  const handleBGToUnassign = (id: number) => {
    dispatch(setBgIdsToUnassign(id));
  };

  const handleCompanySelect = (x: UserCompany) => {
    dispatch(setUserCompany(x));
    getData(x);
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

  const filtered = (data: BaseGroup[], filter: string) => {
    return data.filter((x) =>
      x.name.toLowerCase().includes(filter.toLowerCase()),
    );
  };

  const selectedUserCompanies = users.filter((u) => u.id === selectedUserId)[0]
    .companies;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
        {selectedUserCompanies.map((c) => (
          <div
            key={c.id}
            className={`px-2 py-0.5 rounded-full ${companyBG(c.company)} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
            onClick={() => handleCompanySelect(c)}
          >
            {c.name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto text-[11.5px] leading-tight">
          {filtered(inactiveBaseGroups, "").map((bg) => {
            return (
              <div
                key={bg.id}
                className={`rounded-full border border-content/25 relative
                ${bgIdsToAssign.some((b) => b === bg.id) ? "bg-[rgb(30,45,80)]/90 text-custom-white" : "text-content/60 bg-content/5"} 
                px-2.5 py-2 shadow-md cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                onClick={() => handleBGToAssign(bg.id)}
              >
                <div className="flex items-start justify-between ">
                  <div className="font-medium break-words">{bg.name}</div>
                  <div
                    className={`absolute right-2 z-10 bg-[rgb(30,45,80)] text-custom-white  px-2 py-[1px] rounded-full`}
                  >
                    Assign
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto text-[11.5px] leading-tight">
          {filtered(activeBaseGroups, "").map((bg) => {
            return (
              <div
                key={bg.id}
                className={`rounded-full border border-content/25 relative
                ${bgIdsToUnassign.some((b) => b === bg.id) ? "bg-[rgb(30,45,80)]/90 text-custom-white" : "text-content/60 bg-content/5"} 
                px-2.5 py-2 shadow-md cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                onClick={() => handleBGToUnassign(bg.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium break-words">{bg.name}</div>
                  <div
                    className={`absolute right-2 z-10 bg-red-600 text-custom-white px-2 py-[1px] rounded-full`}
                  >
                    Unassign
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpdateUserBG;
