import { useState } from "react";
import { deleteBaseGroup, getBaseGroups } from "../../../api/baseGroups";
import SingleSelect from "../../../components/SingleSelect";
import { useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";

const DeleteBaseGroup = () => {
  const toast = useToast();
  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);
  const [selectedBgID, setSelectedBgID] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
    deleteBaseGroup(url, token, selectedBgID)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setBaseGroups([]);
          setSelectedBgID(0);
          setGroupName("");
          setShowForm(false);
          setIsDeleting(false);
          toast.success("Base group updated");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleBGSelect = (id: number, name: string) => {
    setSelectedBgID(id);
    setGroupName(name);
  };

  if (isDeleting) {
    return (
      <div className="p-4">
        <div className="text-center">
          Are you sure you want to delete
        </div>
        <div className="text-center">
          <span className="pr-1">Base group =</span>
          <span className="font-medium">
            {baseGroups.find((bg) => bg.id === selectedBgID)!.name}
          </span>
          <span>?</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="btn-themeGreen" onClick={handleSubmit}>
            Yes
          </button>
          <button
            className="btn-themeOrange"
            onClick={() => setIsDeleting(false)}
          >
            No
          </button>
        </div>
      </div>
    );
  }

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
            <div>Select group to update</div>
          </div>
          <div className="select-none grid grid-cols-2 bg-bkg/80 rounded-lg p-1 min-h-20 max-h-32 overflow-hidden overflow-y-scroll no-scrollbar">
            {baseGroups.map((bg) => (
              <div
                key={bg.id}
                className={`${selectedBgID === bg.id && "bg-orange-200"} rounded-full py-0.5 px-2 transition-all duration-200`}
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
            className="opacity-50 pointer-events-none"
          />
          <div>
            <button
              className={`btn-themeOrange w-full ${!selectedBgID && "opacity-50 pointer-events-none"}`}
              onClick={() => setIsDeleting(true)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteBaseGroup;
