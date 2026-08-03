import PortalPanel from "../shared/PortalPanel";
import { Notice, Bullets } from "../shared/LegalBits";
import { listLabel, isShouted } from "../shared/legalText";
import {
  PRIVACY,
  STRUCTURAL_KEYS,
  blockTitle,
  blockText,
  blockItems,
  type NamedBlock,
  type PrivacySection,
} from "./privacyContent";

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

/** One entry from `categories`, `cookie_types`, `purposes` (§7) or
 *  `recipients` — four keys whose objects reduce to the same three parts.
 *
 *  The `collected` flag matters more than it looks. Category C lists race,
 *  religion and sexual orientation with `collected: false`, meaning those are
 *  examples of information NOT gathered. Rendered without that distinction it
 *  would read as a list of what *is* collected, which is the opposite of the
 *  document and the worst possible error on a privacy policy. Hence the badge
 *  and the muted list. */
const Block = ({ block }: { block: NamedBlock }) => {
  const items = blockItems(block);
  const text = blockText(block);
  const stated = typeof block.collected === "boolean";
  const notCollected = block.collected === false;

  return (
    <div className="mt-4 border border-brand_line rounded-[10px] px-[18px] py-[15px]">
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-[14px] font-bold text-brand_navy leading-[1.35]">
          {blockTitle(block)}
        </span>
        {stated && (
          <span
            className={`flex-none font-mono text-[9px] font-semibold tracking-[0.1em] uppercase rounded-full px-2.5 py-1 ${
              notCollected
                ? "text-brand_slate_2 bg-brand_paper border border-brand_line"
                : "text-brand_green_dark bg-brand_green_tint border border-brand_green_tint"
            }`}
          >
            {notCollected ? "Not collected" : "Collected"}
          </span>
        )}
      </div>

      {text && (
        <p className="text-[13.8px] leading-[1.6] text-brand_slate mt-2">{text}</p>
      )}

      {items?.length ? (
        <Bullets items={items} tone={notCollected ? "muted" : "normal"} />
      ) : null}
    </div>
  );
};

const Section = ({ section }: { section: PrivacySection }) => {
  /* Insertion order is the document's own order, so sweeping the section that
     way keeps every list where the author put it. `purposes` is a string[] in
     §3 and an object[] in §7, so the branch is on element type. */
  const extras = Object.keys(section).filter(
    (k) => !STRUCTURAL_KEYS.has(k) && Array.isArray(section[k]),
  );

  return (
    <section className="pt-[26px] mt-[26px] border-t border-brand_line first:border-t-0 first:mt-0 first:pt-0">
      <h3 className="font-display text-[16.5px] font-extrabold text-brand_navy tracking-[-0.022em] leading-[1.2]">
        <span className="font-mono text-[12px] font-semibold text-brand_green_dark mr-2">
          {section.id}.
        </span>
        {section.title}
      </h3>

      {section.content?.map((p) =>
        isShouted(p) ? (
          <Notice key={p.slice(0, 40)}>{p}</Notice>
        ) : (
          <p
            key={p.slice(0, 40)}
            className="text-[14px] leading-[1.68] text-brand_slate mt-[11px]"
          >
            {p}
          </p>
        ),
      )}

      {extras.map((key) => {
        const arr = section[key] as unknown[];
        if (!arr.length) return null;

        if (typeof arr[0] === "string") {
          return (
            <Bullets key={key} label={listLabel(key)} items={arr as string[]} />
          );
        }

        return (
          <div key={key} className="mt-3.5">
            <span className="block font-mono text-[9.5px] font-semibold tracking-[0.13em] uppercase text-brand_green_dark">
              {listLabel(key)}
            </span>
            {(arr as NamedBlock[]).map((b) => (
              <Block key={blockTitle(b)} block={b} />
            ))}
          </div>
        );
      })}

      {section.management && (
        <p className="text-[13.8px] leading-[1.6] text-brand_slate mt-4">
          {section.management}
        </p>
      )}

      {section.contact && (
        <address className="not-italic mt-4 border border-brand_line rounded-[10px] px-[18px] py-4 text-[13.8px] leading-[1.7] text-brand_slate">
          <span className="block font-display text-[14.5px] font-bold text-brand_navy">
            {section.contact.company}
          </span>
          <span className="block">{section.contact.relationship}</span>
          <span className="block mt-2">
            <a
              href={`mailto:${section.contact.email}`}
              className="text-brand_green_dark hover:underline"
            >
              {section.contact.email}
            </a>
          </span>
          <span className="block">
            <a
              href={`https://${section.contact.website.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand_green_dark hover:underline"
            >
              {section.contact.website}
            </a>
          </span>
        </address>
      )}
    </section>
  );
};

/** Privacy Policy, rendered verbatim from src/content/privacy.json. */
const PrivacyPanel = ({ open, onClose, returnFocusTo }: Props) => (
  <PortalPanel
    open={open}
    onClose={onClose}
    kicker="CounterCtrl Cloud"
    title={PRIVACY.title}
    width={680}
    returnFocusTo={returnFocusTo}
    footer={
      <span>
        {PRIVACY.company.product_name} · {PRIVACY.company.legal_relationship}
      </span>
    }
  >
    <div className="px-8 pt-[26px] pb-[34px]">
      <span className="block font-mono text-[9.5px] font-semibold tracking-[0.15em] uppercase text-brand_slate_2">
        Last updated {PRIVACY.last_updated}
      </span>

      {PRIVACY.introduction.map((p) =>
        isShouted(p) ? (
          <Notice key={p.slice(0, 40)}>{p}</Notice>
        ) : (
          <p
            key={p.slice(0, 40)}
            className="text-[14.5px] leading-[1.68] text-brand_slate mt-[13px]"
          >
            {p}
          </p>
        ),
      )}

      <div className="mt-[10px]">
        {PRIVACY.sections.map((s) => (
          <Section key={s.id} section={s} />
        ))}
      </div>
    </div>
  </PortalPanel>
);

export default PrivacyPanel;
