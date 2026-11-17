interface BuildingNoticeProps {
  /** Past the point the connection usually waits. */
  slow: boolean;
}

/** The bar while the file is being written, with a spinner. */
const BuildingNotice = ({ slow }: BuildingNoticeProps) => (
  <div className="flex-shrink-0 bg-brand_navy rounded-xl px-4 py-3 flex items-center gap-3">
    <div className="w-5 h-5 rounded-full border-2 border-custom-white/25 border-t-brand_green animate-spin flex-shrink-0" />
    <div className="flex-1">
      <div className="text-[13px] cc-navy-title">
        {slow ? "Still building" : "Building your file"}
      </div>
      <div className="text-[11.5px] text-custom-white/95 mt-0.5">
        {slow
          ? "Past the point the connection usually waits. It is still being written — if no link arrives, try a shorter range."
          : "Written straight to storage — nothing downloads here."}
      </div>
    </div>
  </div>
);

export default BuildingNotice;
