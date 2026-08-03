import { type Post } from "../../../../content/posts";

interface Props {
  posts: Post[];
  onSelect: (post: Post, index: number) => void;
}

/** The Field Notes index — every post as a button, newest first.
 *
 *  Posts with artwork get an 82x60 thumbnail and lay out horizontally; the
 *  four without one fall back to a plain stacked row, matching `.note-item`
 *  vs `.note-item.has-im` in the static build. */
const PostList = ({ posts, onSelect }: Props) => (
  <div>
    {posts.map((post, i) => (
      <button
        key={post.slug}
        onClick={() => onSelect(post, i)}
        className={`w-full text-left border-b border-brand_line px-7 py-4 transition-colors hover:bg-brand_paper cursor-pointer ${
          post.hero ? "flex gap-3.5 items-start" : "block"
        }`}
      >
        {post.hero && (
          <span
            aria-hidden="true"
            className="flex-none w-[82px] h-[60px] rounded-lg border border-brand_line bg-cover bg-center mt-0.5"
            style={{ backgroundImage: `url(${post.hero})` }}
          />
        )}
        <span className="min-w-0 block">
          <span className="block font-mono text-[9.5px] tracking-[0.11em] uppercase text-brand_green_dark">
            {post.date} &nbsp;·&nbsp; {post.category}
          </span>
          <span className="block font-display text-[15.5px] font-bold text-brand_navy mt-1.5 tracking-[-0.02em] leading-[1.3]">
            {post.title}
          </span>
          <span className="block text-[13px] text-brand_slate mt-[5px] leading-[1.5]">
            {post.dek}
          </span>
        </span>
      </button>
    ))}
  </div>
);

export default PostList;
