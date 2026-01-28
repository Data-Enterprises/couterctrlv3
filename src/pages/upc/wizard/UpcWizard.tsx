import React from "react";

type CarouselProps = {
  children: React.ReactNode;
  className?: string;
  index: number;
};

const UpcWizard = ({
  children,
  className = "h-[540px]",
  index,
}: CarouselProps) => {
  return (
    <div
      className={`relative overflow-hidden bg-custom-white rounded-lg transition-all duration-500 ${className}`}
    >
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
    </div>
  );
};

export default UpcWizard;
