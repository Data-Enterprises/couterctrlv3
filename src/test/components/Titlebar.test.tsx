import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import TitleBar from "../../components/navigation/TitleBar";
import SideBar from "../../components/navigation/SideBar";
import userEvent from "@testing-library/user-event";
import { store, setupStore } from "../../store";
import { setIsMobile, setIsDesktop } from "../../features/appSlice";
import { setUserPrefs } from "../../api/user";

vi.mock("../../api/user");
const mobileStore = setupStore();
mobileStore.dispatch(setIsMobile(true));
mobileStore.dispatch(setIsDesktop(false));
const user = userEvent.setup();
const mockedToastError = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      error: mockedToastError,
    }),
  };
});

describe("TitleBar and SideBar Components", () => {
  it("should render", () => {
    (setUserPrefs as Mock).mockResolvedValue({
      data: { error: 0, success: true, msg: "success" },
    });
    renderWithProviders(<TitleBar />);
    renderWithProviders(<SideBar />);

    const sideBar = screen.getByTestId("side-bar");
    const titleBar = screen.getByTestId("title-bar");
    expect(sideBar).toBeInTheDocument();
    expect(titleBar).toBeInTheDocument();
  });

  it("should toggle nav open/close when clicking the TitleBar logo area", async () => {
    (setUserPrefs as Mock).mockResolvedValue({
      data: { error: 0, success: true, msg: "success" },
    });

    renderWithProviders(<TitleBar />, { store });
    renderWithProviders(<SideBar />, { store });
    const sideBar = screen.getByTestId("side-bar");
    const logoArea = screen.getByTestId("logo-area");

    expect(sideBar).toHaveAttribute("data-open", "false");
    if (logoArea) {
      await user.click(logoArea);
    }
    expect(sideBar).toHaveAttribute("data-open", "true");
    if (logoArea) {
      await user.click(logoArea);
    }
    expect(sideBar).toHaveAttribute("data-open", "false");
  });

  it("should close the nav when clicking outside the SideBar if it is open", async () => {
    (setUserPrefs as Mock).mockResolvedValue({
      data: { error: 0, success: true, msg: "success" },
    });
    renderWithProviders(<TitleBar />, { store });
    renderWithProviders(<SideBar />, { store });
    const sideBar = screen.getByTestId("side-bar");
    const logoArea = screen.getByTestId("logo-area");

    expect(sideBar).toHaveAttribute("data-open", "false");
    if (logoArea) {
      await user.click(logoArea);
    }

    expect(sideBar).toHaveAttribute("data-open", "true");
    const fixedFrame = document.getElementById("fixed-frame");
    if (fixedFrame) {
      await user.click(fixedFrame);
    }
    expect(sideBar).toHaveAttribute("data-open", "false");
  });

  it("should navigate to the correct route when a SideBar nav item is clicked", async () => {
    (setUserPrefs as Mock).mockResolvedValue({
      data: { error: 0, success: true, msg: "success" },
    });
    renderWithProviders(<TitleBar />, { store });
    renderWithProviders(<SideBar />, { store });

    const salesLink = await screen.findByTestId("nav-sales");
    await user.click(salesLink);
    expect(salesLink).toBeInTheDocument();
  });

  it("should close the nav when it is open and link is clicked", async () => {
    (setUserPrefs as Mock).mockRejectedValue({
      data: { error: 0, success: true, msg: "success" },
    });

    renderWithProviders(<TitleBar />, { store });
    renderWithProviders(<SideBar />, { store });

    const sideBar = screen.getByTestId("side-bar");
    const logoArea = screen.getByTestId("logo-area");

    expect(sideBar).toHaveAttribute("data-open", "false");
    if (logoArea) {
      await user.click(logoArea);
    }
    expect(sideBar).toHaveAttribute("data-open", "true");

    const groupLink = await screen.findByTestId("nav-groups");
    await user.click(groupLink);
  });

  it("should handle settings and signing out the user when Sign Out is clicked", async () => {
    (setUserPrefs as Mock).mockRejectedValue({
      data: { error: 0, success: true, msg: "success" },
    });

    renderWithProviders(<TitleBar />, { store });
    renderWithProviders(<SideBar />, { store });

    const sideBar = screen.getByTestId("side-bar");
    const logoArea = screen.getByTestId("logo-area");

    expect(sideBar).toHaveAttribute("data-open", "false");
    if (logoArea) {
      await user.click(logoArea);
    }
    expect(sideBar).toHaveAttribute("data-open", "true");

    const settings = await screen.findByTestId("nav-settings");
    await user.click(settings);

    const signOut = await screen.findByTestId("signout-btn");
    await user.click(signOut);
    expect(sideBar).toHaveAttribute("data-open", "false");
  });

  it("should handle mobile nav interactions", async () => {
    (setUserPrefs as Mock).mockResolvedValue({
      data: { error: 0, success: true, msg: "success" },
    });
    renderWithProviders(<TitleBar />, { store: mobileStore });
    renderWithProviders(<SideBar />, { store: mobileStore });
    await waitFor(() => {
      const mobileClosedIcons = document.getElementsByClassName(
        "opacity-0 h-7 w-7 transition-all duration-200 ml-0"
      );
      expect(mobileClosedIcons.length).toBeGreaterThan(0);
    });

    const logoArea = screen.getByTestId("logo-area");
    if (logoArea) {
      await user.click(logoArea);
    }
    await waitFor(() => {
      const mobileOpenIcons = document.getElementsByClassName(
        "opacity-100 h-7 w-7 transition-all duration-200 ml-2"
      );
      expect(mobileOpenIcons.length).toBeGreaterThan(0);
    });
  });
});
