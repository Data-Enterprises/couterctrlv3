import { useEffect, useState } from "react";
import InfoModal from "./InfoModal";
import { useAppSelector } from "../hooks";
import {
  helpFailed,
  listHelpReleases,
  type HelpRelease,
  type HelpReleasesResp,
} from "../api/helpPages";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * What went out, and when.
 *
 * Release notes live in their own tree in the help bucket — one file per
 * release, named by date — so the history reads back later rather than being
 * overwritten by whatever shipped most recently. This asks for the list, shows
 * the newest, and lets somebody walk back through the older ones.
 *
 * The list is fetched when this opens rather than when the app loads: nothing
 * here is needed until somebody asks for it, and the signed URL behind each
 * note would be halfway through its life by the time they did.
 */
const ReleaseNotesModal = ({ isOpen, onClose }: Props) => {
  const { apiEnv, url, token } = useAppSelector((state) => ({
    apiEnv: state.app.apiEnv,
    url: state.app.url,
    token: state.app.token,
  }));

  const [releases, setReleases] = useState<HelpRelease[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setProblem(null);
    listHelpReleases(url, token, apiEnv as "dev" | "prod")
      .then((resp) => {
        const j = resp.data as HelpReleasesResp;
        if (helpFailed(j) || !j.releases?.length) {
          setProblem("There are no release notes here yet.");
          return;
        }
        // Already newest first, sorted by name — which is why the files are
        // named by date. Re-sorting on last_modified would let a note
        // corrected in November claim to be the newest release.
        setReleases(j.releases);
        setChosen((held) =>
          held && j.releases.some((r) => r.name === held)
            ? held
            : j.releases[0].name,
        );
      })
      .catch(() => setProblem("The release notes could not be listed."));
  }, [isOpen, url, token, apiEnv]);

  if (!isOpen) return null;

  if (problem || !chosen) {
    return (
      <InfoModal
        release={chosen ?? undefined}
        isOpen
        onClose={onClose}
        toolbar={
          <span className="text-[12px] text-content/85">
            {problem ?? "Reading the releases…"}
          </span>
        }
      />
    );
  }

  return (
    <InfoModal
      release={chosen}
      isOpen
      onClose={onClose}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-content/85">
            Release
          </span>
          {releases.slice(0, 6).map((one) => (
            <button
              key={one.name}
              type="button"
              onClick={() => setChosen(one.name)}
              className={`text-[11.5px] font-semibold px-2.5 py-1 rounded transition-colors ${
                one.name === chosen
                  ? "bg-brand_navy text-custom-white"
                  : "bg-row_selected text-content hover:bg-filter_active"
              }`}
            >
              {one.name}
            </button>
          ))}
          {releases.length > 6 && (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Older releases</span>
              <select
                value={releases.slice(0, 6).some((r) => r.name === chosen) ? "" : chosen}
                onChange={(e) => e.target.value && setChosen(e.target.value)}
                className="text-[11.5px] border border-brand_line rounded px-2 py-1 bg-custom-white"
              >
                <option value="">Older…</option>
                {releases.slice(6).map((one) => (
                  <option key={one.name} value={one.name}>
                    {one.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      }
    />
  );
};

export default ReleaseNotesModal;
