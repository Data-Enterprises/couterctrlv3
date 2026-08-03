import raw from "../../../../content/privacy.json";

/** Privacy Policy.
 *
 *  `src/content/privacy.json` is the supplied document, copied into src/ so
 *  the build doesn't depend on a file outside the repo. To take a revision,
 *  overwrite that copy — nothing here needs changing.
 *
 *  ⚠️ Rendered verbatim. No sentence is written, reworded or summarised in
 *  code. The only text the UI contributes is a heading above each unlabelled
 *  list, derived mechanically from that list's JSON key.
 *
 *  Shape differs from terms.json in three ways worth knowing:
 *   - sections are keyed `id` / `content`, not `number` / `paragraphs`
 *   - `purposes` is a string[] in §3 but an object[] in §7, so the renderer
 *     branches on element type rather than on the key name
 *   - four keys carry object arrays with converging shapes — see NamedBlock
 */

/** `categories`, `cookie_types`, `purposes` (§7) and `recipients` all reduce
 *  to the same three parts, under different key names. */
export interface NamedBlock {
  /** categories use `category`; the rest use `name`. */
  name?: string;
  category?: string;
  /** cookie_types and recipients use `description`; §7 purposes use `reason`. */
  description?: string;
  reason?: string;
  /** categories use `examples`, §7 purposes use `uses`, analytics cookies use
   *  `information_collected`. */
  examples?: string[];
  uses?: string[];
  information_collected?: string[];
  /** Only on `categories`. **Load-bearing**: a false value means the examples
   *  beneath it are things we do NOT collect, which must never read as a list
   *  of things we do. */
  collected?: boolean;
}

export interface PrivacyContact {
  company: string;
  relationship: string;
  website: string;
  email: string;
}

export interface PrivacySection {
  id: number;
  title: string;
  content?: string[];
  management?: string;
  contact?: PrivacyContact;
  [key: string]: unknown;
}

interface RawPrivacy {
  title: string;
  last_updated: string;
  company: {
    product_name: string;
    legal_relationship: string;
    website: string;
    contact_email: string;
  };
  introduction: string[];
  sections: PrivacySection[];
}

export const PRIVACY = raw as RawPrivacy;

/** Handled explicitly by the renderer, so skipped when sweeping for lists. */
export const STRUCTURAL_KEYS = new Set(["id", "title", "content", "management", "contact"]);

export const blockTitle = (b: NamedBlock) => b.name ?? b.category ?? "";
export const blockText = (b: NamedBlock) => b.description ?? b.reason;
export const blockItems = (b: NamedBlock) =>
  b.examples ?? b.uses ?? b.information_collected;
