import { useAppSelector } from "../../hooks";
import SingleSelect from "../../components/SingleSelect";

const SelectGroup = () => {
  const group = useAppSelector((state) => state.group);

  const handleGroupSelect = (group: number) => {
    console.log("Selected group:", group);
    // Grabbing the group's id, make the api call to get the stores in that group
  };

  return (
    <div data-testid="select-group">
      <div className="grid grid-cols-2 gap-4">
        <SingleSelect
          label="Select Group"
          onSelect={(selection) => handleGroupSelect(selection as number)}
          data={group.groups}
          valueKey={"id"}
          displayKey={"group_name"}
        />
        <SingleSelect
          label="Filter Options"
          onSelect={(selection) => {
            console.log("Selected group:", selection);
          }}
          data={[]}
          valueKey={""}
          displayKey={""}
        />
      </div>
      <div className="font-medium text-sm my-4">
        Select a Group and then select each store that you would like to see in
        that Group. You can swith groups and change as many goups as you like.
        All selected stores in the group will have the blue indicator
      </div>
      <div className="hidden md:block w-1/2 items-center rounded-lg mt-8">
        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-[#3b82f6] text-custom-white p-2 rounded-r-lg uppercase">
            all stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-[#10b981] text-custom-white p-2 rounded-r-lg uppercase">
            active stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>

        <div className="flex mb-4 bg-custom-white rounded-r-lg shadow-lg">
          <div className="bg-[#f97316] text-custom-white p-2 rounded-r-lg uppercase">
            inactive stores
          </div>
          <div className="flex-1 text-right p-2 ">0</div>
        </div>
      </div>
    </div>
  );
};

export default SelectGroup;
