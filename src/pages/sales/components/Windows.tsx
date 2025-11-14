import { useAppSelector, useAppDispatch } from "../../../hooks";
import Window from "../../../components/Window";
import {
  setWindowVisible,
  type WindowVisible,
} from "../../../features/salesSlice";

const Windows = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);

  const closeWindow = (type: keyof WindowVisible) => {
    dispatch(
      setWindowVisible({
        key: type,
        show: false,
      })
    );
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
      >
        <div>Howdy from Cats</div>
      </Window>
    </>
  );
};

export default Windows;
