import { ErrorIcon, WarningIcon, InfoIcon, SuccessIcon } from "./Icons";
import { type ToastProps } from "./interfaces";
import { useRef, useEffect } from "react";

interface ToastCmpProps {
  toast: ToastProps;
  onClick: () => void;
}

const Toast = ({ toast, onClick }: ToastCmpProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const { message, type, options } = toast;
  const { useIcon = true, autoClose, duration } = options || {};

  useEffect(() => {
    let progress = 100;
    const amountToDecrease = 100 / (duration! / 100);
    if (progressRef.current) {
      const interval = setInterval(() => {
        if (progress > 0) {
          if (progressRef.current) {
            progress -= amountToDecrease;
            progressRef.current!.style.width = `${progress}%`;
          } else {
            clearInterval(interval);
          }
        } else {
          clearInterval(interval);
        }
      }, 100);
    }
  }, []);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <SuccessIcon />;
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
  };
  return (
    <div
      query-id={toast.id}
      style={{ zIndex: 5000}}
      className="flex flex-col justify-content-between items-center mb-2 md:ml-16 border rounded-lg cursor-pointer min-h-[34px] animate-slidein shadow-lg bg-custom-white"
      onClick={onClick}
    >
      <div className="flex w-full">
        {useIcon ? (
          <div
            className={`flex rounded-l-lg toast-${type} h-[57px] place-items-center justify-center px-4 border-r border-white`}
          >
            {getIcon()}
          </div>
        ) : null}
        <div className="flex flex-col w-full">
          <div className={`uppercase border-b border-white pl-2 toast-${type} rounded-tr-lg w-full`}>{type}</div>
          <div data-testid="toast-message" className="pl-2 pr-8 py-1 font-medium bg-custom-white text-content">
            {message}
          </div>
        </div>
      </div>

      {autoClose ? (
        <div className="w-4/5 mt-1 mb-1 bg-slate-300 rounded-full h-2.5 ml-2 mr-2">
          <div
            ref={progressRef}
            className={`toast-${type} h-2.5 rounded-full transition-all`}
            style={{ width: "100%" }}
          ></div>
        </div>
      ) : null}
    </div>
  );
};

export default Toast;
