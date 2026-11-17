interface SignalFindingProps {
  /** The explorer's reading of what the signal means. */
  finding: string;
  /** One or a few cashiers own it, so it reads as behaviour, not a bad tag. */
  isBehaviour: boolean;
}

/** The band over a signal's transactions that says what it likely is. */
const SignalFinding = ({ finding, isBehaviour }: SignalFindingProps) => (
  <div
    className={`px-4 py-2 border-b border-line_hair flex-shrink-0 ${
      isBehaviour ? "bg-severity_critical_bg" : "bg-severity_watch_bg"
    }`}
  >
    <p
      className={`text-[11.5px] leading-relaxed ${
        isBehaviour ? "text-severity_critical_text" : "text-severity_watch_text"
      }`}
    >
      {finding}
    </p>
  </div>
);

export default SignalFinding;
