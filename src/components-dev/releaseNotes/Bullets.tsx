interface BulletsProps {
  items: string[];
}

/** A bulleted list of changes. */
const Bullets = ({ items }: BulletsProps) => (
  <ul className="m-0 list-disc space-y-0.5 pl-5 text-[13.5px] leading-relaxed marker:text-brand_navy">
    {items.map((b) => (
      <li key={b}>{b}</li>
    ))}
  </ul>
);

export default Bullets;
