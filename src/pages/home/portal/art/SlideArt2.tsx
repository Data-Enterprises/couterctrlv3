/** Slide 2 illustration, ported verbatim from the design handoff
 *  (counterctrl-site/index.html). Attributes were converted to JSX and
 *  every internal id namespaced `a2-*` — gradient and filter ids are
 *  global to the document, so six illustrations sharing generic ids
 *  would cross-contaminate each other's fills. Purely decorative. */
const SlideArt2 = () => (
  <svg
    viewBox="0 0 700 620"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <filter id="a2-sb" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="9"
          floodColor="#0F2440"
          floodOpacity=".13"
        />
      </filter>
      <filter id="a2-smb" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="5"
          floodColor="#0F2440"
          floodOpacity=".16"
        />
      </filter>
      <radialGradient id="a2-prb">
        <stop offset="0" stopColor="#E11D48" stopOpacity=".3" />
        <stop offset="1" stopColor="#E11D48" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a2-pab">
        <stop offset="0" stopColor="#D97706" stopOpacity=".3" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a2-pgb">
        <stop offset="0" stopColor="#1E9E52" stopOpacity=".3" />
        <stop offset="1" stopColor="#1E9E52" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a2-pbb">
        <stop offset="0" stopColor="#0F2440" stopOpacity=".2" />
        <stop offset="1" stopColor="#0F2440" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g stroke="#C4D3E4" strokeWidth="1" fill="none" opacity=".7">
      <line x1="21" y1="502" x2="355" y2="378" />
      <line x1="35" y1="378" x2="370" y2="502" />
      <line x1="73" y1="520" x2="407" y2="396" />
      <line x1="83" y1="396" x2="418" y2="520" />
      <line x1="125" y1="537" x2="459" y2="414" />
      <line x1="131" y1="414" x2="466" y2="537" />
      <line x1="177" y1="555" x2="511" y2="431" />
      <line x1="179" y1="431" x2="514" y2="555" />
      <line x1="229" y1="573" x2="563" y2="449" />
      <line x1="226" y1="449" x2="561" y2="573" />
      <line x1="281" y1="590" x2="615" y2="467" />
      <line x1="274" y1="467" x2="609" y2="590" />
      <line x1="333" y1="608" x2="667" y2="484" />
      <line x1="322" y1="484" x2="657" y2="608" />
      <line x1="385" y1="626" x2="719" y2="502" />
      <line x1="370" y1="502" x2="705" y2="626" />
    </g>
    <g className="card" style={{ animationDelay: "0.1s" }}>
      <g filter="url(#a2-sb)">
        <rect
          x="148"
          y="108"
          width="236"
          height="104"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M148 118a10 10 0 0 1 10-10h0v104h0a10 10 0 0 1-10-10z"
        fill="#0F2440"
      />
      <text
        x="168"
        y="132"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#0F2440"
      >
        SALES &amp; PERFORMANCE
      </text>
      <text
        x="168"
        y="152"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        this week vs LW &amp; LY
      </text>
      <polyline
        points="168,184 192,184 217,194 242,183 266,185 290,192 315,182 340,186 364,190"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.25s" }}>
      <g filter="url(#a2-sb)">
        <rect
          x="404"
          y="164"
          width="236"
          height="104"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M404 174a10 10 0 0 1 10-10h0v104h0a10 10 0 0 1-10-10z"
        fill="#E11D48"
      />
      <text
        x="424"
        y="188"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#E11D48"
      >
        LOSS PREVENTION
      </text>
      <text
        x="424"
        y="208"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        vs each location baseline
      </text>
      <polyline
        points="424,243 448,246 473,238 498,244 522,244 546,238 571,246 596,243 620,238"
        fill="none"
        stroke="#E11D48"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.4s" }}>
      <g filter="url(#a2-sb)">
        <rect
          x="148"
          y="268"
          width="236"
          height="104"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M148 278a10 10 0 0 1 10-10h0v104h0a10 10 0 0 1-10-10z"
        fill="#D97706"
      />
      <text
        x="168"
        y="292"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#D97706"
      >
        MARGIN &amp; PRICING
      </text>
      <text
        x="168"
        y="312"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        decliners by points lost
      </text>
      <polyline
        points="168,343 192,345 217,352 242,342 266,346 290,350 315,342 340,348 364,348"
        fill="none"
        stroke="#D97706"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.55s" }}>
      <g filter="url(#a2-sb)">
        <rect
          x="404"
          y="324"
          width="236"
          height="104"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M404 334a10 10 0 0 1 10-10h0v104h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="424"
        y="348"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        ITEMS &amp; INVENTORY
      </text>
      <text
        x="424"
        y="368"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        movement and direction
      </text>
      <polyline
        points="424,400 448,410 473,399 498,401 522,408 546,398 571,403 596,406 620,398"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <line
      x1="266"
      y1="212"
      x2="266"
      y2="268"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="522"
      y1="268"
      x2="522"
      y2="324"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="384"
      y1="160"
      x2="404"
      y2="182"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="384"
      y1="320"
      x2="404"
      y2="342"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <g className="pin" style={{ animationDelay: "0s" }}>
      <ellipse cx="300" cy="528" rx="50" ry="18" fill="url(#a2-pbb)" />
      <ellipse
        cx="300"
        cy="528"
        rx="28"
        ry="10"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a2-smb)">
        <path
          d="M300 522c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#0F2440"
        />
        <circle cx="300" cy="499" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "0.7s" }}>
      <ellipse cx="470" cy="552" rx="50" ry="18" fill="url(#a2-pgb)" />
      <ellipse
        cx="470"
        cy="552"
        rx="28"
        ry="10"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a2-smb)">
        <path
          d="M470 546c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#1E9E52"
        />
        <circle cx="470" cy="523" r="4.6" fill="#fff" />
      </g>
    </g>
  </svg>
);

export default SlideArt2;
