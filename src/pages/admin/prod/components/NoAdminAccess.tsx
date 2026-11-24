/** What an account below Admin's level sees instead of the page. */
const NoAdminAccess = () => (
  <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
    <div className="self-start bg-custom-white rounded-xl shadow-lg px-6 py-5 max-w-[420px]">
      <p className="text-[13px] font-semibold text-content">
        Admin access isn’t available on this account
      </p>
      <p className="text-[12px] text-content/95 mt-1.5 leading-snug">
        It needs a higher access level. Speak to whoever manages your users if
        this looks wrong.
      </p>
    </div>
  </div>
);

export default NoAdminAccess;
