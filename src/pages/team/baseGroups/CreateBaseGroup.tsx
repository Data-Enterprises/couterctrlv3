import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import {
  getBaseGroups,
  createBaseGroup,
  getAllStoresInBaseGroup,
} from "../../../api/baseGroups";
import { useToast } from "../../../components/toasts/hooks/useToast";

import Input from "../../../components/inputs/Input";
import { setBGStores, setSelectedBG } from "../../../features/baseGroupSlice";
import AssignStoresBG from "./AssignStoresBG";

const CreateBaseGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);

  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (groupName.length) {
      const found = baseGroups.some(
        (bg) => bg.name.toLowerCase() === groupName.toLowerCase(),
      );
      setShowWarning(found);
    } else {
      setShowWarning(false);
    }
  }, [groupName]);

  const getData = (company: number) => {
    getBaseGroups(url, token, company)
      .then((resp) => {
        const j: CompanyBGJsonResp = resp.data;
        if (j.error === 0) {
          setBaseGroups(j.groups);
          setShowForm(true);
        } else {
          // no groups are returned
          setBaseGroups([]);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSelect = (id: number) => {
    setSelectedCompanyId(id);
    getData(id);
  };

  const handleGroupName = (x: string) => {
    setGroupName(x);
  };

  const canSubmit = () => {
    return !showWarning && groupName.length > 0;
  };

  const handleSubmit = () => {
    createBaseGroup(url, token, groupName, selectedCompanyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(`Base Group: ${groupName} Created`);
          setGroupName("");
          getData(selectedCompanyId);

          const newBGId = j.id;
          dispatch(setSelectedBG(newBGId));
          getAllStoresInBaseGroup(url, token, newBGId)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const assigned = j.assigned_stores;
                const unassigned = j.unassigned_stores;
                dispatch(setBGStores({ assigned, unassigned }));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const companyBG = (id: number) => {
    if (selectedCompanyId === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  return (
    <div data-testid="create-bg-form-container" className="flex gap-2">
      <div className="w-[40%]">
        <div className="bg-custom-white rounded-lg shadow-lg p-2">
          {/* Companies */}
          <div className="text-[13px] font-medium mb-0.5">Companies</div>
          <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`px-2 py-0.5 rounded-full ${companyBG(c.company)} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                onClick={() => handleSelect(c.company)}
              >
                {c.name}
              </div>
            ))}
          </div>
          {baseGroups.length ? (
            <div className="text-[13px] my-2">
              <div className="font-medium flex justify-between">
                <div>Existing Groups</div>
              </div>
              <div className="select-none grid grid-cols-2 bg-bkg/80 rounded-lg p-1 max-h-[35vh] text-[12px] overflow-hidden overflow-y-scroll no-scrollbar">
                {baseGroups.map((bg) => (
                  <div
                    key={bg.id}
                    className={`py-0.5 px-2 transition-all duration-200`}
                  >
                    {bg.name}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showForm && (
            <div className="">
              {showWarning ? (
                <div
                  data-testid="create-bg-warning-div"
                  className="font-medium text-orange-500 text-[12px] pl-0.5"
                >
                  Group name already exists
                </div>
              ) : null}
              <Input
                label="Group Name"
                value={groupName}
                setValue={handleGroupName}
              />
              <button
                data-testid="create-bg-submit-btn"
                className={`btn-themeBlue w-full mt-2 py-1.5 ${!canSubmit() && "opacity-50 pointer-events-none"}`}
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-[60%]">
        <AssignStoresBG />
      </div>
    </div>
  );
};

export default CreateBaseGroup;
