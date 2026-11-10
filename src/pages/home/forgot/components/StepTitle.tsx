interface StepTitleProps {
  title: string;
  sub?: string;
}

/** A step's heading in the sign-in rail's type, with an optional line under it. */
const StepTitle = ({ title, sub }: StepTitleProps) => (
  <div className="mb-[22px]">
    <h2
      id="forgot-title"
      className="font-display text-[23px] font-extrabold text-portal_navy tracking-[-0.03em] leading-[1.15]"
    >
      {title}
    </h2>
    {sub && <p className="text-[13.5px] text-brand_slate mt-2 leading-[1.6]">{sub}</p>}
  </div>
);

export default StepTitle;
