import { useAppSelector, useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { setUserInfo } from "../../../../../features/usersSlice";
import { updateUser } from "../../../../../api/team";
import type { JsonError } from "../../../../../interfaces";
import Input from "../../../../../components/inputs/Input";

const UpdateUserInfo = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useAppSelector((state) => state.users);
  const { url, token } = useAppSelector((state) => state.app);

  const handleUserUpdate = () => {
    const found = ctx.users.filter((u) => u.id === ctx.selectedUserId)[0];
    updateUser(
      url,
      token,
      ctx.userInfo,
      found.security || 0,
      found.template || 0,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User updated successfully");
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error updating user: " + err.message),
      );
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-3 bg-custom-white rounded-xl shadow-lg ">
      <Input
        label="Username"
        value={ctx.userInfo.username}
        setValue={(val) =>
          dispatch(setUserInfo({ key: "username", value: val }))
        }
        className="opacity-75 pointer-events-none"
      />
      <Input
        label="Email"
        value={ctx.userInfo.email}
        setValue={(val) => dispatch(setUserInfo({ key: "email", value: val }))}
      />
      <Input
        label="First Name"
        value={ctx.userInfo.first_name}
        setValue={(val) =>
          dispatch(setUserInfo({ key: "first_name", value: val }))
        }
      />
      <Input
        label="Last Name"
        value={ctx.userInfo.last_name}
        setValue={(val) =>
          dispatch(setUserInfo({ key: "last_name", value: val }))
        }
      />
      <div className="col-span-2">
        <button
          className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow w-full"
          onClick={handleUserUpdate}
        >
          Update Basic Info
        </button>
      </div>
    </div>
  );
};

export default UpdateUserInfo;
