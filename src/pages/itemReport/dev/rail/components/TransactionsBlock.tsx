// Utils
import { formatCurrency2 } from "../../../../../utils";
import { TXN_COLS } from "../utils";

// Interfaces
import type { mergePricePoints } from "../../utils/priceEras";
import type { Fold } from "../interfaces";

// Components
import Block from "./Block";
import Head from "./Head";
import Line from "./Line";
import ShowAll from "./ShowAll";

interface TransactionsBlockProps {
  fold: Fold;
  loading: boolean;
  /** The register's prices, merged by price alone. */
  prices: ReturnType<typeof mergePricePoints>;
  /** Every price shown, not just the first five. */
  expanded: boolean;
  onToggleAll: () => void;
  /** Opens a price's transactions. */
  onOpen: (price: number) => void;
}

/**
 * What the registers actually rang, one row per price, each opening to its
 * transactions. Named beside "Price points" because the two are kinds of the
 * same thing: the difference is where the price came from.
 */
const TransactionsBlock = ({
  fold,
  loading,
  prices,
  expanded,
  onToggleAll,
  onOpen,
}: TransactionsBlockProps) => (
  <Block {...fold} label="Price points (transactions)">
    {loading ? (
      <div className="text-[12px] text-content">Reading…</div>
    ) : prices.length === 0 ? (
      <div className="text-[12px] text-content">No lines matched</div>
    ) : (
      <>
        <Head
          cols={[
            prices[0]?.weighed ? "Price / lb" : "Price",
            prices[0]?.weighed ? "Lb" : "Qty",
            "Transactions",
          ]}
          template={TXN_COLS}
        />
        {(expanded ? prices : prices.slice(0, 5)).map((p) => (
          <Line
            key={p.price}
            template={TXN_COLS}
            onClick={() => onOpen(p.price)}
            cells={[
              { text: formatCurrency2(p.price) },
              {
                text: p.weighed ? p.qty.toFixed(2) : String(Math.round(p.qty)),
              },
              { text: String(p.receipts) },
            ]}
          />
        ))}
        {prices.length > 5 && (
          <ShowAll
            total={prices.length}
            expanded={expanded}
            onToggle={onToggleAll}
          />
        )}
      </>
    )}
  </Block>
);

export default TransactionsBlock;
