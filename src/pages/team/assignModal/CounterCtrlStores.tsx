import { useAppSelector } from "../../../hooks";
import Assigned from "./Assigned";
import Unassigned from "./Unassigned";

const CounterCtrlStores = () => {
  const users = useAppSelector((state) => state.users);

  return (
    <div className={`grid grid-cols-2 gap-4 h-[65vh] ${users.selectedUserStores.unassigned.length ? "" : "hidden"}`}>
      <Unassigned />
      <Assigned />
    </div>
  );
};

export default CounterCtrlStores;
