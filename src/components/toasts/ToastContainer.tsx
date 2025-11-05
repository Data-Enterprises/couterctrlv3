import { type ToastContainerProps } from "./interfaces";
import Toast from "./Toast";

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-0 left-0 z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClick={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;
