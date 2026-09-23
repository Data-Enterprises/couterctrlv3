import { useAppSelector } from "./hooks";

import Cashiers from "./pages/cashiers/Cashiers.tsx";
import Sales from "./pages/sales/Sales.tsx";
import LossPrevention from "./pages/lossPrevention/LossPrevention.tsx";
import Orders from "./pages/orders/Orders.tsx";
import Coupons from "./pages/coupons/Coupons.tsx";
import Receivers from "./pages/receivers/Receivers.tsx";
import ItemLookup from "./pages/lookup/ItemLookup.tsx";
import Admin from "./pages/admin/Admin.tsx";
import Groups from "./pages/groups/Groups.tsx";
import Organization from "./pages/organization/Organization.tsx";
import UpcList from "./pages/upc/UpcList.tsx";
import Forecasting from "./pages/forecast/Forecasting.tsx";
import SubDeptMargins from "./pages/subDepts/SubDeptMargins.tsx";

import CashiersLegacy from "./legacy/pages/cashiers/CashiersLegacy.tsx";
import SalesLegacy from "./legacy/pages/sales/SalesLegacy.tsx";
import LossPreventionLegacy from "./legacy/pages/lossPrevention/LossPreventionLegacy.tsx";
import OrdersLegacy from "./legacy/pages/orders/OrdersLegacy.tsx";
import CouponsLegacy from "./legacy/pages/coupons/CouponsLegacy.tsx";
import ReceiversLegacy from "./legacy/pages/receivers/ReceiversLegacy.tsx";
import ItemLookupLegacy from "./legacy/pages/lookup/ItemLookupLegacy.tsx";
import AdminLegacy from "./legacy/pages/admin/AdminLegacy.tsx";
import GroupsLegacy from "./legacy/pages/groups/GroupsLegacy.tsx";
import TeamLegacy from "./legacy/pages/team/TeamLegacy.tsx";
import UpcListLegacy from "./legacy/pages/upc/UpcList.tsx";
import ForecastingLegacy from "./legacy/pages/forecast/Forecasting.tsx";
import SubDeptMarginsLegacy from "./legacy/pages/subDepts/SubDeptMarginsLegacy.tsx";
import TitleBar from "./components/navigation/TitleBar.tsx";
import TitleBarLegacy from "./legacy/components/navigation/TitleBarLegacy.tsx";
import SideBarLegacy from "./legacy/components/navigation/SideBarLegacy.tsx";

/**
 * Which generation of a page to render.
 *
 * Live is what is published, and picks its prod or dev tree from `apiEnv`
 * inside the page. Legacy is the page as it was before the separation,
 * restored under `src/legacy` and pinned to the prod API.
 *
 * Per page rather than one switch around the router, because the two sets are
 * not the same: a route with no legacy version still has to render something,
 * and what it renders is the live page. Switching into Legacy from such a
 * route sends you Home (see TitleBar), so that page is not what you land on.
 */
const useLegacy = () => useAppSelector((s) => s.app.uiMode) === "legacy";

/**
 * The frame, which is part of the page.
 *
 * Legacy is the app as it was, and it was a title bar with a sidebar under it
 * — not today's menu with older pages hung off it. The old bar carries its own
 * way back to Live, because the View switch lives in the live avatar menu and
 * that menu is not on screen here.
 */
export const NavSwitch = () =>
  useLegacy() ? (
    <>
      <TitleBarLegacy />
      <SideBarLegacy />
    </>
  ) : (
    <TitleBar />
  );

export const CashiersPage = () => (useLegacy() ? <CashiersLegacy /> : <Cashiers />);

export const SalesPage = () => (useLegacy() ? <SalesLegacy /> : <Sales />);

export const LossPreventionPage = () =>
  useLegacy() ? <LossPreventionLegacy /> : <LossPrevention />;

export const OrdersPage = () => (useLegacy() ? <OrdersLegacy /> : <Orders />);

export const CouponsPage = () => (useLegacy() ? <CouponsLegacy /> : <Coupons />);

export const ReceiversPage = () =>
  useLegacy() ? <ReceiversLegacy /> : <Receivers />;

export const UpcPage = () => (useLegacy() ? <UpcListLegacy /> : <UpcList />);

export const ItemLookupPage = () =>
  useLegacy() ? <ItemLookupLegacy /> : <ItemLookup />;

export const AdminPage = () => (useLegacy() ? <AdminLegacy /> : <Admin />);

export const ForecastPage = () =>
  useLegacy() ? <ForecastingLegacy /> : <Forecasting />;

export const GroupsPage = () => (useLegacy() ? <GroupsLegacy /> : <Groups />);

/** Legacy's is the old Team page, which User Management replaced. */
export const OrganizationPage = () =>
  useLegacy() ? <TeamLegacy /> : <Organization />;

export const SubDeptMarginsPage = () =>
  useLegacy() ? <SubDeptMarginsLegacy /> : <SubDeptMargins />;
