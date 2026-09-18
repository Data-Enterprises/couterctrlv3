import { useEffect, useState } from "react";

export const useResizeContext = (alt: string) => {
  const [height, setHeight] = useState<string>("min-h-28 max-h-28");
  const [scrollHeight, setInnerHeight] = useState<string>("min-h-24 max-h-24");

  useEffect(() => {
    const calcHeight = () => {
      if (alt === "") {
        // setHeight("min-h-40 max-h-40");
        // setInnerHeight("min-h-40 max-h-40");

        // setHeight("min-h-20");
        // setInnerHeight("min-h-20");

        setHeight("min-h-8 max-h-44");
        setInnerHeight("min-h-8 max-h-44");
        return;
      }
      if (window.innerWidth < 1537) {
        setHeight("min-h-[86px] max-h-[86px]");
        setInnerHeight("min-h-[82px] max-h-[82px]");
      } else {
        const newHeight =
          alt === "large" ? "min-h-40 max-h-40" : "min-h-28 max-h-28 mb-3";
        const newInnerHeight =
          alt === "large" ? "min-h-40 max-h-40" : "min-h-24 max-h-24";
        setHeight(newHeight);
        setInnerHeight(newInnerHeight);
      }
    };

    window.addEventListener("resize", calcHeight);
    calcHeight();
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, []);

  return {
    height,
    scrollHeight,
  };
};
