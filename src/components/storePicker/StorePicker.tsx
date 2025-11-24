import SearchType from "./SearchType";
import SearchStore from "./SearchStore";
import SelectGroup from "./SelectGroup";
import { useAppSelector } from "../../hooks";

interface Props {
  singleStoreOnly?: boolean;
  useSingleDate?: boolean;
  useSubComp?: boolean;
  inMarketing?: boolean;
}

const StorePicker = ({
  singleStoreOnly = false,
  useSubComp = false,
  inMarketing = false,
}: Props) => {
  const state = useAppSelector((state) => state.search.type);
  const style =
    "flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-2 items-center justify-center select-none";

  return (
    <div data-testid="store-picker" className={style}>
      <SearchType
        singleStoreOnly={singleStoreOnly}
        useSubComp={useSubComp}
        inMarketing={inMarketing}
      />
      {state === "Stores" || state === "Store" ? (
        <SearchStore />
      ) : (
        <SelectGroup />
      )}
    </div>
  );
};

export default StorePicker;
