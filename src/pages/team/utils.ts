import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector } from "../../hooks";
import zxcvbn from "zxcvbn";

export const useTeamErrorCheck = () => {
  const toast = useToast();
  const userInfo = useAppSelector((state) => state.users.userInfo);

  const validateCreateUserInfo = (): boolean => {
    const passwordStrength = zxcvbn(userInfo.password).score;
    if (userInfo.password !== userInfo.confirm_password) {
      toast.warn("Passwords do not match");
      return false;
    } else if (!userInfo.username) {
      toast.warn("Please enter a username");
      return false;
    } else if (userInfo.role === 0) {
      toast.warn("Please select a role");
      return false;
    } else if (userInfo.user_level === 0) {
      toast.warn("Please select a user level");
      return false;
    } else if (userInfo.company === 0) {
      toast.warn("Please select a company");
      return false;
    } else if (!userInfo.email) {
      toast.warn("Please enter an email address");
      return false;
    } else if (!userInfo.first_name) {
      toast.warn("Please enter a first name");
      return false;
    } else if (!userInfo.last_name) {
      toast.warn("Please enter a last name");
      return false;
    } else if (passwordStrength < 2) {
      toast.warn("Please enter at least a moderately safe password");
      return false;
    }
    return true;
  };

  return { validateCreateUserInfo };
};
