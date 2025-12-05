import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Carousel from "../../components/Carousel";

const user = userEvent.setup();

describe("Carousel Component", () => {
  it("should render with children", () => {
    render(
      <Carousel>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Carousel>
    );
    const carousel = screen.getByTestId("carousel-0");
    expect(carousel).toBeInTheDocument();
    expect(carousel).toHaveTextContent("Slide 1");
    expect(carousel).toHaveTextContent("Slide 2");
  });

  it("should handle slide changing", async () => {
    render(
      <Carousel>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Carousel>
    );

    const btn1 = screen.getByTestId("carousel-btn-0");
    const btn2 = screen.getByTestId("carousel-btn-1");
    expect(btn1).toBeInTheDocument();
    expect(btn2).toBeInTheDocument();

    await user.click(btn2);
    expect(btn2).toHaveClass("bg-blue-500");
    expect(btn1).toHaveClass("bg-panel_active");
    const nextBtn = screen.getByTestId("carousel-next-btn");
    const prevBtn = screen.getByTestId("carousel-prev-btn");
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn).toBeInTheDocument();

    await user.click(nextBtn);
    await user.click(prevBtn);
  });

  it("should handle dynamic index", async () => {
    render(
      <Carousel useDynamicIndex={true} dynamicIndex={1}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Carousel>
    );
  });

  it("should hide buttons when showButtons is false", () => {
    render(
      <Carousel useDynamicIndex={true} dynamicIndex={1} showButtons={false}>
        <div>Slide 1</div>
      </Carousel>
    );
  });
});
