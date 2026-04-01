import logo from "../../assets/dcr_counterctrl-favicon_32.png";
import { BellIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setIsNavOpen } from "../../features/navSlice";
import { useEffect, useRef } from "react";
import { setUseDev } from "../../features/appSlice";

const TitleBar = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => {
    dispatch(setIsNavOpen(!nav.isNavOpen));
  };

  const width = context.isDesktop ? "w-[202px]" : "";
  const welcomeWidth = context.isDesktop
    ? "w-[calc(100vw-12rem)]"
    : "w-[calc(100vw-3rem)]";

  const handleDevClick = (bool: boolean) => {
    dispatch(setUseDev(bool));
    handleChevronClick();
  };

  const handleChevronClick = () => {
    if (menuRef.current) {
      const display = menuRef.current.getAttribute("data-display");
      menuRef.current.setAttribute(
        "data-display",
        display === "open" ? "close" : "open",
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        (event.target as HTMLElement).id !== "dev-chevron"
      ) {
        menuRef.current.setAttribute("data-display", "close");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      data-testid="title-bar"
      className="h-12 w-full flex cursor-default select-none"
    >
      <div
        data-testid="logo-area"
        className={`${width} flex items-center shadow shadow-content/10 border-r cursor-pointer hover:bg-blue-200 transition-all duration-300`}
        onClick={toggleNav}
      >
        <img src={logo} alt="Logo" className="h-8 w-8 m-2 inline-block" />
        {context.isDesktop && <div className="font-medium">CounterCtrl</div>}
      </div>
      <div
        className={`shadow shadow-content/10 ${welcomeWidth} flex justify-between`}
      >
        <div className="ml-4 flex items-center font-medium">
          Welcome {user.firstName}
        </div>
        <div className="flex items-center h-full">
          <BellIcon className="h-6 w-6 m-2 cursor-pointer hover:text-accent1 transition-colors" />
          {context.isDesktop && (
            <div className="flex items-center px-6 ml-4 border-l-2 relative">
              <div className="text-sm font-medium">{user.username}</div>
              <ChevronDownIcon
                id="dev-chevron"
                className={`${user.userLevel < 9 ? "hidden" : "block"} h-4 w-4 m-2 cursor-pointer hover:text-accent1 transition-colors`}
                onClick={handleChevronClick}
              />
              <div
                ref={menuRef}
                data-display="close"
                className="data-[display=close]:hidden data-[display=open]:block bg-custom-white w-full rounded-b-lg shadow-md absolute left-0 translate-y-[91%] text-[13.5px] text-nowrap"
              >
                <div
                  className={`${context.useDev ? "bg-orange-200 font-medium" : ""} cursor-pointer hover:bg-blue-200 transition-all duration-200 px-2 py-1`}
                  onClick={() => handleDevClick(true)}
                >
                  Use Dev API
                </div>
                <div
                  className={`${!context.useDev ? "bg-orange-200 font-medium" : ""} cursor-pointer hover:bg-blue-200 transition-all duration-200 px-2 py-1 rounded-b-lg`}
                  onClick={() => handleDevClick(false)}
                >
                  Use Prod API
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
