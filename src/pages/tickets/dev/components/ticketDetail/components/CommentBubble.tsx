// Utils
import { stampText } from "../../../utils/ticketsUtils";

// Interfaces
import type { TicketComment } from "../../../../../../api/tickets";

interface CommentBubbleProps {
  comment: TicketComment;
  mine: boolean;
}

/** One comment in the ticket thread: author and time above a bubble, aligned right when it is the viewer's own.
 *  Internal notes are flagged as never sent to a client. */
const CommentBubble = ({ comment, mine }: CommentBubbleProps) => {
  return (
    <div
      className={`flex flex-col gap-1 max-w-[82%] ${
        mine ? "self-end items-end" : "self-start items-start"
      }`}
    >
      <div className="flex items-baseline gap-2 flex-wrap px-1">
        <span className="text-[12.5px] font-semibold">
          {mine ? "You" : comment.author_name}
        </span>
        <span className="text-[11px] text-content/85">
          {stampText(comment.created_at)}
        </span>
      </div>
      <div
        className={`rounded-2xl px-3.5 py-2.5 ${
          mine ? "rounded-br-sm" : "rounded-bl-sm"
        } ${
          comment.is_internal
            ? "bg-amber-50 border border-amber-200"
            : mine
              ? "bg-brand_navy text-custom-white"
              : "bg-row_selected border border-brand_line"
        }`}
      >
        {comment.is_internal && (
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-900 mb-1">
            Internal note — never sent to a client
          </div>
        )}
        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap m-0">
          {comment.comment}
        </p>
      </div>
    </div>
  );
};

export default CommentBubble;
