import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import DatePickers from "../../../components/datePickers/DatePickers";

interface StepTwoProps {
  className?: string;
  getData?: () => void;
}

const StepTwo = ({ className = "", getData }: StepTwoProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const app = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);

    return (
      <div className={`flex flex-col items-center pt-4 gap-2 ${className}`}>
        <div className="text-sm text-center text-content/70 px-4 -mb-1">
          Please ensure your date range and stores are valid before continuing.
        </div>
        <DatePickers />
        {/* <div className="grid grid-cols-[1.1fr_1fr] gap-2 mb-2 -mt-4">
          <RadioBox
            label="Stores"
            value={radioId === 1}
            onChange={handleRadioChange}
            id={1}
          />
          <div className="flex items-center gap-4">
            Trend Periods
            <Input
              width={85}
              className="py-1.5 px-1 ml-3 border-2 border-content/20 focus:border-blue-500"
              type="number"
              value={trendPeriods}
              onChange={(e) => dispatch(setTrendPeriods(e.target.value))}
            />
          </div>
          <RadioBox
            label="Group"
            value={radioId === 2}
            onChange={handleRadioChange}
            id={2}
          />
          {radioId === 1 ? (
            <SingleSelect
              label=""
              data={filteredData as AssignedStore[]}
              displayKey={"store_Name" as keyof unknown}
              valueKey={"storeid" as keyof unknown}
              onSelect={handleSelectClick}
              keepOpen={true}
              resetQuery={true}
              innerClass="border-2 focus:border-blue-500 border-content/20"
            />
          ) : (
            <SingleSelect
              label=""
              data={filteredData as Group[]}
              valueKey={"id" as keyof unknown}
              displayKey={"group_name" as keyof unknown}
              onSelect={handleSelectClick}
              resetQuery={true}
              innerClass="border-2 focus:border-blue-500 border-content/20"
            />
          )}
        </div> */}
        {/* <SelectedStoreList /> */}
        <div className="my-8">???Global/extra query params???</div>
        {/* <UpcListSubmit getData={getData} /> */}
      </div>
    );
};

export default StepTwo;
