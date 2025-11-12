import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setCreateInput,
  setFilterOption,
  setSelectedGroup,
  setStoresWithGroupStatus,
  type Group,
  type FilterOption,
} from "../../features/groupSlice";
import SingleSelect from "../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import type { JsonError } from "../../interfaces";
import { useToast } from "../../components/toasts/hooks/useToast";

const options = [
  { display: "All Stores", value: "all" },
  { display: "Active Stores", value: "active" },
  { display: "Inactive Stores", value: "inactive" },
];

const SelectGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const group = useAppSelector((state) => state.group);
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    // Show all, active, or inactive stores based on filterOption and selectedGroup
  }, [group.filterOption, group.selectedGroup]);

  const handleGroupSelect = (groupId: number) => {
    const selected: Group = group.groups.find((g: Group) => g.id === groupId)!;
    dispatch(setCreateInput(selected.group_name));
    dispatch(setSelectedGroup(selected));
    getStoresAssignedToUserGroup(
      context.url,
      context.token,
      user.userid,
      groupId
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const stores = [...j.stores].sort((a, b) => b.active - a.active);
          dispatch(setStoresWithGroupStatus(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  };

  const handleOptionSelect = (option: string) => {
    dispatch(setFilterOption(option as FilterOption));
  };

  return (
    <div data-testid="select-group">
      <div className="grid grid-cols-2 gap-4">
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
        />
      </div>
      <div className="font-medium text-sm my-4">
        Select a Group and then select each store that you would like to see in
        that Group. You can swith groups and change as many goups as you like.
        All selected stores in the group will have the blue indicator
      </div>
      <div className="hidden md:block w-1/2 items-center rounded-lg mt-4 pr-2.5">
        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-blue-500 text-custom-white p-2 rounded-r-lg uppercase">
            all stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-emerald-500 text-custom-white p-2 rounded-r-lg uppercase">
            active stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-orange-500 text-custom-white p-2 rounded-r-lg uppercase">
            inactive stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>
      </div>
    </div>
  );
};

export default SelectGroup;
