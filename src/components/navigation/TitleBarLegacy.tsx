import logo from "../../assets/dcr_counterctrl-favicon_32.png";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setIsNavOpen } from "../../features/navSlice";
import { toggleDevMode } from "../../features/appSlice";

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
    : "w-[calc(100vw-3rem)]";

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
        <img src={logo} alt="Logo" className="h-8 w-8 m-2 inline-block" />
        {context.isDesktop && <div className="font-medium">CounterCtrl</div>}
      </div>
      <div
        className={`shadow shadow-content/10 ${welcomeWidth} flex justify-between`}
      >
        <div className="ml-4 text-[12px] md:text-sm flex items-center justify-between font-medium w-full relative">
          <div>Welcome {user.firstName}</div>
        </div>
        <div className="flex items-center h-full gap-2 pr-2">
          {user.role === 9 && (
            <button
              onClick={() => dispatch(toggleDevMode())}
              className="flex items-center gap-0 rounded-full overflow-hidden border border-content/20 text-[10px] font-bold select-none"
              title={context.devMode ? "Switch to PROD" : "Switch to DEV"}
            >
              <span className={`px-2.5 py-1 transition-colors ${!context.devMode ? "bg-[#1e2a4a] text-white" : "text-content/40"}`}>
                PROD
              </span>
              <span className={`px-2.5 py-1 transition-colors ${context.devMode ? "bg-emerald-500 text-white" : "text-content/40"}`}>
                DEV
              </span>
            </button>
          )}
          {context.isDesktop && (
            <div className="flex items-center px-6 ml-4 border-l-2 relative">
              <div className="text-[12px] md:text-sm font-medium">{user.username}</div>
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
