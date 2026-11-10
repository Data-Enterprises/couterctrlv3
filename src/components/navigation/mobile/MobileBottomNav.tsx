// Hooks
import { useAppDispatch } from "../../../hooks";

// Redux
import { setIsNavOpen, setLastRoute } from "../../../features/navSlice";

// Interfaces
import type { NavCategory } from "../interfaces";

// Components
import NavSheet from "./components/NavSheet";

interface MobileBottomNavProps {
  openCategory: string | null;
  setOpenCategory: (category: string | null) => void;
  visibleCategories: NavCategory[];
  canSee: (userLevels: string[], href?: string | undefined) => boolean;
  activeCategory: NavCategory | undefined;
}

const MobileBottomNav = ({
  openCategory,
  setOpenCategory,
  visibleCategories,
  canSee,
  activeCategory,
}: MobileBottomNavProps) => {
  const dispatch = useAppDispatch();
  const currentPath = location.pathname.replace(/^\//, "");

  const handleMobileNavClick = (href: string) => {
    dispatch(setLastRoute(href));
    dispatch(setIsNavOpen(false));
    setOpenCategory(null);
  };
  return (
    <>
      {/* Bottom sheet — animated slide-up/down */}
      {openCategory &&
        (() => {
          const cat = visibleCategories.find((c) => c.name === openCategory);
          if (!cat) return null;
          // No href passed, so no desk exception: Tickets is
          // `mobile: false` and this list drops it either way.
          const visiblePages = cat.pages.filter(
            (p) => canSee(p.userLevels) && p.mobile,
          );
          return (
            <NavSheet
              key={cat.name}
              cat={cat}
              visiblePages={visiblePages}
              onClose={() => setOpenCategory(null)}
              onNavigate={handleMobileNavClick}
              currentPath={currentPath}
            />
          );
        })()}

      {/* Bottom tab bar */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-custom-white border-t border-gray-200 flex"
        style={{ height: 56 }}
      >
        {visibleCategories.map((cat) => {
          const isActive = activeCategory?.name === cat.name;
          const isOpen = openCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setOpenCategory(isOpen ? null : cat.name)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{
                color:
                  isActive || isOpen
                    ? "rgb(var(--color-brand-navy))"
                    : "rgb(var(--color-brand-navy) / 0.35)",
              }}
            >
              <cat.icon className="h-5 w-5" />
              <span className="text-[9px] font-medium">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default MobileBottomNav;
