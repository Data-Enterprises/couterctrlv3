/** Post-submit confirmation, shared by both portal forms.
 *
 *  Mirrors `.dm-done` / `.sp-done`: a green check, "Thanks, <first name>.",
 *  a one-line promise, then a recap of what was sent so the sender has a
 *  record without needing a confirmation email. */

interface Props {
  firstName: string;
  message: string;
  recap: { k: string; v: string }[];
}

const PortalFormDone = ({ firstName, message, recap }: Props) => (
  <div className="px-8 pt-[52px] pb-5 text-center">
    <div className="w-14 h-14 mx-auto rounded-full bg-brand_green_tint flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
        <polyline
          points="4,13 10,19 20,6"
          fill="none"
          stroke="#1E9E52"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <h3 className="font-display text-[21px] font-extrabold text-brand_navy tracking-[-0.03em] mt-5">
      Thanks, {firstName}.
    </h3>
    <p className="text-[14.5px] leading-[1.65] text-brand_slate mt-2.5 max-w-[42ch] mx-auto">
      {message}
    </p>

    {recap.length > 0 && (
      <div className="text-left mt-[26px] border border-brand_line rounded-[11px] px-[18px] py-1">
        {recap.map((r) => (
          <div
            key={r.k}
            className="flex justify-between gap-[18px] py-3 border-b border-brand_line last:border-b-0 text-[13.5px]"
          >
            <span className="font-mono text-[9.5px] tracking-[0.13em] uppercase text-brand_slate_2 whitespace-nowrap pt-[3px]">
              {r.k}
            </span>
            <span className="text-right text-brand_navy font-medium break-words">{r.v}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PortalFormDone;
