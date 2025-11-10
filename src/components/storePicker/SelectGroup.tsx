import { useEffect } from "react";
import { useAppSelector } from "../../hooks";
import { useDispatch } from "react-redux";
import { setLastGroup } from "../../features/searchSlice";

const SelectGroup = () => {
  const context = useAppSelector((state) => state.app);
  const searchState = useAppSelector((state) => state.search);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!context.token) return;
    // getGroups();
  }, [context.token]);

  // const getGroups = () => {
  //   userGroups(context.url, context.token)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error == "0") {
  //         dispatch(setGroups(j.groups));
  //       } else {
  //         setError(j.msg);
  //       }
  //     })
  //     .catch((e: JsonError) => {
  //       setError(e.message);
  //     });
  // };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setLastGroup(parseInt(e.target.value)));
  };
  const styling = !context.isMobile ? "px-4 md:px-0 md:w-full" : "w-full";

  return (
    <div data-testid="select-group" className={styling}>
      <label className="block text-sm/6 font-medium ">Group</label>
      <div className="grid grid-cols-1">
        <select
          defaultValue={searchState.lastGroup}
          value={searchState.lastGroup}
          onChange={handleChange}
          className="basic-input bg-custom-white"
        >
          <option>Select a Group</option>
          {/* {searchState.groups.map((group, idx) => (
            <option key={`group-${idx}`} value={group.id}>
              {group.group_name}
            </option>
          ))} */}
        </select>
      </div>
    </div>
  );
};

export default SelectGroup;
