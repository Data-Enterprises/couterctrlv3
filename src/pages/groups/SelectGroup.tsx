import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setCreateInput,
  setFilterOption,
  setSelectedGroup,
  type Group,
  type FilterOption,
} from "../../features/groupSlice";
import SingleSelect from "../../components/SingleSelect";

const options = [
  { display: "All Stores", value: "all" },
  { display: "Active Stores", value: "active" },
  { display: "Inactive Stores", value: "inactive" },
];

interface SelectGroupProps {
  getData: (id: number) => void;
}

const SelectGroup = ({ getData }: SelectGroupProps) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const group = useAppSelector((state) => state.group);

  const handleGroupSelect = (groupId: number) => {
    const selected: Group = group.groups.find((g: Group) => g.id === groupId)!;
    dispatch(setCreateInput(selected.group_name));
    dispatch(setSelectedGroup(selected));
    getData(groupId);
  };

  const handleOptionSelect = (option: string) => {
    dispatch(setFilterOption(option as FilterOption));
  };

  const showFilterAmount = (filter: FilterOption = "all") => {
    switch (filter) {
      case "all":
        return group.storesWithGroupStatus.length;
      case "active":
        return group.storesWithGroupStatus.filter((s) => s.active === 1).length;
      case "inactive":
        return group.storesWithGroupStatus.filter((s) => s.active === 0).length;
      default:
        return group.storesWithGroupStatus.length;
    }
  };

  const layout = context.isDesktop ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2";

  return (
    <div data-testid="select-group">
      <div className={layout}>
        <SingleSelect
          id={1}
          label="Select Group"
          onSelect={(selection) => handleGroupSelect(selection as number)}
          data={group.groups}
          valueKey={"id"}
          displayKey={"group_name"}
          resetQuery={true}
        />
        <SingleSelect
          id={2}
          label="Filter Options"
          onSelect={(selection) => handleOptionSelect(selection as string)}
          data={options}
          valueKey={"value"}
          displayKey={"display"}
          resetQuery={true}
          defaultQuery={"All Stores"}
          className="hidden md:block"
        />
      </div>
      <div className="hidden md:block font-medium text-sm my-4 select-none">
        Select a Group and then select each store that you would like to see in
        that Group. You can swith groups and change as many goups as you like.
        All selected stores in the group will have the blue indicator
      </div>
      <div className="hidden md:block w-1/2 items-center rounded-lg mt-4 pr-2.5 select-none">
        <div className="flex mb-4 bg-custom-white rounded-lg shadow-lg">
          <div className="bg-blue-500 text-custom-white p-2 rounded-lg uppercase">
            all stores
          </div>
          <div className="flex-1 text-right p-2 ">{showFilterAmount()}</div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-lg shadow-lg">
          <div className="bg-emerald-500 text-custom-white p-2 rounded-lg uppercase">
            active stores
          </div>
          <div className="flex-1 text-right p-2 ">
            {showFilterAmount("active")}
          </div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-lg shadow-lg">
          <div className="bg-orange-500 text-custom-white p-2 rounded-lg uppercase">
            inactive stores
          </div>
          <div className="flex-1 text-right p-2 ">
            {showFilterAmount("inactive")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectGroup;
