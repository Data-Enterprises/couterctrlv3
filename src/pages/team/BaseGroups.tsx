const BaseGroups = () => {
  return (
    <div>
      <div className="flex gap-2">
        
        <div className="bg-blue-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          All Groups
        </div>
        <div className="bg-emerald-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          0 Active Groups
        </div>
        <div className="bg-orange-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          0 Inactive Groups
        </div>
      </div>
      <div className="w-full min-h-[93.4%] max-h-[93.4%] rounded-b-lg px-4 border-2 border-content/30">
        <div>Groups here</div>
        <div className="grid grid-cols-3 gap-4">
          <button className="btn-themeOrange">Delete User</button>
          <button className="btn-themeBlue">Update Password</button>
          <button className="btn-themeBlue">Update User</button>
        </div>
      </div>
    </div>
  );
};

export default BaseGroups;
