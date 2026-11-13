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
import VendorBars from "./VendorBars";

interface HoldsChartsProps {
  spread: Spread;
  them: string;
  vitals: VitalsShape;
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
  cash: (v: number) => string;
  onVendor: (vendor: string) => void;
}

/** The Summary's supporting charts: week by week, against the other store,
 *  and who supplies the shortfall. */
const HoldsCharts = ({
  spread,
  them,
  vitals,
  fmt,
  cash,
  onVendor,
}: HoldsChartsProps) => {
  const vendors = spread.byVendor;

  /* Three ways of asking the same question, so they are peers and
     share one frame. Across a row they were three cards none of them
     was wide enough for; down a rail the third went unread. */
  return (
    <Carousel
      fill
      helpAnchor="inv-charts"
      slides={[
        {
          label: "Week by week",
          body: <Weeks vitals={vitals} fmt={fmt} />,
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
                    <VendorBars vendors={vendors} fmt={fmt} onVendor={onVendor} />
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
