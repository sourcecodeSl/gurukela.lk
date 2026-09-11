import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Plus, Book, Trash, Edit, Layers, Info } from '../../components/icons.jsx'

const blankStream = { name: '', color: 245 }
const blankSubject = { name: '', description: '', color: 245, icon: 'book', grade: '' }
const blankModule = { code: '', name: '', level: 'A/L', hours: 20 }
const blankLesson = { name: '', hours: 2 }

// O/L is taught grade by grade, so its subjects are pinned to a grade.
// Other streams (A/L, etc.) have no grade dimension.
const OL_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11']
const isOLStream = (s) => s?.name?.trim().toUpperCase() === 'O/L'

/**
 * The admin owns this catalogue tree: Stream -> Subject -> Lesson -> Sub-lesson.
 * Instructors register against these lessons and cannot invent their own,
 * which keeps search and filtering coherent.
 */
export default function Catalogue() {
  const app = useApp()
  const [streamId, setStreamId] = useState(app.streams[0]?.id)
  const [subjectId, setSubjectId] = useState(null)
  const [moduleId, setModuleId] = useState(null)
  const [grade, setGrade] = useState(OL_GRADES[0])
  const [streamForm, setStreamForm] = useState(null)
  const [subjectForm, setSubjectForm] = useState(null)
  const [moduleForm, setModuleForm] = useState(null)
  const [lessonForm, setLessonForm] = useState(null)

  const stream = app.streamById[streamId] || app.streams[0]
  const isOL = isOLStream(stream)
  const allStreamSubjects = stream ? app.subjectsOfStream(stream.id) : []
  // O/L subjects are shown one grade at a time; other streams show them all.
  const streamSubjects = isOL ? allStreamSubjects.filter((s) => s.grade === grade) : allStreamSubjects
  const subject = streamSubjects.find((s) => s.id === subjectId) || null
  const mods = subject ? app.modules.filter((m) => m.subjectId === subject.id) : []
  const selectedModule = mods.find((m) => m.id === moduleId) || null
  const sublessons = selectedModule ? app.defaultLessonsOf(selectedModule.id) : []

  const pickStream = (id) => { setStreamId(id); setSubjectId(null); setModuleId(null) }
  const pickSubject = (id) => { setSubjectId(id); setModuleId(null) }
  const pickGrade = (g) => { setGrade(g); setSubjectId(null); setModuleId(null) }

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Streams</h1>
            <p className="sub">Define what can be taught: Stream › Subject › Lesson › Sub-lesson. Instructors pick from this list only.</p>
          </div>
          <button className="btn btn-outline" onClick={() => setStreamForm({ ...blankStream })}>
            <Plus width={16} height={16} /> New stream
          </button>
          <button className="btn btn-outline" disabled={!stream} onClick={() => setSubjectForm({ ...blankSubject, grade: isOL ? grade : '' })}>
            <Plus width={16} height={16} /> New subject
          </button>
          <button className="btn btn-primary" disabled={!subject} onClick={() => setModuleForm({ ...blankModule })}>
            <Plus width={16} height={16} /> New lesson
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 1fr) minmax(0, 2.6fr)' }}>
        {/* stream list */}
        <Card pad={false} style={{ alignSelf: 'flex-start' }}>
          <div className="row" style={{ padding: '16px 16px 10px' }}>
            <Layers width={16} height={16} className="accent" />
            <h3 style={{ flex: 1 }}>Streams</h3>
            <Badge>{app.streams.length}</Badge>
          </div>
          <div style={{ padding: '0 8px 10px' }}>
            {app.streams.length === 0 && <p className="tiny faint" style={{ padding: '4px 8px 8px' }}>No streams yet.</p>}
            {app.streams.map((s) => {
              const count = app.subjectsOfStream(s.id).length
              return (
                <button
                  key={s.id}
                  className={`nav-item ${stream?.id === s.id ? 'active' : ''}`}
                  style={{ width: '100%', border: 0, background: stream?.id === s.id ? undefined : 'none', font: 'inherit', textAlign: 'left' }}
                  onClick={() => pickStream(s.id)}
                >
                  <span
                    style={{
                      width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', flex: 'none',
                      background: `hsl(${s.color ?? 245} 60% 50% / .16)`, color: `hsl(${s.color ?? 245} 60% 45%)`,
                    }}
                  >
                    <Layers width={14} height={14} />
                  </span>
                  <span className="truncate" style={{ flex: 1 }}>{s.name}</span>
                  <span className="tiny faint">{count}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* subjects in the selected stream */}
        {!stream ? (
          <Card><Empty icon={Layers} title="No streams yet">Create a stream to start building the catalogue.</Empty></Card>
        ) : (
          <Card pad={false}>
            <div className="row wrap" style={{ padding: 'var(--pad)', gap: 12, borderBottom: '1px solid var(--border)' }}>
              <span
                style={{
                  width: 44, height: 44, borderRadius: 'var(--r)', display: 'grid', placeItems: 'center',
                  background: `hsl(${stream.color ?? 245} 60% 50% / .14)`, color: `hsl(${stream.color ?? 245} 60% 45%)`,
                }}
              >
                <Layers width={21} height={21} />
              </span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <h2>{stream.name}</h2>
                <p className="small muted">{streamSubjects.length} subject{streamSubjects.length === 1 ? '' : 's'}</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setStreamForm(stream)}>
                <Edit width={14} height={14} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  if (allStreamSubjects.length) return app.toast('Remove its subjects first', 'err')
                  if (!(await app.confirm({ title: 'Delete stream?', text: `"${stream.name}" will be permanently removed.`, confirmText: 'Delete' }))) return
                  app.dispatch({ type: 'stream/remove', id: stream.id })
                  pickStream(app.streams.find((s) => s.id !== stream.id)?.id)
                  app.toast('Stream removed', 'err')
                }}
              >
                <Trash width={14} height={14} />
              </button>
            </div>

            {isOL && (
              <div className="row wrap" style={{ gap: 6, padding: '12px var(--pad)', borderBottom: '1px solid var(--border)' }}>
                <span className="tiny faint" style={{ width: '100%', marginBottom: 2 }}>Grade</span>
                {OL_GRADES.map((g) => {
                  const count = allStreamSubjects.filter((s) => s.grade === g).length
                  return (
                    <button
                      key={g}
                      className={`chip ${g === grade ? 'on' : ''}`}
                      onClick={() => pickGrade(g)}
                    >
                      {g}{count ? ` · ${count}` : ''}
                    </button>
                  )
                })}
              </div>
            )}

            {streamSubjects.length === 0 ? (
              <Empty
                icon={Book}
                title={isOL ? `No subjects in ${grade} yet` : 'No subjects here yet'}
                action={<button className="btn btn-primary" onClick={() => setSubjectForm({ ...blankSubject, grade: isOL ? grade : '' })}><Plus width={15} height={15} /> Add subject</button>}
              />
            ) : (
              <div style={{ padding: '10px 8px' }}>
                {streamSubjects.map((s) => {
                  const active = s.id === subject?.id
                  const count = app.modules.filter((m) => m.subjectId === s.id).length
                  return (
                    <div
                      key={s.id}
                      className={`nav-item ${active ? 'active' : ''}`}
                      style={{ width: '100%', cursor: 'pointer', background: active ? undefined : 'none' }}
                      onClick={() => pickSubject(active ? null : s.id)}
                    >
                      <span
                        style={{
                          width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', flex: 'none',
                          background: `hsl(${s.color ?? 245} 60% 50% / .16)`, color: `hsl(${s.color ?? 245} 60% 45%)`,
                        }}
                      >
                        <Book width={14} height={14} />
                      </span>
                      <span className="truncate" style={{ flex: 1 }}>{s.name}</span>
                      <span className="tiny faint">{count} lesson{count === 1 ? '' : 's'}</span>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setSubjectForm(s) }} aria-label="Edit subject">
                        <Edit width={14} height={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--danger)' }}
                        aria-label="Delete subject"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!(await app.confirm({ title: 'Delete subject?', text: `"${s.name}" and its lessons will be permanently removed.`, confirmText: 'Delete' }))) return
                          if (s.id === subjectId) pickSubject(null)
                          app.dispatch({ type: 'subject/remove', id: s.id })
                          app.toast('Subject removed', 'err')
                        }}
                      >
                        <Trash width={14} height={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* lessons of the selected subject */}
      {subject && (
        <Card pad={false} style={{ marginTop: 'var(--gap)' }}>
          <div className="row wrap" style={{ padding: 'var(--pad)', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <Book width={17} height={17} className="accent" />
            <div style={{ flex: 1, minWidth: 160 }}>
              <h3>Lessons: {subject.name}</h3>
              <p className="tiny faint">{subject.description}</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setModuleForm({ ...blankModule })}>
              <Plus width={14} height={14} /> Add lesson
            </button>
          </div>
          {mods.length === 0 ? (
            <Empty icon={Book} title="No lessons here yet">Add the lessons taught under this subject.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Code</th><th>Lesson</th><th>Level</th><th>Hours</th><th>Instructors</th><th /></tr>
                </thead>
                <tbody>
                  {mods.map((m) => {
                    const teachers = app.instructors.filter((i) => i.subjectIds?.includes(m.subjectId))
                    const active = m.id === selectedModule?.id
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setModuleId(active ? null : m.id)}
                        style={{ cursor: 'pointer', background: active ? 'var(--accent-soft)' : undefined }}
                        title="Manage sub-lessons"
                      >
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
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setModuleForm(m) }} aria-label="Edit">
                              <Edit width={15} height={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ color: 'var(--danger)' }}
                              aria-label="Delete"
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!(await app.confirm({ title: 'Delete lesson?', text: `"${m.name}" and its sub-lessons will be permanently removed.`, confirmText: 'Delete' }))) return
                                if (m.id === moduleId) setModuleId(null)
                                app.dispatch({ type: 'module/remove', id: m.id })
                                app.toast('Lesson removed', 'err')
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

      {/* sub-lessons of the selected lesson */}
      {subject && (
        <Card pad={false} style={{ marginTop: 'var(--gap)' }}>
          <div className="row wrap" style={{ padding: 'var(--pad)', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <Layers width={17} height={17} className="accent" />
            <div style={{ flex: 1, minWidth: 160 }}>
              <h3>{selectedModule ? `Default sub-lessons: ${selectedModule.name}` : 'Default sub-lessons'}</h3>
              <p className="tiny faint">The syllabus every instructor starts from. They can add their own on top of these.</p>
            </div>
            {selectedModule && (
              <>
                <Badge>{sublessons.length} sub-lesson{sublessons.length === 1 ? '' : 's'}</Badge>
                <button className="btn btn-outline btn-sm" onClick={() => setLessonForm({ ...blankLesson })}>
                  <Plus width={14} height={14} /> Add sub-lesson
                </button>
              </>
            )}
          </div>
          {!selectedModule ? (
            <Empty icon={Book} title="Select a lesson above">Pick a lesson to manage its sub-lessons.</Empty>
          ) : sublessons.length === 0 ? (
            <Empty icon={Book} title="No default sub-lessons yet">Add the standard sub-lessons for this lesson.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th style={{ width: 46 }}>#</th><th>Sub-lesson</th><th style={{ width: 90 }}>Hours</th><th /></tr></thead>
                <tbody>
                  {sublessons.map((l, i) => (
                    <tr key={l.id}>
                      <td className="tiny bold accent">{String(i + 1).padStart(2, '0')}</td>
                      <td style={{ fontWeight: 600 }}>{l.name}</td>
                      <td className="small muted">{l.hours != null ? `${l.hours} h` : '—'}</td>
                      <td>
                        <div className="row" style={{ gap: 5, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setLessonForm(l)} aria-label="Edit">
                            <Edit width={15} height={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            style={{ color: 'var(--danger)' }}
                            aria-label="Delete"
                            onClick={async () => {
                              if (!(await app.confirm({ title: 'Delete sub-lesson?', text: `"${l.name}" will be permanently removed.`, confirmText: 'Delete' }))) return
                              app.dispatch({ type: 'lesson/remove', id: l.id })
                              app.toast('Sub-lesson removed', 'err')
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
          )}
        </Card>
      )}

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            Deleting a stream removes every subject, lesson and sub-lesson beneath it, and unregisters instructors from those
            lessons. Existing bookings keep their historical reference.
          </p>
        </div>
      </Card>

      {streamForm && (
        <StreamModal
          value={streamForm}
          onClose={() => setStreamForm(null)}
          onSubmit={(payload) => {
            if (streamForm.id) {
              app.dispatch({ type: 'stream/update', id: streamForm.id, payload })
              app.toast('Stream updated')
            } else {
              app.dispatch({ type: 'stream/add', payload })
              app.toast('Stream created')
            }
            setStreamForm(null)
          }}
        />
      )}

      {subjectForm && stream && (
        <SubjectModal
          value={subjectForm}
          stream={stream}
          onClose={() => setSubjectForm(null)}
          onSubmit={(payload) => {
            if (subjectForm.id) {
              app.dispatch({ type: 'subject/update', id: subjectForm.id, payload })
              app.toast('Subject updated')
            } else {
              app.dispatch({ type: 'subject/add', payload: { ...payload, streamId: stream.id } })
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
              app.toast('Lesson updated')
            } else {
              app.dispatch({ type: 'module/add', payload: { ...payload, subjectId: subject.id } })
              app.toast('Lesson added')
            }
            setModuleForm(null)
          }}
        />
      )}

      {lessonForm && selectedModule && (
        <LessonModal
          value={lessonForm}
          module={selectedModule}
          onClose={() => setLessonForm(null)}
          onSubmit={(payload) => {
            if (lessonForm.id) {
              app.dispatch({ type: 'lesson/update', id: lessonForm.id, payload })
              app.toast('Sub-lesson updated')
            } else {
              app.dispatch({
                type: 'lesson/add',
                payload: { ...payload, moduleId: selectedModule.id, position: sublessons.length },
              })
              app.toast('Sub-lesson added')
            }
            setLessonForm(null)
          }}
        />
      )}
    </>
  )
}

function ColorField({ value, onChange, previewIcon, previewLabel }) {
  return (
    <Field label="Accent hue" hint="Used for the badge colour.">
      <input
        type="range"
        min="0"
        max="360"
        value={value}
        onChange={onChange}
        style={{
          background:
            'linear-gradient(to right, hsl(0 70% 55%), hsl(60 70% 55%), hsl(120 70% 55%), hsl(180 70% 55%), hsl(240 70% 55%), hsl(300 70% 55%), hsl(360 70% 55%))',
        }}
      />
      <span
        className="row"
        style={{ gap: 9, marginTop: 8, padding: '9px 12px', borderRadius: 'var(--r)', background: `hsl(${value} 60% 50% / .14)`, color: `hsl(${value} 60% 45%)` }}
      >
        {previewIcon}
        <b>{previewLabel}</b>
      </span>
    </Field>
  )
}

function StreamModal({ value, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit stream' : 'New stream'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!f.name.trim()} onClick={() => onSubmit({ ...f, color: Number(f.color) })}>
            {value.id ? 'Save' : 'Create stream'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Stream name">
          <input className="input" placeholder="e.g. O/L, A/L Physical Science, ICT" value={f.name} onChange={set('name')} />
        </Field>
        <ColorField
          value={f.color}
          onChange={set('color')}
          previewIcon={<Layers width={17} height={17} />}
          previewLabel={f.name || 'Stream preview'}
        />
      </div>
    </Modal>
  )
}

function SubjectModal({ value, stream, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const isOL = isOLStream(stream)
  const canSave = f.name.trim() && (!isOL || f.grade)

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit subject' : `New subject in ${stream.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={() => onSubmit({ ...f, color: Number(f.color), grade: isOL ? f.grade : null })}>
            {value.id ? 'Save' : 'Create subject'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        {isOL && (
          <Field label="Grade" hint="O/L subjects belong to a specific grade.">
            <select className="select" value={f.grade || ''} onChange={set('grade')}>
              <option value="">Select…</option>
              {OL_GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Subject name">
          <input className="input" placeholder="e.g. Biology" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" placeholder="What does this subject cover?" value={f.description} onChange={set('description')} />
        </Field>
        <ColorField
          value={f.color}
          onChange={set('color')}
          previewIcon={<Book width={17} height={17} />}
          previewLabel={f.name || 'Subject preview'}
        />
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
      title={value.id ? 'Edit lesson' : `New lesson in ${subject.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!f.name.trim() || !f.code.trim()}
            onClick={() => onSubmit({ ...f, hours: Number(f.hours) })}
          >
            {value.id ? 'Save' : 'Add lesson'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <Field label="Lesson code">
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
        <Field label="Lesson name">
          <input className="input" placeholder="e.g. Vector Geometry" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Teaching hours" hint="Guideline duration shown to students.">
          <input className="input" type="number" min="1" value={f.hours} onChange={set('hours')} />
        </Field>
      </div>
    </Modal>
  )
}

function LessonModal({ value, module, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit sub-lesson' : `New sub-lesson in ${module.name}`}
      subtitle="Sub-lesson names can be in Sinhala, English or both."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!f.name.trim()}
            onClick={() => onSubmit({ name: f.name.trim(), hours: f.hours === '' ? null : Number(f.hours) })}
          >
            {value.id ? 'Save' : 'Add sub-lesson'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Sub-lesson name">
          <textarea
            className="textarea"
            style={{ minHeight: 60 }}
            placeholder="e.g. තොරතුරු හා සන්නිවේදන තාක්ෂණය - Information and Communication Technology"
            value={f.name}
            onChange={set('name')}
          />
        </Field>
        <Field label="Hours" hint="Estimated teaching hours for this sub-lesson.">
          <input className="input" type="number" min="0" value={f.hours ?? ''} onChange={set('hours')} />
        </Field>
      </div>
    </Modal>
  )
}
