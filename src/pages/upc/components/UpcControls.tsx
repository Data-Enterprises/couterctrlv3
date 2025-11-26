import { useEffect, useRef, useState } from "react";
import CheckBox from "../../../components/inputs/CheckBox";
import RadioBox from "../../../components/inputs/RadioBox";
import { useUpcContext } from "../wizard/hooks";

const useScrollHeight = () => {
  const [height, setHeight] = useState<number>(0);
  const topRef = useRef<HTMLDivElement>(null);

  const calcHeight = () => {
    if (!topRef.current) return;
    const position = topRef.current.getBoundingClientRect().height;
    console.log(position);
    setHeight(window.innerHeight - position - 80); // 32 for page padding + 48 for the titlebar height
  };

  useEffect(() => {
    calcHeight();

    window.addEventListener("resize", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, []);

  return { height, topRef };
};

const UpcControls = () => {
  const context = useUpcContext();
  const { height, topRef } = useScrollHeight();

  // use this map when you finally get the upcs from the endpoints
  const renderTest = () => {
    const test = [];
    for (let i = 0; i < 50; i++) {
      test.push(i);
    }
    return test.map((item) => (
      <div key={item} className="even:bg-blue-200 px-2 py-1">
        <CheckBox
          label={`Store ${item}`}
          value={false}
          onChange={() => {}}
          id={item}
        />
      </div>
    ));
  };

  return (
    <div className="grid bg-custom-white rounded-lg shadow-lg text-sm">
      <div
        ref={topRef}
        className="flex flex-col gap-2 rounded-t-lg px-2 pt-3 pb-2"
      >
        <div className="font-medium text-center rounded-t-lg">
          {context.startDate} - {context.endDate}
        </div>
        <div className="flex flex-col gap-2">
          <button className="py-1 btn-themeBlue">Reset</button>
          <button className="py-1 btn-themeGreen">Export Csv</button>
        </div>
        <div className="flex flex-col gap-2">
          <RadioBox
            value={false}
            label={"Show All - 0"}
            onChange={function (id: number): void {
              throw new Error("Function not implemented.");
            }}
            id={1}
          />
          <RadioBox
            value={false}
            label={"Show Selected - 0"}
            onChange={function (id: number): void {
              throw new Error("Function not implemented.");
            }}
            id={2}
          />
          <RadioBox
            value={false}
            label={"Show Stores - 0"}
            onChange={function (id: number): void {
              throw new Error("Function not implemented.");
            }}
            id={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button className="py-1 btn-themeOrange">Deselect All</button>
          <button className="py-1 btn-themeBlue">Show Desc</button>
        </div>
        <input
          type="text"
          className="basic-input focus:border bg-custom-white py-1 w-full"
        />
      </div>

      <div
        className="bg-custom-white rounded-b-lg overflow-y-scroll no-scrollbar"
        style={{ minHeight: height, maxHeight: height }}
      >
        {renderTest()}
      </div>
    </div>
  );
};

export default UpcControls;
