import UserInfo from "./UseInfo";
import UserGrid from "./UserGrid";

const Team = () => {
  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="grid grid-rows-2 gap-4">
          <UserGrid />
          <div className="h-full w-full ">Active Groups</div>
        </div>
        <div className="grid grid-rows-2 gap-4">
          <UserInfo />
          <div className="h-full w-full ">Edit Controls for user</div>
        </div>
      </div>
    </div>
  );
};

export default Team;
