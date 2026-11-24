// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useGroupCtx, useGroupsData } from "../hooks";

// Redux
import { setSelectedForm } from "../../../../features/groupsPageSlice";

// Interfaces
import type { GroupFormType } from "../../../../interfaces";

// Components
import CreateGroup from "./CreateGroup";
import UpdateGroup from "./UpdateGroup";
import DeleteGroup from "./DeleteGroup";
import GroupStoreAssignMobile from "./GroupStoreAssignMobile";
import PageInfoButton from "../../../../components/PageInfoButton";
import {
  ArrowPathIcon,
  PlusCircleIcon,
  BuildingStorefrontIcon,
  LinkSlashIcon,
} from "@heroicons/react/24/solid";

/** The phone Groups page: a Create / Update / Delete / Assign tab row, with the help at its end, over the selected form. */
const GroupsMobile = () => {
  const ctx = useGroupCtx();
  const dispatch = useAppDispatch();
  useGroupsData();

  const handleFormSelect = (formType: GroupFormType) => {
    dispatch(setSelectedForm(formType));
  };

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
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div
          className={`py-2 transition-all duration-200 flex gap-2 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "create" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("create")}
        >
          <PlusCircleIcon className="w-6 h-6" />
          <div className="text-content">Create</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex gap-2 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "update" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("update")}
        >
          <ArrowPathIcon className="w-6 h-6" />
          <div className="text-content">Update</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex gap-2 items-center justify-center border-r border-content/15 ${ctx.selectedForm === "delete" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("delete")}
        >
          <LinkSlashIcon className="w-6 h-6" />
          <div className="text-content">Delete</div>
        </div>
        <div
          className={`py-2 transition-all duration-200 flex gap-2 items-center justify-center ${ctx.selectedForm === "assign" ? "text-orange-500" : "text-content"} bg-custom-white`}
          onClick={() => handleFormSelect("assign")}
        >
          <BuildingStorefrontIcon className="w-6 h-6" />
          <div className="text-content">Assign</div>
        </div>
        <div className="flex items-center justify-center px-3 border-l border-content/15 bg-custom-white">
          <PageInfoButton
            page="store-groups"
            variant="light"
            title="About Groups"
          />
        </div>
      </div>
      <div className="px-3">{renderForm()}</div>
    </div>
  );
};

export default GroupsMobile;
