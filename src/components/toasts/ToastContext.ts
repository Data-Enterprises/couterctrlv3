import { createContext } from "react";
import { type ToastContextValue } from "./interfaces";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default ToastContext;
