import type { WeekTotal } from "../../../../features/salesSlice";
import { addDays } from "../../../../utils";
import { chunkData } from "../../tracker";
import { useMobileSalesCtx } from "../hooks";
// import type { WeekTotal } from "../../../../features/salesSlice";

import ReducedTotalsHeader from "./ReducedTotalsHeader";
import WeekDayMobile from "./WeekDayMobile";

const SalesTrackerDays = () => {
  const ctx = useMobileSalesCtx();

  const filteredSubs = () => {
    if (ctx.salesTrackerSelectedSubDept === -1) {
      return ctx.uniqueSubsMobile;
    }
    return [...ctx.uniqueSubsMobile].filter(
      (sub) => sub.id === ctx.salesTrackerSelectedSubDept,
    );
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] px-3 py-2 space-y-2">
      <ReducedTotalsHeader />
      <div className="flex-1 w-full grid overflow-y-hidden">
        <div className="flex flex-col overflow-y-auto space-y-2">
          {filteredSubs().map((sub) => {
            const subId = sub.id;
            const desc = sub.desc;

                        const filteredBySub = ctx.tyReducedTotalsMobile
                          .filter((wg) => wg[0][0]?.subDept === subId)
                          .flat();
            
                        const storeName = filteredBySub[0][0]?.storeName || "";
                        const storeId = filteredBySub[0][0]?.storeid || 0;
                        const missingDates: WeekTotal[] = [];
                        const flattened = [...filteredBySub].flat();
            
                        flattened.flat().forEach((d, i) => {
                          if (i < flattened.length - 1) {
                            let currentDateCheck = addDays(new Date(d.sale_date), 1)
                              .toISOString()
                              .split("T")[0];
            
                            while (
                              currentDateCheck !== flattened[i + 1].sale_date.split("T")[0]
                            ) {
                              const defaultWekTotal: WeekTotal = {
                                sale_date: currentDateCheck + "T00:00:00",
                                subDept: subId,
                                subDesc: desc,
                                salesTY: 0,
                                salesLY: 0,
                                atsTotalSales: 0,
                                storeid: storeId,
                                storeName: storeName,
                                transaction_count: 0,
                                totalSalesDollarChange: 0,
                                totalSalesPercentChange: 0,
                              };
                              missingDates.push(defaultWekTotal);
                              currentDateCheck = addDays(new Date(currentDateCheck), 1)
                                .toISOString()
                                .split("T")[0];
                            }
                          }
                        });
            
                        const concatWithMissing = [...flattened, ...missingDates].sort(
                          (a, b) => a.sale_date.localeCompare(b.sale_date),
                        );
            
                        const filteredWithMissing = chunkData(concatWithMissing);

            return filteredWithMissing.map((week, idx) => {
              return (
                <WeekDayMobile key={idx} week={week} desc={desc} idx={idx} />
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerDays;
