interface ButtonsProps {
  isReady: () => boolean;
  handleNext: () => void;
  handleBack: () => void;
  btnText?: string;
  slide: number;
}

const Buttons = ({
  isReady,
  handleNext,
  handleBack,
  btnText = "Back",
  slide,
}: ButtonsProps) => {
  return (
    <div className="flex gap-4 justify-center w-3/4">
      <div data-testid={`upc-wizard-back-btn-${slide}`} className={`btn-themeBlue w-1/2 text-center`} onClick={handleBack}>
        {btnText}
      </div>
      <div
        data-testid={`upc-wizard-next-btn-${slide}`}
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
