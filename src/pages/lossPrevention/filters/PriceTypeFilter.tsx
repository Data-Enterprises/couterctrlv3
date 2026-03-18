interface PriceTypeFilterProps {
  handleSelection: (type: string) => void;
  priceTypes: string[];
  availablePriceTypes: string[];
}

const PriceTypeFilter = ({
  handleSelection,
  priceTypes,
  availablePriceTypes,
}: PriceTypeFilterProps) => {
  return (
    <div className="flex justify-center gap-4 mt-2 mb-4">
      {availablePriceTypes.length ? (
        <>
          {availablePriceTypes.map((type, i) => (
            <div key={i} className="flex gap-2 items-center">
              <label htmlFor={type}>{type}</label>
              <input
                name={type}
                data-testid={`cashier-table-filter-price-type-${type}`}
                type="checkbox"
                className="rounded focus:ring-0 focus:outline-none"
                checked={priceTypes.includes(type)}
                onChange={() => handleSelection(type)}
              />
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
};

export default PriceTypeFilter;
