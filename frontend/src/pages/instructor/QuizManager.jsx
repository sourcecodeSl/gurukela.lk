import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal, SkeletonCard, SkeletonText } from '../../components/ui.jsx'
import { useCountdown, fmtCountdown } from '../../lib/useCountdown.js'
import { Plus, Trash, Edit, Check, Clock, Users, Award, X, Layers, Book } from '../../components/icons.jsx'
import { QuestionModal, correctSetOf, blankQuestion } from '../../components/QuestionEditor.jsx'

/**
 * Instructor MCQ control panel for a single seminar OR a booked 1-on-1 slot.
 * Pass `seminar` (many registered students) or `slot` + `title` (one booked
 * student). The rest of the flow is identical:
 *   draft  → build questions, mark the correct option, then Start
 *   active → shared countdown + live submission count, End early
 *   ended  → leaderboard of every student's score
 */
export default function QuizManager({ seminar, slot, title, onClose }) {
  const { toast, confirm } = useApp()
  const [quizzes, setQuizzes] = useState(null)
  const [openId, setOpenId] = useState(null)

  // Which entity this panel drives — a seminar or a slot.
  const listQuery = seminar ? `seminarId=${seminar.id}` : `slotId=${slot.id}`
  const createOwner = seminar ? { seminarId: seminar.id } : { slotId: slot.id }
  const ownerTitle = title || seminar?.title || 'Session'

  const load = useCallback(async () => {
    try {
      setQuizzes(await api.get(`/quizzes?${listQuery}`))
    } catch (e) {
      toast(e.message || 'Failed to load tests', 'err')
    }
  }, [listQuery, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Modal
      open
      onClose={onClose}
      width={720}
      title={openId ? 'MCQ test' : 'MCQ tests'}
      subtitle={ownerTitle}
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
            const q = await api.post('/quizzes', { ...createOwner, ...payload })
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

const STATUS_TONE = { draft: '', scheduled: 'warning', active: 'success', ended: 'accent' }
const STATUS_LABEL = { draft: 'Draft', scheduled: 'Scheduled', active: 'Live now', ended: 'Ended' }

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

// Whole seconds from now until a stored wall-clock time (for the pre-start countdown).
const secondsUntil = (s) =>
  s ? Math.max(0, Math.round((new Date(String(s).replace(' ', 'T')).getTime() - Date.now()) / 1000)) : 0

// Coarse "time until start" — days/hours far out, m:ss in the final minutes.
const fmtRemaining = (secs) => {
  const s = Math.max(0, Math.floor(secs))
  if (s >= 3600) {
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`
  }
  return fmtCountdown(s)
}

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
        <div className="col" style={{ gap: 10 }}>
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : quizzes.length === 0 && !creating ? (
        <Empty icon={Layers} title="No tests yet">Create an MCQ test for this session.</Empty>
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
                  {q.status === 'scheduled' && q.scheduledAt && (
                    <span className="row" style={{ gap: 4 }}><Clock width={12} height={12} />Starts {fmtWhen(q.scheduledAt)}</span>
                  )}
                  {q.status !== 'draft' && q.status !== 'scheduled' && <span className="row" style={{ gap: 4 }}><Users width={12} height={12} />{q.submissionCount ?? 0} submitted</span>}
                </span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => onOpen(q.id)}>
                {q.status === 'draft' ? <><Edit width={14} height={14} /> Build</> : q.status === 'scheduled' ? <><Clock width={14} height={14} /> Manage</> : q.status === 'active' ? 'Control' : <><Award width={14} height={14} /> Results</>}
              </button>
              {(q.status === 'draft' || q.status === 'scheduled') && (
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

  // While scheduled (waiting to auto-start) or live, poll so the countdown flips
  // to live on its own and the submission count / auto-end stays current.
  useEffect(() => {
    if (quiz?.status !== 'active' && quiz?.status !== 'scheduled') return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [quiz?.status, load])

  if (!quiz) return <SkeletonText lines={4} />


  return (
    <div className="col" style={{ gap: 14 }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <X width={14} height={14} /> Back to tests
      </button>
      {quiz.status === 'draft' && <DraftEditor quiz={quiz} reload={load} onStarted={load} />}
      {quiz.status === 'scheduled' && <ScheduledControl quiz={quiz} reload={load} />}
      {quiz.status === 'active' && <LiveControl quiz={quiz} reload={load} />}
      {quiz.status === 'ended' && <Results quiz={quiz} reload={load} />}
    </div>
  )
}

/* --- draft: add/edit questions + start --- */

function DraftEditor({ quiz, reload, onStarted }) {
  const { toast, confirm } = useApp()
  const [editing, setEditing] = useState(null) // question being added/edited
  const [importing, setImporting] = useState(false) // MCQ-bank import modal open
  const [schedAt, setSchedAt] = useState('') // datetime-local value for scheduling
  const [scheduling, setScheduling] = useState(false)
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

  const schedule = async () => {
    if (!schedAt) return
    setScheduling(true)
    try {
      // datetime-local -> "YYYY-MM-DD HH:MM:SS" wall-clock (matches seminars/classes).
      await api.post(`/quizzes/${quiz.id}/schedule`, { scheduledAt: schedAt.replace('T', ' ') + ':00' })
      toast('Test scheduled — it will start automatically')
      onStarted()
    } catch (e) {
      toast(e.message || 'Could not schedule', 'err')
    } finally {
      setScheduling(false)
    }
  }

  // datetime-local min: one minute from now, formatted to the input's local shape.
  const minLocal = new Date(Date.now() + 60000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <div className="col" style={{ flex: 1 }}>
          <strong>{quiz.title}</strong>
          <span className="tiny faint">{questions.length} question{questions.length === 1 ? '' : 's'} · {Math.round(quiz.durationSecs / 60)} min limit</span>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => setImporting(true)}><Book width={14} height={14} /> Import from bank</button>
        <button className="btn btn-sm btn-outline" onClick={() => setEditing(blankQuestion())}><Plus width={14} height={14} /> Add question</button>
        <button className="btn btn-sm btn-primary" disabled={questions.length === 0} onClick={start}>Start now</button>
      </div>

      {questions.length > 0 && (
        <Card className="col" style={{ gap: 8 }}>
          <div className="row wrap" style={{ gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Field label="Or schedule to start automatically">
                <input
                  className="input"
                  type="datetime-local"
                  min={minLocal}
                  value={schedAt}
                  onChange={(e) => setSchedAt(e.target.value)}
                />
              </Field>
            </div>
            <button className="btn btn-sm btn-outline" disabled={!schedAt || scheduling} onClick={schedule}>
              <Clock width={14} height={14} /> {scheduling ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
          <p className="tiny muted">The test goes live on its own at this time — no need to click Start.</p>
        </Card>
      )}

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
              {qq.imageUrl && <img src={qq.imageUrl} alt="" style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, alignSelf: 'flex-start' }} />}
              <div className="col" style={{ gap: 4 }}>
                {qq.options.map((opt, oi) => {
                  const correct = correctSetOf(qq).includes(oi)
                  return (
                  <span key={oi} className={`small row ${correct ? 'bold' : 'muted'}`} style={{ gap: 6, alignItems: 'center' }}>
                    {correct ? <Check width={13} height={13} style={{ color: 'var(--success)' }} /> : <span style={{ width: 13 }} />}
                    {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ height: 34, maxWidth: 80, objectFit: 'cover', borderRadius: 5 }} />}
                    {opt.text}
                  </span>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <QuestionModal value={editing} onClose={() => setEditing(null)} onSubmit={saveQuestion} />
      )}
      {importing && (
        <ImportBankModal
          onClose={() => setImporting(false)}
          onImport={async (password) => {
            const { message } = await api.post(`/quizzes/${quiz.id}/import`, { password })
            toast(message || 'Questions imported')
            setImporting(false)
            reload()
          }}
        />
      )}
    </>
  )
}

// Import a whole MCQ bank into this draft by typing its shared password. The
// bank's questions are copied and appended; the instructor can then edit them.
function ImportBankModal({ onClose, onImport }) {
  const { toast } = useApp()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!password.trim()) return
    setBusy(true)
    try {
      await onImport(password.trim())
    } catch (e) {
      toast(e.message || 'Could not import — check the password', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      width={440}
      title="Import from an MCQ bank"
      subtitle="Enter the password shared with you. Its questions will be copied into this test — you can edit them afterwards."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!password.trim() || busy} onClick={submit}>
            {busy ? 'Importing…' : 'Import questions'}
          </button>
        </>
      }
    >
      <Field label="MCQ bank password">
        <input
          className="input"
          placeholder="e.g. ABCD2345"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
      </Field>
    </Modal>
  )
}

/* --- scheduled: waiting to auto-start --- */

function ScheduledControl({ quiz, reload }) {
  const { toast, confirm } = useApp()
  const left = useCountdown(secondsUntil(quiz.scheduledAt))

  // When the start time arrives, reload — the server flips it to live for us.
  useEffect(() => {
    if (left === 0) reload()
  }, [left, reload])

  const startNow = async () => {
    if (!(await confirm({ title: 'Start now instead?', text: 'The test goes live immediately for all registered students.', confirmText: 'Start now' }))) return
    try {
      await api.post(`/quizzes/${quiz.id}/activate`)
      toast('Test is live!')
      reload()
    } catch (e) {
      toast(e.message || 'Could not start', 'err')
    }
  }

  const cancel = async () => {
    if (!(await confirm({ title: 'Cancel schedule?', text: 'The test goes back to draft so you can edit questions again.', confirmText: 'Cancel schedule' }))) return
    try {
      await api.post(`/quizzes/${quiz.id}/unschedule`)
      toast('Schedule cancelled', 'err')
      reload()
    } catch (e) {
      toast(e.message || 'Could not cancel', 'err')
    }
  }

  return (
    <Card className="col" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <Badge tone="warning"><Clock width={12} height={12} /> Scheduled</Badge>
      <p className="small muted">{quiz.title} · {(quiz.questions || []).length} questions · {Math.round(quiz.durationSecs / 60)} min</p>
      <div className="col center" style={{ gap: 2 }}>
        <span className="small muted">Starts automatically</span>
        <strong style={{ fontSize: 18 }}>{fmtWhen(quiz.scheduledAt)}</strong>
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
        <Clock width={20} height={20} />
        <span style={{ fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtRemaining(left)}</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-sm btn-ghost" onClick={cancel}>Cancel schedule</button>
        <button className="btn btn-sm btn-primary" onClick={startNow}>Start now</button>
      </div>
      <span className="tiny faint">Students see it go live on their own at the scheduled time.</span>
    </Card>
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
      <LiveProgress progress={quiz.progress} fallbackSubmitted={quiz.submissionCount ?? 0} />
      <AddTime quiz={quiz} reload={reload} />
      <button className="btn btn-danger" onClick={end}>End now &amp; show results</button>
      <span className="tiny faint">Results are revealed automatically when the timer hits zero.</span>
    </Card>
  )
}

// Give everyone more time on the shared countdown. Works while live, and reopens
// a test that has already run out (used from the results panel too).
function AddTime({ quiz, reload, reopen = false }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)

  const add = async (minutes) => {
    setBusy(true)
    try {
      await api.post(`/quizzes/${quiz.id}/extend`, { minutes })
      toast(reopen ? `Reopened for ${minutes} more min` : `Added ${minutes} min`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not add time', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="col center" style={{ gap: 6 }}>
      <span className="tiny muted row" style={{ gap: 4 }}>
        <Clock width={12} height={12} /> {reopen ? 'Reopen with more time' : 'Add more time'}
      </span>
      <div className="row" style={{ gap: 6 }}>
        {[1, 2, 5, 10].map((m) => (
          <button key={m} className="btn btn-sm btn-outline" disabled={busy} onClick={() => add(m)}>
            +{m} min
          </button>
        ))}
      </div>
    </div>
  )
}

// Real-time tally of who's taking the quiz right now: submitted vs still working,
// out of everyone the quiz is aimed at. Refreshes with the editor's 3s poll.
function LiveProgress({ progress, fallbackSubmitted }) {
  const submitted = progress?.submitted ?? fallbackSubmitted
  const inProgress = progress?.inProgress ?? 0
  const expected = progress?.expected
  const notStarted = progress?.notStarted ?? 0

  const Stat = ({ value, label, tone }) => (
    <div className="col center" style={{ gap: 2, minWidth: 78 }}>
      <strong style={{ fontSize: 26, fontVariantNumeric: 'tabular-nums', color: tone }}>{value}</strong>
      <span className="tiny muted">{label}</span>
    </div>
  )

  return (
    <div className="col" style={{ gap: 6, alignItems: 'center' }}>
      <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
        <Stat value={submitted} label="Submitted" tone="var(--success)" />
        <Stat value={inProgress} label="In progress" tone="var(--accent)" />
        {expected != null && <Stat value={notStarted} label="Not started" />}
      </div>
      {expected != null && (
        <span className="tiny faint row" style={{ gap: 4 }}>
          <Users width={12} height={12} /> {submitted + inProgress} of {expected} registered have started
        </span>
      )}
    </div>
  )
}

/* --- ended: results --- */

function Results({ quiz, reload }) {
  const subs = quiz.submissions || []
  const total = (quiz.questions || []).length
  const analytics = quiz.analytics
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <div className="col" style={{ flex: 1 }}>
          <strong>{quiz.title}</strong>
          <span className="tiny faint">Ended · {subs.length} submission{subs.length === 1 ? '' : 's'} · out of {total}</span>
        </div>
        <Badge tone="accent">Results</Badge>
      </div>

      {reload && (
        <Card className="col center" style={{ gap: 8, textAlign: 'center' }}>
          <span className="small muted">Ran out of time? Reopen the test so students can keep going.</span>
          <AddTime quiz={quiz} reload={reload} reopen />
        </Card>
      )}

      {analytics && subs.length > 0 && (
        <>
          <ScoreDistribution distribution={analytics.scoreDistribution} total={analytics.submissionCount} />
          <QuestionStats stats={analytics.questionStats} submissionCount={analytics.submissionCount} />
        </>
      )}

      {subs.length === 0 ? (
        <Empty icon={Users} title="No submissions">No students submitted answers for this test.</Empty>
      ) : (
        <div className="col" style={{ gap: 6 }}>
          <span className="small bold row" style={{ gap: 6 }}><Award width={15} height={15} /> Leaderboard</span>
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

// Score distribution: a simple horizontal bar per mark band showing how many
// students landed in each. Bars are scaled to the fullest band.
function ScoreDistribution({ distribution, total }) {
  const bands = distribution || []
  const peak = Math.max(1, ...bands.map((b) => b.count))
  return (
    <Card className="col" style={{ gap: 10 }}>
      <span className="small bold">Score distribution</span>
      <div className="col" style={{ gap: 6 }}>
        {bands.map((b) => {
          const pct = total ? Math.round((b.count / total) * 100) : 0
          return (
            <div key={b.label} className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className="tiny muted" style={{ width: 64, textAlign: 'right' }}>{b.label}</span>
              <div style={{ flex: 1, height: 16, background: 'var(--surface-2, rgba(0,0,0,.06))', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${(b.count / peak) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 6, transition: 'width .2s ease' }} />
              </div>
              <span className="tiny faint" style={{ width: 58 }}>{b.count} · {pct}%</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Per-question breakdown: how many got each question right, with a percentage
// bar so the lecturer can spot the questions the class struggled with.
function QuestionStats({ stats, submissionCount }) {
  const rows = stats || []
  return (
    <Card className="col" style={{ gap: 10 }}>
      <span className="small bold">Question breakdown</span>
      <div className="col" style={{ gap: 10 }}>
        {rows.map((s) => {
          const tone = s.percent >= 70 ? 'var(--success)' : s.percent >= 40 ? 'var(--warning, #d19a00)' : 'var(--danger)'
          return (
            <div key={s.questionId} className="col" style={{ gap: 4 }}>
              <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                <span className="small" style={{ flex: 1 }}>{s.position}. {s.text || <span className="faint">(image question)</span>}</span>
                <span className="tiny faint" style={{ whiteSpace: 'nowrap' }}>{s.correct}/{submissionCount} correct · {s.percent}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-2, rgba(0,0,0,.06))', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${s.percent}%`, height: '100%', background: tone, borderRadius: 5, transition: 'width .2s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
