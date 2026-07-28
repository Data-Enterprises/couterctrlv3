import { useState } from "react";

interface Props {
  id?: string;
  onClick: () => void;
  // Positioning is the caller's business — the default matches the original
  // label-above-input layout, but anything that changes the input's height
  // needs to center the icon against the input itself instead.
  className?: string;
}

const Eye = ({ onClick, id = "", className = "right-1.5 top-[28px]" }: Props) => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(!active);
    onClick();
  };
  return (
    <svg
      data-testid={`eye-icon-${id}`}
      onClick={handleClick}
      className={`size-6 absolute cursor-pointer transition-all duration-300 ${className} ${
        active ? "fill-blue-500" : "fill-content"
      }`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
    >
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path
        fillRule="evenodd"
        d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.238.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default Eye;
