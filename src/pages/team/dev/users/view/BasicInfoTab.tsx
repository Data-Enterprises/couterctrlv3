import { useTeamCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  setAvailableEmailDetails,
  setRefresh,
  setUserInfo,
} from "../../../../../features/usersSlice";
import { checkEmail, updateUser } from "../../../../../api/team";
import type { JsonError } from "../../../../../interfaces";
import { roles } from "../../..";
import Input from "../../../../../components/inputs/Input";

const BasicInfoTab = () => {
  const toast = useToast();
  const ctx = useTeamCtx();

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
    <div className="max-w-[440px]">
      <div className="mb-3">
        <div className="text-[11px] font-medium text-content mb-1">Role</div>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() =>
                ctx.dispatch(
                  setUserInfo({ key: "role", value: Number(r.value) }),
                )
              }
              className={`text-[11px] px-3 py-1 rounded-full ${ctx.userInfo.role === Number(r.value) ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[11px] font-medium text-content mb-1">
          User level
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableLevels.map((l) => (
            <button
              key={l.id}
              onClick={() =>
                ctx.dispatch(setUserInfo({ key: "user_level", value: l.id }))
              }
              className={`text-[11px] px-3 py-1 rounded-full ${ctx.userInfo.user_level === l.id ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
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
