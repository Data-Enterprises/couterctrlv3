// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useGroupsData } from "../hooks";

// Redux
import { setSelectedForm } from "../../../../features/dev/devGroupsPageSlice";

// Interfaces
import type { GroupFormType } from "../../../../interfaces";

// Components
import GroupsMobile from "./GroupsMobile";

/** The phone view of the user's own groups. */
const UserGroupsMobile = () => {
  const dispatch = useAppDispatch();
  useGroupsData();
  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };
  return <GroupsMobile handleFormSelect={handleFormSelect} />;
};

export default UserGroupsMobile;
