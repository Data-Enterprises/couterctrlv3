import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, className = "", children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
    data-testid="modal" 
      className={`fixed ${className} inset-0 bg-black bg-opacity-50 flex items-center justify-center `}
      style={{ zIndex: 1000 }}
    >
      <div
        ref={modalRef}
        className="bg-custom-white p-4 ml-12 rounded-xl shadow-xl"
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
