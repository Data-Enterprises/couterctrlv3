/** Slide 5 illustration, ported verbatim from the design handoff
 *  (Jul 2026, since removed from the repo — see git history). Attributes
 *  were converted to JSX and
 *  every internal id namespaced `a5-*` — gradient and filter ids are
 *  global to the document, so six illustrations sharing generic ids
 *  would cross-contaminate each other's fills. Purely decorative. */
const SlideArt5 = () => (
  <svg
    viewBox="0 0 700 620"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <filter id="a5-se" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="9"
          floodColor="#0F2440"
          floodOpacity=".13"
        />
      </filter>
      <filter id="a5-sme" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="5"
          floodColor="#0F2440"
          floodOpacity=".16"
        />
      </filter>
      <radialGradient id="a5-pre">
        <stop offset="0" stopColor="#E11D48" stopOpacity=".3" />
        <stop offset="1" stopColor="#E11D48" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a5-pae">
        <stop offset="0" stopColor="#D97706" stopOpacity=".3" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a5-pge">
        <stop offset="0" stopColor="#1E9E52" stopOpacity=".3" />
        <stop offset="1" stopColor="#1E9E52" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a5-pbe">
        <stop offset="0" stopColor="#0F2440" stopOpacity=".2" />
        <stop offset="1" stopColor="#0F2440" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g stroke="#C4D3E4" strokeWidth="1" fill="none" opacity=".7">
      <line x1="-107" y1="432" x2="341" y2="267" />
      <line x1="-87" y1="267" x2="360" y2="432" />
      <line x1="-53" y1="450" x2="395" y2="285" />
      <line x1="-37" y1="285" x2="410" y2="450" />
      <line x1="1" y1="469" x2="449" y2="303" />
      <line x1="12" y1="303" x2="459" y2="469" />
      <line x1="55" y1="487" x2="503" y2="322" />
      <line x1="62" y1="322" x2="509" y2="487" />
      <line x1="109" y1="505" x2="557" y2="340" />
      <line x1="112" y1="340" x2="559" y2="505" />
      <line x1="163" y1="524" x2="611" y2="359" />
      <line x1="161" y1="359" x2="608" y2="524" />
      <line x1="217" y1="542" x2="665" y2="377" />
      <line x1="211" y1="377" x2="658" y2="542" />
      <line x1="271" y1="561" x2="719" y2="395" />
      <line x1="261" y1="395" x2="708" y2="561" />
      <line x1="325" y1="579" x2="773" y2="414" />
      <line x1="310" y1="414" x2="757" y2="579" />
      <line x1="379" y1="597" x2="827" y2="432" />
      <line x1="360" y1="432" x2="807" y2="597" />
    </g>
    <line
      x1="250"
      y1="432"
      x2="400"
      y2="470"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="400"
      y1="470"
      x2="540"
      y2="416"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="250"
      y1="432"
      x2="360"
      y2="354"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="540"
      y1="416"
      x2="360"
      y2="354"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <g className="pin" style={{ animationDelay: "0s" }}>
      <ellipse cx="250" cy="432" rx="50" ry="18" fill="url(#a5-pbe)" />
      <ellipse
        cx="250"
        cy="432"
        rx="28"
        ry="10"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a5-sme)">
        <path
          d="M250 426c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#0F2440"
        />
        <circle cx="250" cy="403" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "0.4s" }}>
      <ellipse cx="400" cy="470" rx="50" ry="18" fill="url(#a5-pge)" />
      <ellipse
        cx="400"
        cy="470"
        rx="28"
        ry="10"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a5-sme)">
        <path
          d="M400 464c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#1E9E52"
        />
        <circle cx="400" cy="441" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "0.8s" }}>
      <ellipse cx="540" cy="416" rx="50" ry="18" fill="url(#a5-pae)" />
      <ellipse
        cx="540"
        cy="416"
        rx="28"
        ry="10"
        fill="none"
        stroke="#D97706"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a5-sme)">
        <path
          d="M540 410c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#D97706"
        />
        <circle cx="540" cy="387" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "1.2s" }}>
      <ellipse cx="360" cy="354" rx="50" ry="18" fill="url(#a5-pbe)" />
      <ellipse
        cx="360"
        cy="354"
        rx="28"
        ry="10"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a5-sme)">
        <path
          d="M360 348c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#0F2440"
        />
        <circle cx="360" cy="325" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="card" style={{ animationDelay: "0.15s" }}>
      <g filter="url(#a5-se)">
        <rect
          x="148"
          y="128"
          width="200"
          height="92"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M148 138a10 10 0 0 1 10-10h0v92h0a10 10 0 0 1-10-10z"
        fill="#0F2440"
      />
      <text
        x="168"
        y="152"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#0F2440"
      >
        DISTRICT
      </text>
      <text
        x="168"
        y="172"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        12 locations
      </text>
      <polyline
        points="168,190 188,199 208,194 228,191 248,201 268,193 288,191 308,203 328,191"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.3s" }}>
      <g filter="url(#a5-se)">
        <rect
          x="420"
          y="106"
          width="208"
          height="92"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M420 116a10 10 0 0 1 10-10h0v92h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="440"
        y="130"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        GROUP ROLLUP
      </text>
      <text
        x="440"
        y="150"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        every banner
      </text>
      <polyline
        points="440,174 461,174 482,168 503,176 524,173 545,168 566,178 587,171 608,169"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.5s" }}>
      <g filter="url(#a5-se)">
        <rect
          x="468"
          y="536"
          width="196"
          height="74"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M468 546a10 10 0 0 1 10-10h0v74h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="488"
        y="560"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        ALL REPORTING
      </text>
      <text
        x="488"
        y="595"
        fontFamily="Plus Jakarta Sans,sans-serif"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1"
        fill="#0F2440"
      >
        100x
      </text>
    </g>
    <line
      x1="248"
      y1="220"
      x2="250"
      y2="400"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="524"
      y1="198"
      x2="540"
      y2="384"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
  </svg>
);

export default SlideArt5;
