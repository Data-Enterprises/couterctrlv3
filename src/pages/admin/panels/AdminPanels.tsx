import { useAdminContext } from "../hooks";
import UserAdminPanel from "./UserAdminPanel";
import CompanyAdminPanel from "./CompanyAdminPanel";
import StoreAdminPanel from "./StoreAdminPanel";
import VendorAdminPanel from "./VendorAdminPanel";

const AdminPanels = () => {
  const { adminOption } = useAdminContext();

  switch (adminOption) {
    case 1:
      return <UserAdminPanel />;
    case 2:
      return <CompanyAdminPanel />;
    case 3:
      return <StoreAdminPanel />;
    case 4:
      return <VendorAdminPanel />;
  }
};

export default AdminPanels;
