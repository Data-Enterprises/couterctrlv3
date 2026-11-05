// Components
import Bar from "./Bar";

const NAME_W = ["78%", "62%", "85%", "55%", "72%", "68%", "90%", "60%"];

/** A card's worth of bars. */
const SkCard = ({ rows = 4 }: { rows?: number }) => (
  <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 flex flex-col gap-2.5">
    <Bar w="46%" h={13} />
    {Array.from({ length: rows }, (_, i) => (
      <Bar key={i} w={NAME_W[i % NAME_W.length]} />
    ))}
  </div>
);

export default SkCard;
