import LoadingIndicator from "../../../components/loading/LoadingIndicator";

interface StepThreeProps {
  className?: string;
}
const StepThree = ({ className = "" }: StepThreeProps) => {
  return (
    <div className={`${className} relative`}>
      <LoadingIndicator />
    </div>
  );
};

export default StepThree;
