import { useAppSelector } from "./hooks";
import UpcList from "./pages/upc/UpcList.tsx";
import UpcListDev from "./pages/upc/dev/UpcListDev.tsx";
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
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <UpcListDev /> : <UpcList />;
};
