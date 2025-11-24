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
import Cashiers from "./pages/cashiers/Cashiers.tsx";
import Settings from "./pages/settings/Settings.tsx";

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
                <Route path="cashiers" element={<Cashiers />} />
                <Route path="groups" element={<Groups />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
