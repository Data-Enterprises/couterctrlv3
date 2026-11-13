// Interfaces
import type { Supply } from "../utils/investigationSteps";

// Components
import KpiBox from "./KpiBox";

interface SupplySideBySideProps {
  supply: Supply;
  us: string;
  them: string;
  cash: (v: number) => string;
}

/** The two stores side by side: a column each, their Ordered boxes level with
 *  each other and their Received boxes under them, so each figure sits straight
 *  across from the other store's. Order information, so no grading colours. */
const SupplySideBySide = ({ supply, us, them, cash }: SupplySideBySideProps) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const sides = [
    { mine: true, name: us, s: supply.mine },
    { mine: false, name: them, s: supply.theirs },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {sides.map((x) => (
        <span
          key={x.name}
          className={`flex items-center gap-1.5 min-w-0 pb-1 border-b-2 text-[12px] font-bold text-content ${
            x.mine ? "border-store_open" : "border-store_compare"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              x.mine ? "bg-store_open" : "bg-store_compare"
            }`}
          />
          <span className="min-w-0 truncate" title={x.name}>
            {x.name}
          </span>
        </span>
      ))}
      {sides.map((x) => (
        <KpiBox
          key={`o${x.name}`}
          title="Ordered"
          outlined={false}
          mine={x.mine}
          figures={[
            { value: n(x.s.orders), label: "orders" },
            { value: n(x.s.orderLines), label: "lines" },
            { value: n(x.s.orderedUnits), label: "units" },
          ]}
        />
      ))}
      {sides.map((x) => (
        <KpiBox
          key={`r${x.name}`}
          title="Received"
          outlined
          mine={x.mine}
          figures={[
            { value: n(x.s.deliveries), label: "receivers" },
            { value: n(x.s.receivedUnits), label: "units" },
            { value: cash(x.s.receivedCost), label: "cost" },
          ]}
        />
      ))}
    </div>
  );
};

export default SupplySideBySide;
