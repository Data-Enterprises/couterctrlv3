interface MarginKpiProps {
  data: string;
  title: string;
}

const SubDeptMarginKpi = ({ data, title }: MarginKpiProps) => {
  return (
    <div className="w-1/6 flex flex-col gap-1 justify-center items-center bg-custom-white px-2 py-4 rounded-lg shadow-lg">
      <div className="text-content/50">{title}</div>
      <div>{data}</div>
    </div>
  );
};

export default SubDeptMarginKpi;
