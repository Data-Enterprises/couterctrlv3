import { useRef, useState, useEffect } from "react";

export const useScrollHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (!topRef.current) return;
    const position = topRef.current.getBoundingClientRect().height;
    setHeight(window.innerHeight - position - 80); // 32 for page padding + 48 for the titlebar height
  };

  useEffect(() => {
    calcHeight();

    window.addEventListener("resize", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, []);

  return { height, topRef };
};
