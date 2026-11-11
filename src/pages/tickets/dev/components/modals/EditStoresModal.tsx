// Hooks
import { useEffect, useState } from "react";
import { useDevApi } from "../../../../../hooks/useDevApi";

// API
import {
  getTicketStoreOptions,
  ticketFailed,
  type Ticket,
  type TicketStoreOption,
} from "../../../../../api/tickets";

// Utils
import { cleanStoreOptions, storesOf } from "../../utils";

// Components
import Modal from "../../../../../components-dev/Modal";
import StoreChecklist from "../StoreChecklist";

interface EditStoresModalProps {
  ticket: Ticket;
  onSave: (storeids: number[]) => Promise<string | null>;
  onClose: () => void;
  working: boolean;
}

/**
 * A tech corrects which stores a ticket is about (the stores decide which
 * managers see it). The options are the server's, so the save never refuses one.
 */
const EditStoresModal = ({ ticket, onSave, onClose, working }: EditStoresModalProps) => {
  const { url, token } = useDevApi();
  const [options, setOptions] = useState<TicketStoreOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>(() =>
    storesOf(ticket).map((s) => s.storeid),
  );
  const [notAbout, setNotAbout] = useState(storesOf(ticket).length === 0);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getTicketStoreOptions(url, token, ticket.id)
      .then((resp) => {
        if (!live) return;
        if (ticketFailed(resp.data)) {
          setLoadError("The stores for this ticket could not be read.");
          return;
        }
        const list: TicketStoreOption[] = cleanStoreOptions(
          resp.data.stores ?? [],
        );
        setOptions(list);
        // The server's `selected` is the newer answer than the row in hand.
        const on = list.filter((o) => o.selected).map((o) => o.storeid);
        setPicked(on);
        setNotAbout(on.length === 0);
      })
      .catch(() => {
        if (live) setLoadError("The stores for this ticket could not be read.");
      });
    return () => {
      live = false;
    };
  }, [ticket.id]);

  const answered = picked.length > 0 || notAbout;

  const save = async () => {
    setSaveError(null);
    const why = await onSave(notAbout ? [] : picked);
    if (why) setSaveError(why);
    else onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      modalClassName="bg-card_bg w-[480px] max-w-[94vw] max-h-[88vh] flex flex-col"
    >
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[17px] font-semibold">
          Stores on {ticket.ticket_number}
        </h2>
        <p className="mt-1 text-[12.5px] text-content/95">
          These decide which managers see the ticket. The change is noted in the
          thread for the desk, not the client.
        </p>
      </div>

      <div className="cc-scroll px-4 pb-4">
        <StoreChecklist
          options={loadError ? [] : options}
          picked={picked}
          onPicked={setPicked}
          notAbout={notAbout}
          onNotAbout={setNotAbout}
          searchable={(options?.length ?? 0) > 12}
          loadError={loadError}
        />
      </div>

      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-brand_line px-4 py-3">
        {saveError && (
          <p role="alert" className="m-0 mr-auto text-[11.5px] text-brand_danger">
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="cc-btn-outline text-[12.5px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!answered || working || options === null}
          className="rounded-lg bg-brand_navy px-5 py-1.5 text-[12.5px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {working ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
};

export default EditStoresModal;
