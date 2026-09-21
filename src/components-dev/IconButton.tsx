interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  variant?: "default" | "danger";
}

// Shared small icon-only action button (rename/delete/etc.) used across
// grid-style admin pages (Organization, Admin) wherever a row/section needs a
// quiet inline action instead of a full labeled button.
const IconButton = ({
  icon: Icon,
  onClick,
  title,
  variant = "default",
}: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
        variant === "danger"
          ? "text-content/85 hover:text-red-600 hover:bg-red-50"
          : "text-content/85 hover:text-content hover:bg-gray-100"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
};

export default IconButton;
