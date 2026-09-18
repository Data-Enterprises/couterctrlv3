import { useAppSelector } from "./hooks";
import Cashiers from "./pages/cashiers/Cashiers.tsx";
import Sales from "./pages/sales/Sales.tsx";
import LossPrevention from "./pages/lossPrevention/LossPrevention.tsx";
import Orders from "./pages/orders/Orders.tsx";
import Coupons from "./pages/coupons/Coupons.tsx";
import Receivers from "./pages/receivers/Receivers.tsx";
import ItemLookup from "./pages/lookup/ItemLookup.tsx";
import Admin from "./pages/admin/dev/Admin.tsx";
import AdminLegacy from "./pages/admin/AdminLegacy.tsx";
import Groups from "./pages/groups/Groups.tsx";
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

// No legacy branch: Orders has a prod and a dev tree, picked inside
// pages/orders/Orders.tsx by the API switch.
export const OrdersPage = () => <Orders />;

// No legacy branch: Coupons has a prod and a dev tree, picked inside
// pages/coupons/Coupons.tsx by the API switch.
export const CouponsPage = () => <Coupons />;

// No legacy branch: Receivers has a prod and a dev tree, picked inside
// pages/receivers/Receivers.tsx by the API switch.
export const ReceiversPage = () => <Receivers />;

// No legacy branch: the old UpcList is gone, and Upc List has a prod and a dev
// tree, picked inside pages/upc/UpcList.tsx by the API switch.
export const UpcPage = () => <UpcList />;

// No legacy branch: Item Lookup has a prod and a dev tree, picked inside
// pages/lookup/ItemLookup.tsx by the API switch.
export const ItemLookupPage = () => <ItemLookup />;

export const AdminPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <Admin /> : <AdminLegacy />;
};

// No legacy branch: the old Forecasting page is gone, and Forecasting has a
// prod and a dev tree, picked inside pages/forecast/Forecasting.tsx.
export const ForecastPage = () => <Forecasting />;

// No legacy branch: Store Groups has a prod and a dev tree, picked inside
// pages/groups/Groups.tsx by the API switch.
export const GroupsPage = () => <Groups />;

export const OrganizationPage = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <OrganizationDev /> : <TeamLegacy />;
};
