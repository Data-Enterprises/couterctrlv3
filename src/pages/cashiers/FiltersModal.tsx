import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setFilterModalOpen } from "../../features/cashierSlice";
import Modal from "../../components/Modal";

const FiltersModal = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);
  const [text, setText] = useState<string>("");

  const handleClose = () => dispatch(setFilterModalOpen(false));

  console.log(text);

  const renderFilter = () => {
    if (cashier.filterType !== "Total Sales" && cashier.filterType !== "Price Type") {
      return <TextFilter text={text} setText={setText} />;
    } else if (cashier.filterType === "Price Type") {
      return <PriceTypeFilter />;
    } else if (cashier.filterType === "Total Sales") {
      return <TotalSalesFilter />;
    }
  };

  return (
    <Modal
      isOpen={cashier.filterModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/5"
    >
      <div className="font-medium text-center text-lg">
        Set {cashier.filterType} Filter
      </div>
      {renderFilter()}
      <div className="flex gap-4">
        <button className="btn-themeGreen w-full">Filter</button>
        <button className="btn-themeOrange w-full" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

interface TextFilterProps {
  text: string;
  setText: (text: string) => void;
}

const TextFilter = ({ text, setText }: TextFilterProps) => {
  return (
    <input
      type="text"
      className="basic-input focus:border my-4 bg-custom-white"
      value={text}
      onChange={(e) => setText(e.currentTarget.value)}
    />
  );
};

const PriceTypeFilter = () => {

  return (
    <div>
      <div>Price Type Filter Component</div>
    </div>
  )
};

const TotalSalesFilter = () => {
  return (
    <div>
      <div>Total Sales Filter Component</div>
    </div>
  )
};

export default FiltersModal;
