import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Modal, SkeletonText } from '../../components/ui.jsx'
import { useCountdown, fmtCountdown } from '../../lib/useCountdown.js'
import { Layers, Clock, Award, Check, X } from '../../components/icons.jsx'

// Format a stored wall-clock time ("YYYY-MM-DD HH:MM:SS") for display.
const fmtWhen = (s) =>
  s
    ? new Date(String(s).replace(' ', 'T')).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

/**
 * Shown on a student's seminar card or booked 1-on-1 slot. Polls that entity's
 * MCQ tests and surfaces a "Take test" button while one is live, or "View
 * results" once it has ended. Pass either `seminarId` or `slotId`.
 */
export default function SeminarQuiz({ seminarId, slotId }) {
  const [quizzes, setQuizzes] = useState([])
  const [openId, setOpenId] = useState(null)

  const listQuery = seminarId ? `seminarId=${seminarId}` : `slotId=${slotId}`

  const load = useCallback(async () => {
    try {
      setQuizzes(await api.get(`/quizzes?${listQuery}`))
    } catch {
      /* not registered / transient — leave the list as-is */
    }
  }, [listQuery])

  // Poll so a test the lecturer starts appears without a page refresh.
  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const active = quizzes.filter((q) => q.status === 'active')
  const scheduled = quizzes.filter((q) => q.status === 'scheduled')
  const ended = quizzes.filter((q) => q.status === 'ended')
  if (active.length === 0 && scheduled.length === 0 && ended.length === 0) return null

  return (
    <>
      <div className="col" style={{ gap: 6 }}>
        {scheduled.map((q) => (
          <div key={q.id} className="row" style={{ gap: 6, alignItems: 'center' }}>
            <Badge tone="warning"><Clock width={12} height={12} /> Test soon</Badge>
            <span className="tiny muted">{q.title} · starts {fmtWhen(q.scheduledAt)}</span>
          </div>
        ))}
        {active.map((q) => (
          <button key={q.id} className="btn btn-primary btn-sm" onClick={() => setOpenId(q.id)}>
            <Layers width={14} height={14} /> Take test: {q.title}
          </button>
        ))}
        {ended.map((q) => (
          <button key={q.id} className="btn btn-outline btn-sm" onClick={() => setOpenId(q.id)}>
            <Award width={14} height={14} /> Results: {q.title}
          </button>
        ))}
      </div>

      {openId && (
        <QuizTaker
          quizId={openId}
          onClose={() => {
            setOpenId(null)
            load()
          }}
          onChanged={load}
        />
      )}
    </>
  )
}

function QuizTaker({ quizId, onClose, onChanged }) {
  const { toast } = useApp()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const q = await api.get(`/quizzes/${quizId}`)
      setQuiz(q)
      return q
    } catch (e) {
      toast(e.message || 'Could not load the test', 'err')
    }
  }, [quizId, toast])

  useEffect(() => {
    load()
  }, [load])

  const alreadySubmitted = !!quiz?.mine
  const isActive = quiz?.status === 'active'
  const waiting = isActive && alreadySubmitted // submitted, awaiting the shared timer
  const taking = !!quiz && isActive && !alreadySubmitted

  // Poll while the test is live (or we're waiting on results) to catch the end.
  useEffect(() => {
    if (!quiz || quiz.status === 'ended') return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [quiz, load])

  const submit = useCallback(
    async (auto = false) => {
      setSubmitting(true)
      try {
        await api.post(`/quizzes/${quizId}/submit`, { answers })
        if (!auto) toast('Answers submitted — results appear when the timer ends')
        onChanged?.()
        await load()
      } catch (e) {
        // On auto-submit the window may have just closed; that's fine.
        if (!auto) toast(e.message || 'Could not submit', 'err')
        await load()
      } finally {
        setSubmitting(false)
      }
    },
    [answers, quizId, toast, onChanged, load]
  )

  // Countdown + auto-submit live here so the timer and Submit button can sit in
  // the modal's pinned footer, staying visible however long the question list is.
  const left = useCountdown(taking ? quiz.secondsLeft : null)
  // Only auto-submit once the countdown has actually been running. On the render
  // where the quiz first loads, useCountdown returns a stale 0 (its real value
  // lands a tick later) — without this guard that momentary 0 would instantly
  // submit an empty sheet and lock the student out of answering.
  const armed = useRef(false)
  useEffect(() => {
    if (!taking) {
      armed.current = false
      return
    }
    if (left > 0) armed.current = true
    else if (left === 0 && armed.current) submit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, taking])

  const questions = quiz?.questions || []
  const answeredCount = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length

  const takeFooter = taking ? (
    <>
      <span
        className="row bold"
        style={{ gap: 6, marginRight: 'auto', fontVariantNumeric: 'tabular-nums', color: left <= 10 ? 'var(--danger)' : undefined }}
      >
        <Clock width={16} height={16} /> {fmtCountdown(left)}
      </span>
      <span className="small muted">{answeredCount}/{questions.length} answered</span>
      <button className="btn btn-primary" disabled={submitting} onClick={() => submit(false)}>
        <Check width={16} height={16} /> Submit answers
      </button>
    </>
  ) : null

  return (
    <Modal
      open
      onClose={onClose}
      width={620}
      title={quiz?.title || 'MCQ test'}
      subtitle={quiz?.status === 'ended' ? 'Results' : isActive ? 'Answer before the timer runs out' : ''}
      footer={takeFooter}
    >
      {!quiz ? (
        <SkeletonText lines={5} />
      ) : quiz.status === 'ended' ? (
        <StudentResults quiz={quiz} />
      ) : waiting ? (
        <WaitingScreen quiz={quiz} />
      ) : (
        <TakeScreen quiz={quiz} answers={answers} setAnswers={setAnswers} />
      )}
    </Modal>
  )
}

/* --- taking --- */

function TakeScreen({ quiz, answers, setAnswers }) {
  const questions = quiz.questions || []

  return (
    <div className="col" style={{ gap: 14 }}>
      {questions.map((q, i) => {
        const multi = !!q.multiSelect
        const chosen = answers[q.id] || []
        const pick = (oi) =>
          setAnswers((a) => {
            const cur = a[q.id] || []
            if (multi) {
              // Toggle within the set for multi-answer questions.
              const next = cur.includes(oi) ? cur.filter((v) => v !== oi) : [...cur, oi].sort((x, y) => x - y)
              return { ...a, [q.id]: next }
            }
            return { ...a, [q.id]: [oi] }
          })
        return (
        <Card key={q.id} className="col" style={{ gap: 12 }}>
          <strong style={{ lineHeight: 1.4 }}>{i + 1}. {q.text}</strong>
          {multi && <span className="tiny faint">Select all that apply</span>}
          {q.imageUrl && <img src={q.imageUrl} alt="" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, alignSelf: 'flex-start' }} />}
          <div className="col" style={{ gap: 8 }}>
            {q.options.map((opt, oi) => {
              const selected = chosen.includes(oi)
              return (
                <label
                  key={oi}
                  className="row"
                  style={{
                    gap: 10,
                    cursor: 'pointer',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected ? 'var(--accent-soft)' : 'transparent',
                    transition: 'background .12s ease, border-color .12s ease',
                  }}
                >
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={q.id}
                    checked={selected}
                    onChange={() => pick(oi)}
                  />
                  {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ height: 48, maxWidth: 120, objectFit: 'cover', borderRadius: 6 }} />}
                  {opt.text && <span style={{ color: selected ? 'var(--accent)' : undefined, fontWeight: selected ? 600 : undefined }}>{opt.text}</span>}
                </label>
              )
            })}
          </div>
        </Card>
        )
      })}
    </div>
  )
}

function WaitingScreen({ quiz }) {
  const left = useCountdown(quiz.secondsLeft)
  return (
    <div className="col" style={{ gap: 12, alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
      <Badge tone="success"><Check width={12} height={12} /> Submitted</Badge>
      <p className="small muted">Your answers are in. Results are shown to everyone when the timer ends.</p>
      <div className="row bold" style={{ gap: 6, fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>
        <Clock width={22} height={22} /> {fmtCountdown(left)}
      </div>
    </div>
  )
}

/* --- results --- */

function StudentResults({ quiz }) {
  const { session } = useApp()
  const questions = quiz.questions || []
  const subs = quiz.results?.submissions || []
  const mine = useMemo(() => subs.find((s) => s.studentId === session.id) || quiz.mine, [subs, quiz.mine, session.id])
  const myAnswers = mine?.answers || {}

  return (
    <div className="col" style={{ gap: 16 }}>
      {mine ? (
        <Card className="col" style={{ gap: 4, alignItems: 'center', textAlign: 'center' }}>
          <span className="small muted">Your score</span>
          <span style={{ fontSize: 40, fontWeight: 700 }}>{mine.score}<span className="muted" style={{ fontSize: 22 }}>/{mine.total}</span></span>
        </Card>
      ) : (
        <Card><p className="small muted" style={{ textAlign: 'center' }}>You did not submit answers for this test.</p></Card>
      )}

      {/* Answer review */}
      <div className="col" style={{ gap: 10 }}>
        <span className="small bold">Answer review</span>
        {questions.map((q, i) => {
          const correctIdxs = Array.isArray(q.correctIndexes) ? q.correctIndexes : q.correctIndex != null ? [q.correctIndex] : []
          const mineIdxs = Array.isArray(myAnswers[q.id]) ? myAnswers[q.id] : myAnswers[q.id] != null ? [myAnswers[q.id]] : []
          return (
            <Card key={q.id} className="col" style={{ gap: 8 }}>
              <strong>{i + 1}. {q.text}</strong>
              {q.multiSelect && <span className="tiny faint">Select all that apply</span>}
              {q.imageUrl && <img src={q.imageUrl} alt="" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, alignSelf: 'flex-start' }} />}
              <div className="col" style={{ gap: 4 }}>
                {q.options.map((opt, oi) => {
                  const isCorrect = correctIdxs.includes(oi)
                  const isMine = mineIdxs.includes(oi)
                  return (
                    <span
                      key={oi}
                      className={`small row ${isCorrect ? 'bold' : ''}`}
                      style={{ gap: 6, alignItems: 'center', color: isCorrect ? 'var(--success)' : isMine ? 'var(--danger)' : 'var(--text-muted)' }}
                    >
                      {isCorrect ? <Check width={14} height={14} /> : isMine ? <X width={14} height={14} /> : <span style={{ width: 14 }} />}
                      {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ height: 34, maxWidth: 80, objectFit: 'cover', borderRadius: 5 }} />}
                      {opt.text}
                      {isMine && !isCorrect && <span className="tiny faint">(your answer)</span>}
                    </span>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Leaderboard */}
      {subs.length > 0 && (
        <div className="col" style={{ gap: 6 }}>
          <span className="small bold row" style={{ gap: 6 }}><Award width={15} height={15} /> Leaderboard</span>
          {subs.map((s, i) => (
            <Card key={s.id} className="row" style={{ gap: 10, alignItems: 'center', ...(s.studentId === session.id ? { outline: '1px solid var(--accent)' } : {}) }}>
              <span className="tiny faint" style={{ width: 22 }}>#{i + 1}</span>
              <span style={{ flex: 1 }}>{s.studentName}{s.studentId === session.id ? ' (you)' : ''}</span>
              <Badge tone={s.score === s.total ? 'success' : s.score === 0 ? 'danger' : ''}>{s.score}/{s.total}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
