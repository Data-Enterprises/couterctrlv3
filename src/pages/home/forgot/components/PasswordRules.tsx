// Utils
import { passwordRules } from "../../../../utils/passwordRules";

interface PasswordRulesProps {
  password: string;
}

/** The four rules Add user enforces, ticking off as the new password is typed. */
const PasswordRules = ({ password }: PasswordRulesProps) => (
  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 -mt-1 mb-4 text-[12.5px]" aria-label="Password rules">
    {passwordRules(password).map((rule) => (
      <li
        key={rule.label}
        className={`flex items-center gap-1.5 ${rule.met ? "text-brand_green_dark" : "text-brand_slate"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 flex-none"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth={rule.met ? 2.4 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {rule.met ? <path d="M5 12l5 5 9-10" /> : <circle cx="12" cy="12" r="7" />}
        </svg>
        <span>
          {rule.label}
          <span className="sr-only">{rule.met ? " (met)" : " (not met)"}</span>
        </span>
      </li>
    ))}
  </ul>
);

export default PasswordRules;
