import { useAppSelector } from "../../../hooks";
import Assigned from "./Assigned";
import Unassigned from "./Unassigned";

interface CounterCtrlStoresProps {
  getData: () => void;
}

const CounterCtrlStores = ({ getData }: CounterCtrlStoresProps) => {
  const users = useAppSelector((state) => state.users);

  return (
    <>
      <div className="font-medium grid grid-cols-3 mb-4">
        <div className="w-full ">
          {users.userInfo.first_name} {users.userInfo.last_name || ""}
        </div>
        <div className="text-center">CounterCtrl</div>
        <div className="w-full text-right">{users.userInfo.username}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Unassigned getData={getData} />
        <Assigned getData={getData} />
      </div>
    </>
  );
};

export default CounterCtrlStores;
