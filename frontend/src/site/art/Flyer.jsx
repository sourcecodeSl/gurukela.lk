/**
 * Campaign flyers.
 *
 * Six poster designs, drawn as 400 × 500 SVG so they stay crisp on a card, in
 * the campaign rail and blown up on a phone. Same green/white brand system as
 * the rest of the site: deep green ground, mint accent, one loud numeral.
 */

const W = 400
const H = 500

function Poster({ id, children, label }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#063a26" />
          <stop offset="0.55" stopColor="#085232" />
          <stop offset="1" stopColor="#0a6a41" />
        </linearGradient>
        <linearGradient id={`${id}-mint`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#68d3a5" />
          <stop offset="1" stopColor="#12a065" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.8" cy="0.15" r="0.7">
          <stop offset="0" stopColor="#2fbb80" stopOpacity=".45" />
          <stop offset="1" stopColor="#2fbb80" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />

      {children}

      {/* shared brand footer */}
      <g>
        <path d="M0 452h400v48H0z" fill="#052318" fillOpacity=".55" />
        <g transform="translate(26 464)">
          <rect width="24" height="24" rx="7" fill="#12a065" />
          <path d="M12 5c2.9.9 4.6 2.8 4.6 5.1 0 1.9-1.4 3.4-3.2 3.7v1.4h-2.8v-1.4c-1.8-.3-3.2-1.8-3.2-3.7C7.4 7.8 9.1 5.9 12 5Z" fill="#fff" />
          <path d="M4.6 16.4c2.5-1.2 4.9-1.2 7.4 0v4.4c-2.5-1.2-4.9-1.2-7.4 0v-4.4Z" fill="#fff" />
          <path d="M12.3 16.4c2.5-1.2 4.9-1.2 7.4 0v4.4c-2.5-1.2-4.9-1.2-7.4 0v-4.4Z" fill="#fff" fillOpacity=".8" />
        </g>
        <text x="58" y="481" fill="#ffffff" fontSize="15" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="-.3">
          Gurukela
        </text>
        <text x="374" y="481" fill="#8fc4ab" fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif" textAnchor="end">
          gurukela.lk
        </text>
      </g>
    </svg>
  )
}

/** Repeating faint grid, used on a few of the posters. */
const Grid = () => (
  <g stroke="#ffffff" strokeOpacity=".07" strokeWidth="1">
    {Array.from({ length: 10 }, (_, i) => (
      <path key={`v${i}`} d={`M${i * 44} 0v452`} />
    ))}
    {Array.from({ length: 11 }, (_, i) => (
      <path key={`h${i}`} d={`M0 ${i * 44}h400`} />
    ))}
  </g>
)

const T = { fontFamily: 'Inter, sans-serif' }

/* ================================================================== */

function TrialFlyer() {
  return (
    <Poster id="fl-trial" label="Flyer: free trial week, seven days free">
      <Grid />
      <circle cx="330" cy="150" r="118" fill="#2fbb80" fillOpacity=".14" />

      <text x="34" y="72" fill="#a6e8c9" fontSize="14" fontWeight="700" letterSpacing="3" {...T}>
        EVERY STREAM
      </text>
      <text x="34" y="132" fill="#ffffff" fontSize="40" fontWeight="800" letterSpacing="-1.6" {...T}>
        FREE TRIAL
      </text>
      <text x="34" y="178" fill="#68d3a5" fontSize="40" fontWeight="800" letterSpacing="-1.6" {...T}>
        WEEK
      </text>

      <text x="34" y="308" fill="#ffffff" fontSize="150" fontWeight="800" letterSpacing="-8" opacity=".95" {...T}>
        7
      </text>
      <text x="152" y="268" fill="#a6e8c9" fontSize="26" fontWeight="800" letterSpacing="-.6" {...T}>
        days
      </text>
      <text x="152" y="298" fill="#a6e8c9" fontSize="26" fontWeight="800" letterSpacing="-.6" {...T}>
        on us
      </text>

      <g transform="translate(34 336)" {...T}>
        {['Live lessons', 'One printed tute', 'One model paper'].map((t, i) => (
          <g key={t} transform={`translate(0 ${i * 30})`}>
            <circle cx="10" cy="10" r="10" fill="#12a065" />
            <path d="m5.6 10.3 3 3 5.8-6.3" stroke="#fff" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="30" y="15" fill="#d5f4e4" fontSize="16" fontWeight="600">{t}</text>
          </g>
        ))}
      </g>

      <g transform="translate(268 296)">
        <rect width="106" height="46" rx="23" fill="#ffffff" />
        <text x="53" y="30" fill="#085232" fontSize="18" fontWeight="800" textAnchor="middle" {...T}>
          Rs. 0
        </text>
      </g>
    </Poster>
  )
}

/* ================================================================== */

function TheoryFlyer() {
  const cols = ['SCIENCE', 'TECHNOLOGY', 'COMMERCE']
  return (
    <Poster id="fl-theory" label="Flyer: A/L 2027 theory batch across three streams">
      <Grid />

      <g transform="translate(34 46)">
        <rect width="104" height="30" rx="15" fill="#2fbb80" />
        <text x="52" y="20" fill="#052318" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="1.2" {...T}>
          NEW BATCH
        </text>
      </g>

      <text x="34" y="132" fill="#ffffff" fontSize="52" fontWeight="800" letterSpacing="-2.4" {...T}>
        A/L 2027
      </text>
      <text x="34" y="178" fill="#68d3a5" fontSize="36" fontWeight="800" letterSpacing="-1.4" {...T}>
        THEORY BATCH
      </text>
      <path d="M34 196h120" stroke="#2fbb80" strokeWidth="4" strokeLinecap="round" />

      {/* three stream columns */}
      <g transform="translate(34 224)">
        {cols.map((c, i) => (
          <g key={c} transform={`translate(${i * 112} 0)`}>
            <rect width="100" height="118" rx="14" fill="#ffffff" fillOpacity=".1" stroke="#ffffff" strokeOpacity=".18" />
            <circle cx="50" cy="42" r="20" fill="url(#fl-theory-mint)" />
            {i === 0 && <path d="M50 32v20M42 42h16M44 52l12-20" stroke="#052318" strokeWidth="2.4" strokeLinecap="round" />}
            {i === 1 && <path d="M40 34h20v16H40zM50 50v8M42 58h16" stroke="#052318" strokeWidth="2.4" strokeLinecap="round" fill="none" />}
            {i === 2 && <path d="M40 52V38M50 52V32M60 52V42M38 56h24" stroke="#052318" strokeWidth="2.6" strokeLinecap="round" />}
            <text x="50" y="86" fill="#d5f4e4" fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing=".8" {...T}>
              {c}
            </text>
            <text x="50" y="104" fill="#8fc4ab" fontSize="11" textAnchor="middle" {...T}>
              full syllabus
            </text>
          </g>
        ))}
      </g>

      <g transform="translate(34 366)" {...T}>
        <text y="14" fill="#8fc4ab" fontSize="13" fontWeight="600">Starts 6 January · twice a week</text>
        <text y="52" fill="#ffffff" fontSize="30" fontWeight="800" letterSpacing="-1">Rs. 2,500</text>
        <text x="136" y="52" fill="#8fc4ab" fontSize="15" fontWeight="600">/ month</text>
        <text x="230" y="50" fill="#7fb59b" fontSize="16" fontWeight="600" textDecoration="line-through">Rs. 3,000</text>
      </g>
    </Poster>
  )
}

/* ================================================================== */

function RevisionFlyer() {
  return (
    <Poster id="fl-revision" label="Flyer: O/L 2026 revision programme with a weekly timed paper">
      <circle cx="300" cy="330" r="150" fill="#2fbb80" fillOpacity=".12" />
      <circle cx="300" cy="330" r="106" fill="#2fbb80" fillOpacity=".12" />

      <text x="34" y="70" fill="#a6e8c9" fontSize="14" fontWeight="700" letterSpacing="3" {...T}>
        ORDINARY LEVEL
      </text>
      <text x="34" y="128" fill="#ffffff" fontSize="54" fontWeight="800" letterSpacing="-2.4" {...T}>
        O/L 2026
      </text>
      <text x="34" y="172" fill="#68d3a5" fontSize="38" fontWeight="800" letterSpacing="-1.5" {...T}>
        REVISION
      </text>

      <g transform="translate(34 206)" {...T}>
        {['Mathematics', 'Science', 'English'].map((s, i) => (
          <g key={s} transform={`translate(${i * 0} ${i * 34})`}>
            <rect width="150" height="28" rx="14" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".4" />
            <circle cx="16" cy="14" r="5" fill="#68d3a5" />
            <text x="30" y="19" fill="#d5f4e4" fontSize="14" fontWeight="700">{s}</text>
          </g>
        ))}
      </g>

      {/* clock — a timed paper every Sunday */}
      <g transform="translate(240 236)">
        <circle cx="70" cy="70" r="66" fill="#ffffff" fillOpacity=".1" stroke="#68d3a5" strokeOpacity=".55" strokeWidth="3" />
        <circle cx="70" cy="70" r="52" fill="#052318" fillOpacity=".35" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6
          return (
            <circle
              key={i}
              cx={70 + Math.sin(a) * 42}
              cy={70 - Math.cos(a) * 42}
              r={i % 3 === 0 ? 3.4 : 2}
              fill="#a6e8c9"
            />
          )
        })}
        <path d="M70 70V38" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M70 70l24 14" stroke="#68d3a5" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="70" cy="70" r="5" fill="#fff" />
        <g transform="translate(28 138)">
          <rect width="84" height="26" rx="13" fill="#12a065" />
          <text x="42" y="18" fill="#fff" fontSize="12.5" fontWeight="800" textAnchor="middle" {...T}>
            SUNDAYS
          </text>
        </g>
      </g>

      <g transform="translate(34 388)" {...T}>
        <text y="14" fill="#8fc4ab" fontSize="13" fontWeight="600">March — November · marked the same week</text>
        <text y="50" fill="#ffffff" fontSize="28" fontWeight="800" letterSpacing="-1">Rs. 1,800</text>
        <text x="128" y="50" fill="#8fc4ab" fontSize="14" fontWeight="600">/ month</text>
      </g>
    </Poster>
  )
}

/* ================================================================== */

function ScholarshipFlyer() {
  return (
    <Poster id="fl-scholarship" label="Flyer: Gurukela merit scholarship, one hundred fully funded seats">
      <Grid />
      <circle cx="200" cy="196" r="128" fill="#2fbb80" fillOpacity=".13" />

      {/* medal */}
      <g transform="translate(200 176)">
        <path d="M-34 -78l20 52-24 8-18-46z" fill="#12a065" />
        <path d="M34 -78l-20 52 24 8 18-46z" fill="#0a6a41" />
        <circle cx="0" cy="16" r="60" fill="url(#fl-scholarship-mint)" />
        <circle cx="0" cy="16" r="48" fill="#063a26" />
        <circle cx="0" cy="16" r="42" fill="none" stroke="#a6e8c9" strokeWidth="2" strokeDasharray="4 6" />
        <text x="0" y="8" fill="#ffffff" fontSize="36" fontWeight="800" textAnchor="middle" letterSpacing="-1.5" {...T}>
          100
        </text>
        <text x="0" y="32" fill="#a6e8c9" fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="1.4" {...T}>
          SEATS
        </text>
      </g>

      <text x="200" y="298" fill="#ffffff" fontSize="34" fontWeight="800" textAnchor="middle" letterSpacing="-1.4" {...T}>
        MERIT SCHOLARSHIP
      </text>
      <text x="200" y="330" fill="#68d3a5" fontSize="17" fontWeight="700" textAnchor="middle" {...T}>
        A full year of classes, fully funded
      </text>

      <g transform="translate(48 356)" {...T}>
        {[
          ['1', 'Sit one aptitude paper'],
          ['2', 'Top 100 study free for a year'],
        ].map(([n, t], i) => (
          <g key={n} transform={`translate(0 ${i * 32})`}>
            <circle cx="12" cy="10" r="12" fill="#ffffff" fillOpacity=".16" />
            <text x="12" y="15" fill="#a6e8c9" fontSize="13" fontWeight="800" textAnchor="middle">{n}</text>
            <text x="34" y="15" fill="#d5f4e4" fontSize="15" fontWeight="600">{t}</text>
          </g>
        ))}
      </g>

      <text x="200" y="440" fill="#8fc4ab" fontSize="13.5" fontWeight="700" textAnchor="middle" letterSpacing=".6" {...T}>
        APPLICATIONS CLOSE 28 FEBRUARY
      </text>
    </Poster>
  )
}

/* ================================================================== */

function PaperFlyer() {
  return (
    <Poster id="fl-paper" label="Flyer: past paper marathon, twenty papers in ten weeks">
      {/* stacked papers */}
      <g transform="translate(214 78)">
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${i * 10} ${i * 14}) rotate(${5 - i * 3} 70 90)`}>
            <rect width="150" height="196" rx="10" fill="#ffffff" fillOpacity={0.94 - i * 0.16} />
            <path d="M22 34h106M22 56h84M22 78h96M22 100h68" stroke="#0a6a41" strokeWidth="5" strokeLinecap="round" opacity=".28" />
            <rect x="22" y="126" width="52" height="20" rx="10" fill="#12a065" opacity=".3" />
          </g>
        ))}
      </g>

      <text x="34" y="72" fill="#a6e8c9" fontSize="14" fontWeight="700" letterSpacing="3" {...T}>
        A/L 2026 SITTING
      </text>
      <text x="34" y="126" fill="#ffffff" fontSize="44" fontWeight="800" letterSpacing="-2" {...T}>
        PAST PAPER
      </text>
      <text x="34" y="168" fill="#68d3a5" fontSize="44" fontWeight="800" letterSpacing="-2" {...T}>
        MARATHON
      </text>

      <g transform="translate(34 210)">
        <rect width="164" height="94" rx="16" fill="#ffffff" fillOpacity=".12" stroke="#68d3a5" strokeOpacity=".45" />
        <text x="24" y="58" fill="#ffffff" fontSize="46" fontWeight="800" letterSpacing="-2" {...T}>20</text>
        <text x="86" y="42" fill="#a6e8c9" fontSize="15" fontWeight="700" {...T}>papers</text>
        <text x="86" y="64" fill="#a6e8c9" fontSize="15" fontWeight="700" {...T}>10 weeks</text>
        <text x="24" y="80" fill="#8fc4ab" fontSize="12.5" {...T}>question by question</text>
      </g>

      <g transform="translate(34 330)" {...T}>
        {['Marking scheme on screen', 'Weekends · 8.00 a.m.'].map((t, i) => (
          <g key={t} transform={`translate(0 ${i * 30})`}>
            <circle cx="10" cy="10" r="10" fill="#12a065" />
            <path d="m5.6 10.3 3 3 5.8-6.3" stroke="#fff" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="30" y="15" fill="#d5f4e4" fontSize="15" fontWeight="600">{t}</text>
          </g>
        ))}
        <text y="82" fill="#ffffff" fontSize="28" fontWeight="800" letterSpacing="-1">Rs. 3,200</text>
        <text x="130" y="82" fill="#8fc4ab" fontSize="14" fontWeight="600">/ month</text>
      </g>
    </Poster>
  )
}

/* ================================================================== */

function SeminarFlyer() {
  return (
    <Poster id="fl-seminar" label="Flyer: free island-wide chemistry seminar on 14 February">
      <circle cx="96" cy="410" r="170" fill="#2fbb80" fillOpacity=".12" />

      <g transform="translate(34 46)">
        <rect width="118" height="30" rx="15" fill="#ffffff" />
        <text x="59" y="20" fill="#085232" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="1.2" {...T}>
          FREE ENTRY
        </text>
      </g>

      <text x="34" y="134" fill="#ffffff" fontSize="46" fontWeight="800" letterSpacing="-2" {...T}>
        ISLAND-WIDE
      </text>
      <text x="34" y="180" fill="#68d3a5" fontSize="46" fontWeight="800" letterSpacing="-2" {...T}>
        SEMINAR
      </text>

      {/* date block */}
      <g transform="translate(258 210)">
        <rect width="112" height="118" rx="18" fill="#ffffff" />
        <path d="M0 18a18 18 0 0 1 18-18h76a18 18 0 0 1 18 18v16H0V18Z" fill="#12a065" />
        <text x="56" y="24" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="1.6" {...T}>
          FEBRUARY
        </text>
        <text x="56" y="86" fill="#063a26" fontSize="52" fontWeight="800" textAnchor="middle" letterSpacing="-2" {...T}>
          14
        </text>
        <text x="56" y="107" fill="#0a6a41" fontSize="13" fontWeight="700" textAnchor="middle" {...T}>
          2.00 p.m.
        </text>
      </g>

      {/* molecule — organic chemistry */}
      <g transform="translate(96 268)" stroke="#68d3a5" strokeWidth="3" fill="none">
        <path d="M0-42 36-21v42L0 42l-36-21v-42z" />
        <path d="M0-42v-22M36-21l20-12M36 21l20 12M0 42v22M-36 21l-20 12M-36-21l-20-12" strokeOpacity=".7" />
      </g>
      <g fill="#a6e8c9">
        {[[0, -42], [36, -21], [36, 21], [0, 42], [-36, 21], [-36, -21]].map(([x, y], i) => (
          <circle key={i} cx={96 + x} cy={268 + y} r="7" />
        ))}
      </g>

      <text x="34" y="372" fill="#ffffff" fontSize="24" fontWeight="800" letterSpacing="-.8" {...T}>
        Chemistry · Organic reactions
      </text>
      <text x="34" y="400" fill="#8fc4ab" fontSize="15" fontWeight="600" {...T}>
        Three hours with Rohana Wickramasinghe
      </text>
      <text x="34" y="424" fill="#8fc4ab" fontSize="14" {...T}>
        Streamed free · recording open for a week
      </text>
    </Poster>
  )
}

const FLYERS = {
  trial: TrialFlyer,
  theory: TheoryFlyer,
  revision: RevisionFlyer,
  scholarship: ScholarshipFlyer,
  paper: PaperFlyer,
  seminar: SeminarFlyer,
}

export default function Flyer({ art = 'trial' }) {
  const F = FLYERS[art] || TrialFlyer
  return <F />
}
