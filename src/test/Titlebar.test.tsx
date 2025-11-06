import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./utils";
import TitleBar from "../components/navigation/TitleBar";
import SideBar from "../components/navigation/SideBar";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router";
import Sales from "../pages/sales/Sales";
import Home from "../pages/home/Home";
describe("TitleBar and SideBar Components", () => {
  it("should render", () => {
    renderWithProviders(<TitleBar />);
    renderWithProviders(<SideBar />);

    const sideBar = screen.getByTestId("side-bar");
    const titleBar = screen.getByTestId("title-bar");
    expect(sideBar).toBeInTheDocument();
    expect(titleBar).toBeInTheDocument();
  });

  it("should toggle nav open/close when clicking the TitleBar logo area", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TitleBar />);
    renderWithProviders(<SideBar />);
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
    const user = userEvent.setup();
    renderWithProviders(<TitleBar />);
    renderWithProviders(<SideBar />);
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
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SideBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </>
    );

    // Testing here to see if clicking on the sales nav link navigates to the Sales page
    // Seems that the name property reflects the inner text of the link, so be careful here
    const salesLink = screen.getByRole("link", { name: /sales/i });
    await user.click(salesLink);
    expect(await screen.findByTestId("sales-page")).toBeInTheDocument();
  });
});
