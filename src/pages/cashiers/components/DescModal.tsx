import { useState } from "react";
import Modal from "../../../components/Modal";

interface DescModalProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: (description: string) => void;
}

const DescModal = ({ open, onClose, handleSubmit }: DescModalProps) => {
  const [desc, setDesc] = useState<string>("");

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div>
        <label htmlFor="desc-input" className="font-medium text-sm pl-0.5">
          What are you looking for?
        </label>
        <input
          id="desc-input"
          className="basic-input focus:border bg-custom-white"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="flex mt-4 gap-2">
        <button className="btn-themeBlue w-1/2" onClick={() => handleSubmit(desc)}>Submit</button>
        <button className="btn-themeOrange w-1/2" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default DescModal;
