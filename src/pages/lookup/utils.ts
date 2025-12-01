import { useState, useRef, useEffect } from "react";

export const useHeight = () => {
  const [height, setHeight] = useState<number>(400);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const calculateHeight = () => {
      const vh = window.innerHeight;
      // navbar + padding + header + buttons + margin + clear button
      const offset = 56 + 40 + 32 + 48 + 16 + 48 + 55;
      const availableHeight = vh - offset;
      setHeight(availableHeight);
    };
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
  }, []);
  return { height, topRef, bottomRef };
};
