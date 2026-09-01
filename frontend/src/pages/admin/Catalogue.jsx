import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Plus, Book, Trash, Edit, Layers, Info } from '../../components/icons.jsx'

const blankSubject = { name: '', description: '', color: 245, icon: 'book' }
const blankModule = { code: '', name: '', level: 'A/L', hours: 20 }

/**
 * The admin owns this catalogue. Instructors register against these modules
 * and cannot invent their own, which keeps search and filtering coherent.
 */
export default function Catalogue() {
  const app = useApp()
  const [subjectId, setSubjectId] = useState(app.subjects[0]?.id)
  const [subjectForm, setSubjectForm] = useState(null)
  const [moduleForm, setModuleForm] = useState(null)

  const subject = app.subjectById[subjectId] || app.subjects[0]
  const mods = subject ? app.modules.filter((m) => m.subjectId === subject.id) : []

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Subjects &amp; modules</h1>
            <p className="sub">Define what can be taught on the platform. Instructors pick from this list only.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setSubjectForm({ ...blankSubject })}>
            <Plus width={16} height={16} /> New subject
          </button>
          <button className="btn btn-primary" disabled={!subject} onClick={() => setModuleForm({ ...blankModule })}>
            <Plus width={16} height={16} /> New module
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(230px, 1fr) minmax(0, 2.6fr)' }}>
        {/* subject list */}
        <Card pad={false} style={{ alignSelf: 'flex-start' }}>
          <div className="row" style={{ padding: '16px 16px 10px' }}>
            <Layers width={16} height={16} className="accent" />
            <h3 style={{ flex: 1 }}>Subjects</h3>
            <Badge>{app.subjects.length}</Badge>
          </div>
          <div style={{ padding: '0 8px 10px' }}>
            {app.subjects.map((s) => {
              const count = app.modules.filter((m) => m.subjectId === s.id).length
              return (
                <button
                  key={s.id}
                  className={`nav-item ${subject?.id === s.id ? 'active' : ''}`}
                  style={{ width: '100%', border: 0, background: subject?.id === s.id ? undefined : 'none', font: 'inherit', textAlign: 'left' }}
                  onClick={() => setSubjectId(s.id)}
                >
                  <span
                    style={{
                      width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', flex: 'none',
                      background: `hsl(${s.color} 60% 50% / .16)`, color: `hsl(${s.color} 60% 45%)`,
                    }}
                  >
                    <Book width={14} height={14} />
                  </span>
                  <span className="truncate" style={{ flex: 1 }}>{s.name}</span>
                  <span className="tiny faint">{count}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* module table */}
        {!subject ? (
          <Card><Empty icon={Layers} title="No subjects yet">Create a subject to start building the catalogue.</Empty></Card>
        ) : (
          <Card pad={false}>
            <div className="row wrap" style={{ padding: 'var(--pad)', gap: 12, borderBottom: '1px solid var(--border)' }}>
              <span
                style={{
                  width: 44, height: 44, borderRadius: 'var(--r)', display: 'grid', placeItems: 'center',
                  background: `hsl(${subject.color} 60% 50% / .14)`, color: `hsl(${subject.color} 60% 45%)`,
                }}
              >
                <Book width={21} height={21} />
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <h2>{subject.name}</h2>
                <p className="small muted">{subject.description}</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setSubjectForm(subject)}>
                <Edit width={14} height={14} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (mods.length) return app.toast('Remove its modules first', 'err')
                  app.dispatch({ type: 'subject/remove', id: subject.id })
                  setSubjectId(app.subjects.find((s) => s.id !== subject.id)?.id)
                  app.toast('Subject removed', 'err')
                }}
              >
                <Trash width={14} height={14} />
              </button>
            </div>

            {mods.length === 0 ? (
              <Empty
                icon={Book}
                title="No modules in this subject"
                action={<button className="btn btn-primary" onClick={() => setModuleForm({ ...blankModule })}><Plus width={15} height={15} /> Add module</button>}
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Code</th><th>Module</th><th>Level</th><th>Hours</th><th>Instructors</th><th /></tr>
                  </thead>
                  <tbody>
                    {mods.map((m) => {
                      const teachers = app.instructors.filter((i) => i.moduleIds.includes(m.id))
                      return (
                        <tr key={m.id}>
                          <td><span className="tiny bold accent">{m.code}</span></td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td><Badge>{m.level}</Badge></td>
                          <td className="small muted">{m.hours} h</td>
                          <td>
                            {teachers.length === 0 ? (
                              <span className="tiny faint">none yet</span>
                            ) : (
                              <div className="row" style={{ gap: 0 }}>
                                {teachers.slice(0, 4).map((t, i) => (
                                  <span key={t.id} title={t.name} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--surface)', borderRadius: '50%' }}>
                                    <Avatar name={t.name} hue={t.hue} size={24} />
                                  </span>
                                ))}
                                {teachers.length > 4 && <span className="tiny faint" style={{ marginLeft: 7 }}>+{teachers.length - 4}</span>}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="row" style={{ gap: 5, justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModuleForm(m)} aria-label="Edit">
                                <Edit width={15} height={15} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                style={{ color: 'var(--danger)' }}
                                aria-label="Delete"
                                onClick={() => {
                                  app.dispatch({ type: 'module/remove', id: m.id })
                                  app.toast('Module removed', 'err')
                                }}
                              >
                                <Trash width={15} height={15} />
                              </button>
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
        )}
      </div>

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            Deleting a module also removes it from every instructor who registered for it, and hides it from student
            search. Existing bookings keep their historical reference.
          </p>
        </div>
      </Card>

      {subjectForm && (
        <SubjectModal
          value={subjectForm}
          onClose={() => setSubjectForm(null)}
          onSubmit={(payload) => {
            if (subjectForm.id) {
              app.dispatch({ type: 'subject/update', id: subjectForm.id, payload })
              app.toast('Subject updated')
            } else {
              app.dispatch({ type: 'subject/add', payload })
              app.toast('Subject created')
            }
            setSubjectForm(null)
          }}
        />
      )}

      {moduleForm && subject && (
        <ModuleModal
          value={moduleForm}
          subject={subject}
          onClose={() => setModuleForm(null)}
          onSubmit={(payload) => {
            if (moduleForm.id) {
              app.dispatch({ type: 'module/update', id: moduleForm.id, payload })
              app.toast('Module updated')
            } else {
              app.dispatch({ type: 'module/add', payload: { ...payload, subjectId: subject.id } })
              app.toast('Module added')
            }
            setModuleForm(null)
          }}
        />
      )}
    </>
  )
}

function SubjectModal({ value, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit subject' : 'New subject'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!f.name.trim()} onClick={() => onSubmit({ ...f, color: Number(f.color) })}>
            {value.id ? 'Save' : 'Create subject'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Subject name">
          <input className="input" placeholder="e.g. Biology" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" placeholder="What does this subject cover?" value={f.description} onChange={set('description')} />
        </Field>
        <Field label="Accent hue" hint="Used for the subject badge colour.">
          <input
            type="range"
            min="0"
            max="360"
            value={f.color}
            onChange={set('color')}
            style={{
              background:
                'linear-gradient(to right, hsl(0 70% 55%), hsl(60 70% 55%), hsl(120 70% 55%), hsl(180 70% 55%), hsl(240 70% 55%), hsl(300 70% 55%), hsl(360 70% 55%))',
            }}
          />
          <span
            className="row"
            style={{ gap: 9, marginTop: 8, padding: '9px 12px', borderRadius: 'var(--r)', background: `hsl(${f.color} 60% 50% / .14)`, color: `hsl(${f.color} 60% 45%)` }}
          >
            <Book width={17} height={17} />
            <b>{f.name || 'Subject preview'}</b>
          </span>
        </Field>
      </div>
    </Modal>
  )
}

function ModuleModal({ value, subject, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit module' : `New module in ${subject.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!f.name.trim() || !f.code.trim()}
            onClick={() => onSubmit({ ...f, hours: Number(f.hours) })}
          >
            {value.id ? 'Save' : 'Add module'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <Field label="Module code">
            <input className="input" placeholder="MATH-301" value={f.code} onChange={set('code')} />
          </Field>
          <Field label="Level">
            <select className="select" value={f.level} onChange={set('level')}>
              {['Beginner', 'Intermediate', 'Advanced', 'O/L', 'A/L'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Module name">
          <input className="input" placeholder="e.g. Vector Geometry" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Teaching hours" hint="Guideline duration shown to students.">
          <input className="input" type="number" min="1" value={f.hours} onChange={set('hours')} />
        </Field>
      </div>
    </Modal>
  )
}
