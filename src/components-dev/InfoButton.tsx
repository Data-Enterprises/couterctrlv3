// Solid, not outline. The filled glyph is what gives the "?" its light fill
// against the navy; the outline variant is stroke-only and reads as empty.
// Utils
import { GLYPH, SHELL } from "./utils";

// Components
import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";

interface InfoButtonProps {
  /** Optional: Sub Dept Margins opens its legend on hover from the wrapper,
   *  so the button itself has nothing to handle. */
  onClick?: () => void;
  /** Defaults to "About this view"; override where the panel isn't a view. */
  title?: string;
  className?: string;
  /**
   * Which surface it sits on.
   *
   * "navy" is the desktop panel header this was written for. "light" is the
   * white card the mobile screens use, where the navy styling renders a white
   * glyph on white — which is why those screens had started hand-rolling their
   * own copy, exactly the drift this component exists to stop.
   */
  variant?: "navy" | "light";
}

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
const InfoButton = ({
  onClick,
  title = "About this view",
  className,
  variant = "navy",
}: InfoButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`flex items-center justify-center transition-colors ${SHELL[variant]} ${className ?? ""}`}
  >
    <QuestionMarkCircleIcon className={GLYPH[variant]} />
  </button>
);

export default InfoButton;
