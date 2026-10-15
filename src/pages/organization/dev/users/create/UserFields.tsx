import { useEffect, type ReactNode } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setUserInfo,
} from "../../../../../features/dev/devUsersSlice";
import { checkEmail, checkUsername } from "../../../../../api/team";
import type { JsonError } from "../../../../../interfaces";
import { roles } from "../../constants";
import Input from "../../../../../components-dev/inputs/Input";
import PasswordInput from "../../../../../components-dev/inputs/PasswordInput";

interface UserFieldsProps {
  /**
   * Told whether the identity half is complete, so the page that owns the
   * submit can decide for itself. The fields carry no button of their own:
   * the wizard's footer owns Continue, and it answers to these fields on step
   * one and to the access panel on step three.
   */
  onValidityChange?: (valid: boolean) => void;
}

/**
 * One block of the form: what it is on the left, the fields on the right.
 *
 * The left column says why the section exists rather than repeating the field
 * labels — "What this user can do across the app" tells you more about Role
 * and Level than the word Authorization does.
 */
const Section = ({
  title,
  desc,
  last = false,
  children,
}: {
  title: string;
  desc: string;
  last?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`flex flex-wrap gap-x-8 gap-y-3 px-5 py-3.5 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <div className="flex-1 min-w-[150px] max-w-[200px]">
      <h3 className="text-[12.5px] font-bold text-content m-0">{title}</h3>
      <p className="text-[11.5px] text-content/85 leading-snug mt-1 mb-0">
        {desc}
      </p>
    </div>
    <div className="flex-[999] min-w-[300px] grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

/** A rule, and whether the password meets it yet. Live rather than a static
 *  list: a tick that never moves is decoration. */
const Rule = ({ met, children }: { met: boolean; children: ReactNode }) => (
  <div className="flex items-center gap-2 text-[12px] py-1">
    <CheckIcon
      className={`w-4 h-4 flex-shrink-0 ${
        met ? "text-severity_healthy_text" : "text-content/85 opacity-40"
      }`}
    />
    <span className={met ? "text-content" : "text-content/85"}>{children}</span>
  </div>
);

const NEXT_UP = [
  { t: "Access type", d: "by group or by store" },
  { t: "Assignments", d: "pick groups or stores" },
  { t: "Review", d: "check and create" },
];

const UserFields = ({ onValidityChange }: UserFieldsProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const availableLevels = ctx.userLevels.filter((l) => l.id <= ctx.userLevel);

  const handleUsernameValidation = () => {
    if (ctx.userInfo.username.length === 0) return;
    checkUsername(ctx.url, ctx.token, ctx.userInfo.username)
      .then((resp) => {
        const j = resp.data;
        ctx.dispatch(
          setAvailableUsernameDetails(
            j.error === 0
              ? {
                  availableUsernameText: "- Available",
                  usernameTextColor: "text-emerald-600",
                }
              : {
                  availableUsernameText: "- Not available",
                  usernameTextColor: "text-red-600",
                },
          ),
        );
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleEmailValidation = () => {
    if (ctx.userInfo.email.length === 0) return;
    checkEmail(ctx.url, ctx.token, ctx.userInfo.email)
      .then((resp) => {
        const j = resp.data;
        ctx.dispatch(
          setAvailableEmailDetails(
            j.error === 0
              ? {
                  availableEmailText: "- Available",
                  emailTextColor: "text-emerald-600",
                }
              : {
                  availableEmailText: "- Not available",
                  emailTextColor: "text-red-600",
                },
          ),
        );
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const canContinue =
    ctx.userInfo.username.trim() !== "" &&
    ctx.userInfo.email.trim() !== "" &&
    ctx.userInfo.first_name.trim() !== "" &&
    ctx.userInfo.last_name.trim() !== "" &&
    ctx.userInfo.password.length > 0 &&
    ctx.userInfo.password === ctx.userInfo.confirm_password &&
    ctx.userInfo.role > 0 &&
    ctx.userInfo.user_level > 0;

  useEffect(() => {
    onValidityChange?.(canContinue);
  }, [canContinue, onValidityChange]);

  const pw = ctx.userInfo.password;
  const rules = [
    { met: pw.length >= 12, label: "At least 12 characters" },
    {
      met: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
      label: "Upper and lower case",
    },
    { met: /[0-9]/.test(pw), label: "At least one number" },
    { met: /[^A-Za-z0-9]/.test(pw), label: "At least one symbol" },
  ];

  return (
    <div className="flex flex-wrap gap-5 items-start">
      <form className="flex-[999] min-w-[520px] bg-custom-white rounded-lg shadow-card">
        <Section
          title="Authorization"
          desc="What this user can do across the app."
        >
          <div>
            <label className="text-[12px] font-semibold text-content mb-1.5 block">
              Role
            </label>
            <select
              value={ctx.userInfo.role || ""}
              onChange={(e) =>
                ctx.dispatch(
                  setUserInfo({ key: "role", value: Number(e.target.value) }),
                )
              }
              className="basic-input w-full bg-custom-white py-2 text-[13px]"
            >
              <option value="" disabled>
                Select role
              </option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-content mb-1.5 block">
              Level
            </label>
            <select
              value={ctx.userInfo.user_level || ""}
              onChange={(e) =>
                ctx.dispatch(
                  setUserInfo({
                    key: "user_level",
                    value: Number(e.target.value),
                  }),
                )
              }
              className="basic-input w-full bg-custom-white py-2 text-[13px]"
            >
              <option value="" disabled>
                Select level
              </option>
              {availableLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Identity" desc="How they sign in. Both must be unique.">
          <Input
            label="Username"
            value={ctx.userInfo.username}
            setValue={(v) =>
              ctx.dispatch(setUserInfo({ key: "username", value: v }))
            }
            className="py-2 text-[13px]"
            validateUsername={handleUsernameValidation}
            availableText={ctx.availableUsernameText}
            textColor={ctx.usernameTextColor}
          />
          <Input
            label="Email"
            value={ctx.userInfo.email}
            setValue={(v) =>
              ctx.dispatch(setUserInfo({ key: "email", value: v }))
            }
            className="py-2 text-[13px]"
            validateEmail={handleEmailValidation}
            availableText={ctx.availableEmailText}
            textColor={ctx.emailTextColor}
          />
        </Section>

        <Section title="Name" desc="Shown in lists and reports.">
          <Input
            label="First name"
            value={ctx.userInfo.first_name}
            setValue={(v) =>
              ctx.dispatch(setUserInfo({ key: "first_name", value: v }))
            }
            className="py-2 text-[13px]"
          />
          <Input
            label="Last name"
            value={ctx.userInfo.last_name}
            setValue={(v) =>
              ctx.dispatch(setUserInfo({ key: "last_name", value: v }))
            }
            className="py-2 text-[13px]"
          />
        </Section>

        <Section
          title="Security"
          desc="They can change it after first sign-in."
          last
        >
          <PasswordInput
            label="Password"
            name="password"
            text={ctx.userInfo.password}
            setText={(v) =>
              ctx.dispatch(setUserInfo({ key: "password", value: v }))
            }
            leftCompare={ctx.userInfo.password}
            rightCompare={ctx.userInfo.confirm_password}
            className="py-2"
          />
          <PasswordInput
            label="Confirm password"
            name="confirm_password"
            text={ctx.userInfo.confirm_password}
            setText={(v) =>
              ctx.dispatch(setUserInfo({ key: "confirm_password", value: v }))
            }
            leftCompare={ctx.userInfo.password}
            rightCompare={ctx.userInfo.confirm_password}
            className="py-2"
          />
        </Section>
      </form>

      <aside className="flex-1 min-w-[240px] flex flex-col gap-3">
        <section className="bg-custom-white rounded-lg shadow-card px-5 py-4">
          <h3 className="text-[12.5px] font-bold text-content m-0 mb-1.5">
            Password rules
          </h3>
          {rules.map((r) => (
            <Rule key={r.label} met={r.met}>
              {r.label}
            </Rule>
          ))}
        </section>

        {/* What the next three steps are, so the wizard does not feel like a
            form that has been cut in half with no end in sight. */}
        <section className="bg-custom-white rounded-lg shadow-card px-5 py-4">
          <h3 className="text-[12.5px] font-bold text-content m-0 mb-1.5">
            Next up
          </h3>
          {NEXT_UP.map((n) => (
            <div
              key={n.t}
              className="text-[12px] py-1.5 border-t border-gray-100 first:border-t-0"
            >
              <span className="font-semibold text-content">{n.t}</span>
              <span className="text-content/85"> — {n.d}</span>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
};

export default UserFields;
