/**
 * Result posters — the congratulations cards that ride the auto-scrolling
 * rail on the home page.
 *
 * Five layouts, picked by `variant`, all drawn from the same green/white
 * system as the campaign flyers. Photographs are the illustrated Portrait,
 * so a card needs no uploaded image to look finished.
 */

import Portrait from './Portrait.jsx'
import { Medal } from './Decor.jsx'
import { Star } from './Icons.jsx'

/** Faint diagonal rays behind the dark variants. */
function Rays() {
  return (
    <svg className="gk-result__rays" viewBox="0 0 300 580" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M150 210 L${-120 + i * 90} -40 L${-60 + i * 90} -40 Z`} fill="#68d3a5" fillOpacity=".07" />
      ))}
    </svg>
  )
}

/** The laurel-and-ribbon plate the rank sits on. */
function RankPlate({ rank, tone }) {
  return (
    <div className="gk-result__plate">
      <Medal tone={tone} label={rank} size={58} />
      <span className="gk-result__rank">{rank}</span>
    </div>
  )
}

function Crest({ exam, year }) {
  return (
    <div className="gk-result__crest">
      <span>{exam}</span>
      <b>{year}</b>
    </div>
  )
}

function Foot() {
  return (
    <div className="gk-result__foot">
      <span className="gk-result__brand">Gurukela</span>
      <span>gurukela.lk</span>
    </div>
  )
}

/* ================================================================== */

function Island(r) {
  return (
    <article className="gk-result gk-result--dark" aria-hidden={r.duplicate || undefined}>
      <Rays />
      <div className="gk-result__body">
        <Crest exam={r.exam} year={r.year} />

        <div className="gk-result__photo">
          <Portrait id={r.id + r.name} name={r.name} />
        </div>

        <h3 className="gk-result__name">{r.name}</h3>
        <p className="gk-result__meta">
          Index {r.index} · {r.district}
        </p>
        <p className="gk-result__stream">{r.stream}</p>

        <RankPlate rank={r.rank} tone={r.tone} />
      </div>
      <Foot />
    </article>
  )
}

/* ================================================================== */

function District(r) {
  return (
    <article className="gk-result gk-result--mint" aria-hidden={r.duplicate || undefined}>
      <div className="gk-result__body">
        <Crest exam={r.exam} year={r.year} />

        <div className="gk-result__photo gk-result__photo--ring">
          <Portrait id={r.id + r.name} name={r.name} />
        </div>

        <span className="gk-result__ribbon">{r.rank}</span>
        <h3 className="gk-result__name">{r.name}</h3>
        <p className="gk-result__meta">{r.district} District</p>
        <p className="gk-result__stream">{r.stream}</p>
        <span className="gk-result__pill">{r.subject}</span>

        <p className="gk-result__congrats">Congratulations</p>
      </div>
      <Foot />
    </article>
  )
}

/* ================================================================== */

function Grades(r) {
  return (
    <article className="gk-result gk-result--paper" aria-hidden={r.duplicate || undefined}>
      <div className="gk-result__body gk-result__body--top">
        <div className="gk-result__head">
          <span className="gk-result__avatar">
            <Portrait id={r.id + r.name} name={r.name} />
          </span>
          <div>
            <h3 className="gk-result__name gk-result__name--sm">{r.name}</h3>
            <p className="gk-result__meta">
              {r.exam} {r.year}
            </p>
            <p className="gk-result__meta">Index {r.index}</p>
          </div>
        </div>

        <span className="gk-result__note">{r.note}</span>

        <ul className="gk-result__grades">
          {r.grades.map(([subject, grade]) => (
            <li key={subject}>
              <span>{subject}</span>
              <b>{grade}</b>
            </li>
          ))}
        </ul>

        <div className="gk-result__z">
          <span>Z-score</span>
          <b>{r.zScore}</b>
        </div>

        <p className="gk-result__stream">
          {r.stream} · {r.district}
        </p>
      </div>
      <Foot />
    </article>
  )
}

/* ================================================================== */

function Toppers(r) {
  return (
    <article className="gk-result gk-result--paper" aria-hidden={r.duplicate || undefined}>
      <div className="gk-result__banner">
        <b>{r.title}</b>
        <span>
          {r.exam} {r.year}
        </span>
      </div>
      <div className="gk-result__body gk-result__body--top">
        <p className="gk-result__subtitle">{r.subtitle}</p>
        <div className="gk-result__grid">
          {r.people.map((p) => (
            <div className="gk-result__cell" key={p.rank + p.name}>
              <span className="gk-result__cellPhoto">
                <Portrait id={r.id + p.name} name={p.name} />
                <b>{p.rank}</b>
              </span>
              <span className="gk-result__cellName">{p.name}</span>
              <span className="gk-result__cellPlace">{p.district}</span>
            </div>
          ))}
        </div>
      </div>
      <Foot />
    </article>
  )
}

/* ================================================================== */

function Ol(r) {
  return (
    <article className="gk-result gk-result--mint" aria-hidden={r.duplicate || undefined}>
      <div className="gk-result__body">
        <Crest exam={r.exam} year={r.year} />

        <div className="gk-result__huge">
          {r.passes}
          <span aria-hidden="true">
            <Star size={22} />
          </span>
        </div>

        <div className="gk-result__photo gk-result__photo--ring">
          <Portrait id={r.id + r.name} name={r.name} />
        </div>

        <h3 className="gk-result__name">{r.name}</h3>
        <p className="gk-result__meta">{r.district} District</p>
        <p className="gk-result__stream">{r.detail}</p>
      </div>
      <Foot />
    </article>
  )
}

/* ================================================================== */

function Batch(r) {
  return (
    <article className="gk-result gk-result--dark gk-result--stat" aria-hidden={r.duplicate || undefined}>
      <Rays />
      <div className="gk-result__body">
        <Crest exam={r.exam} year={r.year} />
        <div className="gk-result__stat">{r.stat}</div>
        <p className="gk-result__label">{r.label}</p>
        <p className="gk-result__detail">{r.detail}</p>
      </div>
      <Foot />
    </article>
  )
}

const VARIANTS = { island: Island, district: District, grades: Grades, toppers: Toppers, ol: Ol, batch: Batch }

/** `duplicate` marks the second copy the rail renders to close its loop, so a
 *  screen reader reads each result once rather than twice. */
export default function ResultCard({ result, duplicate }) {
  const V = VARIANTS[result.variant] || Island
  return <V {...result} duplicate={duplicate} />
}
