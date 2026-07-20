import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setUserInfo,
} from "../../../../features/usersSlice";
import { checkEmail, checkUsername } from "../../../../api/team";
import type { JsonError } from "../../../../interfaces";
import { roles } from "../../constants";
import Input from "../../../../components/inputs/Input";
import PasswordInput from "../../../../components/inputs/PasswordInput";

interface StepUserInfoProps {
  onContinue: () => void;
}

const StepUserInfo = ({ onContinue }: StepUserInfoProps) => {
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

  return (
    <div className="min-w-[500px] max-w-[500px]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Authorization
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[11px] font-medium text-content mb-1 block">
            Role
          </label>
          <select
            value={ctx.userInfo.role || ""}
            onChange={(e) =>
              ctx.dispatch(
                setUserInfo({ key: "role", value: Number(e.target.value) }),
              )
            }
            className="basic-input w-full bg-custom-white py-1.5 text-[13px]"
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
          <label className="text-[11px] font-medium text-content mb-1 block">
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
            className="basic-input w-full bg-custom-white py-1.5 text-[13px]"
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
      </div>

      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Identity
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input
          label="Username"
          value={ctx.userInfo.username}
          setValue={(v) =>
            ctx.dispatch(setUserInfo({ key: "username", value: v }))
          }
          className="py-1.5 text-[13px]"
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
          className="py-1.5 text-[13px]"
          validateEmail={handleEmailValidation}
          availableText={ctx.availableEmailText}
          textColor={ctx.emailTextColor}
        />
      </div>

      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Name
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input
          label="First name"
          value={ctx.userInfo.first_name}
          setValue={(v) =>
            ctx.dispatch(setUserInfo({ key: "first_name", value: v }))
          }
          className="py-1.5 text-[13px]"
        />
        <Input
          label="Last name"
          value={ctx.userInfo.last_name}
          setValue={(v) =>
            ctx.dispatch(setUserInfo({ key: "last_name", value: v }))
          }
          className="py-1.5 text-[13px]"
        />
      </div>

      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Security
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <PasswordInput
          label="Password"
          name="password"
          text={ctx.userInfo.password}
          setText={(v) =>
            ctx.dispatch(setUserInfo({ key: "password", value: v }))
          }
          leftCompare={ctx.userInfo.password}
          rightCompare={ctx.userInfo.confirm_password}
          className="py-1.5"
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
          className="py-1.5"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${canContinue ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepUserInfo;
