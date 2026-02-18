import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setAssignBaseGroups,
  // setAssignBaseGroups,
  setUserCompanyIds,
  updateUserCompanies,
} from "../../../features/usersSlice";
// import type { BaseGroupJsonResp, JsonError } from "../../../interfaces";

// Components
import CheckBox from "../../../components/inputs/CheckBox";
import Input from "../../../components/inputs/Input";
import UserFormButtons from "./UserFormButtons";
import BaseGroupAssign from "./BaseGroupAssign";
import { assignUserToCompany } from "../../../api/user";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import type { BaseGroupJsonResp, JsonError } from "../../../interfaces";

const CompanyAssign = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { selectedUserId, userCompanyIds, users, selectedUserForm } =
    useAppSelector((state) => state.users);
  const { companies } = useAppSelector((state) => state.user);
  const { url, token } = useAppSelector((state) => state.app);
  const [filterText, setFilterText] = useState<string>("");

  useEffect(() => {
    if (selectedUserId > 0) {
      setInitialUserCompanies();
    }
  }, [selectedUserId]);

  const setInitialUserCompanies = () => {
    const companies = users
      .filter((u) => u.id === selectedUserId)[0]
      .companies.reduce((acc: number[], curr) => {
        acc.push(curr.company);
        return acc;
      }, []);
    dispatch(setUserCompanyIds(companies));
  };

  const handleCompanyIdState = (x: boolean | number) => {
    const copy = [...userCompanyIds];
    if (copy.includes(Number(x))) {
      dispatch(setUserCompanyIds(copy.filter((id) => id !== Number(x))));
    } else {
      dispatch(setUserCompanyIds([...copy, Number(x)]));
    }
  };

  const handleSubmit = () => {
    assignUserToCompany(url, token, selectedUserId, userCompanyIds)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(updateUserCompanies(j.companies));
          getAssignedBaseGroups();
        } else {
          dispatch(setUserCompanyIds([]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setUserCompanyIds([]));
        toast.error(err.message);
      });
  };

  const getAssignedBaseGroups = () => {
    getBaseGroupsAssignedToUser(url, token, selectedUserId)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setAssignBaseGroups([...j.active, ...j.inactive]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleTextChange = (x: string) => {
    setFilterText(x);
  };

  const isHidden = (name: string) => {
    if (filterText.length === 0) {
      return false;
    } else {
      return !name
        .trim()
        .toLowerCase()
        .includes(filterText.trim().toLowerCase());
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end justify-between gap-2">
        <Input
          label="Search Company"
          value={filterText}
          setValue={handleTextChange}
          width="w-2/3"
        />
        <button
          className="btn-themeBlue w-1/3 py-1.5"
          onClick={() => setFilterText("")}
        >
          Clear Search
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 my-2 max-h-[92px] overflow-y-scroll no-scrollbar">
        {companies.map((c) => (
          <CheckBox
            id={c.company}
            value={userCompanyIds.includes(c.company)}
            label={c.name}
            onChange={handleCompanyIdState}
            isBool={false}
            className={`${isHidden(c.name) && "hidden"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button className="btn-themeGreen py-1.5" onClick={handleSubmit}>
          Assign
        </button>
        <button
          className="btn-themeBlue py-1.5"
          onClick={() => setInitialUserCompanies()}
        >
          Reset
        </button>
        <button
          className="btn-themeBlue py-1.5"
          onClick={() => dispatch(setUserCompanyIds([]))}
        >
          Clear
        </button>
      </div>
      <BaseGroupAssign />
      <UserFormButtons formType={selectedUserForm} />
    </div>
  );
};

export default CompanyAssign;
