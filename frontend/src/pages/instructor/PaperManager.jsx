import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, SkeletonCard, Spinner } from '../../components/ui.jsx'
import { Plus, Trash, Book, Upload, Users, Check } from '../../components/icons.jsx'

/**
 * Instructor panel to attach question papers (PDF) to a single seminar OR a
 * booked 1-on-1 slot, and to review + mark the answers students upload.
 * Pass `seminar` (many registered students) or `slot` + `title` (one booked
 * student) — the flow is identical either way.
 */
export default function PaperManager({ seminar, slot, title, onClose }) {
  const { toast, confirm } = useApp()
  const [papers, setPapers] = useState(null)
  const [adding, setAdding] = useState(false)

  const listQuery = seminar ? `seminarId=${seminar.id}` : `slotId=${slot.id}`
  const target = seminar ? { seminarId: seminar.id } : { slotId: slot.id }
  const ownerTitle = title || seminar?.title || 'Session'

  const load = useCallback(async () => {
    try {
      setPapers(await api.get(`/papers?${listQuery}`))
    } catch (e) {
      toast(e.message || 'Failed to load papers', 'err')
    }
  }, [listQuery, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Modal open onClose={onClose} width={720} title="Papers" subtitle={ownerTitle}>
      <div className="col" style={{ gap: 14 }}>
        <div className="row">
          <p className="small muted" style={{ flex: 1 }}>
            Upload a question paper or handout (PDF). Students in this session can download it and
            upload their answers, which you can mark and give feedback on.
          </p>
          {!adding && (
            <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
              <Plus width={15} height={15} /> Add paper
            </button>
          )}
        </div>

        {adding && (
          <AddPaperForm
            target={target}
            onCancel={() => setAdding(false)}
            onDone={() => {
              setAdding(false)
              load()
            }}
          />
        )}

        {papers == null ? (
          <div className="col" style={{ gap: 10 }}>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
          </div>
        ) : papers.length === 0 && !adding ? (
          <Empty icon={Book} title="No papers yet">Add a question paper or handout for this session.</Empty>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {papers.map((p) => (
              <PaperRow
                key={p.id}
                paper={p}
                onChanged={load}
                onDelete={async () => {
                  if (!(await confirm({ title: 'Delete paper?', text: `“${p.title}” and all answers uploaded for it will be removed.`, confirmText: 'Delete' }))) return
                  await api.del(`/papers/${p.id}`)
                  toast('Paper removed', 'err')
                  load()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------- add form ------------------------------- */

function AddPaperForm({ target, onCancel, onDone }) {
  const { toast } = useApp()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [dueAt, setDueAt] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = title.trim() && file && !busy

  const submit = async () => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())
      if (description.trim()) fd.append('description', description.trim())
      if (dueAt) fd.append('dueAt', dueAt.replace('T', ' ') + ':00')
      if (target.seminarId) fd.append('seminarId', target.seminarId)
      if (target.slotId) fd.append('slotId', target.slotId)
      await api.upload('/papers/upload', fd)
      toast('Paper uploaded')
      onDone()
    } catch (e) {
      toast(e.message || 'Could not upload the paper', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="col" style={{ gap: 12 }}>
      <Field label="Paper title">
        <input className="input" placeholder="e.g. Paper 1 — MCQ & Structured" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <Field label="PDF file" hint="Maximum 25 MB.">
        <input className="input" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </Field>
      <Field label="Description (optional)">
        <textarea className="textarea" style={{ minHeight: 54 }} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Answer deadline (optional)" hint="Students can keep uploading answers until this time.">
        <input className="input" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={!canSubmit} onClick={submit}>
          {busy ? <><Spinner /> Uploading…</> : 'Upload paper'}
        </button>
      </div>
    </Card>
  )
}

/* ------------------------------- paper row ------------------------------- */

// Format a stored wall-clock time ("YYYY-MM-DD HH:MM:SS") for display.
const fmtWhen = (s) =>
  s
    ? new Date(String(s).replace(' ', 'T')).toLocaleString(undefined, {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : ''

function PaperRow({ paper, onChanged, onDelete }) {
  const { toast } = useApp()
  const [open, setOpen] = useState(false)
  const [subs, setSubs] = useState(null)

  const loadSubs = useCallback(async () => {
    try {
      setSubs(await api.get(`/papers/${paper.id}/submissions`))
    } catch (e) {
      toast(e.message || 'Failed to load submissions', 'err')
    }
  }, [paper.id, toast])

  useEffect(() => {
    if (open) loadSubs()
  }, [open, loadSubs])

  const toggleAnswers = async () => {
    try {
      await api.patch(`/papers/${paper.id}`, { allowAnswers: !paper.allowAnswers })
      toast(paper.allowAnswers ? 'Answers closed' : 'Answers reopened')
      onChanged()
    } catch (e) {
      toast(e.message || 'Could not update', 'err')
    }
  }

  return (
    <Card className="col" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <span style={{ width: 34, height: 34, borderRadius: 'var(--r)', flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Book width={17} height={17} />
        </span>
        <div className="col" style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <strong className="truncate">{paper.title}</strong>
          <span className="tiny faint row" style={{ gap: 10 }}>
            <span className="row" style={{ gap: 4 }}><Users width={12} height={12} />{paper.submissionCount ?? 0} answer{paper.submissionCount === 1 ? '' : 's'}</span>
            {!paper.allowAnswers && <Badge tone="danger">Answers closed</Badge>}
            {paper.dueAt && <span>Due {fmtWhen(paper.dueAt)}</span>}
          </span>
        </div>
        <a className="btn btn-sm btn-outline" href={paper.fileUrl} target="_blank" rel="noreferrer">Open PDF</a>
        <button className="btn btn-sm btn-danger" onClick={onDelete}><Trash width={14} height={14} /></button>
      </div>
      {paper.description && <p className="small muted" style={{ margin: 0 }}>{paper.description}</p>}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide answers' : `View answers (${paper.submissionCount ?? 0})`}
        </button>
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={toggleAnswers}>
          {paper.allowAnswers ? 'Close answers' : 'Reopen answers'}
        </button>
      </div>

      {open && (
        subs == null ? (
          <SkeletonCard lines={2} />
        ) : subs.length === 0 ? (
          <Empty icon={Upload} title="No answers yet">Students haven't uploaded answers for this paper.</Empty>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {subs.map((s) => (
              <SubmissionRow key={s.id} paperId={paper.id} sub={s} onGraded={loadSubs} />
            ))}
          </div>
        )
      )}
    </Card>
  )
}

function SubmissionRow({ paperId, sub, onGraded }) {
  const { toast } = useApp()
  const [marks, setMarks] = useState(sub.marks ?? '')
  const [feedback, setFeedback] = useState(sub.feedback ?? '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      await api.patch(`/papers/${paperId}/submissions/${sub.id}`, {
        marks: marks === '' ? null : Number(marks),
        feedback: feedback.trim(),
      })
      toast('Marks saved')
      onGraded()
    } catch (e) {
      toast(e.message || 'Could not save marks', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="col" style={{ gap: 10, background: 'var(--surface-2, rgba(0,0,0,.03))' }}>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <Avatar name={sub.studentName} hue={sub.studentHue} size={26} />
        <div className="col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <strong className="truncate">{sub.studentName}</strong>
          <span className="tiny faint">Submitted {fmtWhen(sub.submittedAt)}{sub.gradedAt ? ' · graded' : ''}</span>
        </div>
        <a className="btn btn-sm btn-outline" href={sub.fileUrl} target="_blank" rel="noreferrer">
          {sub.fileType === 'pdf' ? 'Open PDF' : 'View image'}
        </a>
      </div>
      {sub.note && <p className="tiny muted" style={{ margin: 0 }}>Note: {sub.note}</p>}
      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <div style={{ width: 110 }}>
          <Field label="Marks">
            <input className="input" type="number" placeholder="—" value={marks} onChange={(e) => setMarks(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Feedback">
            <input className="input" placeholder="Optional comment for the student" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Field>
        </div>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
          {busy ? <Spinner /> : <Check width={14} height={14} />} {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Card>
  )
}
