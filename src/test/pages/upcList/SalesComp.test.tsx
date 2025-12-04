import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpcList from "../../../pages/upc/wizard/UpcList";
import { renderWithProviders } from "../../utils";
// import { useToast } from "../../../components/toasts/hooks/useToast";

const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
  }),
}));

describe("SalesComp Module in UpcList", () => {
  it("should render SalesComp module when selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UpcList />);

    const upcWizardContainer = await screen.findByTestId("upcwizard-container");
    expect(upcWizardContainer).toBeInTheDocument();

    const upcFileInput = await screen.findByTestId("upc-file-input");
    expect(upcFileInput).toBeInTheDocument();

    // Try uploading a non-CSV file first to trigger the warning
    const notCsvFile = new File(["not,a,csv,file"], "not_a_csv.txt", {
      type: "text/plain",
    });

    user.upload(upcFileInput, notCsvFile);
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select a valid CSV file"
      );
    });

    // Now upload a valid CSV file
    await user.upload(upcFileInput, notCsvFile);
    const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
      type: "text/csv",
    });

    await user.upload(upcFileInput, csvFile);

    const input = upcFileInput as HTMLInputElement;
    expect(input.files?.[0]).toBe(csvFile);

    const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
    expect(nextBtn).toBeInTheDocument();
    await user.click(nextBtn);
  });
});
