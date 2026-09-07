/**
 * Hero illustrations — one per banner slide.
 *
 * Drawn for the dark green hero: light strokes, mint accents, no photography.
 * Each is a 560 × 460 scene that scales with its container.
 */

const W = 560
const H = 460

function Frame({ children, label }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
      <defs>
        <linearGradient id="ha-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b3d29" />
          <stop offset="1" stopColor="#062a1c" />
        </linearGradient>
        <linearGradient id="ha-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id="ha-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#68d3a5" />
          <stop offset="1" stopColor="#12a065" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  )
}

/* ---------- shared bits ---------- */

const Blob = () => (
  <>
    <circle cx="300" cy="215" r="190" fill="#12a065" fillOpacity=".1" />
    <circle cx="300" cy="215" r="145" fill="#12a065" fillOpacity=".08" />
  </>
)

/** A tiny illustrated participant tile for the class grid. */
function Tile({ x, y, w = 96, h = 72, hue = '#2fbb80', live }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="10" fill="#ffffff" fillOpacity=".1" stroke="#ffffff" strokeOpacity=".16" />
      <circle cx={w / 2} cy={h / 2 - 6} r="12" fill={hue} fillOpacity=".8" />
      <path d={`M${w / 2 - 19} ${h - 8}a19 19 0 0 1 38 0Z`} fill={hue} fillOpacity=".55" />
      {live && <circle cx={w - 10} cy="10" r="3.6" fill="#ff6b6b" />}
    </g>
  )
}

/* ================================================================== */
/* 1 — live classroom                                                  */
/* ================================================================== */

function Classroom() {
  return (
    <Frame label="A live Gurukela class on a laptop, with the lecturer and students on screen">
      <Blob />

      {/* laptop body */}
      <g transform="translate(66 76)">
        <rect x="0" y="0" width="428" height="272" rx="16" fill="url(#ha-screen)" stroke="#2fbb80" strokeOpacity=".35" strokeWidth="2" />

        {/* app chrome */}
        <rect x="14" y="14" width="400" height="30" rx="8" fill="#ffffff" fillOpacity=".08" />
        <circle cx="30" cy="29" r="4" fill="#ff6b6b" fillOpacity=".8" />
        <circle cx="44" cy="29" r="4" fill="#ffd166" fillOpacity=".8" />
        <circle cx="58" cy="29" r="4" fill="#68d3a5" fillOpacity=".8" />
        <rect x="76" y="23" width="120" height="12" rx="6" fill="#ffffff" fillOpacity=".16" />
        <rect x="330" y="21" width="70" height="16" rx="8" fill="#ff6b6b" fillOpacity=".2" />
        <circle cx="342" cy="29" r="3.6" fill="#ff6b6b" />
        <rect x="350" y="25" width="42" height="8" rx="4" fill="#ffffff" fillOpacity=".5" />

        {/* main speaker */}
        <rect x="14" y="56" width="266" height="196" rx="12" fill="#ffffff" fillOpacity=".07" stroke="#ffffff" strokeOpacity=".14" />
        {/* whiteboard behind the lecturer */}
        <rect x="30" y="72" width="150" height="96" rx="8" fill="#ffffff" fillOpacity=".1" />
        <path d="M44 100h108M44 116h84M44 132h96M44 148h60" stroke="#68d3a5" strokeOpacity=".75" strokeWidth="4" strokeLinecap="round" />
        {/* lecturer */}
        <g transform="translate(196 108)">
          <circle cx="30" cy="30" r="26" fill="#e8b98f" />
          <path d="M4 34c0-18 12-30 26-30s26 12 26 30c-5-9-9-13-14-15-9 5-24 5-31 0-4 3-6 7-7 15Z" fill="#26170f" />
          <circle cx="21" cy="32" r="3" fill="#20302a" />
          <circle cx="39" cy="32" r="3" fill="#20302a" />
          <path d="M23 43q7 6 14 0" stroke="#8a4a42" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M-4 144c0-30 16-48 34-48s34 18 34 48Z" fill="url(#ha-mint)" transform="translate(0 -88)" />
        </g>
        <rect x="30" y="222" width="104" height="16" rx="8" fill="#ffffff" fillOpacity=".14" />
        <rect x="40" y="227" width="84" height="6" rx="3" fill="#68d3a5" fillOpacity=".7" />

        {/* student grid */}
        <Tile x={294} y={56} hue="#68d3a5" live />
        <Tile x={294} y={140} hue="#2fbb80" />
        <Tile x={294} y={224} w={96} h={28} hue="#a6e8c9" />
        <text x={310} y={244} fill="#a6e8c9" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="700">
          +148
        </text>
      </g>

      {/* laptop base */}
      <path d="M40 348h480l22 26H18l22-26Z" fill="#ffffff" fillOpacity=".14" />
      <rect x="234" y="356" width="92" height="7" rx="3.5" fill="#ffffff" fillOpacity=".22" />

      {/* floating subject chips */}
      <g fontFamily="Inter, sans-serif" fontWeight="700" fontSize="14">
        <g transform="translate(18 60)">
          <rect width="112" height="38" rx="19" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".45" />
          <circle cx="22" cy="19" r="7" fill="#68d3a5" />
          <text x="40" y="24" fill="#d5f4e4">Chemistry</text>
        </g>
        <g transform="translate(408 26)">
          <rect width="118" height="38" rx="19" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".45" />
          <circle cx="22" cy="19" r="7" fill="#2fbb80" />
          <text x="40" y="24" fill="#d5f4e4">Physics</text>
        </g>
        <g transform="translate(430 352)">
          <rect width="112" height="38" rx="19" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".45" />
          <circle cx="22" cy="19" r="7" fill="#a6e8c9" />
          <text x="40" y="24" fill="#d5f4e4">O/L Maths</text>
        </g>
      </g>
    </Frame>
  )
}

/* ================================================================== */
/* 2 — free trial week                                                 */
/* ================================================================== */

function Trial() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <Frame label="A seven day free trial pass with a week of classes ticked off">
      <Blob />

      {/* the pass */}
      <g transform="translate(92 62)">
        <rect x="0" y="0" width="376" height="228" rx="20" fill="url(#ha-panel)" stroke="#68d3a5" strokeOpacity=".4" strokeWidth="2" />
        {/* perforation */}
        <path d="M262 0v228" stroke="#68d3a5" strokeOpacity=".4" strokeWidth="2" strokeDasharray="7 9" />
        <circle cx="262" cy="0" r="11" fill="#063a26" />
        <circle cx="262" cy="228" r="11" fill="#063a26" />

        <g fontFamily="Inter, sans-serif">
          <text x="30" y="48" fill="#a6e8c9" fontSize="13" fontWeight="700" letterSpacing="2.4">
            GURUKELA ACADEMY
          </text>
          <text x="30" y="98" fill="#ffffff" fontSize="46" fontWeight="800" letterSpacing="-1.6">
            7 days free
          </text>
          <text x="30" y="128" fill="#8fc4ab" fontSize="15">
            Any lecturer · any stream
          </text>

          {/* included ticks */}
          <g transform="translate(30 150)">
            {['Live lessons', 'One tute', 'One model paper'].map((t, i) => (
              <g key={t} transform={`translate(0 ${i * 24})`}>
                <circle cx="8" cy="8" r="8" fill="#12a065" />
                <path d="m4.5 8.2 2.4 2.4 4.6-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="24" y="13" fill="#d5f4e4" fontSize="14">{t}</text>
              </g>
            ))}
          </g>

          {/* stub */}
          <g transform="translate(286 60)">
            <rect width="70" height="70" rx="16" fill="#12a065" />
            <text x="35" y="34" fill="#fff" fontSize="26" fontWeight="800" textAnchor="middle">Rs</text>
            <text x="35" y="58" fill="#fff" fontSize="24" fontWeight="800" textAnchor="middle">0</text>
          </g>
          <text x="321" y="158" fill="#8fc4ab" fontSize="12" textAnchor="middle">no card</text>
          <text x="321" y="174" fill="#8fc4ab" fontSize="12" textAnchor="middle">needed</text>
        </g>
      </g>

      {/* week strip */}
      <g transform="translate(112 320)">
        {days.map((d, i) => (
          <g key={i} transform={`translate(${i * 48} 0)`}>
            <rect width="40" height="52" rx="11" fill="#ffffff" fillOpacity={i < 5 ? '.14' : '.07'} stroke="#ffffff" strokeOpacity=".16" />
            <text x="20" y="19" fill="#8fc4ab" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">
              {d}
            </text>
            {i < 5 ? (
              <>
                <circle cx="20" cy="35" r="9" fill="#12a065" />
                <path d="m16 35.4 2.7 2.7 5.2-5.6" stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : (
              <circle cx="20" cy="35" r="9" fill="#ffffff" fillOpacity=".14" />
            )}
          </g>
        ))}
      </g>

      <g transform="translate(408 300)">
        <circle cx="34" cy="34" r="34" fill="url(#ha-mint)" opacity=".95" />
        <path d="M27 22.5 47 34 27 45.5z" fill="#052318" />
      </g>
    </Frame>
  )
}

/* ================================================================== */
/* 3 — PDF tutes inside the LMS                                        */
/* ================================================================== */

function Lms() {
  return (
    <Frame label="A PDF tute open in the Gurukela LMS on a laptop and a phone">
      <Blob />

      {/* ---- laptop, with the tute open in the LMS ---- */}
      <g transform="translate(46 74)">
        <rect x="0" y="0" width="356" height="248" rx="14" fill="url(#ha-screen)" stroke="#2fbb80" strokeOpacity=".35" strokeWidth="2" />

        {/* app chrome */}
        <rect x="12" y="12" width="332" height="26" rx="7" fill="#ffffff" fillOpacity=".08" />
        <circle cx="27" cy="25" r="3.4" fill="#ff6b6b" fillOpacity=".8" />
        <circle cx="39" cy="25" r="3.4" fill="#ffd166" fillOpacity=".8" />
        <circle cx="51" cy="25" r="3.4" fill="#68d3a5" fillOpacity=".8" />
        <rect x="66" y="19" width="120" height="12" rx="6" fill="#ffffff" fillOpacity=".14" />

        {/* the PDF page */}
        <g transform="translate(30 54)">
          <rect width="182" height="176" rx="9" fill="#ffffff" fillOpacity=".95" />
          {/* PDF flag */}
          <g transform="translate(12 12)">
            <rect width="38" height="17" rx="4.5" fill="#12a065" />
            <text x="19" y="13" fill="#fff" fontSize="10.5" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">
              PDF
            </text>
          </g>
          <path
            d="M62 20h96M12 46h158M12 62h132M12 78h150M12 94h108"
            stroke="#0a6a41"
            strokeOpacity=".34"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* a highlighted line and a small diagram, so it reads as a real tute */}
          <rect x="12" y="108" width="86" height="12" rx="6" fill="#12a065" fillOpacity=".22" />
          <g transform="translate(12 132)" stroke="#12a065" strokeOpacity=".6" strokeWidth="2.6" fill="none">
            <path d="M0 30h64M0 30V4" />
            <path d="M4 24l16-12 14 8 26-16" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <path d="M100 140h70M100 154h52" stroke="#0a6a41" strokeOpacity=".28" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* side rail: the lesson list, one row per tute */}
        <g transform="translate(228 54)">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${i * 44})`}>
              <rect width="100" height="34" rx="8" fill="#ffffff" fillOpacity={i === 0 ? '.16' : '.08'} stroke="#ffffff" strokeOpacity=".14" />
              <rect x="10" y="10" width="14" height="14" rx="3.5" fill={i === 0 ? '#2fbb80' : '#68d3a5'} fillOpacity={i === 0 ? '1' : '.5'} />
              <rect x="32" y="12" width="54" height="5" rx="2.5" fill="#ffffff" fillOpacity=".55" />
              <rect x="32" y="21" width="34" height="4" rx="2" fill="#ffffff" fillOpacity=".3" />
            </g>
          ))}
          {/* download button */}
          <g transform="translate(0 136)">
            <rect width="100" height="34" rx="17" fill="#12a065" />
            <path d="M42 12v11m0 0 4.5-4.5M42 23l-4.5-4.5M34 27h16" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g>

      {/* laptop base */}
      <path d="M32 322h384l20 22H12l20-22Z" fill="#ffffff" fillOpacity=".14" />
      <rect x="196" y="329" width="76" height="6" rx="3" fill="#ffffff" fillOpacity=".22" />

      {/* ---- the same tute on a phone ---- */}
      <g transform="translate(408 152)">
        <rect x="0" y="0" width="118" height="212" rx="20" fill="url(#ha-screen)" stroke="#68d3a5" strokeOpacity=".45" strokeWidth="2" />
        <rect x="42" y="9" width="34" height="6" rx="3" fill="#ffffff" fillOpacity=".22" />
        <rect x="10" y="24" width="98" height="150" rx="9" fill="#ffffff" fillOpacity=".94" />
        <g transform="translate(20 34)">
          <rect width="30" height="14" rx="4" fill="#12a065" />
          <text x="15" y="11" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">
            PDF
          </text>
        </g>
        <path d="M20 62h78M20 76h60M20 90h72M20 104h48M20 118h66M20 132h40" stroke="#0a6a41" strokeOpacity=".3" strokeWidth="4.5" strokeLinecap="round" />
        <g transform="translate(34 182)">
          <rect width="50" height="20" rx="10" fill="#2fbb80" />
          <path d="M25 6v7m0 0 3-3m-3 3-3-3M19 16h12" stroke="#052318" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* floating pages, drifting off the screen to the device */}
      <g transform="translate(352 40) rotate(12)" opacity=".9">
        <rect width="62" height="80" rx="7" fill="#ffffff" fillOpacity=".9" />
        <rect width="9" height="80" rx="4.5" fill="#12a065" />
        <path d="M20 18h32M20 32h26M20 46h30M20 60h20" stroke="#0a6a41" strokeWidth="4" strokeLinecap="round" opacity=".33" />
      </g>

      {/* ---- badge ---- */}
      <g fontFamily="Inter, sans-serif" transform="translate(40 372)">
        <rect width="278" height="48" rx="24" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".4" />
        <circle cx="26" cy="24" r="11" fill="#12a065" />
        <path d="m21 24.4 3.2 3.2 6.2-6.6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="48" y="29" fill="#d5f4e4" fontSize="15" fontWeight="700">
          Available as PDF Downloads
        </text>
      </g>
    </Frame>
  )
}

const ART = { classroom: Classroom, trial: Trial, lms: Lms }

export default function HeroArt({ name = 'classroom' }) {
  const Art = ART[name] || Classroom
  return <Art />
}
