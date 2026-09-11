import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Modal } from '../../components/ui.jsx'
import { useCountdown, fmtCountdown } from '../../lib/useCountdown.js'
import { Layers, Clock, Award, Check, X } from '../../components/icons.jsx'

/**
 * Shown on a registered student's seminar card. Polls the seminar's MCQ tests
 * and surfaces a "Take test" button while one is live, or "View results" once
 * it has ended. Opens the live test / results in a modal.
 */
export default function SeminarQuiz({ seminarId }) {
  const [quizzes, setQuizzes] = useState([])
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      setQuizzes(await api.get(`/quizzes?seminarId=${seminarId}`))
    } catch {
      /* not registered / transient — leave the list as-is */
    }
  }, [seminarId])

  // Poll so a test the lecturer starts appears without a page refresh.
  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const active = quizzes.filter((q) => q.status === 'active')
  const ended = quizzes.filter((q) => q.status === 'ended')
  if (active.length === 0 && ended.length === 0) return null

  return (
    <>
      <div className="col" style={{ gap: 6 }}>
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
  useEffect(() => {
    if (taking && left === 0) submit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, taking])

  const questions = quiz?.questions || []
  const answeredCount = questions.filter((q) => answers[q.id] != null).length

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
        <p className="small muted">Loading…</p>
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
      {questions.map((q, i) => (
        <Card key={q.id} className="col" style={{ gap: 12 }}>
          <strong style={{ lineHeight: 1.4 }}>{i + 1}. {q.text}</strong>
          <div className="col" style={{ gap: 8 }}>
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi
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
                    type="radio"
                    name={q.id}
                    checked={selected}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  />
                  <span style={{ color: selected ? 'var(--accent)' : undefined, fontWeight: selected ? 600 : undefined }}>{opt}</span>
                </label>
              )
            })}
          </div>
        </Card>
      ))}
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
          const mineIdx = myAnswers[q.id]
          return (
            <Card key={q.id} className="col" style={{ gap: 8 }}>
              <strong>{i + 1}. {q.text}</strong>
              <div className="col" style={{ gap: 4 }}>
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex
                  const isMine = oi === mineIdx
                  return (
                    <span
                      key={oi}
                      className={`small row ${isCorrect ? 'bold' : ''}`}
                      style={{ gap: 6, alignItems: 'center', color: isCorrect ? 'var(--success)' : isMine ? 'var(--danger)' : 'var(--text-muted)' }}
                    >
                      {isCorrect ? <Check width={14} height={14} /> : isMine ? <X width={14} height={14} /> : <span style={{ width: 14 }} />}
                      {opt}
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
