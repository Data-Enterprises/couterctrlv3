import { useState } from "react";

const GroupList = () => {
  const [searchText, setSearchText] = useState<string>("");
  return (
    <div className="ml-10" data-testid="group-list">
      <div className="w-full flex items-end gap-4 mb-4">
        <div className="w-1/2">
          <div className="text-sm font-semibold text-themeText">
            Search for stores
          </div>
          <input
            type="text"
            value={searchText}
            placeholder="Search stores..."
            className="basic-input bg-custom-white"
            onChange={(e) => setSearchText(e.currentTarget.value)}
          />
        </div>
        <div>
          <button className="btn-themeBlue px-10">Reset</button>
        </div>
      </div>
    </div>
  );
};

export default GroupList;
