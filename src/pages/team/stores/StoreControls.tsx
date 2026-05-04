import { useAppSelector } from "../../../hooks";
import StoreInfo from "./StoreInfo";
import AssignBaseGroup from "./AssignBaseGroup";
import AssignStoresToUser from "./AssignStoresToUser";

const StoreControls = () => {
  const { storesOption } = useAppSelector((state) => state.users);

  const renderForm = () => {
    switch (storesOption) {
      case "assign":
        return <AssignStoresToUser />;
      case "info":
        return <StoreInfo />;
      case "bg_assign":
        return <AssignBaseGroup />;
      default:
        return null;
    }
  };

  return <div className="flex flex-col gap-4 ">{renderForm()}</div>;
};

export default StoreControls;
