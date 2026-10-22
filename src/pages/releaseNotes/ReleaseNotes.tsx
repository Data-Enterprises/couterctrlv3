import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import {
  RELEASES,
  dateShort,
  type Release,
  type ReleaseKind,
} from "../../content/releaseNotes";

/**
 * What a badge says, and how it is drawn.
 *
 * Literal class strings per kind rather than an assembled name — Tailwind
 * scans source text, so `bg-brand_${kind}` is never emitted and the badge
 * renders unstyled. See the theme reference, rule 7.
 *
 * Deliberately NOT the severity palette. Those tokens grade a figure — this is
 * good, this is bad — and a release note grades nothing: "fixed" is not better
 * news than "new", it is different news. Borrowing the palette would have the
 * list read as a scorecard.
 */
const BADGE: Record<ReleaseKind, { label: string; cls: string }> = {
  new: {
    label: "New",
    cls: "bg-brand_navy text-custom-white",
  },
  improved: {
    label: "Improved",
    cls: "bg-brand_line_2 text-brand_navy",
  },
  fixed: {
    label: "Fixed",
    cls: "bg-brand_line text-brand_navy",
  },
};

/**
 * One release, as a document.
 *
 * The entries keep the order they were written in rather than being grouped by
 * kind here: the author put the thing worth reading first, and a render that
 * regroups them would bury it under whatever happened to be new.
 */
const Note = ({ release }: { release: Release }) => (
  <article className="max-w-[760px] mx-auto px-10 py-10">
    <p className="text-[12px] font-semibold uppercase tracking-wide text-content/95">
      {release.dateText}
    </p>
    <h1 className="mt-1.5 text-[26px] font-bold text-content leading-tight">
      What&rsquo;s new
    </h1>
    <p className="mt-3 text-[15px] text-content/95 leading-relaxed">
      {release.summary}
    </p>

    <div className="mt-8 flex flex-col gap-7">
      {release.entries.map((entry, i) => (
        <section key={`${entry.area}-${i}`}>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE[entry.kind].cls}`}
            >
              {BADGE[entry.kind].label}
            </span>
            <h2 className="text-[16px] font-semibold text-content">
              {entry.area}
            </h2>
          </div>
          <p className="mt-1.5 text-[14px] text-content/95 leading-relaxed">
            {entry.text}
          </p>
        </section>
      ))}
    </div>
  </article>
);

/**
 * What went out, and when.
 *
 * A page rather than a sheet, because these are a document somebody reads
 * rather than something they glance at beside their work: dated, long, with
 * their own sections, and worth linking to when you want to send someone what
 * changed.
 *
 * The releases pick from a rail and the note fills everything else. No page
 * header: the document carries its own title and date, and a second one above
 * it was saying the same thing twice while taking room from the thing people
 * came to read.
 *
 * **The notes ship with the build.** They used to be HTML in a bucket, loaded
 * into a frame at read time, which meant a note could fail to load in front of
 * a customer and the page could not tell them why — a cross-origin frame
 * reports nothing about what it rendered. Now the content is data in the repo:
 * it is either in the app or it is not, there is nothing to upload on release
 * day, and the note is themed and searchable like the rest of the product
 * rather than being a document pasted inside it.
 */
const ReleaseNotes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Back to whatever they were reading.
   *
   * History, because that is the actual answer — the notes are reached from
   * the avatar menu on any page, so there is no fixed place to return to.
   * React Router keys the first entry of a session "default", which is how a
   * link opened cold is told apart: going back from there would leave the app
   * entirely, so it lands on the dashboard instead.
   */
  const goBack = () =>
    location.key === "default" ? navigate("/") : navigate(-1);

  const [chosen, setChosen] = useState<string>(RELEASES[0]?.date ?? "");
  const release = RELEASES.find((r) => r.date === chosen) ?? RELEASES[0];

  return (
    <div className="h-[calc(100vh-3rem)] flex overflow-hidden">
      <div className="w-[180px] flex-shrink-0 flex flex-col bg-custom-white border-r border-brand_line">
        <button
          type="button"
          onClick={goBack}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-semibold text-brand_navy_hover border-b border-brand_line hover:bg-bkg transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar py-2">
          {RELEASES.map((one) => (
            <button
              key={one.date}
              type="button"
              onClick={() => setChosen(one.date)}
              className={`w-full text-left px-4 py-2.5 text-[12.5px] font-semibold border-l-2 transition-colors ${
                one.date === chosen
                  ? "border-l-brand_navy bg-row_selected text-content"
                  : "border-l-transparent text-content/95 hover:bg-bkg"
              }`}
            >
              {dateShort(one.date)}
            </button>
          ))}
        </div>

        <div className="flex-shrink-0 px-4 py-2.5 border-t border-brand_line text-[11px] text-content/95">
          {RELEASES.length} release{RELEASES.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar bg-bkg">
        {release ? (
          <Note release={release} />
        ) : (
          <div className="h-full flex items-center justify-center px-8 text-center">
            <span className="text-[13px] font-semibold text-content/95">
              There are no release notes here yet.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseNotes;
