import { useAppSelector } from "../../../hooks";

import NewStoreNameForm from "./NewStoreNameForm";
import StoresMissingSalesForm from "./StoresMissingSalesForm";

const AdminControls = () => {
  const { selectedAdminForm } = useAppSelector((state) => state.admin);

  const renderForm = () => {
    switch (selectedAdminForm) {
      case "store_name":
        return <NewStoreNameForm />;
      case "store_missing_sales":
        return <StoresMissingSalesForm />;
      default:
        return null;
    }
  };

  return <div className="">{renderForm()}</div>;
};

export default AdminControls;
