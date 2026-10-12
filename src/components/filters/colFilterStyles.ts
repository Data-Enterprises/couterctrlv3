/**
 * Input styling for whatever a `ColFilter` popover holds.
 *
 * Its own module rather than a second export from `ColFilter`: react-refresh
 * only keeps fast refresh working for files that export components alone, and
 * a constant beside the component silently costs every consumer their hot
 * reload.
 */
export const colInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgb(var(--color-brand-navy) / 0.03)",
};
