/**
 * What a dev-only page shows on the prod API.
 *
 * Coming Soon pages have no prod UI tree: their switcher renders this instead
 * of the page, so on prod — what clients see — none of the page's code runs
 * and nothing calls an API. The nav hides the Coming Soon category on prod, so
 * this is only reached by typing the URL.
 */
const DevOnlyNotice = () => (
  <div className="h-[calc(100vh-3rem)] flex flex-col items-center justify-center gap-2 px-4 text-center">
    <div className="text-content/70 text-sm font-semibold">Not available</div>
    <div className="text-content/50 text-xs">
      This page is still in development.
    </div>
  </div>
);

export default DevOnlyNotice;
