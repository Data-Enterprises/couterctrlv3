interface ButtonsProps {
  isReady: () => boolean;
  handleNext: () => void;
  handleBack: () => void;
  btnText?: string;
}

const Buttons = ({
  isReady,
  handleNext,
  handleBack,
  btnText = "Back",
}: ButtonsProps) => {
  return (
    <div className="flex gap-4 justify-center w-3/4">
      <div className={`btn-themeBlue w-1/2 text-center`} onClick={handleBack}>
        {btnText}
      </div>
      <div
        className={`${
          isReady()
            ? "btn-themeGreen"
            : "btn-themeOrange opacity-40 pointer-events-none"
        } w-1/2 text-center`}
        onClick={handleNext}
      >
        Next
      </div>
    </div>
  );
};

export default Buttons;
