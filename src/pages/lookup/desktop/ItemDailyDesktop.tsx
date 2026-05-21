import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { rgbaColor } from "../../sales/utils";

const ItemDailyDesktop = () => {
  const { itemLookupHistory, itemsLoaded } = useAppSelector(
    (state) => state.item,
  );

  if (!itemsLoaded) return null;

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  return (
    <div className="text-[13px] space-y-3 flex flex-col min-h-0 h-full select-none">
      <div className="bg-custom-white pb-2 px-2 rounded-lg shadow-lg h-[175px]">
        <div className="font-medium mt-0.5">Daily History</div>
        <div className="grid grid-cols-2 my-0.5">
          <div className="bg-gradient-to-r from-content/60 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-content/60 to-custom-white h-[1.5px]"></div>
        </div>
        <ResponsiveBar
          data={itemLookupHistory as unknown as BarDatum[]}
          keys={["total_sales"]}
          indexBy="sale_date"
          animate={true}
          margin={{
            top: 10,
            right: 0,
            bottom: 44,
            left: 55,
          }}
          axisBottom={{
            format: (v) => `${formatDate(v).split("/").slice(0, 2).join("/")}`,
          }}
          axisLeft={{
            tickValues: 4,
            format: (v) => `${formatCurrency2(Number(v))}`,
          }}
          tooltip={({ value, data }) => {
            const qty = data.qty;
            return (
              <div className="px-2 py-1.5 bg-custom-white shadow-lg rounded-md text-[12.5px] border-2 border-content/25 text-nowrap">
                <div className="flex justify-between gap-3 items-center">
                  <div className="text-content/60 text-[12px]">
                    Total Sales:
                  </div>
                  <div className="font-medium">{formatCurrency2(value)}</div>
                </div>
                <div className="flex justify-between gap-3 items-center">
                  <div className="text-content/60 text-[12px]">Total Qty:</div>
                  <div className="font-medium">
                    {formatBigNumber(qty as number, 0)}
                  </div>
                </div>
              </div>
            );
          }}
          colors={() => rgbaColor("#3b82f6", 0.3)}
          borderWidth={2}
          borderColor={() => "#3b82f6"}
          padding={0.07}
          enableLabel={false}
          enableGridX={false}
          enableGridY={false}
          borderRadius={4}
        />
      </div>
      <div className="bg-custom-white/75 rounded-lg shadow-md max-h-[calc(100vh-255px)] overflow-y-auto no-scrollbar grid lg:grid-cols-2 gap-2 p-2">
        {itemLookupHistory.map((item, i) => (
          <div
            key={i}
            className="bg-custom-white border border-content/10 rounded-lg p-2 last:mb-0 shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[13px] text-content">
                {formatDate(item.sale_date)}
              </div>
              <div className="text-xs text-content/60 underline">
                Daily history
              </div>
            </div>

            <div className="grid grid-cols-2 mt-0.5 mb-2">
              <div className="bg-gradient-to-r from-content/60 to-custom-white h-[1.5px]"></div>
              <div className="bg-gradient-to-l from-content/60 to-custom-white h-[1.5px]"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-md bg-content/5 shadow-md px-2 py-1">
                <div className="text-content/60 font-medium text-[11px]">
                  Sales
                </div>
                <div className="font-semibold text-[13px]">
                  {formatCurrency2(item.total_sales)}
                </div>
              </div>

              <div className="rounded-md bg-content/5 shadow-md px-2 py-1">
                <div className="text-content/60 font-medium text-[11px]">
                  Qty
                </div>
                <div className="font-semibold text-[13px]">
                  {formatBigNumber(item.qty, 0)}
                </div>
              </div>

              <div className="rounded-md bg-content/5 shadow-md px-2 py-1">
                <div className="text-content/60 font-medium text-[11px]">
                  Price
                </div>
                <div className="font-semibold text-[13px]">
                  {formatCurrency2(item.price)}
                </div>
              </div>

              <div className="rounded-md bg-content/5 shadow-md px-2 py-1">
                <div className="text-content/60 font-medium text-[11px]">
                  C Cost
                </div>
                <div className="font-semibold text-[13px]">
                  {formatCurrency2(item.casecost)}
                </div>
              </div>

              <div className="rounded-md bg-content/5 shadow-md px-2 py-1">
                <div className="text-content/60 font-medium text-[11px]">
                  Ext Cost
                </div>
                <div className="font-semibold text-[13px]">
                  {formatCurrency2(item.extended_cost)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemDailyDesktop;
