import { ResponsivePie } from "@nivo/pie";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../utils";
import ItemHIstory from "./ItemHistory";
import { setViewHistory } from "../../features/itemLookupSlice";
import { ShoppingCartIcon, CalendarIcon } from "@heroicons/react/24/solid";
import UpcListIcon from "../../svgs/UpcListIcon";

type QtyData = {
  id: string;
  value: number;
};

const LookupCharts = () => {
  const dispatch = useAppDispatch();
  const { itemLookupHistory, viewHistory } = useAppSelector(
    (state) => state.item,
  );

  const priceData = () => {
    const qtyByPrice = itemLookupHistory.reduce((acc: QtyData[], curr) => {
      const found = acc.find((item) => item.id === curr.price.toString());
      if (found) {
        found.value += curr.qty;
      } else {
        acc.push({
          id: curr.price.toString(),
          value: curr.qty,
        });
      }
      return acc;
    }, []);

    const salesByPrice = itemLookupHistory.reduce((acc: QtyData[], curr) => {
      const found = acc.find((item) => item.id === curr.price.toString());
      if (found) {
        found.value += curr.total_sales;
      } else {
        acc.push({
          id: curr.price.toString(),
          value: curr.total_sales,
        });
      }
      return acc;
    }, []);

    return { qtyByPrice, salesByPrice };
  };

  const costData = () => {
    const qtyByCost = itemLookupHistory
      .reduce((acc: QtyData[], curr) => {
        const found = acc.find(
          (item) =>
            formatCurrency2(Number(item.id)) === formatCurrency2(curr.casecost),
        );
        if (found) {
          found.value += curr.qty;
        } else {
          acc.push({
            id: curr.casecost.toString(),
            value: curr.qty,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => Number(a.id) - Number(b.id));

    const salesByCost = itemLookupHistory
      .reduce((acc: QtyData[], curr) => {
        const found = acc.find(
          (item) =>
            formatCurrency2(Number(item.id)) === formatCurrency2(curr.casecost),
        );
        if (found) {
          found.value += curr.total_sales;
        } else {
          acc.push({
            id: curr.casecost.toString(),
            value: curr.total_sales,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => Number(a.id) - Number(b.id));

    return { qtyByCost, salesByCost };
  };

  const colors = [
    "#00CC55",
    "#0099AA",
    "#0066FF",
    "#3b82f6",
    "#FF9900",
    "#CC8844",
  ];

  const totalSales = itemLookupHistory.reduce(
    (acc, curr) => acc + curr.total_sales,
    0,
  );

  const totalQty = itemLookupHistory.reduce((acc, curr) => acc + curr.qty, 0);

  if (viewHistory) return <ItemHIstory />;

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const productDesc = itemLookupHistory[0]?.product_description || "";
  const upc = itemLookupHistory[0]?.product_code || "";
  const start = itemLookupHistory[0]?.sale_date || "";
  const end = itemLookupHistory[itemLookupHistory.length - 1]?.sale_date || "";

  return (
    <div>
      <div className="text-[13px] mb-2 font-medium grid grid-cols-2">
        <div className="flex items-center gap-1">
          <UpcListIcon className="h-4 w-4 fill-blue-500" />
          <div>{upc}</div>
        </div>
        <div className="flex items-center justify-end gap-1">
          <CalendarIcon className="h-4 w-4 text-blue-500" />
          <div>
            {formatDate(start)} - {formatDate(end)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingCartIcon className="h-4 w-4 text-blue-500" />
          <div>{productDesc}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px] max-h-[calc(100vh-16.7rem)] overflow-y-auto">
        <div className="grid gap-2">
          <div className="bg-custom-white px-2 rounded-lg shadow-md relative">
            <div className="font-medium">Total Sales by Price</div>
            <div className="h-[80px]">
              <ResponsivePie
                data={priceData().salesByPrice}
                animate={true}
                key={"param"}
                startAngle={-90}
                endAngle={90}
                innerRadius={0.61}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                colors={colors}
                margin={{ top: 0, bottom: 0, left: 5, right: 5 }}
              />
            </div>
            <div className="absolute top-10 left-1/2 flex justify-center items-center transform -translate-x-1/2 font-bold w-full h-[80px]">
              {formatCurrency2(totalSales)}
            </div>
            <div>
              <div className="flex justify-between">
                <div>Prices - {priceData().salesByPrice.length}</div>
                <div>Sales</div>
              </div>
              <div className="pb-2">
                {priceData().salesByPrice.map((item, i) => (
                  <div key={i}>
                    <div className="flex gap-1 items-center">
                      <div
                        className={`h-1 w-3 mt-[3px] rounded-full`}
                        style={{ backgroundColor: colors[i % colors.length] }}
                      ></div>
                      <div className="flex gap-1.5 items-center justify-between w-full">
                        <div>{formatCurrency2(Number(item.id))}</div>
                        <div>{formatCurrency2(item.value)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-custom-white px-2 rounded-lg shadow-md relative">
            <div className="font-medium">Qty by Price</div>
            <div className="h-[80px]">
              <ResponsivePie
                data={priceData().qtyByPrice}
                animate={true}
                key={"param"}
                startAngle={-90}
                endAngle={90}
                innerRadius={0.61}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                colors={colors}
                margin={{ top: 0, bottom: 0, left: 5, right: 5 }}
              />
            </div>
            <div className="absolute top-10 left-1/2 flex justify-center items-center transform -translate-x-1/2 font-bold w-full h-[80px]">
              {formatBigNumber(totalQty, 0)}
            </div>
            <div>
              <div className="flex justify-between">
                <div>Prices - {priceData().qtyByPrice.length}</div>
                <div>Qty</div>
              </div>
              <div className="pb-2">
                {priceData().qtyByPrice.map((item, i) => (
                  <div key={i}>
                    <div className="flex gap-1 items-center">
                      <div
                        className={`h-1 w-3 mt-[3px] rounded-full`}
                        style={{ backgroundColor: colors[i % colors.length] }}
                      ></div>
                      <div className="flex gap-1.5 items-center justify-between w-full">
                        <div>{formatCurrency2(Number(item.id))}</div>
                        <div>{formatBigNumber(item.value, 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="bg-custom-white px-2 rounded-lg shadow-md relative">
            <div className="font-medium">Total Sales by Case Cost</div>
            <div className="h-[80px]">
              <ResponsivePie
                data={costData().salesByCost}
                animate={true}
                key={"param"}
                startAngle={-90}
                endAngle={90}
                innerRadius={0.61}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                colors={colors}
                margin={{ top: 0, bottom: 0, left: 5, right: 5 }}
              />
            </div>
            <div className="absolute top-10 left-1/2 flex justify-center items-center transform -translate-x-1/2 font-bold w-full h-[80px]">
              {formatCurrency2(totalSales)}
            </div>
            <div>
              <div className="flex justify-between">
                <div className="">Costs - {costData().salesByCost.length}</div>
                <div>Sales</div>
              </div>
              <div className="pb-2">
                {costData().salesByCost.map((item, i) => (
                  <div key={i}>
                    <div className="flex gap-1 items-center">
                      <div
                        className={`h-1 w-3 mt-[3px] rounded-full`}
                        style={{ backgroundColor: colors[i % colors.length] }}
                      ></div>
                      <div className="flex gap-1.5 items-center justify-between w-full">
                        <div>{formatCurrency2(Number(item.id))}</div>
                        <div>{formatCurrency2(item.value)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-custom-white px-2 rounded-lg shadow-md relative">
            <div className="font-medium">Qty by Case Cost</div>
            <div className="h-[80px]">
              <ResponsivePie
                data={costData().qtyByCost}
                animate={true}
                key={"param"}
                startAngle={-90}
                endAngle={90}
                innerRadius={0.61}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                colors={colors}
                margin={{ top: 0, bottom: 0, left: 5, right: 5 }}
              />
            </div>
            <div className="absolute top-10 left-1/2 flex justify-center items-center transform -translate-x-1/2 font-bold w-full h-[80px]">
              {formatBigNumber(totalQty, 0)}
            </div>
            <div>
              <div className="flex justify-between">
                <div>Costs - {costData().qtyByCost.length}</div>
                <div>Qty</div>
              </div>
              <div className="pb-2">
                {costData().qtyByCost.map((item, i) => (
                  <div key={i}>
                    <div className="flex gap-1 items-center">
                      <div
                        className={`h-1 w-3 mt-[3px] rounded-full`}
                        style={{ backgroundColor: colors[i % colors.length] }}
                      ></div>
                      <div className="flex gap-1.5 items-center justify-between w-full">
                        <div>{formatCurrency2(Number(item.id))}</div>
                        <div>{formatBigNumber(item.value, 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        className="btn-themeBlue mt-2 w-full text-[13px]"
        onClick={() => dispatch(setViewHistory(true))}
      >
        View History
      </button>
    </div>
  );
};

export default LookupCharts;
