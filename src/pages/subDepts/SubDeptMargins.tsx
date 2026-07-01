import { useAppSelector } from "../../hooks";
import SubDeptMarginsLegacy from "./SubDeptMarginsLegacy";
import SubDeptMarginsDev from "./SubDeptMarginsDev";

const SubDeptMargins = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  if (devMode) return <SubDeptMarginsDev />;
  return <SubDeptMarginsLegacy />;
};

export default SubDeptMargins;
