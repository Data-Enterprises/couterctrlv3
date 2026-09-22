import { useGroupCtx } from "..";
import {
  ArrowPathIcon,
  PlusCircleIcon,
  BuildingStorefrontIcon,
  RectangleStackIcon,
  LinkSlashIcon,
} from "@heroicons/react/24/solid";
import type { GroupFormType } from "../../../../interfaces";
import GroupsListMobile from "./GroupsListMobile";
import CreateGroup from "./CreateGroup";
import UpdateGroup from "./UpdateGroup";
import DeleteGroup from "./DeleteGroup";
import GroupStoreAssignMobile from "./GroupStoreAssignMobile";

interface GroupsMobileProps {
  handleFormSelect: (formType: GroupFormType) => void;
}

const GroupsMobile = ({ handleFormSelect }: GroupsMobileProps) => {
  const ctx = useGroupCtx();

  const renderForm = () => {
    switch (ctx.selectedForm) {
      case "list":
        return <GroupsListMobile />;
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
      <div className="grid grid-cols-5">
        <div
          className={`py-2 transition-all duration-200 flex flex-col gap-0.5 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "list" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("list")}
        >
          <RectangleStackIcon className="w-6 h-6" />
          <div className="text-content">Groups</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex flex-col gap-0.5 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "create" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("create")}
        >
          <PlusCircleIcon className="w-6 h-6" />
          <div className="text-content">Create</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex flex-col gap-0.5 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "update" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("update")}
        >
          <ArrowPathIcon className="w-6 h-6" />
          <div className="text-content">Update</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex flex-col gap-0.5 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "delete" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("delete")}
        >
          <LinkSlashIcon className="w-6 h-6" />
          <div className="text-content">Delete</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex flex-col gap-0.5 items-center justify-center ${ctx.selectedForm === "assign" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("assign")}
        >
          <BuildingStorefrontIcon className="w-6 h-6" />
          <div className="text-content">Assign</div>
        </div>
      </div>
      <div className="px-3">{renderForm()}</div>
    </div>
  );
};

export default GroupsMobile;
