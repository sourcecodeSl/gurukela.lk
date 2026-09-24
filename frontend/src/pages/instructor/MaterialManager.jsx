import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal, SkeletonCard } from '../../components/ui.jsx'
import { Plus, Trash, Book, Video, Globe } from '../../components/icons.jsx'

const KIND_META = {
  pdf: { label: 'PDF', icon: Book, tone: 'danger' },
  recording: { label: 'Recording', icon: Video, tone: 'accent' },
  link: { label: 'Link', icon: Globe, tone: '' },
}

/**
 * Instructor panel to attach lecture materials (PDF upload, or a recording /
 * resource link) to a single seminar, booked slot, or group class. Pass exactly
 * one of `seminar` / `slot` / `group` (+ optional `title` for the header).
 * Only that session's audience sees these — separate from the general shelf.
 */
export default function MaterialManager({ seminar, slot, group, title, onClose }) {
  const { toast, confirm } = useApp()
  const [materials, setMaterials] = useState(null)
  const [adding, setAdding] = useState(false)

  const scope = seminar
    ? { key: 'seminarId', id: seminar.id }
    : slot
      ? { key: 'slotId', id: slot.id }
      : { key: 'groupId', id: group.id }
  const ownerTitle = title || seminar?.title || group?.title || 'Session'

  const load = useCallback(async () => {
    try {
      setMaterials(await api.get(`/materials?${scope.key}=${scope.id}`))
    } catch (e) {
      toast(e.message || 'Failed to load materials', 'err')
    }
  }, [scope.key, scope.id, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Modal open onClose={onClose} width={640} title="Lecture materials" subtitle={ownerTitle}>
      <div className="col" style={{ gap: 14 }}>
        <div className="row">
          <p className="small muted" style={{ flex: 1 }}>
            Share PDFs, class recordings or resource links for this session. Only students in it can
            see them.
          </p>
          {!adding && (
            <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
              <Plus width={15} height={15} /> Add material
            </button>
          )}
        </div>

        {adding && (
          <AddMaterialForm
            scope={scope}
            onCancel={() => setAdding(false)}
            onDone={() => {
              setAdding(false)
              load()
            }}
          />
        )}

        {materials == null ? (
          <div className="col" style={{ gap: 10 }}>
            <SkeletonCard lines={1} />
            <SkeletonCard lines={1} />
          </div>
        ) : materials.length === 0 && !adding ? (
          <Empty icon={Book} title="No materials yet">Add a PDF, recording or link for this session.</Empty>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {materials.map((m) => {
              const meta = KIND_META[m.kind] || KIND_META.link
              const Icon = meta.icon
              return (
                <Card key={m.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 'var(--r)', flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <Icon width={17} height={17} />
                  </span>
                  <div className="col" style={{ flex: 1, gap: 3, minWidth: 0 }}>
                    <strong className="truncate">{m.title}</strong>
                    <div className="row" style={{ gap: 6 }}>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {m.description && <span className="tiny faint truncate">{m.description}</span>}
                    </div>
                  </div>
                  <a className="btn btn-sm btn-outline" href={m.url} target="_blank" rel="noreferrer">
                    {m.kind === 'pdf' ? 'Open PDF' : m.kind === 'recording' ? 'Watch' : 'Open'}
                  </a>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={async () => {
                      if (!(await confirm({ title: 'Delete material?', text: `“${m.title}” will be removed from this session.`, confirmText: 'Delete' }))) return
                      await api.del(`/materials/${m.id}`)
                      toast('Material removed', 'err')
                      load()
                    }}
                  >
                    <Trash width={14} height={14} />
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

function AddMaterialForm({ scope, onCancel, onDone }) {
  const { toast } = useApp()
  const [kind, setKind] = useState('pdf')
  const [title, setTitle] = useState('')
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
        fd.append(scope.key, scope.id)
        if (description.trim()) fd.append('description', description.trim())
        await api.upload('/materials/upload', fd)
      } else {
        await api.post('/materials', {
          title: title.trim(),
          kind,
          url: url.trim(),
          description: description.trim() || null,
          [scope.key]: scope.id,
        })
      }
      toast('Material added')
      onDone()
    } catch (e) {
      toast(e.message || 'Could not save material', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="col" style={{ gap: 12 }}>
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
        <input className="input" placeholder="e.g. Session 3 slides" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
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

      <Field label="Description (optional)">
        <textarea className="textarea" style={{ minHeight: 54 }} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={!canSubmit} onClick={submit}>
          {busy ? 'Saving…' : 'Save material'}
        </button>
      </div>
    </Card>
  )
}
