import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Modal from "../Modal";
import {
  PAGE_SECTIONS,
  SECTION_TITLE,
  dateShort,
  lastChangedRelease,
  pageHits,
  type Release,
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

/**
 * Release Notes, as a window over the page you are on.
 *
 * A window rather than a page because notes are read in passing: somebody
 * halfway through a drill-down glances at what changed and closes it, without
 * losing their place. A date rail on the left, that release's notes on the
 * right, in four sections, any of which is left out when it is empty.
 *
 * It opens on the page you came from. The latest release opens scrolled to
 * that page's first heading, and the page is marked in every section it
 * appears in, fixes included. When the latest release does not touch the page,
 * it opens at the top and says so, with a way to the release that last did.
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

  // Each release opens on this page's first heading, or at the top when it has
  // none. Measured inside the pane, so the window itself never scrolls.
  useEffect(() => {
    const box = pane.current;
    if (!box) return;
    const first = box.querySelector<HTMLElement>("[data-this-page='true']");
    box.scrollTop = first ? Math.max(0, first.offsetTop - box.offsetTop - 12) : 0;
  }, [date]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      padded={false}
      modalClassName="bg-card_bg w-[760px] max-w-[94vw] h-[80vh] flex flex-col overflow-hidden"
    >
      <div className="flex flex-shrink-0 items-center gap-3 rounded-t-xl bg-brand_navy px-4 py-3">
        <h2 className="m-0 flex-1 text-[15px] font-semibold text-custom-white">
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
          className="text-custom-white/95 transition-colors hover:text-custom-white"
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
          <nav
            aria-label="Releases"
            className="flex w-[140px] flex-none flex-col gap-0.5 overflow-y-auto thin-scrollbar border-r border-brand_line p-2"
          >
            {releases.map((r) => {
              const on = r.date === release.date;
              return (
                <button
                  key={r.date}
                  type="button"
                  onClick={() => setDate(r.date)}
                  aria-current={on}
                  className={`rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                    on
                      ? "border-row_selected_border bg-row_selected font-semibold text-content"
                      : "border-transparent text-content/95 hover:bg-bkg"
                  }`}
                >
                  {dateShort(r.date)}
                  {r === latest && (
                    <span className="ml-1.5 text-[10.5px] font-medium text-brand_navy_hover">
                      latest
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div
            ref={pane}
            className="min-w-0 flex-1 overflow-y-auto thin-scrollbar px-5 py-4"
          >
            <h3 className="m-0 text-[16px] font-semibold">{release.dateText}</h3>

            {/* Said rather than left to be inferred: the window opened from a
                page, so a release that does not touch it should say so. */}
            {release === latest && pageName && hits.length === 0 && (
              <p className="m-0 mt-1.5 text-[12.5px] text-content/95">
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
              <section className="mt-4">
                <h4 className="m-0 text-[12.5px] font-semibold uppercase tracking-wide text-content/95">
                  {SECTION_TITLE.platform}
                </h4>
                <ul className="m-0 mt-1.5 list-disc pl-5 text-[13.5px] leading-relaxed">
                  {release.platform.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </section>
            )}

            {PAGE_SECTIONS.filter((s) => release[s].length > 0).map((s) => (
              <section key={s} className="mt-4">
                <h4 className="m-0 text-[12.5px] font-semibold uppercase tracking-wide text-content/95">
                  {SECTION_TITLE[s]}
                </h4>
                {release[s].map((p, i) => {
                  const mine = isHit(s, i);
                  return (
                    <div
                      key={p.page}
                      data-this-page={mine}
                      className={`mt-1.5 rounded-lg border px-3 py-1.5 ${
                        mine
                          ? "border-row_selected_border bg-row_selected"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex items-baseline gap-2 text-[12.5px] font-medium text-content/95">
                        <span className="min-w-0 flex-1">{p.page}</span>
                        {mine && (
                          <span className="flex-none text-[11px] font-semibold text-brand_navy_hover">
                            This page
                          </span>
                        )}
                      </div>
                      <ul className="m-0 mt-0.5 list-disc pl-5 text-[13.5px] leading-relaxed">
                        {p.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReleaseNotesModal;
