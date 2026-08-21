import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./fonts.css";
import { store } from "./store";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ToastProvider } from "./components/toasts/ToastProvider.tsx";
// Pages
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import Home from "./pages/home/Home.tsx";
import CouponSales from "./pages/couponSales/CouponSales.tsx";
import Categories from "./pages/categories/Categories.tsx";
import Vendors from "./pages/vendors/Vendors.tsx";
import InventorySubDept from "./pages/inventory/InventorySubDept.tsx";
import InventoryVendor from "./pages/inventory/InventoryVendor.tsx";
import ItemReport from "./pages/itemReport/ItemReport.tsx";
import Invoices from "./pages/invoices/Invoices.tsx";
import LpActions from "./pages/lpActions/LpActions.tsx";
import {
  SalesPage,
  LossPreventionPage,
  OrdersPage,
  CouponsPage,
  ReceiversPage,
  CashiersPage,
  UpcPage,
  ItemLookupPage,
  AdminPage,
  GroupsPage,
  OrganizationPage,
  ForecastPage,
} from "./DevPages.tsx";
import Settings from "./pages/settings/Settings.tsx";
import Dashboard from "./pages/quicksight/Dashboard.tsx";
import SubDeptMargins from "./pages/subDepts/SubDeptMargins.tsx";
import Tickets from "./pages/tickets/Tickets.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider autoClose={true} duration={4000}>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="user-management" element={<OrganizationPage />} />
                <Route
                  path="team"
                  element={<Navigate to="/user-management" replace />}
                />
                <Route
                  path="loss-prevention"
                  element={<LossPreventionPage />}
                />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="upc-upload" element={<UpcPage />} />
                <Route path="item-lookup" element={<ItemLookupPage />} />
                <Route
                  path="inventory-sub-department"
                  element={<InventorySubDept />}
                />
                <Route path="inventory-vendor" element={<InventoryVendor />} />
                <Route path="item-report" element={<ItemReport />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="lp-actions" element={<LpActions />} />
                <Route path="forecasting" element={<ForecastPage />} />
                <Route path="quicksight" element={<Dashboard />} />
                <Route path="receivers" element={<ReceiversPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="coupon-sales" element={<CouponSales />} />
                <Route path="categories" element={<Categories />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="sub-dept-margins" element={<SubDeptMargins />} />
                <Route path="cashiers" element={<CashiersPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="tickets" element={<Tickets />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
