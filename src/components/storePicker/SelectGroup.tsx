import { useAppSelector } from "../../hooks";
import { useDispatch } from "react-redux";
import { setLastGroup } from "../../features/searchSlice";

const SelectGroup = () => {
  const context = useAppSelector((state) => state.app);
  const searchState = useAppSelector((state) => state.search);
  const group = useAppSelector((state) => state.group);
  const dispatch = useDispatch();

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
          {group.groups.map((group, idx) => (
            <option key={`group-${idx}`} value={group.id}>
              {group.group_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectGroup;
