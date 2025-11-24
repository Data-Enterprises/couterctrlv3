import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "../components/toasts/ToastProvider";
import { setupStore } from "../store";

export const renderWithProviders = (
  ui: ReactNode,
  {
    store = setupStore(),
  } = {}
) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ToastProvider autoClose={true} duration={4000}>
          {ui}
        </ToastProvider>
      </MemoryRouter>
    </Provider>
  );
};
