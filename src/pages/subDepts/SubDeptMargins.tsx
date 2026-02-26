import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./SubMarginDisplay";

const SubDeptMargins = () => {
  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[24%_75%] gap-4 p-4">
      <SubMarginControls />
      <SubMarginDisplay />
    </div>
  );
};

export default SubDeptMargins;
