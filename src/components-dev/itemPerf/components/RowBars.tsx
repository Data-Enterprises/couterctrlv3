// Hooks
import { useItemPerfCtx } from "../hooks";

// Utils
import { measuredOf } from "../utils/itemPerfData";

// Interfaces
import type { MarginRow } from "../utils/itemPerfData";

// Components
import PairedBars from "../../mobile/perf/PairedBars";

interface RowBarsProps {
  r: MarginRow;
}

/** One row's TY, LY and LW bars, on the list's shared scale, measuring sales
 *  or units per the switch. Shared by the group cards and the item rows. */
const RowBars = ({ r }: RowBarsProps) => {
  const { measure, fmt, listMax, listNoLy, listNoLw } = useItemPerfCtx();
  const v = measuredOf(r, measure);
  return (
    <PairedBars
      ty={v.ty}
      ly={v.ly}
      lw={v.lw}
      max={listMax}
      labels={["TY", "LY", "LW"]}
      format={fmt}
      lyUnavailable={listNoLy}
      lwUnavailable={listNoLw}
    />
  );
};

export default RowBars;
