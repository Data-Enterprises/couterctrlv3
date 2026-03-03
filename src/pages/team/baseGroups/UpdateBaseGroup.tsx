import { useState } from "react";
import { getBaseGroups, updateBaseGroup } from "../../../api/baseGroups";
import SingleSelect from "../../../components/SingleSelect";
import { useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";

const UpdateBaseGroup = () => {
  const toast = useToast();
  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);
  const [selectedBgID, setSelectedBgID] = useState<number>(0);

  const { url, token, isDesktop } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);

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

  const handleGroupName = (x: string) => {
    setGroupName(x);
  };

  const handleSelect = (id: string | number) => {
    setSelectedCompanyId(Number(id));
    getData(Number(id));
  };

  const handleSubmit = () => {
    updateBaseGroup(url, token, selectedBgID, groupName, selectedCompanyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group updated");
          setSelectedBgID(0);
          setGroupName("");
          getData(selectedCompanyId);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleBGSelect = (id: number, name: string) => {
    if (selectedBgID === id) {
      setSelectedBgID(0);
      setGroupName("");
    } else {
      setSelectedBgID(id);
      setGroupName(name);
    }
  };

  return (
    <div className="bg-custom-white p-4 rounded-lg shadow-lg max-h-[70vh]">
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
            <div>Select group to update</div>
          </div>
          <div className={`select-none rounded-lg p-1 overflow-hidden overflow-y-auto ${isDesktop ? "max-h-[39vh]" : "max-h-[25vh]"}`}>
            {baseGroups.map((bg) => (
              <div
                key={bg.id}
                className={`${selectedBgID === bg.id && "bg-orange-200"} rounded-full py-1 pl-2 border-b transition-all duration-200 cursor-pointer hover:bg-blue-200`}
                onClick={() => handleBGSelect(bg.id, bg.name)}
              >
                {bg.name}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showForm && (
        <div className="space-y-2">
          <Input
            label="Group Name"
            value={groupName}
            setValue={handleGroupName}
          />
          <button
            className={`btn-themeBlue w-full ${!selectedBgID && "opacity-50 pointer-events-none"}`}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdateBaseGroup;
