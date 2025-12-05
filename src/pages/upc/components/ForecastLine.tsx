import { ResponsiveLine } from "@nivo/line";
import { useEffect, useState, useRef } from "react";
import type { LineData } from "../utils";
import { useAppSelector } from "../../../hooks";
import { useDispatch } from "react-redux";
import { setSelectedLegendForecast } from "../../../features/upcSlice";
import { customForecastShadowLayer } from "./chartUtils";
import type { UpcInfo } from "../../../interfaces";

interface LineProps {
  data: LineData[];
  title: string;
  search: string[];
  title2?: string;
}

const ForecastLine = ({ data, title, search, title2 = "" }: LineProps) => {
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const state = useAppSelector((state) => state.upc);
  const [max, setMax] = useState<number>(0);
  const [min, setMin] = useState<number>(0);
  const [lineData, setLineData] = useState<LineData[]>(data);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [legendData, setLegendData] = useState<UpcInfo[]>([]);

  useEffect(() => {
    if (state.selectedUpcs.length) {
      setLegendData(
        state.upcList.filter((item) => state.selectedUpcs.includes(item.label))
      );
    }
  }, [state.upcList, state.selectedUpcs]);

  useEffect(() => {
    if (ref.current) {
      setLoaded(true);
    }
    return () => setLoaded(false);
  }, [ref.current]);

  useEffect(() => {
    if (lineData) {
      setMax(
        Math.max(
          ...lineData.map((item) => Math.max(...item.data.map((d) => d.y)))
        )
      );
      setMin(
        Math.min(
          ...lineData.map((item) => Math.min(...item.data.map((d) => d.y)))
        )
      );
    }
  }, [lineData]);

  useEffect(() => {
    if (data) {
      setMax(
        Math.max(...data.map((item) => Math.max(...item.data.map((d) => d.y))))
      );
      setMin(
        Math.min(...data.map((item) => Math.min(...item.data.map((d) => d.y))))
      );
      setLineData(data);
    }

    if (search.length > 0 && lineData) {
      setLineData((prev) =>
        prev.filter((item) => search.includes(item.id.split(" - ")[0]))
      );
    }
  }, [data, search]);

  return (
    <div className="w-full h-full bg-custom-white rounded-lg shadow-lg">
      <div
        className={`bg-blue-500 text-white font-medium text-center py-[1px] rounded-t-lg text-[20px] ${
          title2 ? "grid grid-cols-2" : ""
        }`}
      >
        <div>{title}</div>
        {title2 && <div>{title2}</div>}
      </div>

      <div
        ref={ref}
        className={`${
          !loaded ? "opacity-0" : "opacity-100"
        } h-[97%] flex relative`}
      >
        <ResponsiveLine
          data={lineData}
          margin={{ top: 30, right: 30, bottom: 80, left: 60 }}
          colors={(line) => line.color} // This grabs the color from the data
          layers={[
            "markers",
            "grid",
            "areas",
            "lines",
            customForecastShadowLayer,
            "mesh",
            "crosshair",
            "points",
            "axes",
            "legends",
          ]}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: min,
            max: max || 30,
            stacked: false,
            reverse: false,
          }}
          yFormat={state.forecastOption === "sales" ? ">-$d" : ""}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: 36,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: state.forecastOption === "quantity" ? "Quantity" : "Sales",
            legendOffset: -45,
            legendPosition: "middle",
            format: (v) =>
              state.forecastOption === "quantity" ? `${v}` : `$${v}`,
          }}
          enableGridX={false}
          lineWidth={3}
          pointSize={10}
          pointColor={{ from: "color" }}
          pointBorderWidth={2}
          pointBorderColor={{ theme: "background" }}
          useMesh={true}
          theme={{
            grid: {
              line: {
                stroke: "#e0e0e0",
                strokeWidth: 1,
              },
            },
            axis: {
              domain: {
                line: {
                  stroke: "transparent",
                },
              },
            },
          }}
          // tooltip={({ point }) => {
          //   // console.log(point);
          //   return (
          //     <div
          //       style={{
          //         borderRadius: "0.75rem",
          //         border: "1px solid #e5e7eb",
          //         backgroundColor: "#ffffff",
          //         padding: "1rem",
          //         boxShadow:
          //           "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          //       }}
          //     >
          //       <div
          //         style={{
          //           display: "flex",
          //           alignItems: "center",
          //           gap: "1rem",
          //         }}
          //       >
          //         <div
          //           style={{
          //             width: "0.25rem",
          //             borderRadius: "0.25rem",
          //             alignSelf: "stretch",
          //             backgroundColor: "#843dff",
          //           }}
          //         ></div>
          //         <div style={{ flex: 1 }}>
          //           <strong
          //             style={{
          //               display: "block",
          //               fontWeight: 500,
          //               fontSize: "1rem",
          //               lineHeight: "1rem",
          //               color: "#9d99a8",
          //             }}
          //           >
          //             {point?.seriesId || "Unknown series"}
          //           </strong>
          //           <span
          //             style={{
          //               fontSize: "1.125rem",
          //               lineHeight: "1.875rem",
          //               color: "#1e1c24",
          //             }}
          //           >
          //             {point.data.xFormatted || ""}:
          //             <span style={{ fontWeight: 600 }}>
          //               {point.data.yFormatted || ""}
          //             </span>
          //           </span>
          //         </div>
          //       </div>
          //     </div>
          //   );
          // }}
        />
        <div
          className="overflow-y-auto translate-x-4 text-xs absolute bottom-6 flex gap-2"
          style={{
            maxHeight: ref.current
              ? ref.current.getBoundingClientRect().height - 40
              : 200,
          }}
        >
          {legendData.map((item, i) => (
            <div
              data-testid={`forecast-legend-item-${i}`}
              onClick={() => dispatch(setSelectedLegendForecast(item))}
              key={item.label}
              className={`flex items-center cursor-pointer hover:bg-panel_active/50 transition-all duration-200 py-[2px] px-1.5 rounded-md ${
                i !== legendData.length - 1 ? "border-b" : ""
              } ${
                state.selectedLegendForecast !== null
                  ? state.selectedLegendForecast.label === item.label
                    ? "bg-blue-200/50"
                    : ""
                  : ""
              } ${
                state.selectedLegendForecast === null && i === 0
                  ? "bg-blue-200/50"
                  : ""
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span
                className="ml-2 truncate text-nowrap overflow-hidden"
                style={{ maxWidth: 81 }}
              >
                {state.upcSelectorDisplay === "upc"
                  ? item.label
                  : item.metrics.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastLine;
