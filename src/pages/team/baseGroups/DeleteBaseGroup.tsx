import { useState } from "react";
import { deleteBaseGroup, getBaseGroups } from "../../../api/baseGroups";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type {
  CompanyBaseGroup,
  CompanyBGJsonResp,
  JsonError,
} from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import { setSelectedCompanyId } from "../../../features/usersSlice";

const DeleteBaseGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [groupName, setGroupName] = useState<string>("");
  const [baseGroups, setBaseGroups] = useState<CompanyBaseGroup[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedBgID, setSelectedBgID] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { selectedCompanyId } = useAppSelector((state) => state.users);

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

  const handleSelect = (id: number) => {
    dispatch(setSelectedCompanyId(id));
    getData(id);
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
          toast.success("Base group deleted");
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
    <div
      data-testid="bg-delete-step-1-container"
      className="bg-custom-white p-2 w-1/2 rounded-lg shadow-lg"
    >
      {/* Companies */}
      <div className="text-[13px] font-medium mb-0.5 pl-1">Companies</div>
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
          <div className="font-medium flex justify-between pl-1">
            <div>Select group to delete</div>
          </div>
          <div
            data-testid="bg-list-container"
            className={`select-none rounded-lg p-1 max-h-[35vh] overflow-y-auto`}
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
            setValue={() => {}}
            className="opacity-50 pointer-events-none"
          />
          <div>
            <button
              data-testid="bg-delete-step-1-submit-btn"
              className={`btn-themeOrange w-full py-1.5 text-[13px] ${!selectedBgID && "opacity-50 pointer-events-none"}`}
              onClick={() => setIsDeleting(true)}
            >
              Delete Base Group
            </button>
          </div>
        </div>
      )}
      {isDeleting ? (
        <div
          data-testid="bg-delete-step-2-container"
          className="mt-2 text-[13px]"
        >
          <div className="grid grid-cols-2 h-[1.5px] mb-2">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div className="text-center">Are you sure you want to delete</div>
          <div className="text-center">
            <span className="pr-1">Base group:</span>
            <span className="font-medium">
              {baseGroups.find((bg) => bg.id === selectedBgID)!.name}
            </span>
            <span>?</span>
          </div>
          <div className="text-center text-content/60 font-medium">This action cannot be undone</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              data-testid="bg-delete-step-2-submit-btn"
              className="btn-themeGreen py-1.5 text-[13px]"
              onClick={handleSubmit}
            >
              Yes
            </button>
            <button
              data-testid="bg-delete-step-2-cancel-btn"
              className="btn-themeOrange py-1.5 text-[13px]"
              onClick={() => setIsDeleting(false)}
            >
              No
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeleteBaseGroup;
