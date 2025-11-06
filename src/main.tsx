import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { store } from "./store";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToastProvider } from "./components/toasts/ToastProvider.tsx";

// Pages
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import Home from "./pages/home/Home.tsx";
import Sales from "./pages/sales/Sales.tsx";
import Cashiers from "./pages/cashiers/Cashiers.tsx";

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
                <Route path="cashiers" element={<Cashiers />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
