import "./loadingIndicator.css";

interface Props {
  message?: string;
  /** Echoed back to the user — a long group fetch is far less unnerving when
   *  it names the search it is working on rather than spinning at nothing. */
  context?: string;
}

/** Fills an entry card's body while its search is in flight.
 *
 *  Absolute so the caller can leave the real form mounted but
 *  `visibility: hidden` underneath: the card keeps its exact height (no jump
 *  on swap) and the form is genuinely not painted, rather than showing
 *  through a translucent mask. */
const EntryCardLoading = ({ message = "Loading...", context }: Props) => (
  <div data-testid="entry-card-loading" className="loading-inline">
    <div className="loading-pill">
      <span className="loading-pill-text">{message}</span>
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
    {context && (
      <p className="text-[11.5px] text-content text-center px-4 leading-snug">
        {context}
      </p>
    )}
  </div>
);

export default EntryCardLoading;
