import { useAppSelector } from "./hooks";
import Cashiers from "./pages/cashiers/Cashiers.tsx";
import Sales from "./pages/sales/Sales.tsx";
import LossPrevention from "./pages/lossPrevention/LossPrevention.tsx";
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
import OrganizationDev from "./pages/organization/Organization.tsx";
import TeamLegacy from "./pages/team/TeamLegacy.tsx";
import TitleBar from "./components/navigation/TitleBar.tsx";
import TitleBarLegacy from "./components/navigation/TitleBarLegacy.tsx";
import SideBarLegacy from "./components/navigation/SideBarLegacy.tsx";
import UpcList from "./pages/upc/UpcList.tsx";
import Forecasting from "./pages/forecast/Forecasting.tsx";

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

// No legacy branch: Cashiers has a prod and a dev tree, picked inside
// pages/cashiers/Cashiers.tsx by the API switch.
export const CashiersPage = () => <Cashiers />;

// No legacy branch: Sales has a prod and a dev tree now, picked inside
// pages/sales/Sales.tsx by the API switch. The legacy Sales page is in trash/.
export const SalesPage = () => <Sales />;

// No legacy branch: Loss Prevention has a prod and a dev tree, picked inside
// pages/lossPrevention/LossPrevention.tsx by the API switch.
export const LossPreventionPage = () => <LossPrevention />;

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

// No legacy branch: the old UpcList is gone, and Upc List has a prod and a dev
// tree, picked inside pages/upc/UpcList.tsx by the API switch.
export const UpcPage = () => <UpcList />;

export const ItemLookupPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <ItemLookup /> : <ItemLookupLegacy />;
};

export const AdminPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Admin /> : <AdminLegacy />;
};

// No legacy branch: the old Forecasting page is gone, and Forecasting has a
// prod and a dev tree, picked inside pages/forecast/Forecasting.tsx.
export const ForecastPage = () => <Forecasting />;

export const GroupsPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Groups /> : <GroupsLegacy />;
};

export const OrganizationPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <OrganizationDev /> : <TeamLegacy />;
};
