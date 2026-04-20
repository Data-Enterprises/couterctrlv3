import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { store } from "./store";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToastProvider } from "./components/toasts/ToastProvider.tsx";

// Pages
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import Home from "./pages/home/Home.tsx";
import Sales from "./pages/sales/Sales.tsx";
import Team from "./pages/team/Team.tsx";
import Groups from "./pages/groups/Groups.tsx";
import LossPrevention from "./pages/lossPrevention/LossPrevention.tsx";
import Settings from "./pages/settings/Settings.tsx";
import UpcList from "./pages/upc/UpcList.tsx";
import ItemLookup from "./pages/lookup/ItemLookup.tsx";
import Forecasting from "./pages/forecast/Forecasting.tsx";
import Dashboard from "./pages/quicksight/Dashboard.tsx";
import Receivers from "./pages/receivers/Receivers.tsx";
import Coupons from "./pages/coupons/Coupons.tsx";
import AdminPage from "./pages/admin/AdminPage.tsx";
import SubDeptMargins from "./pages/subDepts/SubDeptMargins.tsx";
import Cashiers from "./pages/cashiers/Cashiers.tsx";
import Orders from "./pages/orders/Orders.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider autoClose={true} duration={4000}>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="sales" element={<Sales />} />
                <Route path="team" element={<Team />} />
                <Route path="loss-prevention" element={<LossPrevention />} />
                <Route path="groups" element={<Groups />} />
                <Route path="settings" element={<Settings />} />
                <Route path="upc-upload" element={<UpcList />} />
                <Route path="item-lookup" element={<ItemLookup />} />
                <Route path="forecasting" element={<Forecasting />} />
                <Route path="quicksight" element={<Dashboard />} />
                <Route path="receivers" element={<Receivers />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="sub-dept-margins" element={<SubDeptMargins />} />
                <Route path="cashiers" element={<Cashiers />} />
                <Route path="orders" element={<Orders />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
