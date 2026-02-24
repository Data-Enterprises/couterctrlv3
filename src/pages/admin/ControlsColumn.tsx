import { useAppDispatch } from "../../hooks";
import { useAdminContext, useControlsScrollHeight } from "./hooks";

// Components
import Input from "../../components/inputs/Input";
import SingleSelect from "../../components/SingleSelect";
import {
  defaultComp,
  setAdminOption,
  setCompanyFilter,
  setSelectedUser,
  setUserNameFilter,
} from "../../features/adminSlice";
import CheckBox from "../../components/inputs/CheckBox";
import { adminOptions } from ".";

const ControlsColumn = () => {
  const dispatch = useAppDispatch();
  const { containerRef, scrollRef, height } = useControlsScrollHeight();
  const {
    companies,
    filteredUsers,
    userNameFilter,
    companyFilter,
    adminOption,
    selectedUser,
  } = useAdminContext();

  const handleTextChange = (e: string) => {
    dispatch(setUserNameFilter(e));
  };

  const handleSelect = (e: string | number) => {
    const id = Number(e);
    const company =
      id === 0
        ? defaultComp
        : companies.filter((comp) => comp.id === Number(id))[0];
    dispatch(setCompanyFilter(company));
  };

  const handleAdminSelect = (e: string | number) => {
    dispatch(setAdminOption(Number(e)));
  };

  const handleSelectedUser = (e: number | boolean) => {
    const selected = Number(e) === selectedUser ? 0 : Number(e)
    dispatch(setSelectedUser(selected));
  };

  return (
    <div
      ref={containerRef}
      className="bg-custom-white pb-2 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] rounded-lg shadow-lg overflow-hidden"
    >
      <div className="font-medium px-2 text-center bg-blue-500 py-0.5 rounded-t-lg text-custom-white">
        Admin Controls
      </div>
      <SingleSelect
        label="Admin Options"
        data={adminOptions}
        displayKey={"label"}
        valueKey={"option"}
        innerClass="py-1.5"
        className="px-2"
        onSelect={handleAdminSelect}
        resetQuery={true}
        defaultQuery={adminOptions[adminOption - 1].label}
      />
      {/* Filters */}
      <div className="space-y-1 pb-2 px-2">
        <Input
          label="Username"
          value={userNameFilter}
          setValue={handleTextChange}
          className=""
        />
        <SingleSelect
          label="Company"
          data={companies}
          displayKey="name"
          valueKey="id"
          defaultQuery={companyFilter.name}
          resetQuery={true}
          innerClass="py-1.5"
          onSelect={handleSelect}
        />
      </div>

      {/* ScrollView */}
      <div className="font-medium text-center">
        Users - {filteredUsers.length}
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-scroll no-scrollbar"
        style={{ minHeight: height, maxHeight: height }}
      >
        {filteredUsers.map((user, i) => {
          return (
            <CheckBox
              id={user.id}
              key={i}
              value={user.id === selectedUser}
              className="odd:bg-blue-200 py-1 hover:bg-orange-200 hover:cursor-pointer transition-all duration"
              idExtension="user"
              label={user.username}
              onChange={handleSelectedUser}
              isBool={false}
              
            />
          );
        })}
      </div>
    </div>
  );
};

export default ControlsColumn;
