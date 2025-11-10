import type { IconProps } from ".";
const SalesIconV2 = ({ className, onClick }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer`}
      version="1.1"
      viewBox="0 0 512 512"
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth="20"
    >
      <g id="Layer_2-2" data-name="Layer_2">
        <path d="M14.98,291.7h43.47c6.89,0,12.48,5.59,12.48,12.48v102.5H2.5v-102.5c0-6.89,5.59-12.48,12.48-12.48Z" />
        <path d="M138.45,240.38h43.77c6.81,0,12.33,5.53,12.33,12.33v153.97h-68.43v-153.97c0-6.81,5.53-12.33,12.33-12.33Z" />
        <path d="M260.47,200.45h46.96c5.93,0,10.74,4.81,10.74,10.74v195.48h-68.43v-195.48c0-5.93,4.81-10.74,10.74-10.74Z" />
        <path d="M386.64,151.36h41.85c7.34,0,13.29,5.96,13.29,13.29v242.02h-68.43v-242.02c0-7.34,5.96-13.29,13.29-13.29Z" />
        <polyline points="4.36 216.7 146.2 92.46 215.58 159.87 323.57 54.5" />
        <polygon points="377.97 3.54 294.32 25.95 355.56 87.19 377.97 3.54" />
      </g>
    </svg>
  );
};

export default SalesIconV2;
