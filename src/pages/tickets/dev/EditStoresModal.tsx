import { useEffect, useState } from "react";
import Modal from "../../../components-dev/Modal";
import { useDevApi } from "../../../hooks/useDevApi";
import {
  getTicketStoreOptions,
  ticketFailed,
  type Ticket,
  type TicketStoreOption,
} from "../../../api/tickets";
import StoreChecklist from "./StoreChecklist";
import { storesOf } from "./ticketStores";

interface Props {
  ticket: Ticket;
  /** Returns why it did not save, or null once it has. */
  onSave: (storeids: number[]) => Promise<string | null>;
  onClose: () => void;
  working: boolean;
}

/**
 * A tech corrects which stores a ticket is about.
 *
 * People tick too few or too many, and the stores decide which managers see a
 * ticket, so this is how the desk keeps that right without asking a client to
 * refile. The list is the server's own answer for this ticket (its company,
 * the opener's companies, the opener's stores), with what is on it now ticked,
 * so it cannot offer a store the save would refuse.
 *
 * Saving replaces the whole list. The server notes the change in the thread as
 * an internal note, so the next tech can see why a ticket moved.
 */
const EditStoresModal = ({ ticket, onSave, onClose, working }: Props) => {
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
        const list: TicketStoreOption[] = resp.data.stores ?? [];
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
        <p className="mt-1 text-[12.5px] text-content/85">
          These decide which managers see the ticket. The change is noted in
          the thread for the desk, not the client.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
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
          <p role="alert" className="m-0 mr-auto text-[11.5px] text-red-700">
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-brand_line_2 px-4 py-1.5 text-[12.5px] font-medium transition-colors hover:border-brand_slate"
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
