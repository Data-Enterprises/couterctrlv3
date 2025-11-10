import CreateGroup from "./CreateGroup";
import SelectGroup from "./SelectGroup";
import GroupList from "./GroupList";

const Groups = () => {
  return (
    <div
      className="w-full h-[calc(100vh-3rem)] p-4 grid grid-cols-[40%_1fr] gap-4"
      data-testid="groups-page"
    >
      <div>
        <CreateGroup />
        <SelectGroup />
      </div>
      <GroupList />
    </div>
  );
};

export default Groups;
