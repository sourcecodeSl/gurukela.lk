/**
 * Decorative Colombo skyline for the footer — a single-weight line sketch
 * (Lotus Tower, the twin trade-centre towers, a dagoba, the colonial
 * parliament block, cranes and a couple of aircraft) drawn in the brand green.
 *
 * Purely ornamental: `aria-hidden`, no fills that could swallow footer text,
 * and every stroke inherits `currentColor` so the footer decides the tint.
 */

/** Evenly spaced window lights inside a building box. */
function Windows({ x, y, w, h, cols, rows }) {
  const gx = w / (cols * 2 + 1)
  const gy = h / (rows * 2 + 1)
  const cells = []
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      cells.push(
        <rect
          key={`${c}-${r}`}
          x={x + gx * (1 + c * 2)}
          y={y + gy * (1 + r * 2)}
          width={gx}
          height={gy}
        />
      )
    }
  }
  return <g className="gk-sky__win">{cells}</g>
}

/** Floor bands on a tower — cheaper to read than a full window grid. */
function Floors({ x, y, w, h, count }) {
  const step = h / (count + 1)
  return (
    <g className="gk-sky__win">
      {Array.from({ length: count }, (_, i) => (
        <line key={i} x1={x} y1={y + step * (i + 1)} x2={x + w} y2={y + step * (i + 1)} />
      ))}
    </g>
  )
}

/** Small aircraft glyph, because the reference sketch has them overhead. */
function Plane({ x, y, s = 1, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 L26 -5 L34 -3 L30 0 L34 3 L26 5 Z" />
      <path d="M12 -4 L6 -14 L10 -14 L20 -4" />
      <path d="M12 4 L6 14 L10 14 L20 4" />
    </g>
  )
}

export default function Skyline({ className = '' }) {
  return (
    <svg
      className={`gk-sky ${className}`.trim()}
      viewBox="0 0 1600 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className="gk-sky__ink">
        {/* ---- sky ---- */}
        <g className="gk-sky__air">
          <Plane x={120} y={54} s={1.1} />
          <Plane x={1470} y={44} s={0.9} flip />
          <path d="M700 40q10-8 20 0" />
          <path d="M726 52q8-6 16 0" />
        </g>

        {/* ---- left low blocks ---- */}
        <path d="M0 300V196h74v104" />
        <Windows x={0} y={196} w={74} h={96} cols={3} rows={4} />
        <path d="M84 300V150h56v150M112 150v-22" />
        <Windows x={84} y={150} w={56} h={142} cols={2} rows={6} />

        {/* ---- dagoba ---- */}
        <g>
          <path d="M158 300v-14h84v14" />
          <path d="M166 286a34 34 0 0 1 68 0" />
          <path d="M192 252h16v-14h-16z" />
          <path d="M200 238v-24" />
          <path d="M174 268h52" />
        </g>

        {/* ---- twin trade towers ---- */}
        <path d="M268 300V96l14-14h34v218" />
        <Floors x={268} y={96} w={48} h={200} count={9} />
        <path d="M326 300V116l14-14h34v198" />
        <Floors x={326} y={116} w={48} h={180} count={8} />

        {/* ---- Lotus Tower ---- */}
        <g className="gk-sky__hero">
          <path d="M396 300l14-86h20l14 86" />
          <path d="M410 214c-30-34-30-74 10-104 40 30 40 70 10 104" />
          <path d="M394 176q26 16 52 0" />
          <path d="M400 154q20 12 40 0" />
          <path d="M420 110V52" />
          <path d="M414 300h12" />
        </g>

        {/* ---- stepped block ---- */}
        <path d="M466 300V186h38v-16h30v130" />
        <Windows x={466} y={186} w={38} h={106} cols={2} rows={4} />
        <Windows x={504} y={170} w={30} h={122} cols={2} rows={5} />

        {/* ---- colonial parliament ---- */}
        <g>
          <path d="M556 300v-64h188v64" />
          <path d="M556 236l94-30 94 30" />
          <path d="M614 206a36 36 0 0 1 72 0" />
          <path d="M650 170v-18" />
          <path d="M580 300v-52M606 300v-52M632 300v-52M658 300v-52M684 300v-52M710 300v-52" />
          <path d="M556 252h188" />
        </g>

        {/* ---- tapered tower + leaning tower ---- */}
        <path d="M768 300V88l12-16h30l12 16v212" />
        <Floors x={768} y={88} w={54} h={208} count={10} />
        <path d="M795 72V38" />
        <path d="M852 300c0-84 14-140 34-186h44v186" />
        <Floors x={856} y={140} w={74} h={156} count={7} />

        {/* ---- mid blocks ---- */}
        <path d="M946 300V204h72v96" />
        <Windows x={946} y={204} w={72} h={88} cols={3} rows={4} />

        {/* ---- spire ---- */}
        <g>
          <path d="M1030 300v-70h44v70" />
          <path d="M1030 230l22-46 22 46" />
          <path d="M1052 184v-22M1044 170h16" />
        </g>

        {/* ---- right towers ---- */}
        <path d="M1086 300V136h64v164" />
        <Floors x={1086} y={136} w={64} h={160} count={8} />
        <path d="M1166 300V190h48v110M1190 190v-16" />
        <Windows x={1166} y={190} w={48} h={102} cols={2} rows={4} />
        <path d="M1226 300V166h50v134" />
        <Windows x={1226} y={166} w={50} h={126} cols={2} rows={5} />

        {/* ---- long block ---- */}
        <path d="M1296 300V224h96v76" />
        <Windows x={1296} y={224} w={96} h={68} cols={4} rows={3} />

        {/* ---- tower + crane ---- */}
        <path d="M1404 300V148h54v152" />
        <Floors x={1404} y={148} w={54} h={148} count={7} />
        <g>
          <path d="M1494 300V128" />
          <path d="M1446 142h124" />
          <path d="M1494 128l40 14M1494 128l-34 14" />
          <path d="M1530 142v26" />
        </g>
        <path d="M1500 300v-52h100v52" />
        <Windows x={1500} y={248} w={100} h={44} cols={4} rows={2} />

        {/* ---- ground ---- */}
        <path className="gk-sky__ground" d="M0 300h1600" />
      </g>
    </svg>
  )
}
