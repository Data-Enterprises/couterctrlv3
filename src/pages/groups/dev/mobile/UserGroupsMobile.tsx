import GroupsMobile from "./GroupsMobile";
import { useAppDispatch } from "../../../../hooks";
import { useGroupsData } from "../hooks";
import { setSelectedForm } from "../../../../features/dev/devGroupsPageSlice";
import type { GroupFormType } from "../../../../interfaces";

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