import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import { getBaseGroups, createBaseGroup } from "../../../api/baseGroups";
import { useToast } from "../../../components/toasts/hooks/useToast";

import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";

const CreateBaseGroup = () => {
  const toast = useToast();

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

  return (
    <div data-testid="create-bg-form-container" className="bg-custom-white p-2 rounded-lg shadow-lg">
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

      {showForm && (
        <div className="space-y-2">
          {showWarning ? (
            <div data-testid="create-bg-warning-div" className="font-medium text-sm text-orange-500 text-center">
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
