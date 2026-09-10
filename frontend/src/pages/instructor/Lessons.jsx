import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Plus, Book, Trash, Edit, Layers, Info } from '../../components/icons.jsx'

const blankLesson = { name: '', hours: 2 }

/**
 * Instructors start from the admin's default sub-lessons for a lesson and add
 * their own on top. They can edit or remove only their own sub-lessons;
 * the defaults are read-only.
 */
export default function Lessons() {
  const app = useApp()
  const me = app.instructorById[app.session.id]

  // Lessons the instructor teaches, falling back to the whole catalogue so a
  // new instructor who hasn't picked lessons yet can still browse.
  const myLessons = useMemo(() => {
    const taught = app.modulesOf(me.id)
    return taught.length ? taught : app.modules
  }, [app, me.id])

  const [moduleId, setModuleId] = useState(myLessons[0]?.id)
  const [lessonForm, setLessonForm] = useState(null)

  const lesson = app.moduleById[moduleId] || myLessons[0]
  const defaults = lesson ? app.defaultLessonsOf(lesson.id) : []
  const mine = lesson ? app.instructorLessonsOf(lesson.id, me.id) : []

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My sub-lessons</h1>
            <p className="sub">Start from the default syllabus and add your own sub-lessons. Students see these on your profile.</p>
          </div>
          <button className="btn btn-primary" disabled={!lesson} onClick={() => setLessonForm({ ...blankLesson })}>
            <Plus width={16} height={16} /> Add sub-lesson
          </button>
        </div>
      </div>

      {myLessons.length === 0 ? (
        <Card><Empty icon={Layers} title="No lessons yet">Once the admin adds lessons you can build your sub-lessons here.</Empty></Card>
      ) : (
        <>
          <Field label="Lesson">
            <select
              className="select"
              style={{ maxWidth: 340 }}
              value={lesson?.id || ''}
              onChange={(e) => setModuleId(e.target.value)}
            >
              {myLessons.map((m) => (
                <option key={m.id} value={m.id}>{m.code ? `${m.code} · ${m.name}` : m.name}</option>
              ))}
            </select>
          </Field>

          <div className="col" style={{ gap: 'var(--gap)', marginTop: 18 }}>
            {/* default syllabus */}
            <Card pad={false}>
              <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
                <Layers width={16} height={16} className="accent" />
                <h3 style={{ flex: 1 }}>Default syllabus</h3>
                <Badge>{defaults.length}</Badge>
              </div>
              {defaults.length === 0 ? (
                <Empty icon={Book} title="No default sub-lessons for this lesson" />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th style={{ width: 46 }}>#</th><th>Sub-lesson</th><th style={{ width: 90 }}>Hours</th></tr></thead>
                    <tbody>
                      {defaults.map((l, i) => (
                        <tr key={l.id}>
                          <td className="tiny bold faint">{String(i + 1).padStart(2, '0')}</td>
                          <td>{l.name}</td>
                          <td className="small muted">{l.hours != null ? `${l.hours} h` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* the instructor's own sub-lessons */}
            <Card pad={false}>
              <div className="row wrap" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
                <Book width={16} height={16} className="accent" />
                <h3 style={{ flex: 1 }}>My sub-lessons</h3>
                <Badge tone="accent">{mine.length}</Badge>
                <button className="btn btn-outline btn-sm" onClick={() => setLessonForm({ ...blankLesson })}>
                  <Plus width={14} height={14} /> Add
                </button>
              </div>
              {mine.length === 0 ? (
                <Empty icon={Book} title="You haven't added any sub-lessons yet">Add sub-lessons on top of the default syllabus.</Empty>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th style={{ width: 46 }}>#</th><th>Sub-lesson</th><th style={{ width: 90 }}>Hours</th><th /></tr></thead>
                    <tbody>
                      {mine.map((l, i) => (
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
                                onClick={() => {
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
          </div>
        </>
      )}

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            The default syllabus is maintained by the platform administrator and is read-only. Any sub-lessons you add here are
            your own and can be edited or removed anytime.
          </p>
        </div>
      </Card>

      {lessonForm && lesson && (
        <LessonModal
          value={lessonForm}
          lesson={lesson}
          onClose={() => setLessonForm(null)}
          onSubmit={(payload) => {
            if (lessonForm.id) {
              app.dispatch({ type: 'lesson/update', id: lessonForm.id, payload })
              app.toast('Sub-lesson updated')
            } else {
              app.dispatch({ type: 'lesson/add', payload: { ...payload, moduleId: lesson.id, position: mine.length } })
              app.toast('Sub-lesson added')
            }
            setLessonForm(null)
          }}
        />
      )}
    </>
  )
}

function LessonModal({ value, lesson, onClose, onSubmit }) {
  const [f, setF] = useState(value)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit sub-lesson' : `New sub-lesson in ${lesson.name}`}
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
            placeholder="e.g. වදන් සැකසීම - Word Processing"
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
