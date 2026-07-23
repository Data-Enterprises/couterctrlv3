// Shared inline style for ColFilter's typical text-input children, split
// into its own file since a component file can only export the component
// itself (react-refresh/only-export-components).
export const colFilterInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgba(30,42,74,0.03)",
};
