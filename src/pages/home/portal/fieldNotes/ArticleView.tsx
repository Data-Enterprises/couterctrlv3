import type { Post } from "../../../../content/posts";

interface Props {
  post: Post;
  /** Rendered above the article. The panel passes a "← All posts" button; a
   *  standalone route would pass a link back to the index. */
  back?: React.ReactNode;
  /** Prev/next. Omitted when there is nowhere to go. */
  footerNav?: React.ReactNode;
}

/** One article, body and all. Rendered inside the Field Notes panel — there
 *  are no standalone article routes; reading happens in place.
 *
 *  Split out from the panel so the reader's markup stays legible next to the
 *  list/reader mode switching, not because two callers share it.
 *
 *  The static build assembled this with string concatenation into innerHTML —
 *  HANDOFF §5 flags that as stored XSS the moment posts come from a CMS with
 *  multiple editors. Rendering as JSX removes that class of bug outright:
 *  a title containing markup is escaped, not executed. */
const ArticleView = ({ post, back, footerNav }: Props) => (
  <article className="px-8 pt-[22px] pb-10">
    {back}

    <div className="flex items-center gap-2.5 flex-wrap font-mono text-[9.5px] tracking-[0.13em] uppercase text-brand_slate">
      <span className="text-brand_green_dark font-semibold">{post.category}</span>
      <span aria-hidden="true" className="w-1 h-1 rounded-full bg-brand_line_2" />
      {post.date}
      <span aria-hidden="true" className="w-1 h-1 rounded-full bg-brand_line_2" />
      {post.author}
    </div>

    <h1 className="font-display text-[27px] font-extrabold text-brand_navy tracking-[-0.032em] leading-[1.14] mt-3">
      {post.title}
    </h1>

    <span className="block w-16 h-1 rounded-sm bg-brand_green mt-4" />

    <p className="text-[15px] leading-[1.7] text-brand_slate mt-4">{post.dek}</p>

    {post.hero && (
      <img
        src={post.hero}
        alt=""
        className="block w-full h-auto rounded-[11px] border border-brand_line mt-[22px]"
      />
    )}

    <div className="mt-[22px] flex flex-col gap-4">
      {post.body.map((para, i) => (
        <p key={i} className="text-[14.8px] leading-[1.75] text-brand_slate">
          {para}
        </p>
      ))}
    </div>

    {footerNav}
  </article>
);

export default ArticleView;
