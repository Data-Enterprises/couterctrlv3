const CreateGroup = () => {
  return (
    <div className="flex gap-4 mb-4 items-end" data-testid="create-group">
      <div className="w-1/2">
        <label className="block text-sm mb-0.5 ml-0.5 font-medium">
          Create Group
        </label>
        <input
          type="text"
          className="basic-input focus:border bg-custom-white w-full"
          placeholder="Group Name"
        />
      </div>
      <div className="flex justify-end gap-4 w-1/2">
        <button className="btn-themeOrange w-1/2">Delete</button>
        <button className="btn-themeBlue w-1/2">Create</button>
      </div>
    </div>
  );
};

export default CreateGroup;
