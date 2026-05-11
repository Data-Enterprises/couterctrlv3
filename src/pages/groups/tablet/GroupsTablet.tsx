import { useGroupCtx } from "..";
import {
  ArrowPathIcon,
  PlusCircleIcon,
  BuildingStorefrontIcon,
  LinkSlashIcon,
} from "@heroicons/react/24/solid";
import type { GroupFormType } from "../../../features/groupSlice";
import CreateGroup from "./CreateGroup";
import UpdateGroup from "./UpdateGroup";
import DeleteGroup from "./DeleteGroup";
import AssignStoresToGroup from "./AssignStoresToGroup";

interface GroupsTabletProps {
  handleFormSelect: (formType: GroupFormType) => void;
}

const GroupsTablet = ({ handleFormSelect }: GroupsTabletProps) => {
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
        return <AssignStoresToGroup />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-[17.5%_81.5%] gap-3 min-h-[calc(100vh-3rem)] p-3">
      <div className="space-y-3">
        <div
          className={`p-3 transition-all duration-200 flex flex-col items-center justify-center ${ctx.selectedForm === "create" ? "bg-[rgb(30,45,80)]/75 text-custom-white rounded-lg shadow-md" : "bg-custom-white rounded-lg shadow-lg hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white"}`}
          onClick={() => handleFormSelect("create")}
        >
          <PlusCircleIcon className="w-12 h-12" />
          <div>New Group</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 flex flex-col items-center justify-center ${ctx.selectedForm === "update" ? "bg-[rgb(30,45,80)]/75 text-custom-white rounded-lg shadow-md" : "bg-custom-white rounded-lg shadow-lg hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white"}`}
          onClick={() => handleFormSelect("update")}
        >
          <ArrowPathIcon className="w-12 h-12" />
          <div>Update Name</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 flex flex-col items-center justify-center ${ctx.selectedForm === "delete" ? "bg-[rgb(30,45,80)]/75 text-custom-white rounded-lg shadow-md" : "bg-custom-white rounded-lg shadow-lg hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white"}`}
          onClick={() => handleFormSelect("delete")}
        >
          <LinkSlashIcon className="w-12 h-12" />
          <div>Delete Group</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 flex flex-col items-center justify-center ${ctx.selectedForm === "assign" ? "bg-[rgb(30,45,80)]/75 text-custom-white rounded-lg shadow-md" : "bg-custom-white rounded-lg shadow-lg hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white"}`}
          onClick={() => handleFormSelect("assign")}
        >
          <BuildingStorefrontIcon className="w-12 h-12" />
          <div>Assign Stores</div>
        </div>
      </div>
      {renderForm()}
    </div>
  );
};

export default GroupsTablet;
