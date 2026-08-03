import PortalPanel from "../shared/PortalPanel";
import { Notice, Bullets } from "../shared/LegalBits";
import { listLabel } from "../shared/legalText";
import {
  TERMS,
  STRUCTURAL_KEYS,
  lastUpdated,
  type TermsSection,
} from "./termsContent";

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

const Section = ({ section }: { section: TermsSection }) => {
  /* Object key order is the document's own order, so sweeping the section in
     insertion order keeps lists where the author put them. */
  const lists = Object.keys(section).filter(
    (k) => !STRUCTURAL_KEYS.has(k) && Array.isArray(section[k]),
  );

  return (
    <section className="pt-[26px] mt-[26px] border-t border-brand_line first:border-t-0 first:mt-0 first:pt-0">
      <h3 className="font-display text-[16.5px] font-extrabold text-brand_navy tracking-[-0.022em] leading-[1.2]">
        <span className="font-mono text-[12px] font-semibold text-brand_green_dark mr-2">
          {section.number}.
        </span>
        {section.title}
      </h3>

      {section.uppercase_notice && <Notice>{section.uppercase_notice}</Notice>}

      {section.paragraphs?.map((p) => (
        <p
          key={p.slice(0, 40)}
          className="text-[14px] leading-[1.68] text-brand_slate mt-[11px]"
        >
          {p}
        </p>
      ))}

      {lists.map((key) => (
        <Bullets
          key={key}
          label={listLabel(key)}
          items={section[key] as string[]}
        />
      ))}

      {section.subsections && (
        <dl className="mt-4">
          {section.subsections.map((sub) => (
            <div key={sub.id} className="mt-3.5 first:mt-0">
              <dt className="font-display text-[13.5px] font-bold text-brand_navy">
                <span className="font-mono text-[11px] text-brand_green_dark mr-1.5">
                  ({sub.id})
                </span>
                {sub.title}
              </dt>
              <dd className="text-[13.8px] leading-[1.6] text-brand_slate mt-1 ml-0">
                {sub.text}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {section.contact && (
        <address className="not-italic mt-4 border border-brand_line rounded-[10px] px-[18px] py-4 text-[13.8px] leading-[1.7] text-brand_slate">
          <span className="block font-display text-[14.5px] font-bold text-brand_navy">
            {section.contact.legal_name}
          </span>
          <span className="block text-brand_navy">{section.contact.brand_name}</span>
          <span className="block mt-2">{section.contact.street}</span>
          <span className="block">{section.contact.city_state_zip}</span>
          <span className="block mt-2">
            Toll free{" "}
            <a
              href={`tel:${section.contact.toll_free.replace(/[^\d+]/g, "")}`}
              className="text-brand_green_dark hover:underline"
            >
              {section.contact.toll_free}
            </a>
          </span>
          <span className="block">
            Local{" "}
            <a
              href={`tel:${section.contact.local.replace(/[^\d+]/g, "")}`}
              className="text-brand_green_dark hover:underline"
            >
              {section.contact.local}
            </a>
          </span>
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
              href={section.contact.website}
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

/** Terms and Conditions, rendered verbatim from src/content/terms.json.
 *
 *  Every list in the source is keyed but unlabelled — `prohibited_actions`,
 *  `no_warranty_that` and so on. Those keys are title-cased into headings so a
 *  list isn't left orphaned under a paragraph; no other text is added, and no
 *  sentence from the document is altered. */
const TermsPanel = ({ open, onClose, returnFocusTo }: Props) => (
  <PortalPanel
    open={open}
    onClose={onClose}
    kicker="CounterCtrl Cloud"
    title={TERMS.title}
    width={680}
    returnFocusTo={returnFocusTo}
    footer={<span>{TERMS.copyright}</span>}
  >
    <div className="px-8 pt-[26px] pb-[34px]">
      <span className="block font-mono text-[9.5px] font-semibold tracking-[0.15em] uppercase text-brand_slate_2">
        Last updated {lastUpdated}
      </span>

      {TERMS.introduction.map((p) => (
        <p
          key={p.slice(0, 40)}
          className="text-[14.5px] leading-[1.68] text-brand_slate mt-[13px]"
        >
          {p}
        </p>
      ))}

      <Notice>{TERMS.acceptance_notice}</Notice>

      <p className="text-[13.8px] leading-[1.6] text-brand_slate mt-4 pb-[6px]">
        Your use of the Site is also governed by our{" "}
        <a
          href={TERMS.privacy_policy_url}
          target="_blank"
          rel="noreferrer"
          className="text-brand_green_dark font-semibold hover:underline"
        >
          Privacy Policy
        </a>
        .
      </p>

      <div className="mt-[10px]">
        {TERMS.sections.map((s) => (
          <Section key={s.number} section={s} />
        ))}
      </div>
    </div>
  </PortalPanel>
);

export default TermsPanel;
