import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
// import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  // setAssignBaseGroups,
  setUserCompanyIds,
} from "../../../features/usersSlice";
// import type { BaseGroupJsonResp, JsonError } from "../../../interfaces";

// Components
import CheckBox from "../../../components/inputs/CheckBox";
import Input from "../../../components/inputs/Input";
// import { getBaseGroupsAssignedToUser } from "../../../api/team";

const CompanyAssign = () => {
  // const toast = useToast();
  const dispatch = useAppDispatch();
  const { selectedUserId, userCompanyIds, users } = useAppSelector(
    (state) => state.users,
  );
  const { companies } = useAppSelector((state) => state.user);
  // const { url, token } = useAppSelector((state) => state.app);
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

  // const handleSubmit = () => {
  //   assignUserToCompany(url, token, selectedUserId, userCompanyIds)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         handleClose();
  //         dispatch(updateUserCompanies(j.companies));
  //         getAssignedBaseGroups();
  //       } else {
  //         dispatch(setUserCompanyIds([]));
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       dispatch(setUserCompanyIds([]));
  //       toast.error(err.message);
  //     });
  // };

  // const getAssignedBaseGroups = () => {
  //   getBaseGroupsAssignedToUser(url, token, selectedUserId)
  //     .then((resp) => {
  //       const j: BaseGroupJsonResp = resp.data;
  //       if (j.error === 0) {
  //         dispatch(setAssignBaseGroups([...j.active, ...j.inactive]));
  //       }
  //     })
  //     .catch((err: JsonError) => toast.error(err.message));
  // };

  const handleTextChange = (x: string) => {
    setFilterText(x);
  };

  const isHidden = (name: string) => {
    if (filterText.length === 0) {
      return false;
    } else {
      console.log(
        name,
        filterText,
        filterText.trim().toLowerCase().includes(name.trim().toLowerCase()),
      );
      return !name
        .trim()
        .toLowerCase()
        .includes(filterText.trim().toLowerCase());
    }
  };

  const returnUser = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      return `${firstName} ${lastName}`;
    }
    return "";
  };

  return (
    <div>
      <div className="text-sm pl-0.5 font-medium">{returnUser()}</div>
      <div className="flex items-end justify-between">
        <Input
          label="Search Company"
          value={filterText}
          setValue={handleTextChange}
          width="w-2/3"
        />
        <button
          className="btn-themeBlue py-1.5"
          onClick={() => setFilterText("")}
        >
          Clear Search
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 my-4 max-h-[120px] min-w-[496px] overflow-y-scroll no-scrollbar">
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
    </div>
  );
};

export default CompanyAssign;
