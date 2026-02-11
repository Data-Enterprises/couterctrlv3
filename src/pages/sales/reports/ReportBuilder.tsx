import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useRef } from "react";
import Modal from "../../../components/Modal";
import SingleSelect from "../../../components/SingleSelect";
import logo from "../../../assets/dcr_counterctrl-logo.png";

// dispatch actions
import { setIsRptOpen, setOptions, setTitle } from "../../../features/reportBuilderSlice";
import Input from "../../../components/inputs/Input";
import { formatDateSimple } from "../../../utils";
import SubDeptReport from "./SubDeptReport";
import { exportPdf } from ".";
import WeeklySalesReport from "./WeeklySalesReport";

const dataSets = [
  { type: "Weekly", option: "weekly" },
  { type: "Hourly", option: "hourly" },
  { type: "Sub Dept", option: "subDept" },
];

const ReportBuilder = () => {
  const dispatch = useAppDispatch();
  const reportRef = useRef<HTMLDivElement>(null);
  const state = useAppSelector((state) => state.reportBuilder);
  const search = useAppSelector((state) => state.search);

  const { isOpen } = useAppSelector((state) => state.reportBuilder);
  const { selectedSalesPanel } = useAppSelector((state) => state.sales);
  const handleTitleChange = (e: string) => {
    dispatch(setTitle(e));
  };

  const displayDate = () => {
    const p = selectedSalesPanel;
    if (p.sale_date) {
      // display that panel's date
      return formatDateSimple(p.sale_date);
    } else {
      // display search.singleDate minus 7 days
      const date = new Date(search.singleDate);
      const startDate = new Date(search.singleDate);
      startDate.setDate(date.getDate() - 7);
      return `${formatDateSimple(startDate.toISOString())} - ${search.singleDate}`;
    }
  };

  const savePDF = () => {
    exportPdf(reportRef.current!, state.title);
  };

  const handleOptionSelect = (option: string | number) => {
    const copy = { ...state.options}
    for (const key in copy) {
      if (key === option) {
        copy[key as keyof typeof copy] = true;
      } else {
        copy[key as keyof typeof copy] = false;
      }
    }
    dispatch(setOptions(copy));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(setIsRptOpen(false))}
      modalClassName="bg-custom-white w-1/2 grid gap-4 grid-cols-[0.9fr_3.1fr] h-[97vh]"
    >
      {/* Controls */}
      <div className="space-y-2">
        <Input
          label="Title"
          value={state.title}
          setValue={handleTitleChange}
        />
        <SingleSelect
          label="Data"
          data={dataSets}
          displayKey="type"
          valueKey="option"
          onSelect={handleOptionSelect}
        />
        <button onClick={savePDF} className="btn-themeGreen w-full">
          Export to PDF
        </button>
      </div>

      {/* PDF Wrapper for UI presentation */}
      <div className="rounded-lg border-2 border-content/60">
        {/* Report PDF */}
        <div
          id="pdf-export"
          ref={reportRef}
          className="p-4 min-h-[91vh] max-h-[70vh] overflow-hidden"
          style={{ scrollBehavior: "auto" }}
        >
          <div className="relative w-full">
            <div className="text-3xl font-medium">{state.title}</div>
            <div className=" font-medium">{displayDate()}</div>
            <img
              src={logo}
              alt="Report Preview"
              className="absolute top-0 right-0 h-16"
            />
          </div>

          {state.options.weekly && <WeeklySalesReport />}
          {state.options.subDept && <SubDeptReport />}
        </div>
      </div>
    </Modal>
  );
};

export default ReportBuilder;
