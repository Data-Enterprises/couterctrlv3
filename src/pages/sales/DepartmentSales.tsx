import { useEffect } from "react";
import { useAppSelector } from "../../hooks";
import Carousel from "../../components/Carousel";
import type { DepartmentSale } from "../../interfaces";
import DeptCard from "./DeptCard";

const DepartmentSales = () => {
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    // Any necessary data processing can be done here
  }, [sales.departmentSales]);

  const chunkDeptSales = (data: DepartmentSale[], chunkSize: number) => {
    const chunks: DepartmentSale[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const deptChunks = chunkDeptSales(sales.departmentSales, 4);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="font-medium mx-2 border-b border-content/30 py-0.5">
        Department Sales
      </div>
      <Carousel className="h-[91%]">
        {deptChunks.map((chunk, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-4">
            {chunk.map((dept) => (
              <DeptCard key={dept.sub_department} dept={dept} />
            ))}
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default DepartmentSales;
