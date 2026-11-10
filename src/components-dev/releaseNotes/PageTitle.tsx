/** The menu path, with the page itself standing out from where it lives. */
const PageTitle = ({ page }: { page: string }) => {
  const cut = page.lastIndexOf("→");
  return cut === -1 ? (
    <span className="font-semibold text-content">{page}</span>
  ) : (
    <span>
      <span className="text-content/95">{page.slice(0, cut + 1)} </span>
      <span className="font-semibold text-content">
        {page.slice(cut + 1).trim()}
      </span>
    </span>
  );
};

export default PageTitle;
