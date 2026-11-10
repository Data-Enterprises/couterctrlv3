// Components
import StepTitle from "./StepTitle";

interface DoneStepProps {
  onSignIn: () => void;
}

/** The password changed: back to sign in, with the username filled in. */
const DoneStep = ({ onSignIn }: DoneStepProps) => (
  <div>
    <div
      aria-hidden="true"
      className="w-11 h-11 rounded-full bg-brand_green_tint text-brand_green_dark flex items-center justify-center mb-[18px]"
    >
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-10" />
      </svg>
    </div>
    <StepTitle title="Password changed" sub="Sign in with your new password. Your username is filled in for you." />
    <button
      type="button"
      data-testid="forgot-back-to-sign-in"
      onClick={onSignIn}
      autoFocus
      className="w-full flex items-center justify-center font-display font-semibold text-[15px] text-custom-white bg-portal_navy rounded-lg px-[18px] py-3 transition-colors hover:bg-portal_navy_hover cursor-pointer"
    >
      Back to sign in
    </button>
  </div>
);

export default DoneStep;
