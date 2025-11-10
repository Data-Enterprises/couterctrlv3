import SearchType from "./SearchType";
import SearchStore from "./SearchStore";
import SelectGroup from "./SelectGroup";
import { useAppSelector } from "../../hooks";
import { useEffect } from "react";

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
  const searchState = useAppSelector((state) => state.search);
  const state = useAppSelector((state) => state.search.type);
  const context = useAppSelector((state) => state.app);

  useEffect(() => {
    if (!context.token) return;
    if ((context.token, searchState.sendPrefs)) {
      return;
    }
  }, [searchState.sendPrefs]);

  const style =
    "flex flex-col md:grid md:grid-cols-2 gap2 md:gap-4 items-center justify-center";

  return (
    <div data-testid="store-picker" className={style}>
      <SearchType
        singleStoreOnly={singleStoreOnly}
        useSubComp={useSubComp}
        inMarketing={inMarketing}
      />
      {state == "1" ? <SearchStore /> : null}
      {state === "Stores" ? <SearchStore /> : null}
      {state === "Single Store" ? <SearchStore /> : null}
      {state == "3" ? <SearchStore /> : null}
      {state === "Group" ? <SelectGroup /> : null}
      {state == "2" ? <SelectGroup /> : null}
    </div>
  );
};

export default StorePicker;
