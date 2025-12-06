import type { IconProps } from ".";

const UpcListIcon = ({ size, className, onClick }: IconProps) => {
  return (
    <svg
      data-testid="upc-list-icon"
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      className={`${className} cursor-pointer`}
      version="1.1"
      viewBox="0 0 16 16"
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
    >
      <path d="M3 4.5a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-7zm3 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7z" />
    </svg>
  );
};

export default UpcListIcon;
