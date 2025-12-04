import { describe, expect, it, vi, type Mock } from "vitest";
import { screen } from "@testing-library/react";
// import SalesComp from "../../../pages/upc/modules/SalesComp";
import UpcList from "../../../pages/upc/wizard/UpcList";
import { renderWithProviders } from "../../utils";

describe("SalesComp Module in UpcList", () => {
  it("should render SalesComp module when selected", async () => {
    renderWithProviders(<UpcList />);
  });
});