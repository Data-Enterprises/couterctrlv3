import { calculateCogs } from "..";
import Quagga from "@ericblade/quagga2";
import { useMediaDevices } from "react-media-devices";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import { useEffect, useRef, useState } from "react";
import type { ItemRow } from "../display/widgets";
import {
  setFilteredCostGridData,
  setFilteredItemGridData,
  setItemGridData,
  setPause,
  setScannedItemHistory,
  setScannedUpc,
  setSubDeptCost,
  setSubDeptGridView,
} from "../../../features/subMarginSlice";
import MarginCard from "./MarginCard";
import type { JsonError, SubDeptCost } from "../../../interfaces";
import CostCard from "./CostCard";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { useToast } from "../../../components/toasts/hooks/useToast";
import ItemHistoryModal from "./ItemHistoryModal";

const ItemsView = () => {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useSubMarginCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const constraints = {
    video: { facingMode: "environment", width: 1280, height: 720 },
  };
  const { devices } = useMediaDevices({ constraints });
  const [deviceId, setDeviceId] = useState<string>("");
  const [refreshFiltered, setRefreshFiltered] = useState<boolean>(true);

  useEffect(() => {
    if (ref.current) {
      ref.current!.style.display = "none";
    }
  }, [ref.current]);

  useEffect(() => {
    if (devices) {
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment") ||
          device.label.toLowerCase().includes("rear"),
      );

      const selectedDeviceId = backCamera
        ? backCamera.deviceId
        : devices[1].deviceId;
      setDeviceId(selectedDeviceId);
    }
  }, [devices]);

  const clear = () => {
    dispatch(setPause(true));
  };

  const stopScanner = () => {
    if (!ctx.pause) {
      clear();
      return;
    }

    Quagga.stop();
    Quagga.offDetected();
    dispatch(setPause(false));
  };

  const handleScanItem = (upc: string) => {
    getItemLookupSingleStore(ctx.url, ctx.token, upc, ctx.searchValue)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setScannedItemHistory(j.history));
          setRefreshFiltered(true);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const scanItem = () => {
    if (ref.current) {
      // If it was typed in, get the data without scanning
      if (ctx.scannedUpc.length) {
        handleScanItem(ctx.scannedUpc);
        return;
      }

      // Otherwise, open the scanner and wait for a scan

      if (ref.current.style.display === "block") {
        ref.current.style.display = "none";
        stopScanner();
        return;
      }

      ref.current.style.display = "block";

      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: ref.current!,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: { exact: "environment" },
              deviceId: deviceId,
            },
          },
          decoder: {
            readers: [
              "upc_reader",
              "upc_e_reader",
              "ean_reader",
              "ean_8_reader",
            ],
          },
          locate: true,
        },
        (err) => {
          if (!err) {
            Quagga.start();
            dispatch(setPause(false));
          }
        },
      );

      Quagga.onDetected((result) => {
        Quagga.stop();
        Quagga.offDetected();

        ref.current!.style.display = "none";
        const code = result.codeResult.code;
        dispatch(setScannedUpc(code!));
        // Get the data
        handleScanItem(code!);
        dispatch(setPause(true));
      });
    }
  };

  useEffect(() => {
    if (ctx.subDeptGridView === "item" && refreshFiltered) {
      const dateComp = ctx.selectedWeekDay
        ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
        : "";

      const filtered = ctx.margins.filter((margin) => {
        return dateComp ? margin.sale_date.split("T")[0] === dateComp : true;
      });

      const reduced = filtered.reduce((acc: ItemRow[], margin) => {
        const found = acc.find(
          (item) => item.product_code === margin.product_code,
        );
        if (!found) {
          acc.push({
            sub_department_description: margin.sub_department_description,
            product_code: margin.product_code,
            product_description: margin.product_description,
            cogs: calculateCogs(
              margin.net_cost,
              margin.cost,
              margin.case_size,
              margin.qty,
              margin.weight,
            ),
            cost_fees: margin.cost_fees,
            total_sales: margin.total_sales - margin.total_tax,
            net_sales: margin.net_sales,
            total_tax: margin.total_tax,
            qty: margin.qty,
            margin: 0,
          });
        } else {
          found.cogs += calculateCogs(
            margin.net_cost,
            margin.cost,
            margin.case_size,
            margin.qty,
            margin.weight,
          );
          found.total_sales += margin.total_sales - margin.total_tax;
          found.net_sales += margin.net_sales;
          found.total_tax += margin.total_tax;
          found.qty += margin.qty;
        }
        return acc;
      }, []);

      const newData = reduced
        .map((item) => ({
          ...item,
          margin:
            ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
        }))
        .filter((item) => item.product_code.includes(ctx.scannedUpc));
      dispatch(setItemGridData(newData));
      dispatch(setFilteredItemGridData(newData));
      setRefreshFiltered(false);
    } else if (ctx.subDeptGridView === "cost" && refreshFiltered) {
      // cost view
      const formatDate = (dte: string) => {
        const split = dte.split("T")[0].split("-");
        return `${split[1]}/${split[2]}/${split[0]}`;
      };

      const costData: SubDeptCost[] = ctx.margins
        .reduce((acc: SubDeptCost[], curr) => {
          const found = acc.find(
            (item) => item.product_code === curr.product_code,
          );
          if (!found) {
            acc.push({
              date: formatDate(curr.sale_date),
              product_code: curr.product_code,
              description: curr.product_description,
              calculated_cost: curr.calculated_cost,
              cost: curr.cost,
              qty: curr.qty,
              total_cost: calculateCogs(
                curr.net_cost,
                curr.cost,
                curr.case_size,
                curr.qty,
                curr.weight,
              ),
            });
          } else {
            found.qty += curr.qty;
            found.total_cost += calculateCogs(
              curr.net_cost,
              curr.cost,
              curr.case_size,
              curr.qty,
              curr.weight,
            );
          }
          return acc;
        }, [])
        .filter((item) => item.product_code.includes(ctx.scannedUpc));

      dispatch(setSubDeptCost(costData));
      dispatch(setFilteredCostGridData(costData));
      setRefreshFiltered(false);
    }
  }, [ctx.selectedWeekDay, ctx.subDeptGridView, refreshFiltered]);

  const handleViewToggle = (option: "item" | "cost") => {
    dispatch(setSubDeptGridView(option));
    setRefreshFiltered(true);
  };

  const handleRefresh = () => {
    dispatch(setScannedUpc(""));
    dispatch(setScannedItemHistory([]));
    setRefreshFiltered(true);
  };

  return (
    <div>
      <ItemHistoryModal />
      <div className="grid grid-cols-2 gap-2 px-2">
        <button
          className={`${ctx.subDeptGridView === "item" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("item")}
        >
          Unique Items
        </button>
        <button
          className={`${ctx.subDeptGridView === "cost" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("cost")}
        >
          Item Cost
        </button>
      </div>

      <div className="p-2">
        <div
          ref={ref}
          className={`scanner-container ${
            ctx.pause ? "hidden" : "block"
          } mb-2 rounded-lg`}
          style={{ objectFit: "cover", height: "175px", width: "100%" }}
        />
        {/* <ScanItem scanItem={scanItem} storeSelect={false} /> */}
      </div>
      {ctx.subDeptGridView === "item" ? (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredItemGridData.map((item, i) => (
            <MarginCard key={i} item={item} onRefresh={handleRefresh} />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredCostGridData.map((cost, i) => (
            <CostCard key={i} cost={cost} onRefresh={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsView;
