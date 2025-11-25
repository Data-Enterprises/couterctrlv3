import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { ResponsiveBar } from "@nivo/bar";
import type { HourlySale, HourlyBarData } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import { rgbaColor } from "../utils";
import SingleSelect from "../../../components/SingleSelect";

const Hourly = () => {
  const sales = useAppSelector((state) => state.sales);
  const [hourly, setHourly] = useState<HourlyBarData[]>([]);
  const [hours, setHours] = useState<HourlySale[]>([]);
  const [selectedHour, setSelectedHour] = useState<number>(0);

  useEffect(() => {
    if (sales.hourlySales.length === 0) {
      setHourly([]);
      setHours([]);
      setSelectedHour(0);
      return;
    }
    const todayHourly = () => {
      const date = sales.selectedSalesPanel.sale_date.split("T")[0];
      const todayHourly = [...sales.hourlySales].filter((sale) =>
        sale.sale_date.startsWith(date)
      );
      setHours(todayHourly);
    };
    todayHourly();

    if (selectedHour === 0) {
      setSelectedHour(7);
      return;
    }
  }, [sales.hourlySales]);

  useEffect(() => {
    const result = [...sales.hourlySales]
      .filter((sale) => sale.hour === selectedHour)
      .sort(
        (a, b) =>
          new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
      );

    const newBarData = result.reduce((acc: HourlyBarData[], cur) => {
      const existing = acc.find((item) => item.label === cur.sale_date);
      if (existing) {
        existing.value += cur.total_sales;
        existing.qty += cur.qty;
      } else {
        acc.push({
          id: cur.hour,
          label: cur.sale_date,
          value: cur.total_sales,
          fill: "#3b82f6",
          color: "#3b82f6",
          qty: cur.qty,
        });
      }
      return acc;
    }, []);
    setHourly(newBarData);
  }, [selectedHour, sales.hourlySales]);

  const handleChange = (val: number | string) => {
    setSelectedHour(Number(val));
  };

  const handleDate = (dateStr: string) => {
    if (!dateStr) return "";
    // yyyy-mm-dd to mm/dd/yyyy
    const parts = dateStr.split("-");
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  };

  // const handleCompareClick = () => {};

  return (
    <div className="w-full h-full bg-custom-white rounded-lg shadow-lg ">
      <div className="h-[calc(100%-2px)]">
          <div className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg">
            <div>Hourly</div>
            <div className="flex gap-4">
              <div>{sales.selectedSalesPanel.store_name}</div>
              <div>
                {handleDate(sales.selectedSalesPanel.sale_date.split("T")[0])}
              </div>
            </div>
          </div>
        <div className={`h-[100%] relative ${hours.length === 0 && "hidden"}`}>
          <ResponsiveBar
            data={hourly}
            indexBy="label"
            colors={(bar) => rgbaColor(bar.data.fill, 0.3)}
            borderWidth={2}
            borderColor={(bar) => rgbaColor(bar.data.data.color, 1)}
            margin={{ top: 20, right: 140, bottom: 80, left: 70 }}
            padding={0.1}
            borderRadius={4}
            labelSkipWidth={12}
            labelSkipHeight={12}
            keys={["value"]}
            enableLabel={false}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Sales",
              legendPosition: "middle",
              legendOffset: -55,
              format: (value) => `$${value}`,
            }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Date",
              legendPosition: "middle",
              legendOffset: 35,
              format: (value) => `${value.toString().slice(5, 10)}`,
            }}
            tooltip={({ data }) => (
              <div
                className={`bg-custom-white p-2 rounded-md shadow-md shadow-content whitespace-nowrap text-[13px] flex gap-1 items-center`}
                style={{ color: data.color }}
              >
                <div
                  className={`h-3 w-3 rounded mr-1`}
                  style={{ backgroundColor: data.color }}
                ></div>
                <div className="text-content">
                  {data.label.slice(5, 10).replace("-", "/")}
                </div>
                <div className="text-content">Hour {data.id}</div>
                <div>-</div>
                <div className="font-medium">{formatCurrency2(data.value)}</div>
              </div>
            )}
          />

          <div className="absolute flex flex-col gap-2 top-10 right-2">
            <SingleSelect
              data={hours}
              displayKey={"hour"}
              valueKey={"hour"}
              label="Select Hour"
              onSelect={handleChange}
              className="w-32 relative"
              listClass="mt-[52px]"
              defaultQuery={selectedHour.toString()}
              resetQuery={true}
            />
            {/* <button
              className="btn-themeBlue px-4 py-2"
              onClick={handleCompareClick}
            >
              Compare
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hourly;
