// Components
import Bar from "./Bar";
import LoadNote from "./LoadNote";
import SkCard from "./SkCard";

interface TabSkeletonProps {
  tab: "holds" | "items" | "supply" | "act";
}

/**
 * The tab, mid-load, drawn in the shape of what is coming.
 *
 * Each says what it is waiting for and why it is not guessing: a tab that
 * showed its figures and then changed them when the next wave landed would
 * be worse than one that waited, because the reader would have acted on the
 * first version.
 */
const TabSkeleton = ({ tab }: TabSkeletonProps) => (
  <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5">
    <div className="flex flex-col gap-4" role="status">
      <LoadNote>
        {tab === "holds" || tab === "items" ? (
          <>
            <span className="font-bold text-content">
              Reading this week&rsquo;s sales for both stores.
            </span>{" "}
            The check appears as soon as they land.
          </>
        ) : (
          <>
            <span className="font-bold text-content">
              Reading orders and receipts.
            </span>{" "}
            Until they land a supply gap cannot be told from a
            merchandising one, so this stays masked rather than changing under
            you.
          </>
        )}
      </LoadNote>

      {tab === "holds" && (
        <>
          <Bar w="64%" h={22} />
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            }}
          >
            <SkCard rows={3} />
            <SkCard rows={3} />
            <SkCard rows={3} />
          </div>
          <SkCard rows={6} />
        </>
      )}

      {tab === "items" && (
        <>
          <div className="flex gap-2">
            {[110, 150, 140, 130].map((w) => (
              <Bar key={w} w={`${w}px`} h={24} />
            ))}
          </div>
          <SkCard rows={8} />
        </>
      )}

      {tab === "supply" && (
        <>
          <Bar w="58%" h={22} />
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            }}
          >
            <SkCard rows={5} />
            <SkCard rows={5} />
          </div>
          <SkCard rows={4} />
        </>
      )}

      {tab === "act" && (
        <>
          <Bar w="52%" h={22} />
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            }}
          >
            <SkCard rows={5} />
            <SkCard rows={4} />
          </div>
        </>
      )}
    </div>
  </div>
);

export default TabSkeleton;
