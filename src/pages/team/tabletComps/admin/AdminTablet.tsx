import { useAppSelector } from "../../../../hooks";
import AdminFormOptions from "./AdminFormOptions";
import MissingSales from "./MissingSales";
import NewStoreName from "./NewStoreName";

const AdminTablet = () => {
  const { selectedAdminForm } = useAppSelector((state) => state.admin);

  const renderAdminForm = () => {
    switch (selectedAdminForm) {
      case "store_name":
        return <NewStoreName />;
      case "store_missing_sales":
        return <MissingSales />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-[17.5%_81.1%] gap-3">
      <AdminFormOptions />
      {renderAdminForm()}
    </div>
  );
};

export default AdminTablet;
