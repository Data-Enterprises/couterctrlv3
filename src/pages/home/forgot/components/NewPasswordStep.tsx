// Utils
import { passwordOk } from "../../../../utils/passwordRules";

// Components
import PasswordField from "../../components/PasswordField";
import BackLink from "./BackLink";
import FormError from "./FormError";
import PasswordRules from "./PasswordRules";
import StepTitle from "./StepTitle";
import SubmitButton from "./SubmitButton";

interface NewPasswordStepProps {
  password: string;
  confirm: string;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

/** Step 3: the new password, held to the four rules and typed twice. */
const NewPasswordStep = ({
  password,
  confirm,
  onPassword,
  onConfirm,
  busy,
  error,
  onSubmit,
  onBack,
}: NewPasswordStepProps) => {
  const matches = confirm.length > 0 && confirm === password;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <StepTitle title="Choose a new password" />
      <FormError message={error} />
      <PasswordField
        id="forgot-new-password"
        label="New password"
        value={password}
        onChange={onPassword}
        autoComplete="new-password"
        enterKeyHint="next"
        autoFocus
        disabled={busy}
      />
      <PasswordRules password={password} />
      <PasswordField
        id="forgot-confirm-password"
        label="Confirm password"
        value={confirm}
        onChange={onConfirm}
        autoComplete="new-password"
        enterKeyHint="done"
        disabled={busy}
        invalid={confirm.length > 0 && !matches}
      />
      {confirm.length > 0 && !matches && (
        <p className="-mt-2.5 mb-3 text-[12px] text-brand_danger">Passwords don't match</p>
      )}
      <SubmitButton
        label="Change password"
        busyLabel="Saving…"
        busy={busy}
        disabled={!passwordOk(password) || !matches}
      />
      <BackLink label="Back" onClick={onBack} />
    </form>
  );
};

export default NewPasswordStep;
