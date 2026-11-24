// Interfaces
import type { ExportBuild } from "../../../../../api/exportBuilds";

/**
 * When it ran, in the reader's own time. The manifest stamps UTC, so a build
 * run at 9:50am Central carries 14:50 and printed as-is reads as the future.
 */
export const ranAt = (iso: string) => {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** A build's file name, the last part of its key. */
export const fileName = (key: string) => key.split("/").pop();

/** One bucket per configuration, in the order the builds arrive, with the
 *  ad-hoc ones last however many there are. The endpoint joins nothing. */
export const buildGroups = (builds: ExportBuild[]) => {
  const groups: { id: number | null; name: string; builds: ExportBuild[] }[] =
    [];
  for (const build of builds) {
    const found = groups.find((g) => g.id === build.userQueryId);
    if (found) {
      found.builds.push(build);
      continue;
    }
    groups.push({
      id: build.userQueryId,
      name: build.userQueryName ?? "Ad-hoc",
      builds: [build],
    });
  }
  groups.sort((a, b) => (a.id === null ? 1 : 0) - (b.id === null ? 1 : 0));
  return groups;
};
