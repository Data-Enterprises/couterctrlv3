import { useAppSelector } from "../../hooks";
import type { SalesTwoDates } from "../../interfaces";
import Carousel from "../../components/Carousel";
import SalesPanel from "./SalesPanel";

const SalesPanels = () => {
  const { salesPanels } = useAppSelector((state) => state.sales);

  const handlePanelClick = (panel: SalesTwoDates) => {
    console.log("Clicked panel: ", panel);
    // We could set the selected panel here as well but redux needs (storename, sale_date, terminal) for it to be unique
    // Selected panel could have a bg-blue-200/20 or something
    // then we call the weekly endpoint and get the new data for Weekly Net Sales
  };

  const handleBtnClick = (panel: SalesTwoDates, type: string) => {
    console.log(`Clicked ${type} button for panel: `, panel);
    // Similar to handlePanelClick but we know which button was clicked
    // We can set some state in redux to indicate which view to show in Weekly Net Sales
  };

  // Get the chunks of 4 trends for the nested arrays
  const chunkTrends = (arr: SalesTwoDates[], chunkSize: number) => {
    const chunks: SalesTwoDates[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Create chunks of 4 trends each and iterate through those chunks to render rows
  const panelChunks = chunkTrends(salesPanels, 10);

  // When the sales panels are ready, onClick will call handlePanelClick() for that panel
  return (
    <div className="min-h-[100%] max-h-[100%]">
      <Carousel className="bg-transparent h-[100%]">
        {panelChunks.map((chunk, chunkIdx) => (
          <div
            key={chunkIdx}
            className="grid grid-cols-5 gap-2"
          >
            {chunk.map((panel, idx) => (
              <SalesPanel
                key={idx}
                panel={panel}
                handlePanelClick={handlePanelClick}
                handleBtnClick={handleBtnClick}
              />
            ))}
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default SalesPanels;
