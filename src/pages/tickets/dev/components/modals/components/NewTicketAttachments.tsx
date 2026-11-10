// Utils
import { fileSize } from "../../../utils/ticketsUtils";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface NewTicketAttachmentsProps {
  picker: React.RefObject<HTMLInputElement | null>;
  limits: { extensions: string[]; maxBytes: number } | undefined;
  addFiles: (files: FileList | null) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileError: string | null;
}

/** The new-ticket form's Screenshots block: a file picker, the allowed types and size, the chosen files with a remove button, and any file error. */
const NewTicketAttachments = ({
  picker,
  limits,
  addFiles,
  files,
  setFiles,
  fileError,
}: NewTicketAttachmentsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12.5px] font-medium">Screenshots</span>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={picker}
          type="file"
          multiple
          accept={limits?.extensions.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
        >
          Choose files
        </button>
        <span className="text-[11.5px] text-content/95">
          {limits
            ? `${limits.extensions.join(" ")} · up to ${fileSize(limits.maxBytes)}`
            : "A screenshot is usually the most useful thing you can send."}
        </span>
      </div>

      {files.map((one) => (
        <div
          key={one.name}
          className="flex items-center gap-2 bg-custom-white border border-brand_line rounded-lg px-3 py-1.5"
        >
          <span className="font-mono text-[12px] flex-1 min-w-0 truncate">
            {one.name}
          </span>
          <span className="text-[11.5px] text-content/95">
            {fileSize(one.size)}
          </span>
          <button
            type="button"
            onClick={() =>
              setFiles((have) => have.filter((f) => f.name !== one.name))
            }
            aria-label={`Remove ${one.name}`}
            className="text-content/95 hover:text-content transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}

      {fileError && (
        <span className="text-[11.5px] text-severity_watch_text">{fileError}</span>
      )}
    </div>
  );
};

export default NewTicketAttachments;
