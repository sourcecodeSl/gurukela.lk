import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Plus, Book, Trash, Edit, Layers, Info } from '../../components/icons.jsx'

const blankModule = { code: '', name: '', level: 'A/L', hours: 20 }
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'O/L', 'A/L']

/**
 * Instructors start from the admin's default lessons for a subject and add their
 * own on top. A lesson a teacher adds is submitted for admin approval; once
 * approved it joins the shared catalogue (and becomes read-only to the teacher).
 * Mirrors the "My sub-lessons" page one level up the tree (Subject → Lesson).
 */
export default function Curriculum() {
  const app = useApp()
  const me = app.instructorById[app.session.id]

  // Subjects the instructor teaches, falling back to the whole approved
  // catalogue so a new instructor who hasn't picked subjects yet can still browse.
  const mySubjects = useMemo(() => {
    const taught = app.subjectsOf(me.id)
    return taught.length ? taught : app.approvedSubjects
  }, [app, me.id])

  const [subjectId, setSubjectId] = useState(mySubjects[0]?.id)
  const [moduleForm, setModuleForm] = useState(null)

  const subject = mySubjects.find((s) => s.id === subjectId) || mySubjects[0]

  // Admin defaults (createdBy null) are read-only; the teacher's own lessons
  // (any status) are editable while pending/rejected.
  const defaults = subject
    ? app.approvedModules.filter((m) => m.subjectId === subject.id && m.createdBy == null)
    : []
  const mine = subject
    ? app.modules.filter((m) => m.subjectId === subject.id && m.createdBy === me.id)
    : []

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My lessons</h1>
            <p className="sub">Start from the default lessons for a subject and add your own. New lessons are approved by the admin before they join the catalogue.</p>
          </div>
          <button className="btn btn-primary" disabled={!subject} onClick={() => setModuleForm({ ...blankModule })}>
            <Plus width={16} height={16} /> Add lesson
          </button>
        </div>
      </div>

      {mySubjects.length === 0 ? (
        <Card><Empty icon={Layers} title="No subjects yet">Pick the subjects you teach on the My Subjects page, then build your lessons here.</Empty></Card>
      ) : (
        <>
          <div className="row wrap" style={{ gap: 'var(--gap)' }}>
            <Field label="Subject">
              <select
                className="select"
                style={{ maxWidth: 340 }}
                value={subject?.id || ''}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {mySubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.grade ? `${s.grade} · ${s.name}` : s.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="col" style={{ gap: 'var(--gap)', marginTop: 18 }}>
            {/* default lessons from the admin catalogue */}
            <Card pad={false}>
              <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
                <Layers width={16} height={16} className="accent" />
                <h3 style={{ flex: 1 }}>Default lessons</h3>
                <Badge>{defaults.length}</Badge>
              </div>
              {defaults.length === 0 ? (
                <Empty icon={Book} title="No default lessons for this subject" />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Code</th><th>Lesson</th><th style={{ width: 90 }}>Level</th><th style={{ width: 90 }}>Hours</th></tr></thead>
                    <tbody>
                      {defaults.map((m) => (
                        <tr key={m.id}>
                          <td><span className="tiny bold accent">{m.code || '—'}</span></td>
                          <td>{m.name}</td>
                          <td><Badge>{m.level || '—'}</Badge></td>
                          <td className="small muted">{m.hours != null ? `${m.hours} h` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* the instructor's own lessons */}
            <Card pad={false}>
              <div className="row wrap" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
                <Book width={16} height={16} className="accent" />
                <h3 style={{ flex: 1 }}>My lessons</h3>
                <Badge tone="accent">{mine.length}</Badge>
                <button className="btn btn-outline btn-sm" onClick={() => setModuleForm({ ...blankModule })}>
                  <Plus width={14} height={14} /> Add
                </button>
              </div>
              {mine.length === 0 ? (
                <Empty icon={Book} title="You haven't added any lessons yet">Add lessons on top of the default list; the admin reviews them before they go live.</Empty>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Code</th><th>Lesson</th><th style={{ width: 90 }}>Level</th><th style={{ width: 70 }}>Hours</th><th style={{ width: 130 }}>Status</th><th /></tr></thead>
                    <tbody>
                      {mine.map((m) => {
                        const editable = m.status !== 'approved'
                        return (
                          <tr key={m.id}>
                            <td><span className="tiny bold accent">{m.code || '—'}</span></td>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td><Badge>{m.level || '—'}</Badge></td>
                            <td className="small muted">{m.hours != null ? `${m.hours} h` : '—'}</td>
                            <td>
                              {m.status === 'approved'
                                ? <Badge tone="success">Approved</Badge>
                                : m.status === 'rejected'
                                  ? <Badge tone="danger">Rejected</Badge>
                                  : <Badge tone="warning">Pending review</Badge>}
                            </td>
                            <td>
                              <div className="row" style={{ gap: 5, justifyContent: 'flex-end' }}>
                                {editable && (
                                  <>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModuleForm(m)} aria-label="Edit">
                                      <Edit width={15} height={15} />
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm btn-icon"
                                      style={{ color: 'var(--danger)' }}
                                      aria-label="Delete"
                                      onClick={async () => {
                                        if (!(await app.confirm({ title: 'Delete lesson?', text: `"${m.name}" will be removed.`, confirmText: 'Delete' }))) return
                                        app.dispatch({ type: 'module/remove', id: m.id })
                                        app.toast('Lesson removed', 'err')
                                      }}
                                    >
                                      <Trash width={15} height={15} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            Default lessons are maintained by the platform administrator and are read-only. Lessons you add are submitted for
            approval; once approved they become shared and can no longer be edited here.
          </p>
        </div>
      </Card>

      {moduleForm && subject && (
        <ModuleModal
          value={moduleForm}
          subject={subject}
          onClose={() => setModuleForm(null)}
          onSubmit={(payload) => {
            if (moduleForm.id) {
              app.dispatch({ type: 'module/update', id: moduleForm.id, payload })
              app.toast('Lesson updated')
            } else {
              app.dispatch({ type: 'module/add', payload: { ...payload, subjectId: subject.id } })
              app.toast('Lesson submitted for approval')
            }
            setModuleForm(null)
          }}
        />
      )}
    </>
  )
}

function ModuleModal({ value, subject, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit lesson' : `New lesson in ${subject.name}`}
      subtitle="Lesson names can be in Sinhala, English or both."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!f.name.trim()}
            onClick={() => onSubmit({
              code: f.code.trim() || null,
              name: f.name.trim(),
              level: f.level,
              hours: f.hours === '' ? null : Number(f.hours),
            })}
          >
            {value.id ? 'Save' : 'Submit for approval'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Field label="Lesson code" hint="Optional short code.">
            <input className="input" placeholder="MATH-301" value={f.code} onChange={set('code')} />
          </Field>
          <Field label="Level">
            <select className="select" value={f.level} onChange={set('level')}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Lesson name">
          <input className="input" placeholder="e.g. Vector Geometry" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Teaching hours" hint="Guideline duration shown to students.">
          <input className="input" type="number" min="0" value={f.hours ?? ''} onChange={set('hours')} />
        </Field>
      </div>
    </Modal>
  )
}
