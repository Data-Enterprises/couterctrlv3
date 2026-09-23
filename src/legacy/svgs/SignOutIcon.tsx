import type { IconProps } from ".";

const SignOutIcon = ({ className }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer`}
      version="1.1"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="30"
      strokeMiterlimit="10"
      strokeLinecap="round"
    >
      <g id="Layer_2-2" data-name="Layer_2">
        <path d="M102.01,407.1c35.49,24.69,78.62,39.16,125.13,39.16,121.16,0,219.38-98.22,219.38-219.38S348.3,7.5,227.14,7.5c-46.51,0-89.64,14.47-125.13,39.16" />
        <line x1="227.14" y1="227.38" x2="7.5" y2="222.85" />
        <line x1="7.5" y1="222.85" x2="76.34" y2="145.61" />
        <line x1="7.5" y1="222.85" x2="76.34" y2="300.08" />
      </g>
    </svg>
  );
};

export default SignOutIcon;
