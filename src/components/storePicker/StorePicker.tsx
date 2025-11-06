import SearchType from "./SearchType";
import SearchStore from "./SearchStore";
import SelectGroup from "./SelectGroup";

import { useAppSelector } from "../../hooks";
// import { savePrefs } from "../apis/users";
import { useEffect } from "react";
// import type { JsonError } from "../../interfaces";
// import { useToast } from "../toasts/hooks/useToast";
// import { useDispatch } from "react-redux";
// import type { setSendPrefs } from "../../features/searchSlice";
// import { setSendPrefs } from "../features/searchSlice";

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
  // const dispatch = useDispatch();
  // const toast = useToast();

  useEffect(() => {
    if (!context.token) return;
    if ((context.token, searchState.sendPrefs && !useSubComp)) {
      // send();
      // dispatch(setSendPrefs(false));
    }
  }, [searchState.sendPrefs]);

  // const send = () => {
  //   let type = 1;
  //   if (searchState.type == "Group") {
  //     type = 2;
  //   } else if (searchState.type == "Single Store") {
  //     type = 3;
  //   } else {
  //     // we should be left with just a number
  //     type = parseInt(searchState.type.toString());
  //   }
  //   savePrefs(
  //     context.url,
  //     context.token,
  //     searchState.lastStore,
  //     searchState.lastGroup,
  //     type,
  //     "",
  //     context.lastRoute
  //   )
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error == "0") {
  //         dispatch(setSendPrefs(false));
  //       } else {
  //         toast.warn(j.msg);
  //       }
  //     })
  //     .catch((e: JsonError) => {
  //       toast.error(e.message);
  //     });
  // };

  const style = context.isDesktop
    ? "flex flex-col md:flex-row md:mb-4 gap-0 md:gap-4 items-center justify-center"
    : context.isTablet
    ? "flex mb-2 gap-6"
    : "flex flex-col";

  return (
    <div className={style}>
      <SearchType
        singleStoreOnly={singleStoreOnly}
        useSubComp={useSubComp}
        inMarketing={inMarketing}
      />
      {state === "Single Store" ? <SearchStore /> : null}
      {state == "3" ? <SearchStore /> : null}
      {state === "Group" ? <SelectGroup /> : null}
      {state == "2" ? <SelectGroup /> : null}
    </div>
  );
};

export default StorePicker;
