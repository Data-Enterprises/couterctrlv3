import { useState, useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";
import { useMediaDevices } from "react-media-devices";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  getItemLookup,
  getItemLookupSingleStore,
  getStoreList,
} from "../../api/itemLookup";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setUpcCode,
  setItems,
  resetLookupSlice,
  setItemsLoaded,
  setProductCode,
  setDescription,
  setMetrics,
  setHistoryMetrics,
  setItemLookupHistory,
  setStoreList,
} from "../../features/itemLookupSlice";
import "./scanner.css";
import { useHeight } from "./utils";

import LoadingIndicator from "../../components/loading/LoadingIndicator";
import ScanItem from "./ScanItem";
import TopStoreLookup from "./TopStoreLookup";
import BottomStoreLookup from "./BottomStoreLookup";
import ItemLookupHeader from "./ItemLookupHeader";
import HistoryItemCard from "./HistoryItemCard";

const ItemLookup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { upcCode, itemsLoaded, selectedStore, itemLookupHistory, storeList } =
    useAppSelector((state) => state.item);
  const { email } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pause, setPause] = useState<boolean>(true);
  const [deviceId, setDeviceId] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  const constraints = {
    video: { facingMode: "environment", width: 1280, height: 720 },
  };
  const { devices } = useMediaDevices({ constraints });

  // handle scroll height for history list
  const { height, topRef, bottomRef } = useHeight();

  useEffect(() => {
    // Get the store list on mount or clear
    if (storeList.length || !email) return;
    getStoreList(url, token, email)
      .then((resp) => {
        const j = resp.data;
        if (j.error == 0) {
          dispatch(setStoreList(j.stores));
        }
      })
      .catch((err) => toast.error(err.message));

    return () => {
      dispatch(setUpcCode(""));
    };
  }, [storeList, email]);

  useEffect(() => {
    if (devices) {
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment") ||
          device.label.toLowerCase().includes("rear")
      );

      const selectedDeviceId = backCamera
        ? backCamera.deviceId
        : devices[1].deviceId;
      setDeviceId(selectedDeviceId);
    }
  }, [devices]);

  useEffect(() => {
    return () => {
      dispatch(setUpcCode(""));
      dispatch(resetLookupSlice());
    };
  }, [dispatch]);

  const getSingleStoreData = (upc: string) => {
    setIsLoading(true);
    getItemLookupSingleStore(url, token, upc, selectedStore)
      .then((resp) => {
        const j = resp.data;
        if (j.error == 0) {
          dispatch(setItemLookupHistory(j.history));
          dispatch(
            setHistoryMetrics({
              totalSales: j.total_sales,
              totalQty: j.total_qty,
              avgPrice: j.average_price,
              daysSold: j.days_sold,
            })
          );
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(j.description));
          dispatch(setItemsLoaded(true));
        } else {
          // If item is not found
          setError(`We're sorry, that item was not found in your inventory`);
          dispatch(setItemsLoaded(false));
          dispatch(resetLookupSlice());
          setPause(true);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        dispatch(setUpcCode(""));
        setIsLoading(false);
      });
  };

  const getData = (upc: string) => {
    setIsLoading(true);
    getItemLookup(url, token, upc)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const itemsPayload = {
            top_store_sales: j.top_store_sales,
            lowest_store_sales: j.lowest_store_sales,
            top_store_qty: j.top_store_qty,
            lowest_store_qty: j.lowest_store_qty,
            highest_price_store: j.highest_price_store,
            lowest_price_store: j.lowest_price_store,
          };
          dispatch(setItems(itemsPayload));
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(j.description));
          dispatch(
            setMetrics({
              totalStores: j.total_stores,
              totalSales: j.total_sales,
              totalQty: j.total_qty,
              avgPrice: j.average_price,
            })
          );
          dispatch(setItemsLoaded(true));
        } else {
          setError(
            `We're sorry, item ${
              j.product_code.split(".")[0]
            } was not found in your inventory`
          );
          dispatch(setItemsLoaded(false));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        dispatch(setUpcCode(""));
        setIsLoading(false);
      });
  };

  const clear = () => {
    dispatch(resetLookupSlice());
    setError("");
    setPause(true);
  };

  const scanItem = () => {
    if (!ref.current) return;

    if (upcCode.length) {
      return selectedStore > 0 ? getSingleStoreData(upcCode) : getData(upcCode);
    }

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
          readers: ["upc_reader", "upc_e_reader", "ean_reader", "ean_8_reader"],
        },
        locate: true,
      },
      (err) => {
        if (!err) {
          Quagga.start();
          setPause(false);
        } else {
          console.error(err);
        }
      }
    );

    Quagga.onDetected((result) => {
      Quagga.stop();
      Quagga.offDetected();

      ref.current!.style.display = "none";
      const code = result.codeResult.code;
      dispatch(setUpcCode(code!));
      selectedStore > 0 ? getSingleStoreData(code!) : getData(code!);
      setPause(true);
    });
  };

  const stopScanner = () => {
    if (!pause) {
      clear();
      return;
    }

    setError("");
    Quagga.stop();
    Quagga.offDetected();
    setPause(false);
  };

  return (
    <div
      id="item-lookup-body"
      className="px-4 py-2 h-[calc(100vh-56px)] overflow-hidden"
    >
      <div className={`${isLoading ? "block z-50 " : "hidden z-0"}`}>
        <LoadingIndicator message={`Looking up item: ${upcCode}`} />
      </div>
      <div
        ref={ref}
        className={`scanner-container ${
          pause ? "hidden" : "block"
        } mb-2 rounded-lg`}
        style={{ objectFit: "cover", height: "175px", width: "100%" }}
      />
      <ScanItem scanItem={scanItem} />
      <div ref={topRef} className="text-center font-bold underline">
        {storeList.find((s) => s.storeid === selectedStore)?.store_name}
      </div>
      {itemsLoaded ? (
        <>
          <ItemLookupHeader />
          {!selectedStore ? (
            <>
              <TopStoreLookup />
              <BottomStoreLookup />
            </>
          ) : (
            <>
              {/* layout for each history object */}
              <div
                className="space-y-2 overflow-y-auto"
                style={{ maxHeight: `${height}px` }}
              >
                {itemLookupHistory.map((item, i) => (
                  <HistoryItemCard key={i} item={item} />
                ))}
              </div>
            </>
          )}
          <button
            ref={bottomRef}
            className="btn-themeBlue w-full mt-3 text-[15px]"
            onClick={clear}
          >
            Clear Item
          </button>
        </>
      ) : null}
      {error.length > 0 ? (
        <div className="text-content mt-8 text-center">{error}</div>
      ) : null}
    </div>
  );
};

export default ItemLookup;
