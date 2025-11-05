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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider autoClose={true} duration={4000}>
            <Routes>
              <Route path="/" element={<App />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
