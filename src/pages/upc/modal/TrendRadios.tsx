import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setTrendOption } from "../../../features/upcModalSlice";
import CheckBox from "../../../components/inputs/CheckBox";

const TrendRadios = () => {
  const dispatch = useAppDispatch();
  const trendOption = useAppSelector((state) => state.upcModal.trendOption);

  return (
    <div className="flex justify-center gap-4">
      <CheckBox
        id={0}
        label="All"
        value={trendOption.all}
        className="cursor-pointer"
        onChange={() => dispatch(setTrendOption("all"))}
        idExtension="trend-all"
      />
      <CheckBox
        id={1}
        label="Top 5"
        value={trendOption.top}
        className="cursor-pointer"
        onChange={() => dispatch(setTrendOption("top"))}
        idExtension="trend-top"
      />
      <CheckBox
        id={2}
        label="Bottom 5"
        value={trendOption.bottom}
        className="cursor-pointer"
        onChange={() => dispatch(setTrendOption("bottom"))}
        idExtension="trend-bottom"
      />
    </div>
  );
};

export default TrendRadios;
