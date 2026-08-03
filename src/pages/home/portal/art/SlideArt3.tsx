/** Slide 3 illustration, ported verbatim from the design handoff
 *  (counterctrl-site/index.html). Attributes were converted to JSX and
 *  every internal id namespaced `a3-*` — gradient and filter ids are
 *  global to the document, so six illustrations sharing generic ids
 *  would cross-contaminate each other's fills. Purely decorative. */
const SlideArt3 = () => (
  <svg
    viewBox="0 0 700 620"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <filter id="a3-sc" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="9"
          floodColor="#0F2440"
          floodOpacity=".13"
        />
      </filter>
      <filter id="a3-smc" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="5"
          floodColor="#0F2440"
          floodOpacity=".16"
        />
      </filter>
      <radialGradient id="a3-prc">
        <stop offset="0" stopColor="#E11D48" stopOpacity=".3" />
        <stop offset="1" stopColor="#E11D48" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a3-pac">
        <stop offset="0" stopColor="#D97706" stopOpacity=".3" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a3-pgc">
        <stop offset="0" stopColor="#1E9E52" stopOpacity=".3" />
        <stop offset="1" stopColor="#1E9E52" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a3-pbc">
        <stop offset="0" stopColor="#0F2440" stopOpacity=".2" />
        <stop offset="1" stopColor="#0F2440" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g stroke="#C4D3E4" strokeWidth="1" fill="none" opacity=".7">
      <line x1="11" y1="482" x2="345" y2="358" />
      <line x1="25" y1="358" x2="360" y2="482" />
      <line x1="63" y1="500" x2="397" y2="376" />
      <line x1="73" y1="376" x2="408" y2="500" />
      <line x1="115" y1="517" x2="449" y2="394" />
      <line x1="121" y1="394" x2="456" y2="517" />
      <line x1="167" y1="535" x2="501" y2="411" />
      <line x1="169" y1="411" x2="504" y2="535" />
      <line x1="219" y1="553" x2="553" y2="429" />
      <line x1="216" y1="429" x2="551" y2="553" />
      <line x1="271" y1="570" x2="605" y2="447" />
      <line x1="264" y1="447" x2="599" y2="570" />
      <line x1="323" y1="588" x2="657" y2="464" />
      <line x1="312" y1="464" x2="647" y2="588" />
      <line x1="375" y1="606" x2="709" y2="482" />
      <line x1="360" y1="482" x2="695" y2="606" />
    </g>
    <g transform="translate(318,166)">
      <circle r="130" fill="#fff" opacity=".6" />
      <circle r="130" fill="none" stroke="#C4D3E4" strokeWidth="1" />
      <circle r="95" fill="none" stroke="#C4D3E4" strokeWidth="1" />
      <circle r="57" fill="none" stroke="#C4D3E4" strokeWidth="1" />
      <circle r="21" fill="none" stroke="#C4D3E4" strokeWidth="1" />
      <line x1="-130" y1="0" x2="130" y2="0" stroke="#C4D3E4" strokeWidth="1" />
      <line x1="0" y1="-130" x2="0" y2="130" stroke="#C4D3E4" strokeWidth="1" />
      <g className="sweep">
        <path
          d="M0 0 L130 -44 A130 130 0 0 1 130 24 Z"
          fill="#1E9E52"
          opacity=".18"
        />
      </g>
      <circle cx="6" cy="4" r="8" fill="#E11D48" />
      <circle
        cx="6"
        cy="4"
        r="19"
        fill="none"
        stroke="#E11D48"
        strokeWidth="1.4"
        opacity=".45"
      />
      <circle cx="78" cy="70" r="5" fill="#1E9E52" />
      <circle cx="-38" cy="88" r="5" fill="#D97706" />
    </g>
    <g className="card" style={{ animationDelay: "0.2s" }}>
      <g filter="url(#a3-sc)">
        <rect
          x="472"
          y="96"
          width="192"
          height="128"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M472 106a10 10 0 0 1 10-10h0v128h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="492"
        y="120"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        LOCATION SCORE
      </text>
      <text
        x="492"
        y="155"
        fontFamily="Plus Jakarta Sans,sans-serif"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1"
        fill="#0F2440"
      >
        92
      </text>
      <text
        x="492"
        y="175"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        graded OK
      </text>
      <polyline
        points="492,194 511,200 530,201 549,194 568,201 587,199 606,194 625,203 644,198"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.35s" }}>
      <g filter="url(#a3-sc)">
        <rect
          x="184"
          y="300"
          width="180"
          height="102"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M184 310a10 10 0 0 1 10-10h0v102h0a10 10 0 0 1-10-10z"
        fill="#E11D48"
      />
      <text
        x="204"
        y="324"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#E11D48"
      >
        CRITICAL
      </text>
      <text
        x="204"
        y="344"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        score 92+
      </text>
      <polyline
        points="204,372 222,381 239,376 256,373 274,383 292,375 309,373 326,385 344,373"
        fill="none"
        stroke="#E11D48"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.5s" }}>
      <g filter="url(#a3-sc)">
        <rect
          x="388"
          y="266"
          width="180"
          height="102"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M388 276a10 10 0 0 1 10-10h0v102h0a10 10 0 0 1-10-10z"
        fill="#D97706"
      />
      <text
        x="408"
        y="290"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#D97706"
      >
        WATCH
      </text>
      <text
        x="408"
        y="310"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        score 75–91
      </text>
      <polyline
        points="408,339 426,349 443,341 460,339 478,351 496,340 513,340 530,349 548,339"
        fill="none"
        stroke="#D97706"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.65s" }}>
      <g filter="url(#a3-sc)">
        <rect
          x="494"
          y="392"
          width="172"
          height="98"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M494 402a10 10 0 0 1 10-10h0v98h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="514"
        y="416"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        OK
      </text>
      <text
        x="514"
        y="436"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        score 0–74
      </text>
      <polyline
        points="514,461 530,472 547,462 564,462 580,471 596,461 613,463 630,469 646,460"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <line
      x1="274"
      y1="402"
      x2="274"
      y2="472"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="478"
      y1="368"
      x2="462"
      y2="480"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="580"
      y1="490"
      x2="568"
      y2="540"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <g className="pin" style={{ animationDelay: "0s" }}>
      <ellipse cx="274" cy="496" rx="50" ry="18" fill="url(#a3-prc)" />
      <ellipse
        cx="274"
        cy="496"
        rx="28"
        ry="10"
        fill="none"
        stroke="#E11D48"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a3-smc)">
        <path
          d="M274 490c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#E11D48"
        />
        <circle cx="274" cy="467" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "0.5s" }}>
      <ellipse cx="458" cy="508" rx="50" ry="18" fill="url(#a3-pac)" />
      <ellipse
        cx="458"
        cy="508"
        rx="28"
        ry="10"
        fill="none"
        stroke="#D97706"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a3-smc)">
        <path
          d="M458 502c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#D97706"
        />
        <circle cx="458" cy="479" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "1s" }}>
      <ellipse cx="568" cy="564" rx="50" ry="18" fill="url(#a3-pgc)" />
      <ellipse
        cx="568"
        cy="564"
        rx="28"
        ry="10"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a3-smc)">
        <path
          d="M568 558c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#1E9E52"
        />
        <circle cx="568" cy="535" r="4.6" fill="#fff" />
      </g>
    </g>
  </svg>
);

export default SlideArt3;
