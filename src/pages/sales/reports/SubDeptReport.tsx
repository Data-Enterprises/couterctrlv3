import TopSubDept from "../components/TopSub";
import SubDeptCards from "./SubDeptCards";
import SubDeptRptGrid from "./SubDeptRptGrid";

const SubDeptReport = () => {
  return (
    <div className="py-4 gap-4 h-[70vh]">
      <div className="h-full space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <SubDeptCards />
          <TopSubDept inReport={true} />
        </div>
        <SubDeptRptGrid />
      </div>
    </div>
  );
};

export default SubDeptReport;
