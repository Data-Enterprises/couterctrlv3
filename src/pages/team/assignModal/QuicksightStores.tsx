import { useAppSelector } from "../../../hooks";
import QsAssigned from "./QsAssigned";
import QsUnassigned from "./QsUnassigned";

const QuickSightStores = () => {
  const users = useAppSelector((state) => state.users);
  return (
    <>
      <div className="font-medium grid grid-cols-3 mb-4">
        <div className="w-full ">
          {users.userInfo.first_name} {users.userInfo.last_name || ""}
        </div>
        <div className="text-center">QuickSight</div>
        <div className="w-full text-right">{users.userInfo.username}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <QsUnassigned />
        <QsAssigned />
      </div>
    </>
  );
};

export default QuickSightStores;
