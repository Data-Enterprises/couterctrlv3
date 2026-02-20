import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import type { JsonError } from "../../../interfaces";
import { resetUserSecurityQuestion } from "../../../api/team";

const ResetSecurityForm = () => {
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, selectedUserId } = useAppSelector((state) => state.users);

  const resetSecurity = () => {
    resetUserSecurityQuestion(url, token, selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error resetting security question: " + err.message);
      });
  };

  return (
    <div className="h-[30vh] bg-custom-white mt-4 rounded-lg shadow-lg">
      {!selectedUserId ? (
        <div className="h-full flex justify-center items-center">
          <div className="font-medium">
            No user selected. Please select one.
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col justify-center items-center">
          <div className="font-medium text-center">
            Resetting security question flag for user - {userInfo.username}
          </div>
          <div className="font-medium text-center">
            They will be prompted to reset their security question
          </div>
          <div className="font-medium text-center">on their next login</div>
          <button
            className={`btn-themeGreen w-1/2 mt-4`}
            onClick={resetSecurity}
          >
            Reset Security
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetSecurityForm;
