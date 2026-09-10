import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { api } from '../../api/client.js'
import { Badge, Card, Empty, Field, Modal, PendingVerificationNotice } from '../../components/ui.jsx'
import { Plus, Book, Video, Globe, Trash, Info } from '../../components/icons.jsx'

const KIND_META = {
  pdf: { label: 'PDF', icon: Book, tone: 'danger' },
  recording: { label: 'Recording', icon: Video, tone: 'accent' },
  link: { label: 'Link', icon: Globe, tone: '' },
}

/** Instructors upload PDFs and share recording / resource links with students. */
export default function Materials() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const canPublish = me.verified
  const [form, setForm] = useState(null)

  const mySubjects = useMemo(() => {
    const taught = app.subjectsOf(me.id)
    return taught.length ? taught : app.subjects
  }, [app, me.id])

  const materials = app.materialsOf(me.id)

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Course materials</h1>
            <p className="sub">Upload PDFs and share class recordings or resource links with your students.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setForm({ kind: 'pdf' })} disabled={!canPublish}>
            <Plus width={16} height={16} /> Add material
          </button>
        </div>
      </div>

      {!canPublish && <PendingVerificationNotice status={me.verificationStatus} />}

      {materials.length === 0 ? (
        <Card>
          <Empty
            icon={Book}
            title="No materials yet"
            action={<button className="btn btn-primary" onClick={() => setForm({ kind: 'pdf' })} disabled={!canPublish}><Plus width={15} height={15} /> Add your first material</button>}
          >
            Upload a PDF tute or paste a link to a class recording. Students will find these on your profile.
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-3">
          {materials.map((m) => {
            const meta = KIND_META[m.kind] || KIND_META.link
            const Icon = meta.icon
            const subject = app.subjectById[m.subjectId]
            return (
              <Card key={m.id} className="col" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--r)', flex: 'none',
                      display: 'grid', placeItems: 'center',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                    }}
                  >
                    <Icon width={19} height={19} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }} className="truncate">{m.title}</div>
                    <div className="row" style={{ gap: 6 }}>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {subject && <span className="tiny faint truncate">{subject.name}</span>}
                    </div>
                  </div>
                </div>
                {m.description && <p className="small muted">{m.description}</p>}
                <div className="row" style={{ gap: 8, marginTop: 'auto' }}>
                  <a className="btn btn-outline btn-sm" href={m.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                    {m.kind === 'pdf' ? 'Open PDF' : m.kind === 'recording' ? 'Watch' : 'Open'}
                  </a>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: 'var(--danger)' }}
                    aria-label="Delete"
                    onClick={async () => {
                      if (!(await app.confirm({ title: 'Delete material?', text: 'This material will be permanently removed.', confirmText: 'Delete' }))) return
                      app.dispatch({ type: 'material/remove', id: m.id })
                      app.toast('Material removed', 'err')
                    }}
                  >
                    <Trash width={15} height={15} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            PDFs are stored on the platform (max 25&nbsp;MB). For recordings, upload the video to YouTube or Google Drive and
            paste the share link here; this keeps large files off the platform and playback smooth.
          </p>
        </div>
      </Card>

      {form && (
        <MaterialModal
          value={form}
          subjects={mySubjects}
          onClose={() => setForm(null)}
          onDone={() => setForm(null)}
        />
      )}
    </>
  )
}

function MaterialModal({ value, subjects, onClose, onDone }) {
  const app = useApp()
  const [kind, setKind] = useState(value.kind || 'pdf')
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = title.trim() && (kind === 'pdf' ? !!file : url.trim()) && !busy

  const submit = async () => {
    setBusy(true)
    try {
      if (kind === 'pdf') {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', title.trim())
        if (subjectId) fd.append('subjectId', subjectId)
        if (description.trim()) fd.append('description', description.trim())
        await api.upload('/materials/upload', fd)
        await app.refresh()
        app.toast('PDF uploaded')
      } else {
        await app.dispatch({
          type: 'material/add',
          payload: { title: title.trim(), kind, url: url.trim(), subjectId: subjectId || null, description: description.trim() || null },
        })
        app.toast('Material added')
      }
      onDone()
    } catch (e) {
      app.toast(e.message || 'Could not save material', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add material"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
            {busy ? 'Saving…' : 'Save material'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Type">
          <div className="seg">
            {['pdf', 'recording', 'link'].map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)} type="button">
                {KIND_META[k].label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Title">
          <input className="input" placeholder="e.g. Unit 3: Boolean Algebra notes" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        {kind === 'pdf' ? (
          <Field label="PDF file" hint="Maximum 25 MB.">
            <input className="input" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Field>
        ) : (
          <Field label={kind === 'recording' ? 'Recording URL' : 'Link URL'} hint={kind === 'recording' ? 'YouTube, Google Drive or any video link.' : 'Any web link.'}>
            <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
        )}

        <Field label="Subject (optional)">
          <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Description (optional)">
          <textarea className="textarea" style={{ minHeight: 60 }} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
