/**
 * What a screen's help is made of.
 *
 * Help used to be a complete HTML document per page, built outside the repo
 * and served from S3 into a cross-origin iframe. That frame could never point
 * at anything: no `allow-same-origin`, so it cannot see the screen it is
 * describing. Help that says "the Search button" while the reader hunts for
 * the Search button is the failure the whole thing existed to prevent.
 *
 * So the content is data now, rendered by a panel inside the app, and an entry
 * can name the control it is about. The writing job is unchanged — these are
 * the same sentences — but they are typed, they live beside the page they
 * describe, and a name that does not exist is a compile error rather than a
 * paragraph nobody can follow.
 */

/**
 * The `data-help` value of the control an entry is about.
 *
 * Deliberately a plain string rather than a selector: the panel looks for
 * `[data-help="<anchor>"]` and nothing else, so help can never depend on a
 * class name or a DOM shape that a refactor is free to change.
 */
export type HelpAnchor = string;

export interface HelpTerm {
  term: string;
  def: string;
  /** Where it is on screen. Omitted for a term that names an idea rather than
   *  a control — "matched day" has no button. */
  anchor?: HelpAnchor;
}

export interface HelpStep {
  title: string;
  /**
   * The instruction, split either side of the control's name so the name can
   * be drawn as a chip. `chip` is the label as it appears on screen, letter
   * for letter — the reader is going to compare the two.
   */
  pre: string;
  chip?: string;
  post?: string;
  /** What the screen does once the step is done, so the reader can tell
   *  whether it worked without asking anybody. */
  see?: string;
  anchor?: HelpAnchor;
}

export interface HelpGuide {
  id: string;
  /** Phrased as the thing the reader wants, not as the feature's name. */
  title: string;
  desc: string;
  steps: HelpStep[];
  /** The two or three ways it goes wrong, answered in place. */
  issues?: { q: string; a: string }[];
}

/** One answer to a diagnostic question: either another question, or a verdict. */
export interface HelpFixOption {
  label: string;
  /** The next question's id, or the result's id. Exactly one. */
  next?: string;
  result?: string;
}

export interface HelpFixQuestion {
  id: string;
  title: string;
  options: HelpFixOption[];
}

export interface HelpFixResult {
  id: string;
  badge: string;
  /**
   * How the verdict reads, not how severe the data is. `ok` is "this is
   * normal", `bad` is "something is wrong and here is what" — the severity
   * tokens are for grading figures and are not used here.
   */
  tone: "ok" | "warn" | "bad";
  title: string;
  why: string;
  todo: string[];
}

export interface HelpFix {
  id: string;
  title: string;
  /** First question first; the rest are reached by `next`. */
  questions: HelpFixQuestion[];
  results: HelpFixResult[];
}

export interface HelpContent {
  /** The screen as the reader would name it — what the panel's kicker says. */
  screen: string;
  /** One line on what the screen is for, shown under the search box. */
  purpose: string;
  guides: HelpGuide[];
  fixes: HelpFix[];
  terms: HelpTerm[];
  /** Who to ask when the panel has not helped. */
  contact?: string;
}
