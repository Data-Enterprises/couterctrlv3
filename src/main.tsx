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
import SalesTracker from "./pages/salesTracker/SalesTracker.tsx";
import ExportBuilder from "./pages/exportBuilder/ExportBuilder.tsx";
import UpcScanner from "./pages/upcScanner/UpcScanner.tsx";
// Suggested Weight — commented out for publish; dev-API only (see navigation/utils.tsx)
// import Suggested from "./pages/suggested/Suggested.tsx";
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
  SubDeptMarginsPage,
} from "./DevPages.tsx";
import Settings from "./pages/settings/Settings.tsx";
import Dashboard from "./pages/quicksight/Dashboard.tsx";
import Tickets from "./pages/tickets/Tickets.tsx";
import { armPageCalls } from "./utils/pageCalls.ts";
import { armSessionGuard } from "./utils/sessionGuard.ts";

// Before the first render, so nothing is missed — a ticket filed about the
// screen somebody is looking at wants every call that drew it.
armPageCalls();
// A 401 from our API means the session is over -- deactivated, or expired.
// Sign out once, instead of letting every call on the page fail on its own.
armSessionGuard(store);

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
                <Route path="sales-tracker" element={<SalesTracker />} />
                <Route path="sales-export" element={<ExportBuilder />} />
                <Route path="upc-scanner" element={<UpcScanner />} />
                {/* <Route path="suggested-weight" element={<Suggested />} /> */}
                <Route path="forecasting" element={<ForecastPage />} />
                <Route path="quicksight" element={<Dashboard />} />
                <Route path="receivers" element={<ReceiversPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="coupon-sales" element={<CouponSales />} />
                <Route path="categories" element={<Categories />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="sub-dept-margins" element={<SubDeptMarginsPage />} />
                <Route path="cashiers" element={<CashiersPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="tickets" element={<Tickets />} />
                {/* Release Notes was here. Unmounted until the help endpoints
                    are deployed: the page can neither list the notes nor sign
                    a link to one without them, and the bucket prefix they
                    live under is not public the way dev/ and prod/ are.

                    Gone rather than redirected — nobody has it as their
                    last_route, and it was never in the nav, so there is no
                    path left that expects it to answer. ReleaseNotes.tsx is
                    untouched; restoring it is this route and the row in
                    TitleBar. */}
                {/* A last_route saved in user prefs can name a page that no
                    longer exists; land on Sales rather than a blank outlet. */}
                <Route path="*" element={<Navigate to="/sales" replace />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
