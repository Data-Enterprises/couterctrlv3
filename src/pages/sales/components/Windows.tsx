import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setWindowVisible,
  type WindowVisible,
} from "../../../features/salesSlice";
import Window from "../../../components/Window";

const Windows = () => {
  const defaultZIndex = { subs: 100, hourly: 100, cats: 100 };
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);
  const [zIndexes, setZIndexes] = useState<{ [key: string]: number }>(
    defaultZIndex
  );

  useEffect(() => {
    // Reset zIndexes when windows are closed
    const anyOpen = Object.values(sales.windowVisible).some((v) => v === true);
    if (!anyOpen) {
      setZIndexes(defaultZIndex);
    }
  }, [sales.windowVisible]);

  const closeWindow = (type: keyof WindowVisible) => {
    dispatch(
      setWindowVisible({
        key: type,
        show: false,
      })
    );
  };

  const setZIndex = (type: keyof WindowVisible) => {
    const window = type;
    setZIndexes({ ...defaultZIndex, [window]: 200 });
  };

  return (
    <>
      <Window
        isShowing={sales.windowVisible.subs}
        hide={() => closeWindow("subs")}
        title="Sub Departments"
        top={64}
        left={432}
        height={500}
        width={750}
        zIndex={zIndexes.subs}
        setZIndex={() => setZIndex("subs")}
      >
        <div>Howdy from Subs</div>
      </Window>
      <Window
        isShowing={sales.windowVisible.hourly}
        hide={() => closeWindow("hourly")}
        title="Hourly Overview"
        top={134}
        left={532}
        height={500}
        width={750}
        zIndex={zIndexes.hourly}
        setZIndex={() => setZIndex("hourly")}
      >
        <div>Howdy from Hourly</div>
      </Window>
      <Window
        isShowing={sales.windowVisible.cats}
        hide={() => closeWindow("cats")}
        title="Categories"
        top={204}
        left={632}
        height={500}
        width={750}
        zIndex={zIndexes.cats}
        setZIndex={() => setZIndex("cats")}
      >
        <div>Howdy from Cats</div>
      </Window>
    </>
  );
};

export default Windows;
