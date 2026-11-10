import { NavLink } from "react-router";
import type { NavCategory } from "../../interfaces";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setLastRoute, setIsNavOpen } from "../../../../features/navSlice";

interface CategoryNavListProps {
  openCategory: string | null;
  setOpenCategory: (category: string | null) => void;
  visibleCategories: NavCategory[];
  canSee: (userLevels: string[], href?: string | undefined) => boolean;
  activeCategory: NavCategory | undefined;
  handleCategoryEnter: (category: string) => void;
  handleCategoryLeave: () => void;
}

const CategoryNavList = ({
  openCategory,
  setOpenCategory,
  visibleCategories,
  canSee,
  activeCategory,
  handleCategoryEnter,
  handleCategoryLeave,

}: CategoryNavListProps) => {
  const onNavy = useAppSelector((state) => state.app.apiEnv === "dev");
  const dispatch = useAppDispatch();

  return (
    <div className="flex items-stretch gap-0.5 px-2">
      {visibleCategories.map((cat) => {
        const isActive = activeCategory?.name === cat.name;
        const isOpen = openCategory === cat.name;
        const visiblePages = cat.pages.filter(
          (p) => canSee(p.userLevels, p.href) && p.isVisible,
        );
        return (
          <div
            key={cat.name}
            className="relative flex items-stretch"
            onMouseEnter={() => handleCategoryEnter(cat.name)}
            onMouseLeave={handleCategoryLeave}
          >
            <button
              // Navy now carries the ACTIVE category rather than the
              // whole bar — the same job it does on the mobile tab bar.
              className={`flex items-center gap-1.5 px-3 text-[12px] transition-colors rounded-md my-1.5 ${
                onNavy
                  ? isActive
                    ? "bg-custom-white/15 text-custom-white font-semibold"
                    : "text-custom-white/85 font-medium hover:text-custom-white hover:bg-custom-white/10"
                  : isActive
                    ? "bg-brand_navy/8 text-brand_navy font-semibold"
                    : "text-content/85 font-medium hover:text-content hover:bg-bkg"
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.name}
              <ChevronDownIcon
                className={`h-3 w-3 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`absolute left-0 top-full z-50 transition-all duration-150 ${
                isOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
              style={{ minWidth: 170 }}
            >
              <div
                className="mt-1 bg-custom-white border border-gray-200 rounded-md overflow-hidden"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
                {visiblePages.map((page) => (
                  <NavLink
                    key={page.href}
                    to={page.href}
                    onClick={() => {
                      setOpenCategory(null);
                      dispatch(setLastRoute(page.href));
                      dispatch(setIsNavOpen(false));
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                        isActive
                          ? "bg-gray-50 text-brand_navy font-medium"
                          : "text-content hover:bg-gray-50"
                      }`
                    }
                  >
                    <page.icon className="h-3.5 w-3.5 text-content/40 flex-shrink-0" />
                    {page.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryNavList;
