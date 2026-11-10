// Components
import BackLink from "./BackLink";
import FormError from "./FormError";
import StepTitle from "./StepTitle";
import SubmitButton from "./SubmitButton";
import TextField from "./TextField";

interface WhoStepProps {
  username: string;
  email: string;
  onUsername: (value: string) => void;
  onEmail: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Step 1: the username and the email on the account. */
const WhoStep = ({ username, email, onUsername, onEmail, busy, error, onSubmit, onCancel }: WhoStepProps) => (
  <form
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <StepTitle title="Reset your password" sub="Enter your username and the email on your account." />
    <FormError message={error} />
    <TextField id="forgot-username" label="Username" value={username} onChange={onUsername} autoComplete="username" autoFocus disabled={busy} />
    <TextField id="forgot-email" label="Email" type="email" value={email} onChange={onEmail} autoComplete="email" disabled={busy} />
    <SubmitButton label="Continue" busyLabel="Checking…" busy={busy} />
    <BackLink label="Back to sign in" onClick={onCancel} />
  </form>
);

export default WhoStep;
