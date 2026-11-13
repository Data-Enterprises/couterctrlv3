/** The avatar menu's drop shadow, in the app's navy. */
export const MENU_SHADOW =
  "0 12px 32px rgb(var(--color-brand-navy) / 0.16), 0 2px 6px rgb(var(--color-brand-navy) / 0.08)";

/** One segment of a menu toggle, picked or not. */
export const segmentClass = (on: boolean) =>
  `min-w-[60px] h-7 px-3 rounded-md text-[12px] font-semibold transition-colors disabled:cursor-not-allowed ${
    on ? "bg-brand_navy text-custom-white" : "text-content hover:bg-brand_navy/[0.06]"
  }`;
