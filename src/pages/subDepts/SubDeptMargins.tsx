import { useAppSelector } from "../../hooks";
import SubDeptMarginsLegacy from "./SubDeptMarginsLegacy";

const SubDeptMargins = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  if (devMode) return null;
  return <SubDeptMarginsLegacy />;
};

export default SubDeptMargins;
