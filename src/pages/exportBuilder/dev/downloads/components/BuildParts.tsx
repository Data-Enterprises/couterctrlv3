// Utils
import { fileName } from "../utils";

// Interfaces
import type { ExportBuild } from "../../../../../api/exportBuilds";

interface BuildPartsProps {
  build: ExportBuild;
}

/** A split build's files, each named, with its own download. */
const BuildParts = ({ build }: BuildPartsProps) => (
  <div className="flex flex-col gap-1 bg-custom-white border border-brand_line rounded-lg px-3 py-2">
    {build.files.map((file, i) => (
      <div key={file.key} className="flex items-center gap-3 text-[12px]">
        <span className="min-w-0 flex-1 truncate font-mono">
          {fileName(file.key)}
        </span>
        <a
          href={file.url}
          download
          className="flex-shrink-0 font-semibold text-brand_navy_hover underline underline-offset-2"
        >
          Part {i + 1}
        </a>
      </div>
    ))}
  </div>
);

export default BuildParts;
