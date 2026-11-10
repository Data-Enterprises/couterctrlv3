import SearchType from "./SearchType";
import SearchStore from "./SearchStore";
import SelectGroup from "./SelectGroup";
import { useAppSelector } from "../../hooks";

/** The store picker: the Store / Group type switch with the store search or the
 *  group dropdown below it. Role 1 users are limited to one store. */
const StorePicker = () => {
  const state = useAppSelector((state) => state.search.type);
  const role = useAppSelector((state) => state.user.role);
  const style =
    "flex flex-col gap-2 md:gap-1 items-center justify-center select-none";

  return (
    <div data-testid="store-picker" className={style}>
      <SearchType singleStoreOnly={role === 1} />
      {state === "Store" ? (
        <SearchStore />
      ) : (
        <SelectGroup />
      )}
    </div>
  );
};

export default StorePicker;
