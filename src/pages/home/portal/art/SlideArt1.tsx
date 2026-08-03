/** Slide 1 illustration, ported verbatim from the design handoff
 *  (counterctrl-site/index.html). Attributes were converted to JSX and
 *  every internal id namespaced `a1-*` — gradient and filter ids are
 *  global to the document, so six illustrations sharing generic ids
 *  would cross-contaminate each other's fills. Purely decorative. */
const SlideArt1 = () => (
  <svg
    viewBox="0 0 700 620"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <filter id="a1-sa" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="9"
          floodColor="#0F2440"
          floodOpacity=".13"
        />
      </filter>
      <filter id="a1-sma" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="5"
          floodColor="#0F2440"
          floodOpacity=".16"
        />
      </filter>
      <radialGradient id="a1-pra">
        <stop offset="0" stopColor="#E11D48" stopOpacity=".3" />
        <stop offset="1" stopColor="#E11D48" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a1-paa">
        <stop offset="0" stopColor="#D97706" stopOpacity=".3" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a1-pga">
        <stop offset="0" stopColor="#1E9E52" stopOpacity=".3" />
        <stop offset="1" stopColor="#1E9E52" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="a1-pba">
        <stop offset="0" stopColor="#0F2440" stopOpacity=".2" />
        <stop offset="1" stopColor="#0F2440" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g stroke="#C4D3E4" strokeWidth="1" fill="none" opacity=".7">
      <line x1="11" y1="500" x2="345" y2="376" />
      <line x1="25" y1="376" x2="360" y2="500" />
      <line x1="63" y1="518" x2="397" y2="394" />
      <line x1="73" y1="394" x2="408" y2="518" />
      <line x1="115" y1="535" x2="449" y2="412" />
      <line x1="121" y1="412" x2="456" y2="535" />
      <line x1="167" y1="553" x2="501" y2="429" />
      <line x1="169" y1="429" x2="504" y2="553" />
      <line x1="219" y1="571" x2="553" y2="447" />
      <line x1="216" y1="447" x2="551" y2="571" />
      <line x1="271" y1="588" x2="605" y2="465" />
      <line x1="264" y1="465" x2="599" y2="588" />
      <line x1="323" y1="606" x2="657" y2="482" />
      <line x1="312" y1="482" x2="647" y2="606" />
      <line x1="375" y1="624" x2="709" y2="500" />
      <line x1="360" y1="500" x2="695" y2="624" />
    </g>
    <g filter="url(#a1-sma)">
      <path
        d="M470 118h-74a34 34 0 1 1 8-67 42 42 0 0 1 79 11 29 29 0 0 1-13 56Z"
        fill="#0F2440"
      />
      <circle cx="422" cy="84" r="6.6" fill="#1E9E52" />
      <circle cx="462" cy="97" r="6.6" fill="#1E9E52" />
      <circle cx="443" cy="57" r="7.2" fill="#fff" />
      <path
        d="M422 84 443 57l19 40"
        stroke="#fff"
        strokeWidth="2.4"
        fill="none"
        strokeLinejoin="round"
      />
    </g>
    <line
      x1="410"
      y1="132"
      x2="330"
      y2="214"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="443"
      y1="134"
      x2="443"
      y2="206"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <line
      x1="478"
      y1="132"
      x2="556"
      y2="208"
      stroke="#9CB2CC"
      strokeWidth="1.4"
      strokeDasharray="2 6"
      className="dash"
    />
    <g className="card" style={{ animationDelay: "0.15s" }}>
      <g filter="url(#a1-sa)">
        <rect
          x="214"
          y="214"
          width="232"
          height="94"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M214 224a10 10 0 0 1 10-10h0v94h0a10 10 0 0 1-10-10z"
        fill="#0F2440"
      />
      <text
        x="234"
        y="238"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#0F2440"
      >
        INCOMING · POS FEED
      </text>
      <text
        x="234"
        y="258"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        412 locations, nightly
      </text>
      <polyline
        points="234,289 258,279 282,282 306,287 330,278 354,283 378,285 402,278 426,285"
        fill="none"
        stroke="#0F2440"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.3s" }}>
      <g filter="url(#a1-sa)">
        <rect
          x="470"
          y="206"
          width="198"
          height="84"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M470 216a10 10 0 0 1 10-10h0v84h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="490"
        y="230"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        NORMALISED
      </text>
      <text
        x="490"
        y="250"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        one definition
      </text>
      <polyline
        points="490,266 510,260 530,268 549,264 569,260 589,270 608,263 628,261 648,272"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.8"
        opacity=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g className="card" style={{ animationDelay: "0.45s" }}>
      <g filter="url(#a1-sa)">
        <rect
          x="250"
          y="338"
          width="204"
          height="88"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M250 348a10 10 0 0 1 10-10h0v88h0a10 10 0 0 1-10-10z"
        fill="#E11D48"
      />
      <text
        x="270"
        y="362"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#E11D48"
      >
        CRITICAL
      </text>
      <text
        x="270"
        y="397"
        fontFamily="Plus Jakarta Sans,sans-serif"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1"
        fill="#0F2440"
      >
        9
      </text>
      <text
        x="270"
        y="417"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        needs attention
      </text>
    </g>
    <g className="card" style={{ animationDelay: "0.6s" }}>
      <g filter="url(#a1-sa)">
        <rect
          x="474"
          y="338"
          width="198"
          height="88"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M474 348a10 10 0 0 1 10-10h0v88h0a10 10 0 0 1-10-10z"
        fill="#D97706"
      />
      <text
        x="494"
        y="362"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#D97706"
      >
        WATCH
      </text>
      <text
        x="494"
        y="397"
        fontFamily="Plus Jakarta Sans,sans-serif"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1"
        fill="#0F2440"
      >
        8
      </text>
      <text
        x="494"
        y="417"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        keep an eye on
      </text>
    </g>
    <g className="card" style={{ animationDelay: "0.75s" }}>
      <g filter="url(#a1-sa)">
        <rect
          x="358"
          y="452"
          width="204"
          height="88"
          rx="10"
          fill="#fff"
          stroke="#DCE5EF"
          strokeWidth="1"
        />
      </g>
      <path
        d="M358 462a10 10 0 0 1 10-10h0v88h0a10 10 0 0 1-10-10z"
        fill="#1E9E52"
      />
      <text
        x="378"
        y="476"
        fontFamily="IBM Plex Mono,monospace"
        fontSize="14"
        letterSpacing="1.5"
        fill="#1E9E52"
      >
        OK
      </text>
      <text
        x="378"
        y="511"
        fontFamily="Plus Jakarta Sans,sans-serif"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1"
        fill="#0F2440"
      >
        7
      </text>
      <text
        x="378"
        y="531"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fill="#5A6C84"
      >
        nothing to do
      </text>
    </g>
    <g className="pin" style={{ animationDelay: "0s" }}>
      <ellipse cx="298" cy="558" rx="50" ry="18" fill="url(#a1-pra)" />
      <ellipse
        cx="298"
        cy="558"
        rx="28"
        ry="10"
        fill="none"
        stroke="#E11D48"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a1-sma)">
        <path
          d="M298 552c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#E11D48"
        />
        <circle cx="298" cy="529" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "0.6s" }}>
      <ellipse cx="428" cy="586" rx="50" ry="18" fill="url(#a1-paa)" />
      <ellipse
        cx="428"
        cy="586"
        rx="28"
        ry="10"
        fill="none"
        stroke="#D97706"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a1-sma)">
        <path
          d="M428 580c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#D97706"
        />
        <circle cx="428" cy="557" r="4.6" fill="#fff" />
      </g>
    </g>
    <g className="pin" style={{ animationDelay: "1.2s" }}>
      <ellipse cx="552" cy="550" rx="50" ry="18" fill="url(#a1-pga)" />
      <ellipse
        cx="552"
        cy="550"
        rx="28"
        ry="10"
        fill="none"
        stroke="#1E9E52"
        strokeWidth="1.3"
        opacity=".45"
      />
      <g filter="url(#a1-sma)">
        <path
          d="M552 544c0 0-12.5-13.5-12.5-23a12.5 12.5 0 0 1 25 0c0 9.5-12.5 23-12.5 23z"
          fill="#1E9E52"
        />
        <circle cx="552" cy="521" r="4.6" fill="#fff" />
      </g>
    </g>
  </svg>
);

export default SlideArt1;
