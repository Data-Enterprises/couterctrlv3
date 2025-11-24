import type { ReactNode } from "react";
import type { ToastAnimationType, ToastType } from "../types";

export interface ToastProviderProps {
  children: ReactNode;
  autoClose?: boolean;
  duration?: number;
}

export interface ToastOptions {
  useIcon?: boolean;
  autoClose?: boolean;
  duration?: number; // in milliseconds
  animationType?: ToastAnimationType;
}

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  options?: ToastOptions;
}

export interface ToastContextValue {
  addToast: (type: ToastType, message: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}
