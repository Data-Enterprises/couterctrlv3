import { useEffect, useRef, useState } from "react";
import PortalPanel from "../shared/PortalPanel";
import PostList from "./PostList";
import ArticleView from "./ArticleView";
import { neighbours, type Post } from "../../../../content/posts";

interface Props {
  /** Owned by Login — the bundled copy until the bucket fetch replaces it. */
  posts: Post[];
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

/** Field Notes — the one panel with two modes.
 *
 *  Reading an article swaps the panel body in place; there is no navigation.
 *  The static build did this by rebuilding innerHTML and had to snapshot the
 *  list markup to restore it; here it is just which piece of state is set.
 *
 *  Three behaviours carried over from the original that are easy to miss:
 *   - the panel's *header title* tracks the mode — "Field Notes" in the list,
 *     the post's category while reading
 *   - the body scrolls back to top on every mode change
 *   - closing resets to the list, so reopening never lands mid-article
 */
const FieldNotesPanel = ({ posts, open, onClose, returnFocusTo }: Props) => {
  const [reading, setReading] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // `posts` can be swapped out by the fetch while an article is open, so the
  // index may no longer resolve — fall back to the list rather than crash.
  const post: Post | null = reading === null ? null : (posts[reading] ?? null);
  const { newer, older } = neighbours(posts, reading ?? 0);

  // Match the static build: `closeNotes()` calls `renderList()`, so the panel
  // is always back at the index next time it opens.
  useEffect(() => {
    if (!open) setReading(null);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [reading]);

  const jump = (index: number) => setReading(index);

  return (
    <PortalPanel
      open={open}
      onClose={onClose}
      kicker="CounterCtrl Cloud"
      title={post ? post.category : "Field Notes"}
      width={660}
      returnFocusTo={returnFocusTo}
    >
      <div ref={bodyRef} className="h-full overflow-y-auto thin-scrollbar">
        {post ? (
          <ArticleView
            post={post}
            back={
              <button
                onClick={() => setReading(null)}
                className="font-mono text-[10px] font-semibold tracking-[0.13em] uppercase text-brand_green_dark py-1.5 mb-[18px] hover:underline cursor-pointer"
              >
                ← All posts
              </button>
            }
            footerNav={
              newer || older ? (
                <div className="mt-8 pt-5 border-t border-brand_line flex flex-col gap-2">
                  {newer && (
                    <button
                      onClick={() => jump(reading! - 1)}
                      className="text-left border border-brand_line rounded-[10px] px-4 py-3 transition-colors hover:border-brand_green cursor-pointer"
                    >
                      <span className="block font-mono text-[9.5px] tracking-[0.13em] uppercase text-brand_green_dark mb-1">
                        Newer
                      </span>
                      <span className="block font-display text-[14px] font-bold text-brand_navy leading-[1.35]">
                        {newer.title}
                      </span>
                    </button>
                  )}
                  {older && (
                    <button
                      onClick={() => jump(reading! + 1)}
                      className="text-left border border-brand_line rounded-[10px] px-4 py-3 transition-colors hover:border-brand_green cursor-pointer"
                    >
                      <span className="block font-mono text-[9.5px] tracking-[0.13em] uppercase text-brand_green_dark mb-1">
                        Older
                      </span>
                      <span className="block font-display text-[14px] font-bold text-brand_navy leading-[1.35]">
                        {older.title}
                      </span>
                    </button>
                  )}
                </div>
              ) : null
            }
          />
        ) : (
          <PostList posts={posts} onSelect={(_p, i) => setReading(i)} />
        )}
      </div>
    </PortalPanel>
  );
};

export default FieldNotesPanel;
