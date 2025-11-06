const SideBar = () => {
  /**
   * min-width: 4rem (16)
   * max-width: 12rem (48)
   * 
   * need to handle the animations for this (check dcr_sandbox repo)
   */
  return (
    <div className="absolute top-12 left-0 h-[calc(100vh-3rem)] w-16 bg-black flex flex-col justify-between">
      <div>Sidebar</div>
      <div>Links</div>
    </div>
  );
};

export default SideBar;
