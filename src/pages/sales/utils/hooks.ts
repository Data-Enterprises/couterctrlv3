import { useState, useEffect, useRef } from "react";

export const useStyling = () => {
  const [style, setStyle] = useState<string>("px-2 py-0.5");
  const [text, setText] = useState<string>("text-sm");

  useEffect(() => {
    const updateStyle = () => {
      if (window.innerWidth > 1536) {
        setStyle("px-4 py-1 mt-2");
        setText("text-[15px]");
      } else {
        setText("text-sm");
        setStyle("px-2 py-0.5");
      }
    };
    updateStyle();
    window.addEventListener("resize", updateStyle);
    return () => {
      window.removeEventListener("resize", updateStyle);
    };
  }, []);

  return { style, text };
};

export const useHeight = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => {
      if (gridRef.current) {
        const newHeight = gridRef.current.getBoundingClientRect().height;
        let mult = 0.676;
        if (window.innerWidth < 1537) {
          mult = 0.63;
        }
        const newHeight75 = newHeight * mult;
        setHeight(newHeight75);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);
  return { gridRef, height };
};
