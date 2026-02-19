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
  updateBaseGroup,
} from "../../../api/baseGroups";
import { useToast } from "../../../components/toasts/hooks/useToast";

import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";

const CreateBaseGroup = () => {
  const toast = useToast();

  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  // const [selectedBgID, setSelectedBgID] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);
  // const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSelect = (id: string | number) => {
    setSelectedCompanyId(Number(id));
    getData(Number(id));
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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  // const handleBgSelect = (id: number, name: string) => {
  //   if (selectedBgID === id) {
  //     setGroupName("");
  //   } else {
  //     setGroupName(name);
  //   }
  //   setSelectedBgID((prev) => (prev === id ? 0 : id));
  // };

  // const validateDelete = () => {
  //   setIsDeleting(true);
  //   setShowForm(false);
  // };

  // const cancelDelete = () => {
  //   setIsDeleting(false);
  //   setShowForm(true);
  // };

  // const handleDelete = () => {
  //   updateBaseGroup(url, token, )
  // };

  // const handleUpdate = () => {};

  return (
    <div className="bg-custom-white px-4 pb-4 rounded-lg shadow-lg">
      <SingleSelect
        label="Select Company"
        data={companies}
        displayKey={"name"}
        valueKey={"company"}
        onSelect={handleSelect}
      />
      {baseGroups.length ? (
        <div className="text-sm my-4">
          <div className="font-medium flex justify-between">
            <div>Existing Groups</div>
          </div>
          <div className="select-none grid grid-cols-2 bg-bkg/80 rounded-lg p-1 min-h-20 max-h-32 overflow-hidden overflow-y-scroll no-scrollbar">
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

      {/* {isDeleting ? (
        <div>
          <div className="text-center text-sm">
            Are you sure you want to delete
          </div>
          <div className="text-center text-sm">
            <span className="pr-1">Base group =</span>
            <span className="font-medium">
              {baseGroups.find((bg) => bg.id === selectedBgID)!.name}
            </span>
            <span>?</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn-themeGreen" onClick={handleDelete}>
              Yes
            </button>
            <button className="btn-themeOrange" onClick={cancelDelete}>
              No
            </button>
          </div>
        </div>
      ) : null} */}

      {showForm && (
        // Create Form
        <div className="space-y-2">
          {showWarning ? (
            <div className="font-medium text-sm text-orange-500 text-center">
              Group name already exists
            </div>
          ) : null}
          <Input
            label="Group Name"
            value={groupName}
            setValue={handleGroupName}
          />
          <button
            className={`btn-themeBlue w-full ${!canSubmit() && "opacity-50 pointer-events-none"}`}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateBaseGroup;
