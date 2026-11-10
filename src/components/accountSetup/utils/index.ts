// Interfaces
import type { SetupStep } from "../interfaces";

/** Each step's heading. */
export const STEP_TITLE: Record<SetupStep, string> = {
  password: "Set a new password",
  security: "Set a security question",
};

/** The line under each step's heading. */
export const STEP_BLURB: Record<SetupStep, string> = {
  password: "Your account requires a password change before you continue.",
  security: "Used to verify it's you if you ever need to reset your password.",
};

/** The app's field: brand_line_2 border, brand_navy focus. */
export const FIELD =
  "w-full px-3 py-2 text-[13.5px] text-content bg-custom-white border border-brand_line_2 rounded-lg outline-none transition-colors placeholder:text-brand_placeholder focus:border-brand_navy focus:shadow-[0_0_0_3px_rgb(var(--color-brand-navy)/0.15)]";

/** The app's field label. */
export const LABEL = "block text-[12px] font-semibold mb-1.5 text-content";
