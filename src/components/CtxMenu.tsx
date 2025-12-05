import { useRef, useEffect } from "react";
import { useAppSelector } from "../hooks";
import { useDispatch } from "react-redux";
import { setMenuPosition } from "../features/ctxMenuSlice";
import type { Option, Handlers } from "../interfaces";

interface CopyTextProps {
  className?: string;
  options: Option[];
  handlers: Handlers;
}

/**
 * In the component that uses this, make sure there is a handleRightClick
 * function that dispatches the setMenuPosition action using event.pageX and event.pageY
 * If any values need to be set for the onClick property of the options, set them there
 */

const CtxMenu = ({ className = "", options, handlers }: CopyTextProps) => {
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const context = useAppSelector((state) => state.ctxMenu);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        dispatch(setMenuPosition(null));
      }
    };

    if (context.menuPosition) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [context.menuPosition, dispatch]);

  const topOrBottom = (i: number, arr: Option[]) => {
    if (i === 0) {
      return "rounded-t-md border-b border-b-content/40";
    } else if (i === arr.length - 1) {
      return "rounded-b-md";
    }
    return "border-b border-b-content/40";
  };

  const handleClick = (fn: Handlers, key: keyof Handlers, value: string) => {
    if (fn[key]) {
      fn[key](value);
    }
  };

  return (
    <>
      {context.menuPosition ? (
        <div
          ref={menuRef}
          data-testid="ctx-menu"
          className={`fixed bg-bkg border border-content/30 rounded-md shadow-lg text-content cursor-pointer select-none w-[150px]`}
          style={{
            top: context.menuPosition.y,
            left: context.menuPosition.x,
            zIndex: 2000,
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className={`${className} ${topOrBottom(
                index,
                options
              )} text-[14px] transition-all duration-300`}
            >
              <div
                data-testid={`ctx-menu-option-${index}`}
                className={`flex w-full px-3 py-0.5 justify-between items-center`}
                onClick={() =>
                  handleClick(
                    handlers,
                    option.key,
                    option.value ? option.value : ""
                  )
                }
              >
                {option.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default CtxMenu;
