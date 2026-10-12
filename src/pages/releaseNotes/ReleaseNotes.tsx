import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../hooks";
import { useHelpPageUrl } from "../../hooks/useHelpPageUrl";
import {
  helpFailed,
  listHelpReleases,
  type HelpEnv,
  type HelpRelease,
  type HelpReleasesResp,
} from "../../api/helpPages";

/**
 * The file name as a date somebody reads.
 *
 * Split rather than parsed: the name IS the date, and handing
 * "2026-09-25" to `new Date` makes it midnight UTC, which is the day before
 * for everyone west of Greenwich. A release note dated the 24th when the file
 * says the 25th would be its own little mystery.
 */
const dateText = (name: string) => {
  const [y, m, d] = name.split("-");
  return y && m && d ? `${m}/${d}/${y}` : name;
};

/**
 * What went out, and when.
 *
 * A page rather than a sheet, because these are a document somebody reads
 * rather than something they glance at beside their work: dated, long, with
 * their own sections, and worth linking to when you want to send someone what
 * changed.
 *
 * The releases pick from a rail and the note fills everything else, edge to
 * edge. No page header: the document carries its own title and date, and a
 * second one above it was saying the same thing twice while taking room from
 * the thing people came to read.
 *
 * Each release is its own file in the bucket, named by date, so the history
 * reads back rather than being overwritten by whatever shipped last.
 */
const ReleaseNotes = () => {
  const { apiEnv, url, token } = useAppSelector((state) => ({
    apiEnv: state.app.apiEnv,
    url: state.app.url,
    token: state.app.token,
  }));

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

  const [releases, setReleases] = useState<HelpRelease[]>([]);
  const [chosen, setChosen] = useState<string>("");
  const [listProblem, setListProblem] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setListProblem(null);
    listHelpReleases(url, token, apiEnv as HelpEnv)
      .then((resp) => {
        const j = resp.data as HelpReleasesResp;
        if (helpFailed(j) || !j.releases?.length) {
          setListProblem("There are no release notes here yet.");
          return;
        }
        // Already newest first, sorted by name — which is why the files are
        // named by date. Re-sorting on last_modified would let a note
        // corrected in November claim to be the newest release.
        setReleases(j.releases);
        setChosen((held) =>
          held && j.releases.some((r) => r.name === held) ? held : j.releases[0].name,
        );
      })
      .catch(() => setListProblem("The release notes could not be listed."));
  }, [url, token, apiEnv]);

  const { src, problem, retry } = useHelpPageUrl({
    name: chosen,
    kind: "release",
    enabled: chosen !== "",
  });

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  const trouble = listProblem ?? problem;

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
          {releases.map((one) => (
            <button
              key={one.name}
              type="button"
              onClick={() => setChosen(one.name)}
              className={`w-full text-left px-4 py-2.5 text-[12.5px] font-semibold border-l-2 transition-colors ${
                one.name === chosen
                  ? "border-l-brand_navy bg-row_selected text-content"
                  : "border-l-transparent text-content/85 hover:bg-bkg"
              }`}
            >
              {dateText(one.name)}
            </button>
          ))}

          {releases.length === 0 && !listProblem && (
            <div className="px-4 py-3 text-[12px] text-content/85">
              Reading the releases…
            </div>
          )}
        </div>

        {/* Which set these are, once, at the foot — the one thing the
            document above cannot say for itself. */}
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-brand_line text-[11px] text-content/85">
          {apiEnv === "dev" ? "Dev — our own notes" : "The client set"}
          {releases.length > 0 && ` · ${releases.length}`}
        </div>
      </div>

      <div className="flex-1 min-w-0 relative bg-bkg">
        {trouble && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="text-[13px] font-semibold">{trouble}</span>
            {!listProblem && (
              <button
                type="button"
                onClick={retry}
                className="text-[12.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!trouble && !loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-brand_line_2 border-t-brand_navy animate-spin" />
            <span className="text-[12.5px] text-content/85">
              {src ? "Loading the notes…" : "Fetching the release…"}
            </span>
          </div>
        )}

        {src && !trouble && (
          <iframe
            // Re-navigates when the link changes; a mounted frame would
            // otherwise keep showing the release it first loaded.
            key={src}
            src={src}
            title="Release notes"
            sandbox="allow-scripts"
            onLoad={() => setLoaded(true)}
            className="w-full h-full border-0 block"
          />
        )}
      </div>
    </div>
  );
};

export default ReleaseNotes;
