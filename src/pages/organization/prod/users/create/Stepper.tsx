interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  current: number;
  completed: Set<number>;
  onStepClick: (id: number) => void;
}

const Stepper = ({ steps, current, completed, onStepClick }: StepperProps) => {
  return (
    <div className="w-[150px] flex-shrink-0 flex flex-col gap-1 border-r border-gray-100 p-2">
      {steps.map((step) => {
        const isActive = step.id === current;
        const isDone = completed.has(step.id);
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold ${
                isActive || isDone ? "bg-[#1e2a4a] text-custom-white" : "bg-gray-200 text-content"
              }`}
            >
              {isDone ? "✓" : step.id}
            </span>
            <span className={`text-[11px] ${isActive ? "font-semibold text-[#1e2a4a]" : isDone ? "text-content" : "text-content/40"}`}>
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Stepper;
