interface SignOutRowProps {
  username: string;
  onSignOut: () => void;
}

/** Who is signed in, and the way out if setup can't be finished now. */
const SignOutRow = ({ username, onSignOut }: SignOutRowProps) => (
  <div className="flex items-center justify-between mt-3">
    <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-brand_slate">
      Signed in as {username}
    </span>
    <button
      type="button"
      data-testid="setup-sign-out"
      onClick={onSignOut}
      className="text-[12px] font-medium text-content hover:underline"
    >
      Sign out
    </button>
  </div>
);

export default SignOutRow;
