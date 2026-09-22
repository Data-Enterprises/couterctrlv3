import logo from "../../../assets/portal/logo.webp";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppDispatch } from "../../../hooks/index";
import { useLegacySelector as useAppSelector } from "../../hooks";
import { setIsNavOpen } from "../../../features/navSlice";
import { setUiMode } from "../../../features/appSlice";
const TitleBarLegacy = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);

  const toggleNav = () => {
    dispatch(setIsNavOpen(!nav.isNavOpen));
  };

  const width = context.isDesktop ? "w-[202px]" : "";
  const welcomeWidth = context.isDesktop
    ? "w-[calc(100vw-12rem)]"
    : "w-[calc(100vw-8.2rem)]";

  return (
    <div
      data-testid="title-bar"
      className="h-12 w-full flex cursor-default select-none transition-all duration-200"
    >
      <div
        data-testid="logo-area"
        className={`${width} flex items-center shadow shadow-content/10 border-r cursor-pointer hover:bg-blue-200 transition-all duration-300`}
        onClick={toggleNav}
      >
        {/* The wordmark already reads "CounterCtrl Cloud", so the adjacent
            text label is gone — it was also too wide to fit alongside it in
            the 202px logo area. */}
        <img
          src={logo}
          alt="CounterCtrl Cloud"
          className="h-7 w-auto m-2 block"
        />
      </div>
      <div
        className={`shadow shadow-content/10 ${welcomeWidth} flex justify-end`}
      >
        {context.isDesktop ? (
          <div className="ml-4 text-[12px] md:text-sm flex items-center justify-between font-medium w-full relative">
            <div>Welcome {user.firstName}</div>
          </div>
        ) : null}
        <div className="flex items-center h-full gap-2 pr-2">
          {/* The way back. This bar replaces the live one while Legacy is on,
              and the View switch that got you here went with it — without this
              the only exit is a reload. Level 9, the same gate as the switch
              in the live avatar menu. */}
          {user.userLevel >= 9 ? (
            <button
              onClick={() => dispatch(setUiMode("live"))}
              className="flex items-center gap-0 rounded-full overflow-hidden border border-content/20 text-[10px] font-bold select-none"
              title="Switch to Live"
            >
              <span className="px-2.5 py-1 text-content/40 transition-colors">
                LIVE
              </span>
              <span className="px-2.5 py-1 bg-amber-500 text-custom-white transition-colors">
                LEGACY
              </span>
            </button>
          ) : null}
          {context.isDesktop && (
            <div className="flex items-center px-6 ml-4 border-l-2 relative">
              <div className="text-[12px] md:text-sm font-medium">
                {user.username}
              </div>
              <ChevronDownIcon
                id="dev-chevron"
                className={`h-4 w-4 m-2 cursor-pointer hover:text-accent1 transition-colors`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleBarLegacy;
