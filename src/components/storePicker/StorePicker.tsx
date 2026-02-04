import SearchType from "./SearchType";
import SearchStore from "./SearchStore";
import SelectGroup from "./SelectGroup";
import { useAppSelector } from "../../hooks";

const StorePicker = () => {
  const state = useAppSelector((state) => state.search.type);
  const role = useAppSelector((state) => state.user.role);
  const style =
    "flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-2 items-center justify-center select-none";

  return (
    <div data-testid="store-picker" className={style}>
      <SearchType singleStoreOnly={role === 1} />
      {state === "Stores" || state === "Store" ? (
        <SearchStore />
      ) : (
        <SelectGroup />
      )}
    </div>
  );
};

export default StorePicker;
