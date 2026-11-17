// Interfaces
import type { SavedQuery } from "../../../../../api/savedQueries";

// Components
import Modal from "../../../../../components-dev/Modal";
import SavedQueryRow from "./SavedQueryRow";

interface QueryLibraryModalProps {
  queries: SavedQuery[];
  /** The saved query that is open, if any. */
  current: SavedQuery | null;
  onCloseCurrent: () => void;
  onOpen: (id: number) => void;
  onClose: () => void;
}

/** Saved queries: the user's list, newest first, with a way to close the open
 *  one; picking one opens it. */
const QueryLibraryModal = ({
  queries,
  current,
  onCloseCurrent,
  onOpen,
  onClose,
}: QueryLibraryModalProps) => (
  <Modal
    isOpen
    onClose={onClose}
    modalClassName="bg-card_bg w-[560px] max-w-[92vw] max-h-[80vh] flex flex-col"
  >
    <div className="flex flex-1 flex-col gap-3 p-4 min-h-0">
      <div className="flex items-baseline gap-3 flex-shrink-0">
        <h2 className="text-[15px] font-semibold">Saved queries</h2>
        <span className="text-[11.5px] text-content/95">
          yours, newest first
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-brand_navy hover:bg-brand_navy_hover text-custom-white transition-colors"
        >
          Close
        </button>
      </div>

      <div className="cc-scroll flex flex-col gap-1.5">
        {current && (
          <button
            type="button"
            onClick={onCloseCurrent}
            className="text-left border border-brand_line rounded-lg px-3 py-2 bg-custom-white hover:border-brand_slate transition-colors"
          >
            <span className="block text-[13px] font-semibold">
              Close "{current.name}"
            </span>
            <span className="block text-[11.5px] text-content/95 mt-0.5">
              Work without a saved query open. The box and the configuration
              stay as they are.
            </span>
          </button>
        )}
        {queries.map((query) => (
          <SavedQueryRow
            key={query.id}
            query={query}
            open={query.id === current?.id}
            onOpen={() => onOpen(query.id)}
          />
        ))}

        {queries.length === 0 && (
          <p className="text-[12.5px] text-content/95 py-6 text-center">
            Nothing saved yet. Build a configuration on the left, then Save as
            new to keep it.
          </p>
        )}
      </div>
    </div>
  </Modal>
);

export default QueryLibraryModal;
