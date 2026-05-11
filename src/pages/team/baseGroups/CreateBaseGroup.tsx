import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import {
  getBaseGroups,
  createBaseGroup,
  // getAllStoresInBaseGroup,
} from "../../../api/baseGroups";
import { useToast } from "../../../components/toasts/hooks/useToast";

import Input from "../../../components/inputs/Input";
// import { setBGStores, setSelectedBG } from "../../../features/baseGroupSlice";
// import AssignStoresBG from "./AssignStoresBG";
// import { assignBaseGroupToUser } from "../../../api/team";

const CreateBaseGroup = () => {
  const toast = useToast();
  // const dispatch = useAppDispatch();

  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);
  // const [promptUser, setPromptUser] = useState<boolean>(false);

  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { selectedBG } = useAppSelector((state) => state.baseGroup);

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
          // setPromptUser(true);

          // const newBGId = j.id;
          // dispatch(setSelectedBG(newBGId));
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

  // const handlePromptAnswer = (answer: boolean) => {
  //   if (!answer) {
  //     setPromptUser(false);
  //   } else {
  //     setPromptUser(false);
  //     assignBaseGroupToUser(url, token, userid, [selectedBG])
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           getAllStoresInBaseGroup(url, token, selectedBG)
  //             .then((resp) => {
  //               const j = resp.data;
  //               if (j.error === 0) {
  //                 const assigned = j.assigned_stores;
  //                 const unassigned = j.unassigned_stores;
  //                 dispatch(setBGStores({ assigned, unassigned }));
  //               }
  //             })
  //             .catch((err: JsonError) => toast.error(err.message));
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   }
  // };

  // const handleReset = () => {
  //   dispatch(setSelectedBG(0));
  //   dispatch(setBGStores({ assigned: [], unassigned: [] }));
  // };

  return (
    <div data-testid="create-bg-form-container" className="flex gap-2">
      <div className="w-[55%]">
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
                    className={`py-0.5 px-2 transition-all duration-200 ${selectedBG === bg.id ? "bg-orange-200" : ""} rounded-lg cursor-default`}
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

              {/* {unassignedStoresInBG.length > 0 ||
              assignedStoresInBG.length > 0 ? (
                <button
                  className="btn-themeGreen w-full px-0 mt-2 py-1.5"
                  onClick={handleReset}
                >
                  Reset Form
                </button>
              ) : null} */}
            </div>
          )}
        </div>
      </div>

      {/* {unassignedStoresInBG.length > 0 || assignedStoresInBG.length > 0 ? (
        <div className="w-[60%]">
          <AssignStoresBG />
        </div>
      ) : null}

      {promptUser ? (
        <div className="text-[13px]">
          <div className="bg-custom-white p-2 rounded-lg shadow-lg text-center leading-tight space-y-2">
            <div className="font-medium">
              Would you like to assign stores to the new group?
            </div>
            <div className="text-content/60">
              By selecting yes, the base group will be assigned to you
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-themeOrange py-1.5"
                onClick={() => handlePromptAnswer(false)}
              >
                No
              </button>
              <button
                className="btn-themeBlue py-1.5"
                onClick={() => handlePromptAnswer(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null} */}
    </div>
  );
};

export default CreateBaseGroup;
