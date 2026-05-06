import { useState } from "react";
import { getBaseGroups, updateBaseGroup } from "../../../api/baseGroups";
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

  const { url, token } = useAppSelector((state) => state.app);
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

  const companyBG = (id: number) => {
    if (selectedCompanyId === id) {
      return "bg-[rgb(30,45,80)] text-custom-white";
    }
    return "text-content/85 bg-content/10";
  };

  return (
    <div data-testid="update-bg-form-container" className="flex gap-2">
      <div className="bg-custom-white p-2 rounded-lg shadow-lg w-1/2">
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
          <div className="text-[13px] my-4">
            <div className="font-medium flex justify-between">
              <div>Select group to update</div>
            </div>
            <div
              className={`select-none rounded-lg p-1 max-h-[45vh] overflow-y-auto`}
            >
              {baseGroups.map((bg, i) => (
                <div
                  key={bg.id}
                  data-testid={`bg-option-${i}`}
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
              data-testid="submit-update-bg-btn"
              className={`btn-themeBlue w-full ${!selectedBgID && "opacity-50 pointer-events-none"}`}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateBaseGroup;
