import UserInfo from "./UserInfo";
import UserGrid from "./UserGrid";
import BaseGroups from "./BaseGroups";

const Team = () => {

  /**
   * After this is finished, make sure you account for houchens users???
   * Delete User button needs a modal => as always
   */

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="grid">
          <UserGrid />
        </div>
        <div className="grid grid-rows-2">
          <UserInfo />
          <BaseGroups />
        </div>
      </div>
    </div>
  );
};

export default Team;
