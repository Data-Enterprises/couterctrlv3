import { useAppSelector } from "./hooks";
import UpcList from "./pages/upc/UpcList.tsx";
import Cashiers from "./pages/cashiers/Cashiers.tsx";
import CashiersLegacy from "./pages/cashiers/CashiersLegacy.tsx";
import Sales from "./pages/sales/Sales.tsx";
import SalesLegacy from "./pages/sales/SalesLegacy.tsx";
import LossPrevention from "./pages/lossPrevention/LossPrevention.tsx";
import LossPreventionLegacy from "./pages/lossPrevention/LossPreventionLegacy.tsx";
import Orders from "./pages/orders/Orders.tsx";
import OrdersLegacy from "./pages/orders/OrdersLegacy.tsx";
import Coupons from "./pages/coupons/Coupons.tsx";
import CouponsLegacy from "./pages/coupons/CouponsLegacy.tsx";
import Receivers from "./pages/receivers/Receivers.tsx";
import ReceiversLegacy from "./pages/receivers/ReceiversLegacy.tsx";
import ItemLookup from "./pages/lookup/ItemLookup.tsx";
import ItemLookupLegacy from "./pages/lookup/ItemLookupLegacy.tsx";
import Admin from "./pages/admin/dev/Admin.tsx";
import AdminLegacy from "./pages/admin/AdminLegacy.tsx";
import Groups from "./pages/groups/dev/Groups.tsx";
import GroupsLegacy from "./pages/groups/GroupsLegacy.tsx";
import TitleBar from "./components/navigation/TitleBar.tsx";
import TitleBarLegacy from "./components/navigation/TitleBarLegacy.tsx";
import SideBarLegacy from "./components/navigation/SideBarLegacy.tsx";

export const NavSwitch = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  if (devMode) return <TitleBar />;
  return (
    <>
      <TitleBarLegacy />
      <SideBarLegacy />
    </>
  );
};

export const CashiersPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Cashiers /> : <CashiersLegacy />;
};

export const SalesPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Sales /> : <SalesLegacy />;
};

export const LossPreventionPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <LossPrevention /> : <LossPreventionLegacy />;
};

export const OrdersPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Orders /> : <OrdersLegacy />;
};

export const CouponsPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Coupons /> : <CouponsLegacy />;
};

export const ReceiversPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Receivers /> : <ReceiversLegacy />;
};

export const UpcPage = () => {
  return <UpcList />;
};

export const ItemLookupPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <ItemLookup /> : <ItemLookupLegacy />;
};

export const AdminPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Admin /> : <AdminLegacy />;
};

export const GroupsPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Groups /> : <GroupsLegacy />;
};
