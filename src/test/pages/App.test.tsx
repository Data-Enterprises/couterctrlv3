import { renderWithProviders } from "../utils";
import { describe, it, expect} from 'vitest';
import App from "../../App";
import { setupStore } from "../../store";
import { setIsDesktop, setIsMobile, setLoggedIn } from "../../features/appSlice";

const store = setupStore();
store.dispatch(setIsMobile(true));
store.dispatch(setIsDesktop(false));
describe("App Component", () => {
  it("should handle mobile container style", async () => {
    renderWithProviders(<App />, { store });
  });

  it("should handle styling for after login", async () => {
    store.dispatch(setLoggedIn(true));
    renderWithProviders(<App />, { store });
  });
});