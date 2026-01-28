import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getItemAssociation } from "../../../api/upc";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../utils";
import {
  addSelectedUpcParam,
  removeSelectedUpcParam,
  handleAssociationDeselect,
  setAssociations,
  type ItemAssociate,
  setReQueryAssociations,
  resetAssociations,
  setSingleAssocitions,
} from "../../../features/upcSlice";
import { useEffect, useState } from "react";
import UpcControls from "../components/UpcControls";
import Input from "../../../components/inputs/Input";
import CtxMenu from "../../../components/CtxMenu";
import type { Handlers } from "../../../interfaces";
import { singleOption } from "../utils";
import {
  setClipboardText,
  setMenuPosition,
} from "../../../features/ctxMenuSlice";
import UpcModal from "../modal/UpcModal";
import { associateHeaders } from "../exportHeaders";
import { exportData } from "../exportHeaders/utils";
import { reset } from "../../../features/upcModalSlice";

type AssociateExport = {
  level: string;
  upc: string;
  description: string;
  qty: number;
};

const UpcAssociation = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const upc = useAppSelector((state) => state.upc);
  const ctx = useAppSelector((state) => state.ctxMenu);
  const modal = useAppSelector((state) => state.upcModal);
  const {
    itemAssociations,
    selectedAssociationUpcParam,
    reQueryAssociations,
    selectedUpcs,
    singleItemAssociations,
  } = useAppSelector((state) => state.upc);

  const [upcText, setUpcText] = useState<string>("");

  useEffect(() => {
    dispatch(resetAssociations());
    if (selectedUpcs.length > 0) {
      const start = formatGoliathDate(search.startDate);
      const end = formatGoliathDate(search.endDate);
      const ids = upc.storeids.split(",").map((id) => Number(id));

      getItemAssociation(
        context.url,
        context.token,
        start,
        end,
        ids,
        selectedUpcs,
        20,
        "top",
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const groupedProductCodes = [...j.items].reduce(
              (acc: ItemAssociate[], curr) => {
                const exists = acc.find(
                  (item) => item.product_code === curr.product_code,
                );
                if (exists) {
                  exists.qty += curr.qty;
                } else {
                  acc.push({ ...curr });
                }
                return acc;
              },
              [],
            );
            const main = groupedProductCodes.filter((item: ItemAssociate) =>
              selectedUpcs.includes(item.product_code),
            );

            const associates = groupedProductCodes.filter(
              (item: ItemAssociate) =>
                !selectedUpcs.includes(item.product_code),
            );

            dispatch(resetAssociations());
            dispatch(setAssociations(main));
            dispatch(setAssociations(associates));
          }
        })
        .catch((err) =>
          toast.error("Error fetching associations: " + err.message),
        );
    }
  }, [selectedUpcs]);

  useEffect(() => {
    if (!reQueryAssociations) return;
    getData(selectedAssociationUpcParam);
  }, [reQueryAssociations]);

  const getData = (upcs: string[]) => {
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const ids = upc.storeids.split(",").map((id) => Number(id));
    getItemAssociation(
      context.url,
      context.token,
      start,
      end,
      ids,
      upcs,
      20,
      "top",
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const associations = [
            ...j.items.filter(
              (i: ItemAssociate) =>
                !selectedAssociationUpcParam.some(
                  (pc) => pc === i.product_code,
                ),
            ),
          ];
          dispatch(setAssociations(associations));
        }
      })
      .catch((err) =>
        toast.error("Error fetching deeper level associations: " + err.message),
      )
      .finally(() => dispatch(setReQueryAssociations(false)));
  };

  const handleCardClick = (item: ItemAssociate, level: number) => {
    if (level === 1) {
      // check to see if we add or remove from upc list
      const exists = selectedAssociationUpcParam.find(
        (upc) => upc === item.product_code,
      );

      if (exists) {
        // deselect => based on level and # of columns
        dispatch(removeSelectedUpcParam(item.product_code));
        dispatch(handleAssociationDeselect(level));

        // check if any others are selected => if true, set trigger to fetch
        const upcs = [...selectedAssociationUpcParam].filter(
          (upc) => upc !== item.product_code,
        );

        const someExists = itemAssociations[level].some((ass) =>
          upcs.includes(ass.product_code),
        );

        if (someExists) {
          dispatch(setReQueryAssociations(true));
        }
      } else {
        // select => basedon level and # of columns
        dispatch(addSelectedUpcParam(item.product_code));
        dispatch(handleAssociationDeselect(level));
        dispatch(setReQueryAssociations(true));
      }
    } else if (level === 2) {
      // check to see if we add or remove from upc list
      const exists = selectedAssociationUpcParam.find(
        (upc) => upc === item.product_code,
      );

      if (exists) {
        // deselect => based on level and # of columns
        dispatch(removeSelectedUpcParam(item.product_code));
        dispatch(handleAssociationDeselect(level));

        // check if any others are selected => if true, set trigger to fetch
        const upcs = [...selectedAssociationUpcParam].filter(
          (upc) => upc !== item.product_code,
        );

        const someExists = itemAssociations[level].some((ass) =>
          upcs.includes(ass.product_code),
        );

        if (someExists) {
          dispatch(setReQueryAssociations(true));
        }
      } else {
        // select => basedon level and # of columns
        dispatch(addSelectedUpcParam(item.product_code));
        dispatch(handleAssociationDeselect(level));
        dispatch(setReQueryAssociations(true));
      }
    } else if (level === 0 || level === 3) {
      return;
    }
  };

  const handleSetUpcText = (value: string) => {
    setUpcText(value);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch(setMenuPosition(null));
  };

  const handlers: Handlers = {
    copyUpc: () => handleCopy(ctx.clipboardText.upc),
  };

  const handleRightClick = (
    e: React.MouseEvent<HTMLDivElement>,
    option: ItemAssociate,
  ) => {
    e.preventDefault();

    dispatch(
      setClipboardText({
        upc: option.product_code,
        desc: "",
      }),
    );
    dispatch(setMenuPosition({ x: e.pageX + 5, y: e.pageY }));
  };

  const handleSingleUpcSearch = () => {
    dispatch(setSingleAssocitions([]));
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const ids = upc.storeids.split(",").map((id) => Number(id));
    const upcs = [upcText.trim()];

    getItemAssociation(
      context.url,
      context.token,
      start,
      end,
      ids,
      upcs,
      20,
      "top",
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const grouped = [...j.items].reduce((acc: ItemAssociate[], curr) => {
            const exists = acc.find(
              (item) => item.product_code === curr.product_code,
            );
            if (exists) {
              exists.qty += curr.qty;
            } else {
              acc.push({ ...curr });
            }
            return acc;
          }, []);
          dispatch(setSingleAssocitions(grouped));
        }
      })
      .catch((err) =>
        toast.error("Error fetching single UPC association: " + err.message),
      );
  };

  const showSingleAssociattion = (upc: string) => {
    let isAssociated = false;

    itemAssociations.forEach((lvl) => {
      if (lvl.find((item) => item.product_code === upc)) {
        isAssociated = true;
      }
    });

    return isAssociated ? "bg-blue-200" : "bg-custom-white ";
  };

  const formatData = () => {
    // nested arrays [Main, Level 1, Level 2, Level 3]
    const result: AssociateExport[] = [];
    for (let i = 0; i < itemAssociations.length; i++) {
      const level = i === 0 ? "Main" : `Level ${i}`;
      for (let j = 0; j < itemAssociations[i].length; j++) {
        result.push({
          level,
          upc: itemAssociations[i][j].product_code,
          description: itemAssociations[i][j].product_description,
          qty: itemAssociations[i][j].qty,
        });
      }
    }

    return result;
  };

  const handleExport = () => {
    if (modal.fileName === "") {
      toast.warn("Please enter a file name");
      return;
    }
    const data = formatData();

    exportData(data, associateHeaders, modal.fileName);
    dispatch(reset());
  };

  return (
    <div className="h-full w-full grid grid-cols-[14%_85%] gap-4 overflow-hidden">
      <CtxMenu handlers={handlers} options={singleOption} />
      <UpcModal handleExport={handleExport} />
      <div>
        <UpcControls />
      </div>
      <div className="grid grid-cols-5 gap-4 mr-4">
        {itemAssociations.map((items, idx) => (
          <div className="bg-custom-white rounded-lg">
            <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg px-2 py-0.5 flex justify-between">
              <div>{idx === 0 ? "Main" : `Level ${idx}`}</div>
              <div>
                {itemAssociations[idx].length}{" "}
                {itemAssociations[idx].length === 1 ? "Item" : "Items"}
              </div>
            </div>
            <div className="grid gap-2 max-h-[88vh] overflow-y-auto no-scrollbar p-1 bg-custom-white">
              {items.map((item) => (
                <div
                  key={Math.random()}
                  className={`text-xs rounded-lg p-2 shadow-md cursor-pointer hover:bg-blue-200 duration-200 transition-all ${selectedAssociationUpcParam.find((upc) => upc === item.product_code) ? "bg-orange-200" : "bg-custom-white "}`}
                  onClick={() => handleCardClick(item, idx)}
                  onContextMenu={(e) => handleRightClick(e, item)}
                >
                  <div className="flex justify-between mb-1">
                    <div>{item.product_code}</div>
                    <div>Qty: {item.qty}</div>
                  </div>
                  <div>{item.product_description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* SingleUpcAssociationLookup */}
        <div className="bg-custom-white rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg px-2 py-0.5 flex justify-between">
            <div>Upc Search</div>
            <div>
              {singleItemAssociations.length}{" "}
              {singleItemAssociations.length === 1 ? "Item" : "Items"}
            </div>
          </div>
          <div className="grid gap-2 max-h-[88vh] overflow-y-auto no-scrollbar p-1 bg-custom-white">
            <Input label="" setValue={handleSetUpcText} value={upcText} />
            <div className="flex gap-2">
              <button
                className="btn-themeBlue py-0.5 px-0 w-1/2"
                onClick={handleSingleUpcSearch}
              >
                Search
              </button>
              <button
                className="btn-themeOrange py-0.5 px-0 w-1/2"
                onClick={() => {
                  dispatch(setSingleAssocitions([]));
                  setUpcText("");
                }}
              >
                Clear
              </button>
            </div>

            {singleItemAssociations.map((item) => (
              <div
                key={Math.random()}
                className={`text-xs rounded-lg p-2 shadow-md cursor-pointer hover:bg-blue-200 duration-200 transition-all 
                  ${showSingleAssociattion(item.product_code)}`}
              >
                <div className="flex justify-between mb-1">
                  <div>{item.product_code}</div>
                  <div>Qty: {item.qty}</div>
                </div>
                <div>{item.product_description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcAssociation;
