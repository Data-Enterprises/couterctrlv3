import Input from "../../../components/inputs/Input";
import { renderWithProviders } from "../../utils";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

const user = userEvent.setup();
const MockComponent = () => {
  const [value, setValue] = useState<string>("");
  return (
    <div>
      <Input value={value} setValue={setValue} label="Test" type="text" />
    </div>
  );
};

describe("Input Component", () => {
  it("should handle interactions", async () => {
    renderWithProviders(<MockComponent />);
    const input = await screen.findByTestId("input-test");
    await user.type(input, "Hello");
    expect(input).toHaveValue("Hello");
  });
});
