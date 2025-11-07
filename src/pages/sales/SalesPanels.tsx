// HOOKS
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
// API
import { salesTwoDates } from "../../api/sales";
// TYPES
import type { JsonError } from "../../interfaces";
// REDUX
import { setSalesPanels } from "../../features/salesSlice";
// UTILS
import { formatGoliathDate, formatCurrency2, reformatDate } from "../../utils";

const useStyling = () => {
  const [style, setStyle] = useState<string>("");
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const updateStyle = () => {
      if (window.innerWidth > 1536) {
        setStyle("px-4 py-1 mt-2");
        setText("text-[15px]");
      } else {
        setText("text-sm");
        setStyle("px-2 py-0.5");
      }
    };
    updateStyle();
    window.addEventListener("resize", updateStyle);
    return () => {
      window.removeEventListener("resize", updateStyle);
    };
  }, []);

  return { style, text };
};

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { salesPanels } = useAppSelector((state) => state.sales);
  const { style, text } = useStyling();

  useEffect(() => {
    if (context.token) {
      getData();
    }
  }, [context.token]);

  const getData = () => {
    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 1
        : 0;
    const singleStore =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 0
        : 1;
    salesTwoDates(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      search.lastStore,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSalesPanels(j.items));
          // make the call to weekly with the first returned item to get default behavior
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      });
  };

  // When the sales panels are ready, onClick will call handlePanelClick() for that panel
  return (
    <div className="grid grid-cols-5 gap-2 min-h-[100%] max-h-[100%]">
      {salesPanels.length
        ? salesPanels.map((panel, idx) => (
            <div key={idx} className="bg-custom-white rounded-lg px-2 py-1 shadow-lg">
              <div className="font-medium border-b border-content/30 flex justify-between">
                <div className="">{panel.store_name}</div>
                <div className=" text-center">
                  {reformatDate(panel.sale_date.split("T")[0])}
                </div>
              </div>
              <div className={`flex justify-between px-2 mt-1 ${text}`}>
                <div>
                  <div className={text}>
                    <div>Sales</div>
                    <div className="font-medium">
                      {formatCurrency2(panel.total_sales)}
                    </div>
                  </div>
                  <div className={text}>
                    <div>Weight</div>
                    <div className="font-medium">{panel.weight.toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <div className={text}>
                    <div>Quantity</div>
                    <div className="font-medium">{panel.qty}</div>
                  </div>
                  <div className={text}>
                    <div>Weight</div>
                    <div className="font-medium">{panel.weight}</div>
                  </div>
                </div>
              </div>
              <div className="font-medium text-center">
                Terminal: {panel.terminal}
              </div>
              <div className="flex justify-around">
                <button className={`btn-themeBlue ${style}`}>Subs</button>
                <button className={`btn-themeOrange ${style}`}>Hourly</button>
                <button className={`btn-themeGreen ${style}`}>Cats</button>
              </div>
            </div>
          ))
        : null}
    </div>
  );
};

export default SalesPanels;
