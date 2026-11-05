import type { Gate } from "../../../utils/deptReport";

/** Pass, fail, or never reached. A tick, a cross, or an empty ring. */
const Mark = ({ state }: { state: Gate["state"] }) => (
  <span
    className={`w-[17px] h-[17px] flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold leading-none ${
      state === "fail"
        ? "bg-red-500 text-custom-white"
        : state === "pass"
          ? "bg-emerald-500 text-custom-white"
          : "border border-content/40 text-transparent"
    }`}
  >
    {state === "fail" ? "✕" : state === "pass" ? "✓" : "·"}
  </span>
);

export default Mark;
