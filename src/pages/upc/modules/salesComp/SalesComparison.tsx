import { useAppDispatch } from "../../../../hooks";
import { useUpcContext } from "../../wizard/hooks";
import { formatCurrency2, formatDate } from "../../../../utils";
import { clearSelectedComps } from "../../../../features/upcSlice";
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

const SalesComparison = () => {
  const dispatch = useAppDispatch();
  const { selectedCompOne, selectedCompTwo } = useUpcContext();
  const isReady = selectedCompOne && selectedCompTwo;

  const renderIcon = (num1: number, num2: number) => {
    if (num1 > num2) {
      return <ArrowUpCircleIcon className="h-6 w-6 text-emerald-500" />;
    } else if (num1 < num2) {
      return <ArrowDownCircleIcon className="h-6 w-6 text-orange-500" />;
    } else {
      return <div className="w-5"></div>;
    }
  };

  const handleClear = () => {
    dispatch(clearSelectedComps());
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg mr-4 relative">
      {!isReady ? (
        <div className="flex flex-col justify-center items-center h-full w-full text-content/70 text-sm">
          <div>Select two UPCs from the grid</div>
          <div>To view the sales comparison</div>
        </div>
      ) : (
        <>
            <div className="bg-blue-500 text-custom-white font-medium rounded-t-lg pl-4 py-1">
              Comparison
            </div>
          <div className="px-4 py-2 flex flex-col gap-2">
            <div className="rounded-lg shadow-md shadow-content/30 p-2">
              <div className="flex justify-between font-medium">
                <div>Week Starting</div>
                <div>{formatDate(selectedCompOne.week)}</div>
              </div>
              <div className="text-sm space-y-0.5">
                <div className="py-1.5 border-y border-content/30 my-2">
                  <div className="flex justify-between">
                    <div className="font-medium">Upc:</div>
                    <div>{selectedCompOne.product_code}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Desc:</div>
                    <div>{selectedCompOne.description}</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Monday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Monday || 0)}
                    {renderIcon(
                      selectedCompOne.Monday!,
                      selectedCompTwo.Monday!
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Tuesday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Tuesday || 0)}
                    {renderIcon(
                      selectedCompOne.Tuesday || 0,
                      selectedCompTwo.Tuesday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Wednesday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Wednesday || 0)}
                    {renderIcon(
                      selectedCompOne.Wednesday || 0,
                      selectedCompTwo.Wednesday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Thursday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Thursday || 0)}
                    {renderIcon(
                      selectedCompOne.Thursday || 0,
                      selectedCompTwo.Thursday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Friday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Friday || 0)}
                    {renderIcon(
                      selectedCompOne.Friday || 0,
                      selectedCompTwo.Friday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Saturday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Saturday || 0)}
                    {renderIcon(
                      selectedCompOne.Saturday || 0,
                      selectedCompTwo.Saturday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Sunday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompOne.Sunday || 0)}
                    {renderIcon(
                      selectedCompOne.Sunday || 0,
                      selectedCompTwo.Sunday || 0
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg shadow-md shadow-content/30 p-2">
              <div className="flex justify-between font-medium">
                <div>Week Starting</div>
                <div>{formatDate(selectedCompTwo.week)}</div>
              </div>
              <div className="text-sm space-y-0.5">
                <div className="py-1.5 border-y border-content/30 my-2">
                  <div className="flex justify-between">
                    <div className="font-medium">Upc:</div>
                    {selectedCompTwo.product_code}
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Desc:</div>
                    {selectedCompTwo.description}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Monday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Monday || 0)}
                    {renderIcon(
                      selectedCompTwo.Monday || 0,
                      selectedCompOne.Monday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Tuesday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Tuesday || 0)}
                    {renderIcon(
                      selectedCompTwo.Tuesday || 0,
                      selectedCompOne.Tuesday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Wednesday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Wednesday || 0)}
                    {renderIcon(
                      selectedCompTwo.Wednesday || 0,
                      selectedCompOne.Wednesday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Thursday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Thursday || 0)}
                    {renderIcon(
                      selectedCompTwo.Thursday || 0,
                      selectedCompOne.Thursday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Friday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Friday || 0)}
                    {renderIcon(
                      selectedCompTwo.Friday || 0,
                      selectedCompOne.Friday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Saturday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Saturday || 0)}
                    {renderIcon(
                      selectedCompTwo.Saturday || 0,
                      selectedCompOne.Saturday || 0
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Sunday:</div>
                  <div className="flex gap-1 items-center">
                    {formatCurrency2(selectedCompTwo.Sunday || 0)}
                    {renderIcon(
                      selectedCompTwo.Sunday || 0,
                      selectedCompOne.Sunday || 0
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 left-4 w-full pr-8">
              <div
                data-testid="sales-comp-clear-btn"
                className="btn-themeBlue w-full text-center"
                onClick={handleClear}
              >
                Clear
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesComparison;
