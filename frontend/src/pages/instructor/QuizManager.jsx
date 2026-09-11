import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { useCountdown, fmtCountdown } from '../../lib/useCountdown.js'
import { Plus, Trash, Edit, Check, Clock, Users, Award, X, Layers } from '../../components/icons.jsx'

/**
 * Instructor MCQ control panel for a single seminar.
 *   draft  → build questions, mark the correct option, then Start
 *   active → shared countdown + live submission count, End early
 *   ended  → leaderboard of every student's score
 */
export default function QuizManager({ seminar, onClose }) {
  const { toast, confirm } = useApp()
  const [quizzes, setQuizzes] = useState(null)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      setQuizzes(await api.get(`/quizzes?seminarId=${seminar.id}`))
    } catch (e) {
      toast(e.message || 'Failed to load tests', 'err')
    }
  }, [seminar.id, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Modal
      open
      onClose={onClose}
      width={720}
      title={openId ? 'MCQ test' : 'MCQ tests'}
      subtitle={seminar.title}
    >
      {openId ? (
        <QuizEditor
          quizId={openId}
          onBack={() => {
            setOpenId(null)
            load()
          }}
        />
      ) : (
        <QuizList
          quizzes={quizzes}
          onOpen={setOpenId}
          onCreate={async (payload) => {
            const q = await api.post('/quizzes', { seminarId: seminar.id, ...payload })
            await load()
            setOpenId(q.id)
          }}
          onDelete={async (q) => {
            if (!(await confirm({ title: 'Delete test?', text: `“${q.title}” and its questions will be removed.`, confirmText: 'Delete' }))) return
            await api.del(`/quizzes/${q.id}`)
            toast('Test removed', 'err')
            load()
          }}
        />
      )}
    </Modal>
  )
}

/* ------------------------------- list ------------------------------- */

const STATUS_TONE = { draft: '', active: 'success', ended: 'accent' }
const STATUS_LABEL = { draft: 'Draft', active: 'Live now', ended: 'Ended' }

function QuizList({ quizzes, onOpen, onCreate, onDelete }) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [mins, setMins] = useState(10)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      await onCreate({ title: title.trim(), durationSecs: Math.max(1, Number(mins)) * 60 })
      setTitle('')
      setMins(10)
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row">
        <p className="small muted" style={{ flex: 1 }}>
          Build a quiz, mark the correct answers, then start it live. Registered students take it while the timer runs; when time is up everyone sees the results.
        </p>
        {!creating && (
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            <Plus width={15} height={15} /> New test
          </button>
        )}
      </div>

      {creating && (
        <Card className="col" style={{ gap: 12 }}>
          <Field label="Test title">
            <input className="input" placeholder="e.g. Quick revision quiz" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="Time limit (minutes)" hint="The shared countdown once you start the test.">
            <input className="input" type="number" min="1" value={mins} onChange={(e) => setMins(e.target.value)} />
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={!title.trim() || busy} onClick={submit}>Create</button>
          </div>
        </Card>
      )}

      {quizzes == null ? (
        <p className="small muted">Loading…</p>
      ) : quizzes.length === 0 && !creating ? (
        <Empty icon={Layers} title="No tests yet">Create an MCQ test for this seminar.</Empty>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {quizzes.map((q) => (
            <Card key={q.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
              <div className="col" style={{ flex: 1, gap: 4 }}>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <strong>{q.title}</strong>
                  <Badge tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Badge>
                </div>
                <span className="tiny faint row" style={{ gap: 10 }}>
                  <span className="row" style={{ gap: 4 }}><Layers width={12} height={12} />{q.questionCount ?? 0} questions</span>
                  <span className="row" style={{ gap: 4 }}><Clock width={12} height={12} />{Math.round(q.durationSecs / 60)} min</span>
                  {q.status !== 'draft' && <span className="row" style={{ gap: 4 }}><Users width={12} height={12} />{q.submissionCount ?? 0} submitted</span>}
                </span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => onOpen(q.id)}>
                {q.status === 'draft' ? <><Edit width={14} height={14} /> Build</> : q.status === 'active' ? 'Control' : <><Award width={14} height={14} /> Results</>}
              </button>
              {q.status === 'draft' && (
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(q)}><Trash width={14} height={14} /></button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ editor ------------------------------ */

function QuizEditor({ quizId, onBack }) {
  const { toast } = useApp()
  const [quiz, setQuiz] = useState(null)

  const load = useCallback(async () => {
    try {
      setQuiz(await api.get(`/quizzes/${quizId}`))
    } catch (e) {
      toast(e.message || 'Failed to load test', 'err')
    }
  }, [quizId, toast])

  useEffect(() => {
    load()
  }, [load])

  // While live, poll so the submission count / auto-end stays current.
  useEffect(() => {
    if (quiz?.status !== 'active') return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [quiz?.status, load])

  if (!quiz) return <p className="small muted">Loading…</p>

  return (
    <div className="col" style={{ gap: 14 }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <X width={14} height={14} /> Back to tests
      </button>
      {quiz.status === 'draft' && <DraftEditor quiz={quiz} reload={load} onStarted={load} />}
      {quiz.status === 'active' && <LiveControl quiz={quiz} reload={load} />}
      {quiz.status === 'ended' && <Results quiz={quiz} />}
    </div>
  )
}

/* --- draft: add/edit questions + start --- */

const blankQ = { text: '', options: ['', '', '', ''], correctIndex: 0 }

function DraftEditor({ quiz, reload, onStarted }) {
  const { toast, confirm } = useApp()
  const [editing, setEditing] = useState(null) // question being added/edited
  const questions = quiz.questions || []

  const saveQuestion = async (payload) => {
    try {
      if (editing.id) await api.put(`/quizzes/${quiz.id}/questions/${editing.id}`, payload)
      else await api.post(`/quizzes/${quiz.id}/questions`, payload)
      setEditing(null)
      reload()
    } catch (e) {
      toast(e.message || 'Could not save question', 'err')
    }
  }

  const start = async () => {
    if (!(await confirm({ title: 'Start the test?', text: `The ${Math.round(quiz.durationSecs / 60)}-minute timer starts now and students can begin answering. You cannot edit questions after this.`, confirmText: 'Start now' }))) return
    try {
      await api.post(`/quizzes/${quiz.id}/activate`)
      toast('Test is live!')
      onStarted()
    } catch (e) {
      toast(e.message || 'Could not start', 'err')
    }
  }

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <div className="col" style={{ flex: 1 }}>
          <strong>{quiz.title}</strong>
          <span className="tiny faint">{questions.length} question{questions.length === 1 ? '' : 's'} · {Math.round(quiz.durationSecs / 60)} min limit</span>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => setEditing({ ...blankQ })}><Plus width={14} height={14} /> Add question</button>
        <button className="btn btn-sm btn-primary" disabled={questions.length === 0} onClick={start}>Start test</button>
      </div>

      {questions.length === 0 ? (
        <Empty icon={Layers} title="No questions yet">Add MCQ questions and mark the correct option.</Empty>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {questions.map((qq, i) => (
            <Card key={qq.id} className="col" style={{ gap: 8 }}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                <strong style={{ flex: 1 }}>{i + 1}. {qq.text}</strong>
                <button className="btn btn-sm btn-outline" onClick={() => setEditing(qq)}><Edit width={13} height={13} /></button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    if (!(await confirm({ title: 'Remove question?', confirmText: 'Remove' }))) return
                    await api.del(`/quizzes/${quiz.id}/questions/${qq.id}`)
                    reload()
                  }}
                ><Trash width={13} height={13} /></button>
              </div>
              <div className="col" style={{ gap: 4 }}>
                {qq.options.map((opt, oi) => (
                  <span key={oi} className={`small row ${oi === qq.correctIndex ? 'bold' : 'muted'}`} style={{ gap: 6 }}>
                    {oi === qq.correctIndex ? <Check width={13} height={13} style={{ color: 'var(--success)' }} /> : <span style={{ width: 13 }} />}
                    {opt}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <QuestionModal value={editing} onClose={() => setEditing(null)} onSubmit={saveQuestion} />
      )}
    </>
  )
}

function QuestionModal({ value, onClose, onSubmit }) {
  const [text, setText] = useState(value.text)
  const [options, setOptions] = useState(value.options.length ? value.options : ['', ''])
  const [correctIndex, setCorrectIndex] = useState(value.correctIndex ?? 0)
  const [busy, setBusy] = useState(false)

  const setOpt = (i) => (e) => setOptions(options.map((o, oi) => (oi === i ? e.target.value : o)))
  const addOpt = () => setOptions([...options, ''])
  const removeOpt = (i) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, oi) => oi !== i))
    if (correctIndex >= options.length - 1) setCorrectIndex(0)
  }
  const valid = text.trim() && options.filter((o) => o.trim()).length >= 2 && options[correctIndex]?.trim()

  return (
    <Modal
      open
      onClose={onClose}
      width={520}
      title={value.id ? 'Edit question' : 'Add question'}
      subtitle="Tick the circle next to the correct answer."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid || busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onSubmit({ text: text.trim(), options: options.map((o) => o.trim()).filter(Boolean), correctIndex })
              } finally {
                setBusy(false)
              }
            }}
          >
            {value.id ? 'Save' : 'Add question'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Question">
          <textarea className="textarea" placeholder="Type the question…" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="Answer options" hint="Select the correct one.">
          <div className="col" style={{ gap: 8 }}>
            {options.map((opt, i) => (
              <div key={i} className="row" style={{ gap: 8, alignItems: 'center' }}>
                <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} title="Correct answer" />
                <input className="input" style={{ flex: 1 }} placeholder={`Option ${i + 1}`} value={opt} onChange={setOpt(i)} />
                {options.length > 2 && (
                  <button className="btn btn-sm btn-ghost" onClick={() => removeOpt(i)}><X width={13} height={13} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }} onClick={addOpt}><Plus width={12} height={12} /> Add option</button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}

/* --- active: live control --- */

function LiveControl({ quiz, reload }) {
  const { toast, confirm } = useApp()
  const left = useCountdown(quiz.secondsLeft)

  useEffect(() => {
    if (left === 0) reload()
  }, [left, reload])

  const end = async () => {
    if (!(await confirm({ title: 'End the test now?', text: 'Results will be shown to all students immediately.', confirmText: 'End & show results' }))) return
    try {
      await api.post(`/quizzes/${quiz.id}/end`)
      toast('Test ended — results published')
      reload()
    } catch (e) {
      toast(e.message || 'Could not end', 'err')
    }
  }

  return (
    <Card className="col" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <Badge tone="success">Live now</Badge>
      <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
        <Clock width={22} height={22} />
        <span style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(left)}</span>
      </div>
      <p className="small muted">{quiz.title} · {(quiz.questions || []).length} questions</p>
      <div className="row" style={{ gap: 6, alignItems: 'center' }}>
        <Users width={16} height={16} /> <strong>{quiz.submissionCount ?? 0}</strong> <span className="small muted">students submitted</span>
      </div>
      <button className="btn btn-danger" onClick={end}>End now &amp; show results</button>
      <span className="tiny faint">Results are revealed automatically when the timer hits zero.</span>
    </Card>
  )
}

/* --- ended: results --- */

function Results({ quiz }) {
  const subs = quiz.submissions || []
  const total = (quiz.questions || []).length
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <div className="col" style={{ flex: 1 }}>
          <strong>{quiz.title}</strong>
          <span className="tiny faint">Ended · {subs.length} submission{subs.length === 1 ? '' : 's'} · out of {total}</span>
        </div>
        <Badge tone="accent">Results</Badge>
      </div>

      {subs.length === 0 ? (
        <Empty icon={Users} title="No submissions">No students submitted answers for this test.</Empty>
      ) : (
        <div className="col" style={{ gap: 6 }}>
          {subs.map((s, i) => (
            <Card key={s.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
              <span className="tiny faint" style={{ width: 22 }}>#{i + 1}</span>
              <span style={{ flex: 1 }}>{s.studentName}</span>
              <Badge tone={s.score === s.total ? 'success' : s.score === 0 ? 'danger' : ''}>{s.score}/{s.total}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
