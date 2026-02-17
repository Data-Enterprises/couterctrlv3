interface UserFormButtonsProps {
  formType: "create" | "update";
}

const UserFormButtons = ({ formType }: UserFormButtonsProps) => {
  const handleCreateOrUpdate = () => {
    if (formType === "create") {
      return;
    } else {
      return;
    }
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      <button className="btn-themeBlue px-0" onClick={handleCreateOrUpdate}>
        Submit
      </button>
      <button className="btn-themeBlue px-0">Stores</button>
      <button className="btn-themeBlue px-0">Clear Fields</button>
    </div>
  );
};

export default UserFormButtons;
