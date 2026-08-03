import type { ReactNode } from "react";
import SlideArt1 from "./art/SlideArt1";
import SlideArt2 from "./art/SlideArt2";
import SlideArt3 from "./art/SlideArt3";
import SlideArt5 from "./art/SlideArt5";

/** Every word on the public portal, lifted verbatim from the 2026-07-31 design
 *  handoff. Kept in one file so copy can be edited without opening a component,
 *  and so a future CMS swap only has to replace this module.
 *
 *  Titles are stored as segments rather than an HTML string: the handoff marks
 *  emphasis with <em>, and rendering that would mean dangerouslySetInnerHTML.
 *  Segments give the same result with no injection surface. */

export interface TitleSegment {
  text: string;
  /** Rendered in the brand green, non-italic — matches `.slide h2 em`. */
  em?: boolean;
}

/** Grade chips reuse the product's semantic colours. `neutral` is the plain
 *  outlined chip; the other three are Critical/Watch/OK and must not be
 *  repurposed decoratively (HANDOFF §6). */
export type ChipTone = "neutral" | "critical" | "watch" | "ok";

export interface PortalSlide {
  key: string;
  eyebrow: string;
  title: TitleSegment[];
  sub: string;
  chips: { text: string; tone: ChipTone }[];
  art: ReactNode;
  cta?: string;
}

const n = (text: string) => ({ text, tone: "neutral" as const });

export const SLIDES: PortalSlide[] = [
  {
    key: "what",
    eyebrow: "What is CounterCtrl Cloud?",
    title: [
      { text: "Transaction data, turned into a " },
      { text: "short list", em: true },
      { text: " worth looking at." },
    ],
    sub: "Your sales come in overnight. CounterCtrl reads them, compares every location, department and item to last week and last year, and hands your team the handful of numbers that actually need attention.",
    chips: [n("All in one place"), n("Ready by morning"), n("Down to the item")],
    art: <SlideArt1 />,
  },
  {
    key: "do",
    eyebrow: "What you can do with it",
    title: [
      { text: "Four questions a week, " },
      { text: "answered four ways.", em: true },
    ],
    sub: "Sales and performance against last week and last year. Loss prevention scored on each location's own baseline. Margin decliners ranked by points lost. Any list of items, trended and exportable.",
    chips: [n("Sales"), n("Loss prevention"), n("Margin"), n("Items")],
    art: <SlideArt2 />,
  },
  {
    key: "grades",
    eyebrow: "How it grades",
    title: [
      { text: "The problems " },
      { text: "find you", em: true },
      { text: ", not the other way around." },
    ],
    sub: "Every location, department and item is scored against a threshold you control. Anything outside it rises to the top, so nobody reads a forty-page report looking for the one line that matters.",
    chips: [
      { text: "Critical", tone: "critical" },
      { text: "Watch", tone: "watch" },
      { text: "OK", tone: "ok" },
    ],
    art: <SlideArt3 />,
  },
  {
    key: "who",
    eyebrow: "Who it's for",
    title: [
      { text: "If your registers produce data, " },
      { text: "it's worth reading.", em: true },
    ],
    sub: "Built for operators running more than one location, and for the people who work the numbers — store and district managers, merchandising, loss prevention, marketing and the front office.",
    chips: [],
    art: <SlideArt5 />,
    // The Field Notes CTA used to live on a seventh "Item Scan" slide. That
    // slide was cut in the Aug 2026 revision and its CTA moved here, so the
    // carousel still ends on a way into the blog.
    cta: "Read the latest in Field Notes →",
  },
];

export const MISSION = {
  label: "Mission",
  lead: "To simplify retail operations by transforming data into ",
  emphasis: "actionable intelligence",
  tail: " that helps our customers make better decisions every day.",
};

/** Top-right company nav. `cta` renders as the filled green button. */
export const TOP_NAV: { key: string; label: string; cta?: boolean }[] = [
  { key: "about", label: "About" },
  { key: "notes", label: "Field Notes" },
  { key: "demo", label: "Book a walkthrough", cta: true },
];

export const SIGN_IN_COPY = {
  heading: "Sign in to your account",
  subheading: "Overnight sales are loaded and graded.",
  usernameLabel: "Username",
  usernamePlaceholder: "firstname.lastname",
  passwordLabel: "Password",
  passwordPlaceholder: "••••••••••",
  remember: "Remember me",
  forgot: "Forgot password?",
  submit: "Sign in",
  submitting: "Signing in…",
  note: "New here? Your admin can add you.",
};
