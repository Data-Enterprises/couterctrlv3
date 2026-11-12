// Utils
import { shortStore } from "../utils";

// Interfaces
import type {
  Spread,
  Vitals as VitalsShape,
} from "../utils/investigationSteps";

// Components
import Carousel from "./Carousel";
import Weeks from "./Weeks";
import Index from "./Index";

interface HoldsChartsProps {
  spread: Spread;
  them: string;
  vitals: VitalsShape;
  cash: (v: number) => string;
  onVendor: (vendor: string) => void;
}

/** The Summary's supporting charts: week by week, against the other store,
 *  and who supplies the shortfall. */
const HoldsCharts = ({
  spread,
  them,
  vitals,
  cash,
  onVendor,
}: HoldsChartsProps) => {
  const vendors = spread.byVendor.slice(0, 6);
  const widestVendor = Math.max(1, Math.abs(vendors[0]?.dollars ?? 0));

  /* Three ways of asking the same question, so they are peers and
     share one frame. Across a row they were three cards none of them
     was wide enough for; down a rail the third went unread. */
  return (
    <Carousel
      slides={[
        {
          label: "Week by week",
          body: (
            <>
              <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                Against itself: a standing difference, or something that
                broke this week.
              </p>
              <Weeks vitals={vitals} cash={cash} />
            </>
          ),
        },
        {
          label: `Against ${shortStore(them)}`,
          body: (
            <>
              <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                One rule for all three, so measures that disagree are
                seen to.
              </p>
              <Index vitals={vitals} them={them} cash={cash} />
            </>
          ),
        },
        ...(vendors.length > 0
          ? [
              {
                label: "Who supplies it",
                count: vendors.length,
                body: (
                  <>
                    <p className="text-[12px] text-content/95 leading-snug mb-2.5">
                      The shortfall by vendor. Pick one to narrow the
                      items.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {vendors.map((v) => (
                        <button
                          key={v.vendorName}
                          onClick={() => onVendor(v.vendorName)}
                          className="flex items-center gap-2.5 text-left rounded px-1 py-0.5 hover:bg-bkg transition-colors"
                        >
                          <span className="w-[120px] flex-shrink-0 truncate text-[12.5px] text-content">
                            {v.vendorName}
                          </span>
                          <span className="flex-1 min-w-0 h-[8.4px] rounded-sm bg-bkg">
                            <span
                              className="block h-[8.4px] rounded-sm bg-red-500"
                              style={{
                                width: `${(Math.abs(v.dollars) / widestVendor) * 100}%`,
                              }}
                            />
                          </span>
                          <span className="w-[80px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                            {"−"}
                            {cash(Math.abs(v.dollars))}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ),
              },
            ]
          : []),
      ]}
    />
  );
};

export default HoldsCharts;
