import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setAvailableEmailDetails,
  setRefresh,
  setUserInfo,
} from "../../../../features/usersSlice";
import { checkEmail, updateUser } from "../../../../api/team";
import type { JsonError } from "../../../../interfaces";
import { roles } from "../../constants";
import Input from "../../../../components/inputs/Input";

const BasicInfoTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const availableLevels = ctx.userLevels.filter((l) => l.id <= ctx.userLevel);

  const handleEmailValidation = () => {
    if (ctx.userInfo.email.length === 0) return;
    const existing = ctx.users.find((u) => u.email === ctx.userInfo.email);
    if (existing && existing.id === ctx.selectedUserId) {
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

  const handleSubmit = () => {
    updateUser(ctx.url, ctx.token, ctx.userInfo, 0, 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User updated successfully, refreshing user list…");
          ctx.dispatch(setRefresh(true));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error updating user: " + err.message),
      );
  };

  return (
    <div className="max-w-[450px]">
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
          setValue={() => {}}
          className="py-1.5 text-[13px] opacity-50 pointer-events-none"
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
      <div className="grid grid-cols-2 gap-3 mb-5">
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

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="text-[12px] font-medium px-4 py-1.5 rounded-md bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 text-custom-white"
        >
          Save changes
        </button>
      </div>
    </div>
  );
};

export default BasicInfoTab;
