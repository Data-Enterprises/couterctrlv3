interface StoresIconProps {
  fill: string;
  stroke: string;
  height: number;
  width: number;
  className: string;
}

const StoresIcon = ({
  height = 48,
  width = 48,
  className,
}: StoresIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 512 512"
      height={`${height}px`}
      width={`${width}px`}
      strokeMiterlimit="10"
      className={className}
      strokeWidth={12}
    >
      <g>
        <g id="Layer_1">
          <g>
            <g>
              <path
                stroke="CurrentColor"
                fill="none"
                d="M124,167.2H42.6l28.7-122c2.5-10.7,12-18.2,23-18.2h49.5l-19.8,140.2Z"
              />
              <polygon
                stroke="CurrentColor"
                fill="none"
                points="205.4 167.2 124 167.2 143.8 27 212 27 205.4 167.2"
              />
              <polygon
                stroke="CurrentColor"
                fill="none"
                points="286.7 167.2 205.4 167.2 212 27 280.1 27 286.7 167.2"
              />
              <polygon
                stroke="CurrentColor"
                fill="none"
                points="368.1 167.2 286.7 167.2 280.1 27 348.3 27 368.1 167.2"
              />
              <path
                stroke="CurrentColor"
                fill="none"
                d="M449.5,167.2h-81.4l-19.8-140.2h49.5c11,0,20.5,7.5,23,18.2l28.7,122Z"
              />
            </g>
            <g>
              <path
                stroke="CurrentColor"
                fill="none"
                d="M42.2,168.5v38.6c0,22.4,16.9,40.5,37.7,40.5h6c20.8,0,37.7-18.1,37.7-40.5v-38.6H42.2Z"
              />
              <path
                stroke="CurrentColor"
                fill="none"
                d="M123.6,168.5v38.6c0,22.4,16.9,40.5,37.7,40.5h6c20.8,0,37.7-18.1,37.7-40.5v-38.6h-81.4Z"
              />
              <path
                stroke="CurrentColor"
                fill="none"
                d="M205,168.5v38.6c0,22.4,16.9,40.5,37.7,40.5h6c20.8,0,37.7-18.1,37.7-40.5v-38.6h-81.4Z"
              />
              <path
                stroke="CurrentColor"
                fill="none"
                d="M286.4,168.5v38.6c0,22.4,16.9,40.5,37.7,40.5h6c20.8,0,37.7-18.1,37.7-40.5v-38.6h-81.4Z"
              />
              <path
                stroke="CurrentColor"
                fill="none"
                d="M367.8,168.5v38.6c0,22.4,16.9,40.5,37.7,40.5h6c20.8,0,37.7-18.1,37.7-40.5v-38.6h-81.4Z"
              />
            </g>
          </g>
          <path
            stroke="CurrentColor"
            fill="none"
            d="M298.2,362.7h38.4c10,0,18.1,8.1,18.1,18.1v118.2h-74.6v-118.2c0-10,8.1-18.1,18.1-18.1Z"
          />
          <rect
            stroke="CurrentColor"
            fill="none"
            x="110.4"
            y="347.2"
            width="129.9"
            height="78.5"
            rx="16.6"
            ry="16.6"
          />
          <line
            strokeWidth="10"
            stroke="CurrentColor"
            fill="none"
            x1="79.5"
            y1="246.9"
            x2="79.5"
            y2="499"
          />
          <line
            strokeWidth="10"
            stroke="CurrentColor"
            fill="none"
            x1="411.3"
            y1="246.9"
            x2="412.6"
            y2="499"
          />
          <line
            strokeWidth="10"
            stroke="CurrentColor"
            fill="none"
            x1="79.5"
            y1="499"
            x2="412.6"
            y2="499"
          />
        </g>
      </g>
    </svg>
  );
};

export default StoresIcon;
