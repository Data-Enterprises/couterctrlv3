// Utils
import { NAME_W } from "../utils";

// Components
import Bar from "./Bar";

interface SkCardProps {
  rows?: number;
}

/** A card's worth of bars. */
const SkCard = ({ rows = 4 }: SkCardProps) => (
  <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 flex flex-col gap-2.5">
    <Bar w="46%" h={13} />
    {Array.from({ length: rows }, (_, i) => (
      <Bar key={i} w={NAME_W[i % NAME_W.length]} />
    ))}
  </div>
);

export default SkCard;
