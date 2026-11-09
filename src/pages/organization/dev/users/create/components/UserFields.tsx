// Hooks
import { useEffect } from "react";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useOrganizationCtx } from "../../../hooks";

// Redux
import {
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setUserInfo,
} from "../../../../../../features/dev/devUsersSlice";

// API
import { checkEmail, checkUsername } from "../../../../../../api/team";

// Utils
import { roles } from "../../utils/roles";
import { NOT_AVAILABLE, passwordOk, passwordRules } from "../utils/wizardRules";
import { nextUp } from "../utils";

// Interfaces
import type { JsonError } from "../../../../../../interfaces";

// Components
import Input from "../../../../../../components-dev/inputs/Input";
import PasswordInput from "../../../../../../components-dev/inputs/PasswordInput";
import Section from "./Section";
import Rule from "./Rule";

interface UserFieldsProps {
  /**
   * Told whether the identity half is complete, so the wizard's footer (which
   * owns Continue) can decide.
   */
  onValidityChange?: (valid: boolean) => void;
  /**
   * Editing somebody who already exists; only these change:
   *
   * - **Username is fixed:** `update_user` finds the row by it.
   * - **No Security section:** passwords are set from the users list's key icon.
   * - **Their own email is not "taken":** an unchanged one says so.
   * - **A blank name may stay blank,** so their email can still be fixed.
   */
  editing?: {
    userid: number;
    email: string;
    blankNames?: { first: boolean; last: boolean };
  };
}

/** The first step of the Add or Edit user wizard: Authorization, Identity (username and email, which must be
 *  unique), Name and, when adding, Security. Reports to the wizard whether this step is complete. */
const UserFields = ({ onValidityChange, editing }: UserFieldsProps) => {
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
    if (
      editing &&
      ctx.userInfo.email.trim().toLowerCase() ===
        editing.email.trim().toLowerCase()
    ) {
      ctx.dispatch(
        setAvailableEmailDetails({
          availableEmailText: "- No change",
          emailTextColor: "text-content",
        }),
      );
      return;
    }
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

  /**
   * User info is complete. In Add the password must meet the listed rules, and
   * a username or email marked Not available holds Continue.
   */
  const canContinue =
    ctx.userInfo.username.trim() !== "" &&
    ctx.userInfo.email.trim() !== "" &&
    (ctx.userInfo.first_name.trim() !== "" || !!editing?.blankNames?.first) &&
    (ctx.userInfo.last_name.trim() !== "" || !!editing?.blankNames?.last) &&
    (editing !== undefined ||
      (passwordOk(ctx.userInfo.password) &&
        ctx.userInfo.password === ctx.userInfo.confirm_password)) &&
    (editing !== undefined || ctx.availableUsernameText !== NOT_AVAILABLE) &&
    ctx.availableEmailText !== NOT_AVAILABLE &&
    ctx.userInfo.role > 0 &&
    ctx.userInfo.user_level > 0;

  useEffect(() => {
    onValidityChange?.(canContinue);
  }, [canContinue, onValidityChange]);

  const rules = passwordRules(ctx.userInfo.password);

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
          {editing ? (
            <Input
              label="Username"
              autoComplete="off"
              value={ctx.userInfo.username}
              setValue={() => undefined}
              className="py-2 text-[13px] bg-bkg pointer-events-none"
            />
          ) : (
            <Input
              label="Username"
              autoComplete="off"
              value={ctx.userInfo.username}
              setValue={(v) =>
                ctx.dispatch(setUserInfo({ key: "username", value: v }))
              }
              className="py-2 text-[13px]"
              validateUsername={handleUsernameValidation}
              availableText={ctx.availableUsernameText}
              textColor={ctx.usernameTextColor}
            />
          )}
          <Input
            label="Email"
            autoComplete="off"
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

        <Section
          title="Name"
          desc="Shown in lists and reports."
          last={editing !== undefined}
        >
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

        {!editing && (
        <Section
          title="Security"
          desc="They can change it after first sign-in."
          last
        >
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
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
            autoComplete="new-password"
            text={ctx.userInfo.confirm_password}
            setText={(v) =>
              ctx.dispatch(setUserInfo({ key: "confirm_password", value: v }))
            }
            leftCompare={ctx.userInfo.password}
            rightCompare={ctx.userInfo.confirm_password}
            className="py-2"
          />
        </Section>
        )}
      </form>

      <aside className="flex-1 min-w-[240px] flex flex-col gap-3">
        {!editing && (
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
        )}

        {/* What the next three steps are, so the wizard does not feel like a
            form that has been cut in half with no end in sight. */}
        <section className="bg-custom-white rounded-lg shadow-card px-5 py-4">
          <h3 className="text-[12.5px] font-bold text-content m-0 mb-1.5">
            Next up
          </h3>
          {nextUp(editing !== undefined).map((n) => (
            <div
              key={n.t}
              className="text-[12px] py-1.5 border-t border-gray-100 first:border-t-0"
            >
              <span className="font-semibold text-content">{n.t}</span>
              <span className="text-content/95"> — {n.d}</span>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
};

export default UserFields;
