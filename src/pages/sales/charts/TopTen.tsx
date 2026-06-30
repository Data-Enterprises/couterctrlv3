import { useSalesState } from "../hooks/useSalesState";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { cpu, gpm, ppu, rpu } from "../../../functions";
import { QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { setSelectedItem } from "../../../features/salesSlice";
import SingleSelect from "../../../components/SingleSelect";

interface TopTenGroupItem {
  product_code: string;
  product_description: string;
  total_sales: number;
  qty: number;
  cost: number;
}

type ShowTooltip = {
  gpm: boolean;
  rpu: boolean;
  ppu: boolean;
  cpu: boolean;
};

const TopTen = () => {
  const dispatch = useAppDispatch();
  const [topTen, setTopTen] = useState<TopTenGroupItem[]>([]);
  const [selectedTopTenItem, setSelectedTopTenItem] =
    useState<TopTenGroupItem | null>(null);
  const { topTenItems, selectedSalesPanel } = useSalesState();
  const isMobile = useAppSelector((state) => state.app.isMobile);

  const [tooltip, setTooltip] = useState<ShowTooltip>({
    gpm: false,
    rpu: false,
    ppu: false,
    cpu: false,
  });

  useEffect(() => {
    const p = selectedSalesPanel;
    const filtered = [...topTenItems].filter((item) => {
      const storeMatch = p.storeid ? item.storeid === p.storeid : true;
      return storeMatch;
    });

    const grouped = [...filtered].reduce((acc: TopTenGroupItem[], curr) => {
      const exists = acc.find((item) => {
        const upcMatch = item.product_code === curr.product_code;
        return upcMatch;
      });

      if (exists) {
        exists.total_sales += curr.total_sales;
        exists.qty += curr.qty;
        exists.cost += curr.cost;
      } else {
        acc.push({
          product_code: curr.product_code,
          product_description: curr.product_description,
          total_sales: curr.total_sales,
          qty: curr.qty,
          cost: curr.cost,
        });
      }

      return acc;
    }, []);
    const sorted = grouped.sort((a, b) => b.total_sales - a.total_sales);
    setTopTen(sorted.slice(0, 10));
    setSelectedTopTenItem(sorted[0]);
  }, [topTenItems, selectedSalesPanel]);

  const barData: readonly BarDatum[] = topTen
    .map((item) => ({
      product_code: item.product_code,
      product_description: item.product_description,
      total_sales: item.total_sales,
      qty: item.qty,
      cost: item.cost,
    }))
    .reverse();

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const handleTooltip = (type: keyof ShowTooltip) => {
    const newSet = {
      gpm: false,
      rpu: false,
      ppu: false,
      cpu: false,
    };
    newSet[type] = !tooltip[type];
    setTooltip(newSet);
  };

  const mobileData = [...barData].map((item) => ({
    product_code: item.product_code,
  }));

  const handleSelect = (upc: string | number) => {
    dispatch(setSelectedItem(upc as string));
    setSelectedTopTenItem(
      topTen.find((item) => item.product_code === (upc as string)) || null,
    );
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg  pb-2">
      <div className="font-medium px-2 pt-1 flex justify-between items-center">
        <div className="text-[13.5px]">
          {selectedSalesPanel.sale_date ? "Daily" : "Weekly"} Top Ten Items
        </div>
      </div>

      {isMobile && (
        <SingleSelect
          data={mobileData}
          displayKey="product_code"
          valueKey="product_code"
          label=""
          innerClass="py-1"
          className="font-normal text-sm px-2 my-1"
          onSelect={handleSelect}
          id={2}
        />
      )}

      <div className="grid grid-cols-2 mb-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>

      <div className="md:grid md:grid-cols-[65%_35%] gap-2 h-[90%]">
        <div data-testid="top-10-chart">
          <ResponsiveBar
            data={barData}
            margin={{ top: 0, right: 0, bottom: 30, left: 90 }}
            tooltip={() => null}
            padding={0.1}
            layout="horizontal"
            keys={["total_sales"]}
            indexBy="product_code"
            colors={(d) =>
              rgbaColor(
                d.data.product_code === selectedTopTenItem?.product_code
                  ? "#f97316"
                  : "#3b82f6",
                0.3,
              )
            }
            enableLabel={false}
            axisBottom={{ tickValues: 4 }}
            borderRadius={4}
            borderWidth={2}
            borderColor={(d) =>
              rgbaColor(
                d.data.indexValue === selectedTopTenItem?.product_code
                  ? "#f97316"
                  : "#3b82f6",
                1,
              )
            }
            onClick={(d) => {
              const upc = d.index === 9 ? "" : (d.indexValue as string);
              dispatch(setSelectedItem(upc));
              setSelectedTopTenItem(
                topTen.find((item) => item.product_code === d.indexValue) ||
                  null,
              );
            }}
            theme={{
              axis: {
                domain: {
                  line: { stroke: "#60a5fa", strokeWidth: 1.5 },
                },
                ticks: {
                  text: {
                    fontSize: 10.5,
                    strokeWidth: 2,
                    fontWeight: "bolder",
                  },
                },
              },
            }}
          />
        </div>
        <div className="text-sm pb-2 md:pb-0 px-2 md:px-0">
          <div className="text-xs mb-2">
            <div className="flex gap-1 items-center">
              <div className="font-medium">
                {selectedTopTenItem?.product_code}
              </div>
            </div>
            <div className="font-medium">
              {selectedTopTenItem?.product_description}
            </div>
          </div>

          <div className="mt-1 w-full border-b font-medium">Totals</div>
          <div className="grid grid-cols-2 mt-1 gap-x-2 mb-2">
            <div>
              <div className="text-content/60">Sales:</div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(selectedTopTenItem?.total_sales as number)}
              </div>
            </div>
            <div>
              <div className="text-content/60">Qty:</div>
              <div className="font-medium text-xs  ">
                {formatBigNumber(selectedTopTenItem?.qty as number, 0)}
              </div>
            </div>
            <div>
              <div className="text-content/60">Cost:</div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(selectedTopTenItem?.cost as number)}
              </div>
            </div>
            <div>
              <div className="text-content/60">Profit:</div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(
                  ((selectedTopTenItem?.total_sales as number) -
                    (selectedTopTenItem?.cost as number)) as number,
                )}
              </div>
            </div>
          </div>

          {/* Calculations */}
          <div className="mt-1 w-full border-b font-medium">Metrics</div>
          <div className="grid grid-cols-2 mt-1 gap-x-2">
            <div>
              <div className="flex gap-1 items-center relative">
                <div className="text-content/60">GPM:</div>
                <QuestionMarkCircleIcon
                  data-testid="gpm-tooltip-icon"
                  className="inline-block w-4 h-4 text-content/30 hover:text-blue-200 cursor-default transition-all duration-200"
                  onMouseEnter={() => handleTooltip("gpm")}
                  onMouseLeave={() => handleTooltip("gpm")}
                />
                <div
                  className={`${tooltip.gpm ? "absolute" : "hidden"} -translate-y-1/2 -top-5 -translate-x-1/4 ml-1 bg-orange-200 rounded-lg shadow shadow-content/50 p-2 text-nowrap`}
                  style={{ zIndex: 10 }}
                >
                  Gross Profit Margin
                </div>
              </div>
              <div className="font-medium text-xs  ">
                {gpm(
                  selectedTopTenItem?.total_sales as number,
                  selectedTopTenItem?.cost as number,
                )}
              </div>
            </div>
            <div>
              <div className="flex gap-1 items-center relative">
                <div className="text-content/60">RPU:</div>
                <QuestionMarkCircleIcon
                  data-testid="rpu-tooltip-icon"
                  className="inline-block w-4 h-4 text-content/30 hover:text-blue-200 cursor-default transition-all duration-200"
                  onMouseEnter={() => handleTooltip("rpu")}
                  onMouseLeave={() => handleTooltip("rpu")}
                />
                <div
                  className={`${tooltip.rpu ? "absolute" : "hidden"} -translate-y-1/2 -top-5 -translate-x-1/4 ml-1 bg-orange-200 rounded-lg shadow shadow-content/50 p-2 text-nowrap`}
                  style={{ zIndex: 10 }}
                >
                  Revenue Per Unit
                </div>
              </div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(
                  rpu(
                    selectedTopTenItem?.total_sales as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              </div>
            </div>
            <div>
              <div className="flex gap-1 items-center relative">
                <div className="text-content/60">PPU:</div>
                <QuestionMarkCircleIcon
                  data-testid="ppu-tooltip-icon"
                  className="inline-block w-4 h-4 text-content/30 hover:text-blue-200 cursor-default transition-all duration-200"
                  onMouseEnter={() => handleTooltip("ppu")}
                  onMouseLeave={() => handleTooltip("ppu")}
                />
                <div
                  className={`${tooltip.ppu ? "absolute" : "hidden"} -translate-y-1/2 -top-5 -translate-x-1/4 ml-1 bg-orange-200 rounded-lg shadow shadow-content/50 p-2 text-nowrap`}
                  style={{ zIndex: 10 }}
                >
                  Profit Per Unit
                </div>
              </div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(
                  ppu(
                    selectedTopTenItem?.total_sales as number,
                    selectedTopTenItem?.cost as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              </div>
            </div>
            <div>
              <div className="flex gap-1 items-center relative">
                <div className="text-content/60">CPU:</div>
                <QuestionMarkCircleIcon
                  data-testid="cpu-tooltip-icon"
                  className="inline-block w-4 h-4 text-content/30 hover:text-blue-200 cursor-default transition-all duration-200"
                  onMouseEnter={() => handleTooltip("cpu")}
                  onMouseLeave={() => handleTooltip("cpu")}
                />
                <div
                  className={`${tooltip.cpu ? "absolute" : "hidden"} -translate-y-1/2 -top-5 -translate-x-1/4 ml-1 bg-orange-200 rounded-lg shadow shadow-content/50 p-2 text-nowrap`}
                  style={{ zIndex: 10 }}
                >
                  Cost Per Unit
                </div>
              </div>
              <div className="font-medium text-xs  ">
                {formatCurrency2(
                  cpu(
                    selectedTopTenItem?.cost as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTen;
