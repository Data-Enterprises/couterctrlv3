import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import type { CompanyBaseGroup } from "../../../../interfaces";
import CreateUserFormTablet from "./CreateUserFormTablet";
import UserFormOptions from "./UserFormOptions";
import { setUserCompanyIds } from "../../../../features/usersSlice";
import UserInfoForm from "./UserInfoForm";
// import UsersGrid from "./UsersGrid";

const UsersTablet = () => {
  const dispatch = useAppDispatch();
  const selectedUserForm = useAppSelector((state) => state.users.selectedUserForm);
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);

    useEffect(() => {
      const selected = [...selectedBaseGroups];
      const newCompanyIds = selected.reduce(
        (acc: number[], curr: CompanyBaseGroup) => {
          if (!acc.includes(curr.company)) {
            acc.push(curr.company);
          }
          return acc;
        },
        [],
      );

      dispatch(setUserCompanyIds(newCompanyIds));
    }, [selectedBaseGroups]);
  
  const renderUserForm = () => {
    switch (selectedUserForm) {
      case "create":
        return <CreateUserFormTablet />;
      case "user_info" :
        return <UserInfoForm />;
      case "delete":
        return <UserInfoForm />;
      default:
        return null;
    };
  };
  return (
    <div className="grid grid-cols-[17.5%_81.1%] gap-3">
      <UserFormOptions />
      {renderUserForm()}
    </div>
  );
};

export default UsersTablet;