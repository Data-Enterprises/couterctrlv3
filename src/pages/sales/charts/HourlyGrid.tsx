import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { HourlySale } from "../../../interfaces";
ModuleRegistry.registerModules([AllCommunityModule]);
import { theme, cols } from "../graphs";

interface AvailableHour {
  hour: number;
}

const HourlyGrid = () => {
  const [hour, setHour] = useState<number>(0);
  const [rowData, setRowData] = useState<HourlySale[]>([]);
  const [hours, setHours] = useState<AvailableHour[]>([{ hour: 0 }]);
  const { hourlySales, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  // for the changing of the selected hour
  useEffect(() => {
    if (!hourlySales.length) return;
    const filteredByHour = hourlySales
      .filter((s) => s.hour === hour)
      .sort(
        (a, b) =>
          new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime(),
      );
    setRowData(filteredByHour);
  }, [hour]);

  useEffect(() => {
    if (!hourlySales.length) return;
    const uniqueHours = hourlySales.reduce((acc: { hour: number }[], curr) => {
      if (!acc.find((h) => h.hour === curr.hour)) {
        acc.push({ hour: curr.hour });
      }
      return acc;
    }, []);

    setHours(uniqueHours);
    setHour(uniqueHours[0].hour);
  }, [hourlySales, selectedSalesPanel]);

  const handleSelect = (value: number) => {
    setHour(Number(value));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 pb-2 pt-1">
      <div className="px-2 flex justify-between items-center">
        <span className="font-medium">Hourly Sales</span>
        {hours.map((h) => (
          <span
            key={h.hour}
            className={`${h.hour === hour ? "bg-blue-500 text-custom-white" : ""} 
                  text-sm font-medium underline hover:bg-blue-200 hover:text-content rounded-full 
                  py-0.5 px-2 transition-all duration-200 cursor-pointer`}
            onClick={() => handleSelect(h.hour)}
          >
            {h.hour}
          </span>
        ))}
      </div>
      <div className="h-[90%]">
        <AgGridReact rowData={rowData} columnDefs={cols} theme={theme} />
      </div>
    </div>
  );
};

export default HourlyGrid;
