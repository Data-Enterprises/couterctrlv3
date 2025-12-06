import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useDispatch } from "react-redux";
import { setForecastOption } from "../../../../features/upcSlice";

type CarouselProps = {
  children: React.ReactNode;
  className?: string;
  payloadAction?: (payload: string) => void;
  idxOffset?: number;
};

const MetricsCarousel = ({ children, className = "" }: CarouselProps) => {
  const dispatch = useDispatch();
  const [index, setIndex] = useState<number>(0);
  const totalSlides = React.Children.count(children);
  const goTo = (i: number) => setIndex((i + totalSlides) % totalSlides);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    dispatch(setForecastOption(index < 2 ? "quantity" : "sales"));
  }, [index]);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div
        className="flex transition-transform duration-500"
        style={{
          transform: `translateX(-${index * 100}%)`, // Slide left by 100% per index
        }}
      >
        {React.Children.map(children, (child, i) => (
          <div className="w-full flex-shrink-0" key={i}>
            {child}
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2.5 flex gap-2"
        style={{ zIndex: 1000 }}
      >
        <button
          aria-label="Previous"
          data-testid="metrics-carousel-prev-btn"
          onClick={prev}
          className="absolute -left-9 top-1/2 -translate-y-1/2 z-10 bg-panel_active/70 hover:bg-panel_active transition-all duration-300 rounded-full p-1 shadow"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          aria-label="Next"
          data-testid="metrics-carousel-next-btn"
          onClick={next}
          className="absolute -right-9 top-1/2 -translate-y-1/2 z-10 bg-panel_active/70 hover:bg-panel_active transition-all duration-300 rounded-full p-1 shadow"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            data-testid={`metrics-carousel-circle-btn-${i}`}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-blue-500" : "bg-panel_active"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MetricsCarousel;
