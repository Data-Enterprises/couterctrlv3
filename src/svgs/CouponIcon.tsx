import type { IconProps } from ".";

const CouponIcon = ({ size = 24, onClick, className }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      version="1.1"
      viewBox="0 0 512 512"
    >
      <g>
        <g id="Layer_2">
          <path
            style={{
              fill: "none",
              stroke: "CurrentColor",
              strokeWidth: "30",
              strokeLinecap: "round",
            }}
            d="M440.5,139.5H71.5c-22.1,0-40,17.9-40,40v30.5c.2,0,.3,0,.5,0,25.4,0,46,20.6,46,46s-20.6,46-46,46-.3,0-.5,0v30.5c0,22.1,17.9,40,40,40h369c22.1,0,40-17.9,40-40v-153c0-22.1-17.9-40-40-40Z"
          />
          <line
            style={{
              fill: "none",
              stroke: "CurrentColor",
              strokeWidth: "30",
              strokeLinecap: "round",
            }}
            x1="144"
            y1="167"
            x2="144"
            y2="218"
          />
          <line
            style={{
              fill: "none",
              stroke: "CurrentColor",
              strokeWidth: "30",
              strokeLinecap: "round",
            }}
            x1="144"
            y1="290.7"
            x2="144"
            y2="341.7"
          />
          <circle
            style={{
              fill: "none",
              stroke: "CurrentColor",
              strokeWidth: "20",
              strokeLinecap: "round",
            }}
            cx="344.3"
            cy="256"
            r="75.9"
          />
        </g>
      </g>
    </svg>
  );
};

export default CouponIcon;
