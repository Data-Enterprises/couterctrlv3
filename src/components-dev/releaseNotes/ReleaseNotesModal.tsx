import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  ArrowUpCircleIcon,
  GlobeAltIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import Modal from "../Modal";
import {
  PAGE_SECTIONS,
  SECTION_TITLE,
  lastChangedRelease,
  pageHits,
  type PageSection,
  type Release,
  type ReleasePage,
} from "../../content/releaseNotes";

interface Props {
  releases: Release[];
  /** Made-up notes for trying the window out, and the window says so. */
  sample: boolean;
  /** The route of the page it was opened from, without the leading slash. */
  href: string;
  /** That page's name, for "Nothing new on Sales this release". Null for a
   *  route the menu does not name. */
  pageName: string | null;
  onClose: () => void;
}

type SectionKey = PageSection | "platform";

/**
 * How each section reads at a glance: an icon and a tint, so the four can be
 * told apart before a word is read. Brand and filter tints only — none of these
 * is a grade, so the severity and delta families stay out of it.
 */
const LOOK: Record<
  SectionKey,
  { Icon: ComponentType<{ className?: string }>; tile: string; chip: string }
> = {
  platform: {
    Icon: GlobeAltIcon,
    tile: "bg-brand_navy text-custom-white",
    chip: "bg-row_selected text-content",
  },
  nowAvailable: {
    Icon: SparklesIcon,
    tile: "bg-brand_green_tint text-brand_green_darker",
    chip: "bg-brand_green_tint text-brand_green_darker",
  },
  updates: {
    Icon: ArrowUpCircleIcon,
    tile: "bg-filter_active text-brand_navy_hover",
    chip: "bg-filter_active text-brand_navy_hover",
  },
  fixes: {
    Icon: WrenchScrewdriverIcon,
    tile: "bg-row_selected text-brand_slate",
    chip: "bg-row_selected text-content",
  },
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Nov 2" and "2026" for the rail, from the string rather than a `Date`. */
const railDate = (date: string) => {
  const [y, m, d] = date.split("-");
  return { day: `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}`, year: y };
};

/** How many things a section holds: pages for the page sections, bullets
 *  for Platform Updates, which has no pages. */
const countOf = (release: Release, key: SectionKey) =>
  key === "platform" ? release.platform.length : release[key].length;

const SectionHeading = ({
  sectionKey,
  count,
}: {
  sectionKey: SectionKey;
  count: number;
}) => {
  const { Icon, tile } = LOOK[sectionKey];
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${tile}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <h4 className="m-0 text-[14px] font-semibold text-content">
        {SECTION_TITLE[sectionKey]}
      </h4>
      <span className="text-[12px] tabular-nums text-content/95">{count}</span>
    </div>
  );
};

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="m-0 list-disc space-y-0.5 pl-5 text-[13.5px] leading-relaxed marker:text-brand_navy">
    {items.map((b) => (
      <li key={b}>{b}</li>
    ))}
  </ul>
);

/** The menu path, with the page itself standing out from where it lives. */
const PageTitle = ({ page }: { page: string }) => {
  const cut = page.lastIndexOf("→");
  return cut === -1 ? (
    <span className="font-semibold text-content">{page}</span>
  ) : (
    <span>
      <span className="text-content/95">{page.slice(0, cut + 1)} </span>
      <span className="font-semibold text-content">
        {page.slice(cut + 1).trim()}
      </span>
    </span>
  );
};

const PageCard = ({ p, mine }: { p: ReleasePage; mine: boolean }) => (
  <div
    data-this-page={mine}
    className={`rounded-xl border px-4 py-3 shadow-sm ${
      mine
        ? "border-row_selected_border bg-row_selected"
        : "border-brand_line bg-custom-white"
    }`}
  >
    <div className="mb-1.5 flex items-baseline gap-2 text-[13px]">
      <span className="min-w-0 flex-1">
        <PageTitle page={p.page} />
      </span>
      {mine && (
        <span className="flex-none rounded-full bg-brand_navy px-2 py-0.5 text-[10.5px] font-semibold text-custom-white">
          This page
        </span>
      )}
    </div>
    <Bullets items={p.bullets} />
  </div>
);

/**
 * Release Notes, as a window over the page you are on.
 *
 * A window rather than a page because notes are read in passing: somebody
 * halfway through a drill-down glances at what changed and closes it, without
 * losing their place. A date rail on the left, that release's notes on the
 * right, in four sections, any of which is left out when it is empty.
 *
 * It opens on the page you came from. The latest release opens scrolled to
 * that page's first card, and the page is marked in every section it appears
 * in, fixes included. When the latest release does not touch the page, it
 * opens at the top and says so, with a way to the release that last did.
 *
 * Dev tree for now. It moves to prod with the dev-to-prod migration, like any
 * other page, and the real notes go in then.
 */
const ReleaseNotesModal = ({
  releases,
  sample,
  href,
  pageName,
  onClose,
}: Props) => {
  const [date, setDate] = useState(releases[0]?.date ?? "");
  const pane = useRef<HTMLDivElement>(null);
  const release = releases.find((r) => r.date === date) ?? releases[0];
  const latest = releases[0];

  const hits = release ? pageHits(release, href) : [];
  const isHit = (section: string, index: number) =>
    hits.some((h) => h.section === section && h.index === index);
  const last = lastChangedRelease(releases, href);

  // Each release opens on this page's first card, or at the top when it has
  // none. Measured inside the pane, so the window itself never scrolls.
  useEffect(() => {
    const box = pane.current;
    if (!box) return;
    const first = box.querySelector<HTMLElement>("[data-this-page='true']");
    box.scrollTop = first
      ? Math.max(0, first.offsetTop - box.offsetTop - 48)
      : 0;
  }, [date]);

  const present: SectionKey[] = release
    ? (["platform", ...PAGE_SECTIONS] as SectionKey[]).filter(
        (k) => countOf(release, k) > 0,
      )
    : [];

  return (
    <Modal
      isOpen
      onClose={onClose}
      padded={false}
      modalClassName="bg-card_bg w-[836px] max-w-[94vw] h-[80vh] flex flex-col overflow-hidden"
    >
      <div className="flex flex-shrink-0 items-center gap-3 rounded-t-xl bg-brand_navy px-5 py-3.5">
        <SparklesIcon className="h-5 w-5 flex-none text-custom-white/95" />
        <h2 className="m-0 flex-1 text-[16px] font-semibold text-custom-white">
          Release Notes
        </h2>
        {sample && (
          <span className="rounded-md bg-custom-white/15 px-2 py-0.5 text-[11px] font-medium text-custom-white">
            Sample notes, for trying the window
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close release notes"
          className="rounded-md p-0.5 text-custom-white/95 transition-colors hover:bg-custom-white/15 hover:text-custom-white"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {!release ? (
        <p className="m-0 p-6 text-[13px] text-content/95">
          No release notes yet.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* The releases, drawn in the same hand as the notes beside them:
              a date, and the same section tiles the notes use, small, so each
              release says what kind of release it was before it is opened. */}
          <nav
            aria-label="Releases"
            className="flex w-[176px] flex-none flex-col overflow-y-auto thin-scrollbar border-r border-brand_line bg-custom-white"
          >
            <div className="px-4 pb-1.5 pt-4 font-mono text-[9.5px] uppercase tracking-wider text-brand_slate">
              Releases
            </div>
            <div className="flex flex-col gap-1.5 px-2.5 pb-3">
              {releases.map((r) => {
                const on = r.date === release.date;
                const { day, year } = railDate(r.date);
                const kinds = (
                  ["platform", ...PAGE_SECTIONS] as SectionKey[]
                ).filter((k) => countOf(r, k) > 0);
                return (
                  <button
                    key={r.date}
                    type="button"
                    onClick={() => setDate(r.date)}
                    aria-current={on}
                    aria-label={r.dateText}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      on
                        ? "border-row_selected_border bg-row_selected"
                        : "border-brand_line hover:border-brand_line_2 hover:bg-bkg"
                    }`}
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className={`text-[14px] ${
                          on ? "font-semibold text-content" : "font-medium text-content"
                        }`}
                      >
                        {day}
                      </span>
                      <span className="text-[11.5px] text-brand_slate">{year}</span>
                      {r === latest && (
                        <span className="ml-auto rounded-full bg-brand_navy px-1.5 py-[1px] text-[10px] font-semibold text-custom-white">
                          latest
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 flex gap-1">
                      {kinds.map((k) => {
                        const { Icon, tile } = LOOK[k];
                        return (
                          <span
                            key={k}
                            title={SECTION_TITLE[k]}
                            className={`flex h-5 w-5 items-center justify-center rounded-md ${tile}`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                        );
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            ref={pane}
            className="min-w-0 flex-1 overflow-y-auto thin-scrollbar bg-bkg px-6 py-5"
          >
            <h3 className="m-0 text-[20px] font-semibold text-content">
              {release.dateText}
            </h3>

            {/* What is in this release before any of it is read. */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {present.map((k) => {
                const n = countOf(release, k);
                return (
                  <span
                    key={k}
                    className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${LOOK[k].chip}`}
                  >
                    {SECTION_TITLE[k]}{" "}
                    <span className="tabular-nums">{n}</span>
                  </span>
                );
              })}
            </div>

            {/* Said rather than left to be inferred: the window opened from a
                page, so a release that does not touch it should say so. */}
            {release === latest && pageName && hits.length === 0 && (
              <p className="m-0 mt-3 rounded-lg border border-brand_line bg-custom-white px-3 py-2 text-[12.5px] text-content/95">
                Nothing new on {pageName} this release.
                {last && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => setDate(last.date)}
                      className="font-medium text-brand_navy_hover underline underline-offset-2"
                    >
                      Last changed {last.dateText}
                    </button>
                  </>
                )}
              </p>
            )}

            {release.platform.length > 0 && (
              <section className="mt-6">
                <SectionHeading
                  sectionKey="platform"
                  count={release.platform.length}
                />
                <div className="mt-2.5 rounded-xl border border-brand_line bg-custom-white px-4 py-3 shadow-sm">
                  <Bullets items={release.platform} />
                </div>
              </section>
            )}

            {PAGE_SECTIONS.filter((s) => release[s].length > 0).map((s) => (
              <section key={s} className="mt-6">
                <SectionHeading sectionKey={s} count={release[s].length} />
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {release[s].map((p, i) => (
                    <PageCard key={p.page} p={p} mine={isHit(s, i)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReleaseNotesModal;
