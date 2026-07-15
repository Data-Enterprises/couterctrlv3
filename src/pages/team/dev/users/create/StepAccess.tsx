import { useEffect } from "react";
import { useTeamCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  getAllStoresInBaseGroup,
  getBaseGroups,
} from "../../../../../api/baseGroups";
import {
  setAllSelectedBaseGroups,
  setBaseGroups,
  setCompany,
  setSelectedBaseGroups,
  setSelectedNewUserStores,
  setStoresWithBGID,
} from "../../../../../features/baseGroupSlice";
import type {
  CompanyBaseGroup,
  JsonError,
  Store,
} from "../../../../../interfaces";

interface StepAccessProps {
  onContinue: () => void;
}

const StepAccess = ({ onContinue }: StepAccessProps) => {
  const toast = useToast();
  const ctx = useTeamCtx();

  const handleCompanySelect = (companyId: number) => {
    getBaseGroups(ctx.url, ctx.token, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setBaseGroups(j.groups));
          ctx.dispatch(setCompany(j.company[0]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(() => {
    if (ctx.companies.length > 0) {
      handleCompanySelect(ctx.companies[0].company);
    }
  }, []);

  const companyStyle = (companyId: number) => {
    if (ctx.company && ctx.company.id === companyId) {
      return {
        style: {
          boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)",
          background: "white",
        },
        className: "text-content",
      };
    }
    const hasSelectedBG = ctx.selectedBaseGroups.some(
      (bg) => bg.company === companyId,
    );
    if (hasSelectedBG) {
      return { style: undefined, className: "bg-blue-50 text-blue-800" };
    }
    return {
      style: undefined,
      className: "bg-custom-white border border-gray-200 text-content",
    };
  };

  const handleBGSelect = (bg: CompanyBaseGroup) => {
    ctx.dispatch(setSelectedBaseGroups(bg));
    const found = ctx.storesWithBGID.some((s) => s.base_group === bg.id);
    if (!found) {
      getAllStoresInBaseGroup(ctx.url, ctx.token, bg.id)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const withBGID = [...j.assigned_stores].map((s: Store) => ({
              ...s,
              base_group: bg.id,
            }));
            ctx.dispatch(
              setStoresWithBGID([...ctx.storesWithBGID, ...withBGID]),
            );
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const handleClearAll = () => {
    ctx.dispatch(setAllSelectedBaseGroups([]));
    ctx.dispatch(setSelectedNewUserStores([]));
  };

  const handleClearBGForCompany = () => {
    if (!ctx.company) return;
    const companyId = ctx.company.id;
    const filteredSelected = ctx.selectedBaseGroups.filter(
      (bg) => bg.company !== companyId,
    );
    const filteredStores = ctx.selectedNewUserStores.filter((s) => {
      const bgForStore = ctx.baseGroups.find((bg) => bg.id === s.base_group);
      return bgForStore ? bgForStore.company !== companyId : true;
    });
    const filteredStoresWithBGID = ctx.storesWithBGID.filter((s) => {
      const bgForStore = ctx.baseGroups.find((bg) => bg.id === s.base_group);
      return bgForStore ? bgForStore.company !== companyId : true;
    });
    ctx.dispatch(setAllSelectedBaseGroups(filteredSelected));
    ctx.dispatch(setSelectedNewUserStores(filteredStores));
    ctx.dispatch(setStoresWithBGID(filteredStoresWithBGID));
  };

  const canContinue = ctx.selectedBaseGroups.length > 0;

  return (
    <div>
      <div className="mb-3">
        <div className="text-[11px] font-medium text-content mb-1">Company</div>
        <div className="flex flex-wrap gap-1.5">
          {ctx.companies.map((c) => {
            const { style, className } = companyStyle(c.company);
            return (
              <button
                key={c.id}
                onClick={() => handleCompanySelect(c.company)}
                style={style}
                className={`text-[11px] px-3 py-1 rounded-full ${className}`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[9px] font-bold uppercase tracking-wide text-content mb-1.5">
        Base groups {ctx.company ? `in ${ctx.company.name}` : ""}
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto thin-scrollbar mb-4">
        {ctx.baseGroups.map((bg) => {
          const isSelected = ctx.selectedBaseGroups.some((b) => b.id === bg.id);
          return (
            <div
              key={bg.id}
              onClick={() => handleBGSelect(bg)}
              style={
                isSelected
                  ? {
                      boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)",
                      background: "white",
                    }
                  : undefined
              }
              className={`rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] cursor-pointer ${isSelected ? "text-content" : "bg-gray-50 text-content/70"}`}
            >
              {bg.name}
            </div>
          );
        })}
        {ctx.baseGroups.length === 0 && (
          <div className="col-span-2 flex items-center justify-center py-6 text-[11px] text-content">
            Select a company to see its base groups
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={handleClearAll} className="text-[12px] text-content">
            Clear all
          </button>
          <button
            onClick={handleClearBGForCompany}
            className="text-[12px] text-content"
          >
            Clear base groups
          </button>
        </div>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-white ${canContinue ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepAccess;
