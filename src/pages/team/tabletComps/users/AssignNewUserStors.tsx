import { useAppSelector } from "../../../../hooks";

const AssignNewUserStores = () => {
  const { selectedUserStores } = useAppSelector((state) => state.users);

  if (!selectedUserStores) {
    return null;
  }
  
  return (
    <div>
      <div>Assign New User Stores</div>
    </div>
  );
};

export default AssignNewUserStores;
