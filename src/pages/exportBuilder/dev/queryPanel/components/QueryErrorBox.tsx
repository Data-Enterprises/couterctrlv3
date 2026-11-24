interface QueryErrorBoxProps {
  message: string;
  hint?: string;
}

/** Why the query box's text did not parse, and what to try. */
const QueryErrorBox = ({ message, hint }: QueryErrorBoxProps) => (
  <div className="bg-severity_watch_bg border-t border-severity_watch_text/20 px-3 py-2">
    <div className="text-[12.5px] font-semibold text-severity_watch_text">
      {message}
    </div>
    {hint && (
      <div className="text-[11.5px] text-severity_watch_text mt-1">{hint}</div>
    )}
  </div>
);

export default QueryErrorBox;
