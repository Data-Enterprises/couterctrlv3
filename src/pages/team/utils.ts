import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector } from "../../hooks";
import zxcvbn from "zxcvbn";

export const useTeamErrorCheck = () => {
  const toast = useToast();
  const { userInfo, users, selectedUserId } = useAppSelector(
    (state) => state.users
  );

  const validateCreateUserInfo = (): boolean => {
    const passwordStrength = zxcvbn(userInfo.password).score;
    const findUsername = users.find(
      (user) => user.username.toLowerCase() === userInfo.username.toLowerCase()
    );

    if (findUsername && selectedUserId === 0) {
      toast.warn("Username already exists");
      return false;
    }
    if (!userInfo.username) {
      toast.warn("Please enter a username");
      return false;
    }
    if (!userInfo.email) {
      toast.warn("Please enter an email address");
      return false;
    }
    if (!userInfo.first_name) {
      toast.warn("Please enter a first name");
      return false;
    }
    if (!userInfo.last_name) {
      toast.warn("Please enter a last name");
      return false;
    }
    if (userInfo.password !== userInfo.confirm_password) {
      toast.warn("Passwords do not match");
      return false;
    }
    if (userInfo.role === 0) {
      toast.warn("Please select a role");
      return false;
    }
    if (userInfo.user_level === 0) {
      toast.warn("Please select a user level");
      return false;
    }
    if (passwordStrength < 2) {
      toast.warn("Please enter at least a moderately safe password");
      return false;
    }
    return true;
  };

  return { validateCreateUserInfo };
};
