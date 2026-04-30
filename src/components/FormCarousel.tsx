import React, { useEffect, useState } from "react";

type CarouselProps = {
  id?: number;
  children: React.ReactNode;
  className?: string;
  useDynamicIndex?: boolean;
  dynamicIndex?: number;
  formOptions: string[];
};

const FormCarousel = ({
  id = 0,
  children,
  useDynamicIndex = false,
  dynamicIndex = undefined,
  formOptions,
}: CarouselProps) => {
  const [index, setIndex] = useState<number>(0);
  const forms = React.Children.toArray(children);

  const totalSlides = React.Children.count(children);
  const goTo = (i: number) => setIndex((i + totalSlides) % totalSlides);

  useEffect(() => {
    if (useDynamicIndex && dynamicIndex !== undefined) {
      goTo(dynamicIndex);
    }
  }, [useDynamicIndex, dynamicIndex]);

  return (
    <div
      data-testid={`form-carousel-${id}`}
      className={`relative overflow-hidden rounded-lg w-[25vw] shadow-lg`}
    >
        <div className={`${formOptions.length < 2 ? "hidden" : ""} absolute bg-custom-white grid grid-cols-${formOptions.length} text-sm gap-2 w-full p-2`}>
          {formOptions.map((option, i) => (
            <button key={i} className="text-center btn-themeBlue py-1 px-0" onClick={() => goTo(i)}>
              {option}
            </button>
          ))}
        </div>
      <div
        className={`transition-[height] duration-400 ${formOptions.length < 2 ? "mt-0" : "mt-12"}`}
      >
        {forms[index]}
      </div>
    </div>
  );
};

export default FormCarousel;
