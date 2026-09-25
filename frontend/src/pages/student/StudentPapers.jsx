import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Field, Modal, Spinner } from '../../components/ui.jsx'
import { Book, Upload, Check, Award } from '../../components/icons.jsx'

// Format a stored wall-clock time ("YYYY-MM-DD HH:MM:SS") for display.
const fmtWhen = (s) =>
  s
    ? new Date(String(s).replace(' ', 'T')).toLocaleString(undefined, {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : ''

/**
 * Shown on a student's registered seminar card or booked 1-on-1 slot. Lists the
 * papers the instructor attached; the student downloads each, uploads their
 * answer (PDF or image) and sees their mark + feedback once graded. Pass either
 * `seminarId` or `slotId`.
 */
export default function StudentPapers({ seminarId, slotId }) {
  const [papers, setPapers] = useState([])
  const [openId, setOpenId] = useState(null)

  const listQuery = seminarId ? `seminarId=${seminarId}` : `slotId=${slotId}`

  const load = useCallback(async () => {
    try {
      setPapers(await api.get(`/papers?${listQuery}`))
    } catch {
      /* not registered / transient — leave the list as-is */
    }
  }, [listQuery])

  useEffect(() => {
    load()
  }, [load])

  if (papers.length === 0) return null

  const openPaper = papers.find((p) => p.id === openId)

  return (
    <>
      <div className="col" style={{ gap: 6 }}>
        {papers.map((p) => (
          <button key={p.id} className={`btn btn-sm ${p.mine ? 'btn-outline' : 'btn-primary'}`} onClick={() => setOpenId(p.id)}>
            {p.mine ? <Check width={14} height={14} /> : <Book width={14} height={14} />}
            {p.mine?.marks != null ? `Marked ${p.mine.marks}: ` : p.mine ? 'Submitted: ' : 'Paper: '}{p.title}
          </button>
        ))}
      </div>

      {openPaper && (
        <PaperView
          paper={openPaper}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </>
  )
}

function PaperView({ paper, onClose, onChanged }) {
  const { toast } = useApp()
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = paper.mine

  const submit = async () => {
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (note.trim()) fd.append('note', note.trim())
      await api.upload(`/papers/${paper.id}/submit`, fd)
      toast(mine ? 'Answer replaced' : 'Answer submitted')
      onChanged()
      onClose()
    } catch (e) {
      toast(e.message || 'Could not upload your answer', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} width={520} title={paper.title} subtitle="Download the paper and upload your answer.">
      <div className="col" style={{ gap: 14 }}>
        {paper.description && <p className="small muted" style={{ margin: 0 }}>{paper.description}</p>}

        <a className="btn btn-outline btn-block" href={paper.fileUrl} target="_blank" rel="noreferrer">
          <Book width={16} height={16} /> Open / download the paper
        </a>

        {paper.dueAt && <p className="tiny faint" style={{ margin: 0 }}>Answers accepted until {fmtWhen(paper.dueAt)}.</p>}

        {mine && (
          <Card className="col" style={{ gap: 8, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <Check width={15} height={15} className="accent" />
              <span className="small bold" style={{ flex: 1 }}>Your answer</span>
              <a className="btn btn-sm btn-outline" href={mine.fileUrl} target="_blank" rel="noreferrer">
                {mine.fileType === 'pdf' ? 'Open PDF' : 'View image'}
              </a>
            </div>
            <span className="tiny faint">Uploaded {fmtWhen(mine.submittedAt)}</span>
            {mine.marks != null ? (
              <div className="col" style={{ gap: 4 }}>
                <Badge tone="success"><Award width={12} height={12} /> Marks: {mine.marks}</Badge>
                {mine.feedback && <p className="small muted" style={{ margin: 0 }}>Feedback: {mine.feedback}</p>}
              </div>
            ) : (
              <span className="tiny muted">Not marked yet.</span>
            )}
          </Card>
        )}

        {paper.allowAnswers ? (
          <>
            <Field label={mine ? 'Replace your answer' : 'Upload your answer'} hint="PDF or a photo of your written answer (max 25 MB).">
              <input className="input" type="file" accept="application/pdf,.pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Field>
            <Field label="Note to your teacher (optional)">
              <input className="input" placeholder="Anything you want to mention" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <button className="btn btn-primary btn-block" disabled={!file || busy} onClick={submit}>
              {busy ? <Spinner /> : <Upload width={16} height={16} />} {busy ? 'Uploading…' : mine ? 'Replace answer' : 'Submit answer'}
            </button>
          </>
        ) : (
          <p className="small" style={{ color: 'var(--warning)', margin: 0 }}>Answer submissions are closed for this paper.</p>
        )}
      </div>
    </Modal>
  )
}
