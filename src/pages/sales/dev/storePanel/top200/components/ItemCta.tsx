import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type {
  ItemInsight,
  ItemTone,
  TopItemCompared,
} from "../utils/topItems";
import { ctaClasses } from "../utils";

const CtaIcon = ({ tone, cls }: { tone: ItemTone; cls: string }) => {
  if (tone === "critical") return <ExclamationTriangleIcon className={cls} />;
  if (tone === "watch") return <ExclamationCircleIcon className={cls} />;
  if (tone === "healthy") return <CheckCircleIcon className={cls} />;
  return null;
};

/** The selected item's verdict strip, with the sentence behind it. */
const ItemCta = ({
  insight,
  selected,
  folded,
  fold,
}: {
  insight: ItemInsight;
  selected: TopItemCompared;
  folded: Set<string>;
  fold: (id: string) => void;
}) => (
  <div
    className={`relative flex-shrink-0 border-b ${ctaClasses(insight.tone).border}`}
  >
    <button
      onClick={() => fold("cta")}
      className={`w-full flex items-center gap-1.5 px-3 py-1.5 ${ctaClasses(insight.tone).bg} ${ctaClasses(insight.tone).hoverBg} transition-colors`}
    >
      <CtaIcon
        tone={insight.tone}
        cls={`w-3.5 h-3.5 ${ctaClasses(insight.tone).text} flex-shrink-0`}
      />
      <span
        className={`text-[12px] font-semibold truncate ${ctaClasses(insight.tone).text}`}
      >
        {selected.ty.product_description}
      </span>
      <span
        className={`text-[12px] font-semibold flex-shrink-0 ${ctaClasses(insight.tone).text}`}
      >
        {insight.label}
      </span>
      <span className="flex-1" />
      {folded.has("cta") ? (
        <ChevronDownIcon
          className={`w-3 h-3 flex-shrink-0 ${ctaClasses(insight.tone).text}`}
        />
      ) : (
        <ChevronUpIcon
          className={`w-3 h-3 flex-shrink-0 ${ctaClasses(insight.tone).text}`}
        />
      )}
    </button>
    {!folded.has("cta") && (
      <div
        className={`absolute top-full left-0 right-0 z-20 px-3 py-2 border-b shadow-lg ${ctaClasses(insight.tone).bg} ${ctaClasses(insight.tone).border}`}
      >
        <span
          className={`text-[11px] leading-relaxed ${ctaClasses(insight.tone).text}`}
        >
          {insight.detail}
        </span>
      </div>
    )}
  </div>
);

export default ItemCta;
