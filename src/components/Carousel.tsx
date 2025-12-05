import React, { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type CarouselProps = {
  id?: number;
  children: React.ReactNode;
  className?: string;
  showButtons?: boolean;
  useDynamicIndex?: boolean;
  dynamicIndex?: number;
};

const Carousel = ({
  id = 0,
  children,
  className = "bg-custom-white min-h-[300px]",
  showButtons = true,
  useDynamicIndex = false,
  dynamicIndex,
}: CarouselProps) => {
  const [index, setIndex] = useState<number>(0);
  const totalSlides = React.Children.count(children);
  const goTo = (i: number) => setIndex((i + totalSlides) % totalSlides);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (useDynamicIndex && dynamicIndex !== undefined) {
      goTo(dynamicIndex);
    }
  }, [useDynamicIndex, dynamicIndex]);

  const hasMultipleSlides = totalSlides > 1;

  return (
    <div
      data-testid={`carousel-${id}`}
      className={`relative overflow-hidden rounded-lg ${className}`}
    >
      <div
        className="flex transition-transform duration-500"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {React.Children.map(children, (child, i) => (
          <div className="w-full flex-shrink-0" key={i}>
            {child}
          </div>
        ))}
      </div>

      <div
        className={`absolute ${
          !showButtons || !hasMultipleSlides ? "hidden" : ""
        } bottom-0 left-1/2 z-50 -translate-x-1/2 mb-4 flex gap-1`}
      >
        <button
          aria-label="Previous"
          data-testid="carousel-prev-btn"
          onClick={prev}
          className="absolute flex -left-6 top-1/2 -translate-y-1/2 z-10 bg-blue-500/80 hover:bg-panel_active transition-all duration-300 rounded-full p-1 shadow"
        >
          <ChevronLeftIcon className="w-[13px] h-[13px] stroke-custom-white stroke-2 pr-[1px]" />
        </button>
        <button
          aria-label="Next"
          data-testid="carousel-next-btn"
          onClick={next}
          className="absolute flex -right-6 top-1/2 -translate-y-1/2 z-10 bg-blue-500/80 hover:bg-panel_active transition-all duration-300 rounded-full p-1 shadow"
        >
          <ChevronRightIcon className="w-[13px] h-[13px] stroke-custom-white stroke-2 pl-[1px]" />
        </button>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            data-testid={`carousel-btn-${i}`}
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-blue-500" : "bg-panel_active"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
