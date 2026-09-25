import { useEffect, useState } from "react";
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
 * What went out, and when.
 *
 * A page rather than a sheet, because these are a document somebody reads
 * rather than something they glance at beside their work: dated, long, with
 * their own sections, and worth linking to when you want to send someone what
 * changed. A modal was squeezing a document authored around 860px into 600,
 * and making the dates share a strip with a close button.
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
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-bkg">
      <div className="flex-shrink-0 px-4 py-3 flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight">
            Release notes
          </h1>
          <p className="text-[12.5px] text-content/85 mt-0.5">
            What went out, one file per release.{" "}
            {apiEnv === "dev" ? "The dev set — our own notes." : "The client set."}
          </p>
        </div>
        {releases.length > 0 && (
          <span className="text-[12px] text-content/85">
            {releases.length} release{releases.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {releases.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-3 flex items-center gap-2 flex-wrap">
          {releases.map((one) => (
            <button
              key={one.name}
              type="button"
              onClick={() => setChosen(one.name)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                one.name === chosen
                  ? "bg-brand_navy text-custom-white border-brand_navy"
                  : "bg-card_bg border-brand_line hover:border-brand_slate"
              }`}
            >
              {one.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 mx-4 mb-4 bg-card_bg border border-brand_line rounded-xl overflow-hidden relative">
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
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
};

export default ReleaseNotes;
