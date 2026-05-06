import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setForgotPassword } from "../../../features/appSlice";
import { resetForgotPasswordSlice } from "../../../features/forgotPasswordSlice";

import Modal from "../../../components/Modal";
import Carousel from "../../../components/Carousel";
import EmailVerify from "./EmailVerify";
import SecurityAnswer from "./SecurityAnswer";
import NewPassword from "./NewPassword";

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);
  const [height, setHeight] = useState<string>("h-[250px]");

  useEffect(() => {
    if (forgot.index === 0) {
      setHeight("h-[205px]");
    } else if (forgot.index === 1) {
      setHeight("h-[190px]");
    } else if (forgot.index === 2) {
      setHeight("h-[177px]");
    }
  }, [forgot.index]);

  const onClose = () => {
    dispatch(setForgotPassword(false));
    dispatch(resetForgotPasswordSlice());
  };

  return (
    <Modal
      modalClassName="ml-0 bg-custom-white max-w-md w-full"
      isOpen={context.showForgotPassword}
      onClose={onClose}
    >
      <Carousel
        id={1}
        className={`bg-custom-white ${height} transition-all duration-500`}
        showButtons={false}
        useDynamicIndex={true}
        dynamicIndex={forgot.index}
      >
        <EmailVerify />
        <SecurityAnswer />
        <NewPassword onClose={onClose} />
      </Carousel>
    </Modal>
  );
};

export default ForgotPassword;
