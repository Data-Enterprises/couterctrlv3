import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getBaseGroups } from "../../../api/baseGroups";
import {
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
} from "../../../features/baseGroupSlice";
import type { CompanyBaseGroup, JsonError } from "../../../interfaces";

const UserCompanyBG = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.user);
  const { url, token } = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const { userCompanyIds } = useAppSelector((state) => state.users);
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

  const companyBG = (id: number) => {
    if (company && company.id === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    if (userCompanyIds.includes(id)) {
      return "bg-[rgb(30,45,80)]/50 text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  const handleBGSelect = (bg: CompanyBaseGroup) => {
    const filtered = [...baseGroups].filter((g) => g.id === bg.id);
    dispatch(setSelectedBaseGroups(filtered[0]));
  };

  return (
    <div className="text-[13.5px]">
      {/* Headers */}
      <div className="leading-tight mb-2">
        <div className="font-medium">Companies and Base Groups</div>
        <div className="text-content/60 text-[12.5px]">
          Select a company to assign/unassign its base groups
        </div>
      </div>

      {/* Companies */}
      <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
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
      {/* Base Groups */}
      <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[35vh] overflow-y-auto text-[11.5px] leading-tight">
        {baseGroups.map((bg) => {
          const company = user.companies.find((c) => c.company === bg.company);

          return (
            <div
              key={bg.id}
              className={`rounded-lg border border-content/25 
                ${selectedBaseGroups.some((b) => b.id === bg.id) ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "text-content/60 bg-content/5"} 
                px-2.5 py-2 shadow-md cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
              onClick={() => handleBGSelect(bg)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium break-words">{bg.name}</div>
                  <div className="text-xs break-words">
                    {company?.name ?? "Unknown company"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserCompanyBG;
