// Interfaces
import type { RefObject, SetStateAction } from "react";

// Components
import CheckBox from "../../../../../../components-dev/inputs/CheckBox";

interface ComposerProps {
  draft: string;
  setDraft: (value: SetStateAction<string>) => void;
  isTech: boolean;
  canManage: boolean;
  internal: boolean;
  setInternal: (value: SetStateAction<boolean>) => void;
  fileError: string | null;
  picker: RefObject<HTMLInputElement | null>;
  chooseFile: (file: File | undefined) => void;
  working: boolean;
  send: () => void;
}

const Composer = ({
  draft,
  setDraft,
  isTech,
  canManage,
  internal,
  setInternal,
  fileError,
  picker,
  chooseFile,
  working,
  send,
}: ComposerProps) => {
  return (
    <div className="flex-shrink-0 border-t border-brand_line p-3 flex flex-col gap-2">
      <label htmlFor="ticket-reply" className="sr-only">
        Write a reply
      </label>
      <textarea
        id="ticket-reply"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder={
          isTech
            ? "Write a reply, or an internal note"
            : "Write a reply — a screenshot is usually the most useful thing you can send"
        }
        className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
      />
      <div data-help="reply" className="flex items-center gap-3 flex-wrap">
        {canManage && (
          <CheckBox
            id={2}
            idExtension="internal-note"
            label="Internal note"
            value={internal}
            onChange={(value) => setInternal(Boolean(value))}
            className="text-[12.5px] cursor-pointer select-none"
          />
        )}
        <div className="flex-1" />
        {fileError && (
          <span className="text-[11.5px] text-amber-900">{fileError}</span>
        )}
        <input
          ref={picker}
          type="file"
          className="hidden"
          onChange={(e) => chooseFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          disabled={working}
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
        >
          Attach
        </button>
        <button
          type="button"
          onClick={send}
          disabled={working || draft.trim() === ""}
          className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40"
        >
          {internal ? "Post note" : "Reply"}
        </button>
      </div>
    </div>
  );
};

export default Composer;
