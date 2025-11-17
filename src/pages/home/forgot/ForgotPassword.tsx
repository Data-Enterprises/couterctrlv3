import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError } from "../../../interfaces";
import { setForgotPassword } from "../../../features/appSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { resetForgotPassword } from "../../../api/password";

import {
  setNewPassword,
  resetForgotPasswordState,
} from "../../../features/forgotPasswordSlice";

import Modal from "../../../components/Modal";
import Carousel from "../../../components/Carousel";
import TextInput from "../../../components/TextInput";
import EmailVerify from "./EmailVerify";
import SecurityAnswer from "./SecurityAnswer";

const ForgotPassword = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);
  const [height, setHeight] = useState<string>("h-[250px]");

  useEffect(() => {
    if (forgot.index === 0) {
      setHeight("h-[250px]");
    } else if (forgot.index === 1) {
      setHeight("h-[190px]");
    } else if (forgot.index === 2) {
      setHeight("h-[169px]");
    }
  }, [forgot.index]);

  const setPasswordText = (text: string) => {
    dispatch(setNewPassword(text));
  };

  // For when the modal closes
  const onClose = () => {
    dispatch(setForgotPassword(false));
    dispatch(resetForgotPasswordState());
  };

  const submitNewPassword = () => {
    resetForgotPassword(context.url, forgot.username, forgot.newPassword)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
          onClose();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <Modal
      modalClassName="ml-0 bg-bkg max-w-md w-full"
      isOpen={context.showForgotPassword}
      onClose={onClose}
    >
      <Carousel
        className={`bg-bkg ${height} transition-all duration-500`}
        showButtons={false}
        useDynamicIndex={true}
        dynamicIndex={forgot.index}
      >
        <EmailVerify />
        <SecurityAnswer />

        {/* Reset Password Section */}
        <div className="h-[169px] px-2">
          <div className="font-medium text-center">Reset Password</div>
          <div className="text-center">
            Once updated, sign in with your new password
          </div>
          <TextInput
            query={forgot.newPassword}
            name="forgot-password"
            isSimple={true}
            type="password"
            title="Password"
            setText={setPasswordText}
          />
          <button
            className="btn-themeBlue w-full mt-4"
            onClick={submitNewPassword}
          >
            Change Password
          </button>
        </div>
      </Carousel>
    </Modal>
  );
};

export default ForgotPassword;
