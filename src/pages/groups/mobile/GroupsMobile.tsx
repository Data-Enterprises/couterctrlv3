import { useGroupCtx } from "..";
import {
  ArrowPathIcon,
  PlusCircleIcon,
  BuildingStorefrontIcon,
  LinkSlashIcon,
} from "@heroicons/react/24/solid";
import type { GroupFormType } from "../../../features/groupSlice";
import CreateGroup from "../tablet/CreateGroup";
import UpdateGroup from "../tablet/UpdateGroup";
import DeleteGroup from "../tablet/DeleteGroup";
import GroupStoreAssignMobile from "./GroupStoreAssignMobile";

interface GroupsTabletProps {
  handleFormSelect: (formType: GroupFormType) => void;
}

const GroupsMobile = ({ handleFormSelect }: GroupsTabletProps) => {
  const ctx = useGroupCtx();

  const renderForm = () => {
    switch (ctx.selectedForm) {
      case "create":
        return <CreateGroup />;
      case "update":
        return <UpdateGroup />;
      case "delete":
        return <DeleteGroup />;
      case "assign":
        return <GroupStoreAssignMobile />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 min-h-[calc(100vh-3rem)] text-[10px]">
      <div className="grid grid-cols-4">
        <div
          className={`py-1 transition-all duration-200 flex flex-col items-center justify-center border-r border-content/15 ${ctx.selectedForm === "create" ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"}`}
          onClick={() => handleFormSelect("create")}
        >
          <PlusCircleIcon className="w-6 h-6" />
          <div>Create</div>
        </div>
        <div
          className={`py-1 transition-all duration-200 flex flex-col items-center justify-center border-r border-content/15 ${ctx.selectedForm === "update" ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"}`}
          onClick={() => handleFormSelect("update")}
        >
          <ArrowPathIcon className="w-6 h-6" />
          <div>Update</div>
        </div>
        <div
          className={`py-1 transition-all duration-200 flex flex-col items-center justify-center border-r border-content/15 ${ctx.selectedForm === "delete" ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"}`}
          onClick={() => handleFormSelect("delete")}
        >
          <LinkSlashIcon className="w-6 h-6" />
          <div>Delete</div>
        </div>
        <div
          className={`py-1 transition-all duration-200 flex flex-col items-center justify-center ${ctx.selectedForm === "assign" ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"}`}
          onClick={() => handleFormSelect("assign")}
        >
          <BuildingStorefrontIcon className="w-6 h-6" />
          <div>Assign</div>
        </div>
      </div>
      <div className="px-3">{renderForm()}</div>
    </div>
  );
};

export default GroupsMobile;
