import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { useAppSelector } from "../hooks";

interface WindowProps {
  isShowing: boolean;
  hide: () => void;
  title: string;
  children: React.ReactNode;
  top?: number;
  left?: number;
  height?: number;
  width?: number;
  showClose?: boolean;
  zIndex?: number;
  window?: string;
  setZIndex?: () => void;
}

const Window = ({
  isShowing = true,
  hide,
  title,
  children,
  top = 100,
  left,
  height,
  width,
  showClose = true,
  zIndex = 50,
  window,
  setZIndex,
}: WindowProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const nav = useAppSelector((state) => state.nav);

  const ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStyle();
  }, []);

  const setStyle = () => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.style.opacity = "1";
      }
    }, 200);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (setZIndex) {
      setZIndex();
    }

    const l = ref.current?.offsetLeft;
    const t = ref.current?.offsetTop;

    const startX = e.pageX;
    const startY = e.pageY;

    const drag = (evt: MouseEvent) => {
      evt.preventDefault();
      if (ref.current) {
        const newL = l! + evt.pageX - startX;
        ref.current.style.left = newL + "px";
        const newT = t! + evt.pageY - startY;
        ref.current.style.top = newT + "px";
      }
    };

    const mouseup = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", mouseup);
    };

    document.addEventListener("mouseup", mouseup);
    document.addEventListener("mousemove", drag);
  };

  const handleClose = () => {
    if (hide) {
      hide();
    }
  };

  return isShowing
    ? createPortal(
        <div
          ref={ref}
          // Hidden may need to change here but keep note of it
          className={`absolute select-none opacity-0 text-content flex flex-col 
            rounded-b-xl rounded-t-2xl bg-custom-white shadow-2xl border-2 border-content/25
            animate-windowIn trans-window ${window}`}
          style={{
            opacity: nav.isNavOpen ? 0.6 : 1,
            zIndex: zIndex,
            width: width,
            height: height,
            top: top,
            left: left,
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            ref={titleRef}
            className={`${
              isDragging ? "bg-blue-200" : "bg-blue-500"
            } cursor-grab w-full min-h-5 items-center flex relative rounded-t-xl`}
          >
            <div className="flex gap-4 w-full py-1 justify-between">
              <span
                className={`text-custom-white font-medium select-none  ${
                  showClose ? "ml-4" : "ml-2"
                }`}
              >
                {title}
              </span>
            </div>
            {showClose ? (
              <span
                onClick={handleClose}
                className=" bg-orange-500 mr-2 p-2 py-1 text-xs text-custom-white rounded-full border border-orange-500
                transition-all duration-300 cursor-pointer hover:bg-orange-200 hover:text-content"
              >
                X
              </span>
            ) : null}
          </div>
          <div className="p-2">{children}</div>
        </div>,
        document.body
      )
    : null;
};

export default Window;
