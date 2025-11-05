import { useContext } from "react";
import ToastContext from "../ToastContext";
import { type ToastContextValue, type ToastOptions } from "../interfaces";

export const useToastImplementation = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be called within a ToastProvider");
  }
  return context;
};

export const useToast = () => {
  const { addToast } = useToastImplementation();

  return {
    success: (message: string, options?: ToastOptions) => addToast("success", message, options),
    error: (message: string, options?: ToastOptions) => addToast("error", message, options),
    info: (message: string, options?: ToastOptions) => addToast("info", message, options),
    warning: (message: string, options?: ToastOptions) => addToast("warning", message, options),
    warn: (message: string, options?: ToastOptions) => addToast("warning", message, options),
  };
};
