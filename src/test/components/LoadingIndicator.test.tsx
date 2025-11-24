import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";

describe("LoadingIndicator Component", () => {
  it("should render with default message", () => {
    render(<LoadingIndicator />);
    const loadingElement = screen.getByTestId("loading-indicator");
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveTextContent("Loading...");
  });

  it("should render with custom message", () => {
    const customMessage = "Loading Your Data...";
    render(<LoadingIndicator message={customMessage} />);
    const loadingElement = screen.getByTestId("loading-indicator");
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveTextContent(customMessage);
  });

  it("should apply custom className with default message", () => {
    const customClass = "mock-class";
    render(<LoadingIndicator className={customClass} />);
    const loadingElement = screen.getByTestId("loading-indicator");
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveClass(customClass);
    expect(loadingElement).toHaveTextContent("Loading...");
  });

  it("should render with custom className and custom message", () => {
    const customMessage = "Please wait...";
    const customClass = "mock-class";
    render(
      <LoadingIndicator message={customMessage} className={customClass} />
    );
    const loadingElement = screen.getByTestId("loading-indicator");
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveClass(customClass);
    expect(loadingElement).toHaveTextContent(customMessage);
  });
});
