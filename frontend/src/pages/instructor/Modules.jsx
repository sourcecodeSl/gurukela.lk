import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Check, Book, Info, Search, Plus, Edit, Trash, Clock } from '../../components/icons.jsx'

// Grade options mirror the admin catalogue: O/L subjects must carry a grade,
// other streams may optionally set one (used only to group in the picker).
const OL_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11']
const ALL_GRADES = [...OL_GRADES, 'Grade 12', 'Grade 13', 'A/L']
const isOLStream = (s) => s?.name?.trim().toUpperCase() === 'O/L'

const blankSubject = { name: '', description: '', grade: '', streamId: '' }

/**
 * Instructors teach whole subjects (chosen at registration, grouped by stream).
 * This page lets them adjust that set and — when a subject they teach is missing
 * from the catalogue — submit a new one for admin approval. Submitted subjects
 * stay in an "awaiting approval" shelf until an admin approves them into the
 * shared catalogue, after which they behave like any other picked subject.
 */
export default function Modules() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(me.subjectIds || [])
  const [subjectForm, setSubjectForm] = useState(null)

  const current = me.subjectIds || []
  const dirty =
    selected.length !== current.length || selected.some((id) => !current.includes(id))

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const needle = q.trim().toLowerCase()
  // Tick-list is the shared (approved) catalogue only.
  const shownSubjects = app.approvedSubjects.filter((s) => !needle || s.name.toLowerCase().includes(needle))

  // The instructor's own submissions still awaiting (or refused) admin approval.
  const myPending = app.subjects.filter((s) => s.createdBy === me.id && s.status !== 'approved')

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My subjects</h1>
            <p className="sub">Tick the subjects you teach. Students filter and request sessions against these, and every lesson under them becomes yours to run.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setSubjectForm({ ...blankSubject })}>
            <Plus width={16} height={16} /> Add subject
          </button>
          {dirty && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setSelected(current)}>Discard</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  app.dispatch({ type: 'instructor/setSubjects', id: me.id, subjectIds: selected })
                  app.toast('Subjects updated')
                }}
              >
                <Check width={16} height={16} /> Save {selected.length} subject{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 20, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            Can't find a subject you teach? Use <b>Add subject</b> to submit it. New subjects are reviewed by the platform
            administrator and join the shared catalogue once approved — until then they appear under "Awaiting approval" below.
          </p>
        </div>
      </Card>

      {/* the instructor's own submissions awaiting / refused approval */}
      {myPending.length > 0 && (
        <Card pad={false} style={{ marginBottom: 20 }}>
          <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
            <Clock width={16} height={16} className="accent" />
            <h3 style={{ flex: 1 }}>Awaiting approval</h3>
            <Badge tone="accent">{myPending.length}</Badge>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Subject</th><th>Grade</th><th style={{ width: 130 }}>Status</th><th /></tr></thead>
              <tbody>
                {myPending.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="small muted">{s.grade || '—'}</td>
                    <td>
                      {s.status === 'rejected'
                        ? <Badge tone="danger">Rejected</Badge>
                        : <Badge tone="warning">Pending review</Badge>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 5, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSubjectForm(s)} aria-label="Edit">
                          <Edit width={15} height={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          aria-label="Delete"
                          onClick={async () => {
                            if (!(await app.confirm({ title: 'Withdraw subject?', text: `"${s.name}" will be removed from review.`, confirmText: 'Withdraw' }))) return
                            app.dispatch({ type: 'subject/remove', id: s.id })
                            app.toast('Subject withdrawn', 'err')
                          }}
                        >
                          <Trash width={15} height={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="search" style={{ marginBottom: 20, maxWidth: 380 }}>
        <Search className="ico" width={17} height={17} />
        <input className="input" placeholder="Search subjects…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="col" style={{ gap: 'var(--gap)' }}>
        {app.streams.map((stream) => {
          const subs = shownSubjects.filter((s) => s.streamId === stream.id)
          if (!subs.length) return null
          const picked = subs.filter((s) => selected.includes(s.id)).length

          return (
            <Card key={stream.id} pad={false}>
              <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <h3>{stream.name}</h3>
                  <p className="tiny faint">{subs.length} subjects available</p>
                </div>
                {picked > 0 && <Badge tone="accent">{picked} selected</Badge>}
              </div>

              <div className="grid grid-3" style={{ padding: '0 var(--pad) var(--pad)' }}>
                {subs.map((s) => {
                  const on = selected.includes(s.id)
                  const lessons = app.approvedModules.filter((m) => m.subjectId === s.id).length
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className="slot"
                      style={{
                        cursor: 'pointer',
                        textAlign: 'left',
                        alignItems: 'flex-start',
                        borderColor: on ? 'var(--accent)' : 'var(--border)',
                        background: on ? 'var(--accent-soft)' : 'var(--surface)',
                      }}
                    >
                      <span
                        style={{
                          width: 19, height: 19, flex: 'none', marginTop: 2,
                          borderRadius: 5, display: 'grid', placeItems: 'center',
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--accent)' : 'transparent',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        {on && <Check width={13} height={13} />}
                      </span>
                      <span className="col" style={{ gap: 2, minWidth: 0 }}>
                        <span className="row" style={{ gap: 6 }}>
                          <Book width={14} height={14} className="accent" />
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </span>
                        <span className="tiny faint">{lessons} lesson{lessons === 1 ? '' : 's'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {shownSubjects.length === 0 && (
          <Card><Empty icon={Search} title="No subjects match that search" /></Card>
        )}
      </div>

      {subjectForm && (
        <SubjectModal
          value={subjectForm}
          streams={app.streams}
          onClose={() => setSubjectForm(null)}
          onSubmit={(payload) => {
            if (subjectForm.id) {
              app.dispatch({ type: 'subject/update', id: subjectForm.id, payload })
              app.toast('Subject updated')
            } else {
              app.dispatch({ type: 'subject/add', payload })
              app.toast('Subject submitted for approval')
            }
            setSubjectForm(null)
          }}
        />
      )}
    </>
  )
}

function SubjectModal({ value, streams, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const stream = streams.find((s) => s.id === f.streamId)
  const isOL = isOLStream(stream)
  const gradeOptions = isOL ? OL_GRADES : ALL_GRADES
  const canSave = f.name.trim() && f.streamId && (!isOL || f.grade)

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit subject' : 'Submit a new subject'}
      subtitle="New subjects are reviewed by the admin before they join the shared catalogue."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => onSubmit({
              name: f.name.trim(),
              description: f.description?.trim() || null,
              streamId: f.streamId,
              grade: f.grade || null,
            })}
          >
            {value.id ? 'Save' : 'Submit for approval'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Stream">
          <select className="select" value={f.streamId || ''} onChange={(e) => setF({ ...f, streamId: e.target.value, grade: '' })}>
            <option value="">Select a stream…</option>
            {streams.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Grade" hint={isOL ? 'O/L subjects belong to a specific grade.' : 'Optional — groups this subject under a grade in the picker.'}>
          <select className="select" value={f.grade || ''} onChange={set('grade')} disabled={!f.streamId}>
            <option value="">{isOL ? 'Select…' : 'No grade'}</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Subject name">
          <input className="input" placeholder="e.g. Grade 10 ICT" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" placeholder="What does this subject cover?" value={f.description || ''} onChange={set('description')} />
        </Field>
      </div>
    </Modal>
  )
}
