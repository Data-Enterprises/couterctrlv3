interface MarginKpiProps {
  data: string;
  title: string;
}

const SubDeptMarginKpi = ({ data, title }: MarginKpiProps) => {
  return (
    <div className="flex flex-col gap-1 justify-center items-center bg-custom-white p-4 rounded-lg shadow-lg">
      <div className="text-content/60">{title}</div>
      <div>{data}</div>
    </div>
  );
};

export default SubDeptMarginKpi;
