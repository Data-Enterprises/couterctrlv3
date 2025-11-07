import { useState, useEffect } from "react";

export const useStyling = () => {
  const [style, setStyle] = useState<string>("");
  const [text, setText] = useState<string>("");

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