// Solid, not outline. The filled glyph is what gives the "?" its light fill
// against the navy; the outline variant is stroke-only and reads as empty.
import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";

/**
 * The "?" button in a navy panel header.
 *
 * Eleven panels had drifted into four different versions of this — some with
 * raw `border-custom-white`, some at /50 opacity instead of /75, one with a smaller
 * icon and no border colour at all. The styling lives here so there's one to
 * change.
 *
 * Deliberately renders the button and nothing else: the popovers it opens are
 * absolutely positioned against whatever container each page already
 * establishes, and wrapping the button in its own `relative` would silently
 * re-anchor them.
 */
interface InfoButtonProps {
  /** Optional: Sub Dept Margins opens its legend on hover from the wrapper,
   *  so the button itself has nothing to handle. */
  onClick?: () => void;
  /** Defaults to "About this view"; override where the panel isn't a view. */
  title?: string;
  /**
   * Which surface it sits on. `navy` is the panel header this was built for;
   * `light` is the same button on a white card, where the white-on-navy
   * treatment would be invisible.
   *
   * A variant rather than a className override: the base classes already set
   * a colour and a border, and appending a competing one leaves which wins to
   * the order Tailwind happens to emit.
   */
  tone?: "navy" | "light";
  className?: string;
}

const TONE = {
  navy: "border-custom-white/20 text-custom-white/75 hover:text-custom-white hover:border-custom-white/40",
  light: "border-gray-200 text-content/85 hover:text-content hover:border-gray-400",
};

const InfoButton = ({
  onClick,
  title = "About this view",
  tone = "navy",
  className,
}: InfoButtonProps) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`w-[22px] h-[22px] flex items-center justify-center rounded border transition-colors ${TONE[tone]} ${className ?? ""}`}
  >
    <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
  </button>
);

export default InfoButton;
