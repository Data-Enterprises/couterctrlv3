// Components
import PasswordRules from "../../PasswordRules";
import SetupField from "./SetupField";

interface PasswordStepProps {
  pw: string;
  confirmPw: string;
  onPw: (value: string) => void;
  onConfirmPw: (value: string) => void;
}

/** The new password, held to the four rules, and typed twice. */
const PasswordStep = ({ pw, confirmPw, onPw, onConfirmPw }: PasswordStepProps) => {
  const mismatch = confirmPw.length > 0 && confirmPw !== pw;
  return (
    <div className="space-y-3 mb-4">
      <SetupField id="setup-new-password" label="New password" type="password" value={pw} onChange={onPw} autoComplete="new-password" autoFocus />
      <PasswordRules password={pw} />
      <SetupField id="setup-confirm-password" label="Confirm password" type="password" value={confirmPw} onChange={onConfirmPw} autoComplete="new-password" />
      {mismatch && <p className="text-[12px] text-brand_danger">Passwords don't match</p>}
    </div>
  );
};

export default PasswordStep;
