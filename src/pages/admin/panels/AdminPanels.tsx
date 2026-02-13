import { useAdminContext } from "../hooks";
// import 

const AdminPanels = () => {
  const { adminOption } = useAdminContext();

  return <div className="bg-custom-white">Admin Panels</div>;
};

export default AdminPanels;
