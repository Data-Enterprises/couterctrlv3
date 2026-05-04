import { getBaseGroups } from "../../../../../api/baseGroups";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
} from "../../../../../features/baseGroupSlice";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import type { CompanyBaseGroup, JsonError } from "../../../../../interfaces";

interface CompanyBGAssignProps {
  isCreatingUser: boolean;
}

const CompanyBGAssign = ({ isCreatingUser }: CompanyBGAssignProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
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

  return (
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
          const company = user.companies.find((c) => c.company === bg.company);

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
      {isCreatingUser ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn-themeBlue"
            // onClick={() => handleFormStep(1)}
          >
            Prev
          </button>
          <button
            className="btn-themeGreen"
            // onClick={() => setOpenModal(true)}
          >
            Submit
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default CompanyBGAssign;
