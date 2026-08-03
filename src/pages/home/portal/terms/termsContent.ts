import raw from "../../../../content/terms.json";

/** Terms and Conditions.
 *
 *  `src/content/terms.json` is the supplied document, copied into src/ so the
 *  build doesn't depend on a file outside the repo. To take a revision,
 *  overwrite that copy — nothing here needs changing.
 *
 *  ⚠️ The panel renders this verbatim. No sentence is written, reworded or
 *  summarised in code, because this is a legal document and paraphrasing it in
 *  a component would make the rendered text differ from what was approved.
 *  The only text the UI contributes is a heading above each bulleted list,
 *  derived mechanically from that list's JSON key — see LIST_KEYS below.
 */

export interface TermsSubsection {
  id: string;
  title: string;
  text: string;
}

export interface TermsContact {
  legal_name: string;
  brand_name: string;
  street: string;
  city_state_zip: string;
  toll_free: string;
  local: string;
  website: string;
  email: string;
}

export interface TermsSection {
  number: number;
  title: string;
  paragraphs?: string[];
  uppercase_notice?: string;
  subsections?: TermsSubsection[];
  contact?: TermsContact;
  /** Every other key in a section is a string[] rendered as a bulleted list.
   *  They're kept open-ended so a revised document can introduce a new one
   *  without a type error — it renders with a title-cased heading. */
  [key: string]: unknown;
}

interface RawTerms {
  title: string;
  last_updated: string;
  company: {
    legal_name: string;
    brand_name: string;
    website: string;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    phone: { toll_free: string; local: string };
    email: string;
  };
  privacy_policy_url: string;
  introduction: string[];
  acceptance_notice: string;
  sections: TermsSection[];
  copyright: string;
}

export const TERMS = raw as RawTerms;

/** Keys that carry structure rather than a bulleted list, so the renderer
 *  handles them explicitly and skips them when sweeping for lists. */
export const STRUCTURAL_KEYS = new Set([
  "number",
  "title",
  "paragraphs",
  "uppercase_notice",
  "subsections",
  "contact",
]);

/** Formatted for display, e.g. "August 3, 2026". Parsed as UTC so the date
 *  can't slip a day for anyone west of Greenwich. */
export const lastUpdated = (() => {
  const [y, m, d] = TERMS.last_updated.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
})();
