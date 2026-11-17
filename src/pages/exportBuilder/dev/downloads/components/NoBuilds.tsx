interface NoBuildsProps {
  loading: boolean;
}

/** The list before there is anything in it, saying what will be. */
const NoBuilds = ({ loading }: NoBuildsProps) => (
  <div className="py-8 text-center">
    <div className="text-[13px] font-semibold">
      {loading ? "Reading your builds..." : "No builds yet"}
    </div>
    <div className="text-[12.5px] text-content/95 mt-1.5 max-w-[48ch] mx-auto">
      Every file you build lands here with the settings that made it, so a month
      from now you can download it again or put those settings back on the page.
    </div>
  </div>
);

export default NoBuilds;
