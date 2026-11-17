// Components
import ConfigRow from "./ConfigRow";

interface ProductsSectionProps {
  /** The parsed codes and words in force (the store's). */
  productCodes: string[];
  productDescriptions: string[];
  /** What is in the two boxes, which settles into the store a beat later. */
  codeText: string;
  onCodeText: (value: string) => void;
  onClearCodes: () => void;
  descriptionText: string;
  onDescriptionText: (value: string) => void;
  onClearTerms: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Products row: a box of product codes and a box of words the description
 *  holds, each with a clear, and a warning when both narrow at once. */
const ProductsSection = ({
  productCodes,
  productDescriptions,
  codeText,
  onCodeText,
  onClearCodes,
  descriptionText,
  onDescriptionText,
  onClearTerms,
  isOpen,
  onToggle,
}: ProductsSectionProps) => (
  <ConfigRow
    label="Products"
    isOpen={isOpen}
    onToggle={onToggle}
    summary={
      productCodes.length === 0 && productDescriptions.length === 0
        ? "all"
        : [
            productCodes.length > 0 &&
              `${productCodes.length} code${productCodes.length === 1 ? "" : "s"}`,
            productDescriptions.length > 0 &&
              `${productDescriptions.length} word${productDescriptions.length === 1 ? "" : "s"}`,
          ]
            .filter(Boolean)
            .join(" · ")
    }
  >
    <div className="px-3 pb-3 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-content">Codes</span>
        <textarea
          value={codeText}
          onChange={(e) => onCodeText(e.target.value)}
          rows={3}
          placeholder="Paste or type codes — commas, spaces or new lines"
          aria-label="Product codes"
          className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12px] font-mono resize-y"
        />
      </label>
      <div className="flex items-center gap-3">
        <span className="text-[11.5px] text-content/95 flex-1">
          {productCodes.length === 0
            ? "Empty means every product."
            : `${productCodes.length} code${
                productCodes.length === 1 ? "" : "s"
              } — anything that is not a number is ignored.`}
        </span>
        {productCodes.length > 0 && (
          <button
            type="button"
            onClick={onClearCodes}
            className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
          >
            clear
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-content">
          Description holds
        </span>
        <textarea
          value={descriptionText}
          onChange={(e) => onDescriptionText(e.target.value)}
          rows={2}
          placeholder="MILK — one per line, or separated by commas"
          aria-label="Product description words"
          className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12px] font-mono resize-y"
        />
      </label>
      <div className="flex items-center gap-3">
        <span className="text-[11.5px] text-content/95 flex-1">
          {/* Not split on spaces, unlike the codes: WHOLE MILK is one thing to
              look for. A line is kept if its description holds any of these,
              case ignored. */}
          {productDescriptions.length === 0
            ? "Found anywhere in the description, case ignored."
            : `Any of: ${productDescriptions.join(", ")}`}
        </span>
        {productDescriptions.length > 0 && (
          <button
            type="button"
            onClick={onClearTerms}
            className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
          >
            clear
          </button>
        )}
      </div>

      {productCodes.length > 0 && productDescriptions.length > 0 && (
        <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
          Both are filled, so a line has to match a code AND a word. Clear one
          to widen it.
        </span>
      )}
    </div>
  </ConfigRow>
);

export default ProductsSection;
