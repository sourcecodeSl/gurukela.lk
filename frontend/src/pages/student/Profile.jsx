import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { useAuth } from '../../store/AuthContext.jsx'
import { api } from '../../api/client.js'
import { Avatar, Badge, Card, Empty, Field, Spinner, fmtDate } from '../../components/ui.jsx'
import { Info, Layers, Copy } from '../../components/icons.jsx'

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'O/L', 'A/L']
// O/L / A/L students pick the year they sit the exam: this year through +4.
const EXAM_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i)

/** The signed-in student's own account details. Grade is editable. */
export default function Profile() {
  const app = useApp()
  const auth = useAuth()

  const me = app.me || {}
  const [editing, setEditing] = useState(false)
  const [grade, setGrade] = useState(me.grade || '')
  const [examYear, setExamYear] = useState(me.examYear ? String(me.examYear) : '')
  const [busy, setBusy] = useState(false)
  // Subject editing is independent of the grade editor.
  const [editingSubjects, setEditingSubjects] = useState(false)
  const [subjectIds, setSubjectIds] = useState(() => me.subjectIds || [])
  const [savingSubjects, setSavingSubjects] = useState(false)

  if (app.session.role !== 'student') {
    return (
      <Card>
        <Empty icon={Info} title="Student view only">Switch to the student account to see your profile.</Empty>
      </Card>
    )
  }

  const subjects = (me.subjectIds || []).map((id) => app.subjectById[id]).filter(Boolean)
  const needsExamYear = grade === 'O/L' || grade === 'A/L'

  const copy = (text) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
      .then(() => app.toast('Student ID copied'))
      .catch(() => app.toast('Could not copy', 'err'))
  }

  const startEdit = () => {
    setGrade(me.grade || '')
    setExamYear(me.examYear ? String(me.examYear) : '')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  const startEditSubjects = () => {
    setSubjectIds(me.subjectIds || [])
    setEditingSubjects(true)
  }

  const toggleSubject = (id) =>
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const saveSubjects = async () => {
    setSavingSubjects(true)
    try {
      await api.put(`/students/${me.id}`, { subjectIds })
      // Refresh the auth profile (source of truth) and the app lists.
      const fresh = await api.get('/auth/me')
      auth.setProfile(fresh.profile)
      await app.refresh()
      setEditingSubjects(false)
      app.toast('Subjects updated')
    } catch (e) {
      app.toast(e.message || 'Could not update your subjects', 'err')
    } finally {
      setSavingSubjects(false)
    }
  }

  const save = async () => {
    if (!grade) {
      app.toast('Please select a grade', 'err')
      return
    }
    if ((grade === 'O/L' || grade === 'A/L') && !examYear) {
      app.toast('Please select your exam year', 'err')
      return
    }
    setBusy(true)
    try {
      await api.put(`/students/${me.id}`, {
        grade,
        examYear: grade === 'O/L' || grade === 'A/L' ? Number(examYear) : null,
      })
      // Refresh the auth profile (source of truth) and the app lists.
      const fresh = await api.get('/auth/me')
      auth.setProfile(fresh.profile)
      await app.refresh()
      setEditing(false)
      app.toast('Grade updated')
    } catch (e) {
      app.toast(e.message || 'Could not update your grade', 'err')
    } finally {
      setBusy(false)
    }
  }

  const rows = [
    { label: 'Student ID', value: me.code || me.id, copy: true },
    { label: 'Email', value: me.email },
    { label: 'Mobile number', value: me.phone },
    { label: 'Birthday', value: me.birthday ? fmtDate(me.birthday, { day: 'numeric', month: 'long', year: 'numeric' }) : null },
    { label: 'Joined', value: me.joinedAt ? fmtDate(me.joinedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : null },
  ]

  return (
    <>
      <div className="page-head">
        <h1>My profile</h1>
        <p className="sub">Your account details on GetClass.</p>
      </div>

      <Card>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <Avatar name={me.name} hue={me.hue} size={64} />
          <div>
            <h2 style={{ fontSize: 20 }}>{me.name || 'Student'}</h2>
            <p className="small muted">Student</p>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {rows.map((r) => (
            <div key={r.label}>
              <p className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>{r.label}</p>
              {r.copy && r.value ? (
                <button
                  type="button"
                  onClick={() => copy(r.value)}
                  title="Click to copy"
                  className="row"
                  style={{
                    marginTop: 2, gap: 6, padding: 0, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--accent)', fontWeight: 700,
                  }}
                >
                  <span className="small" style={{ fontWeight: 700 }}>{r.value}</span>
                  <Copy width={13} height={13} />
                </button>
              ) : (
                <p className="small" style={{ fontWeight: 600, marginTop: 2 }}>{r.value || '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
          <div className="row" style={{ alignItems: 'center', marginBottom: editing ? 12 : 0 }}>
            <div style={{ flex: 1 }}>
              <p className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>Grade</p>
              {!editing && (
                <p className="small" style={{ fontWeight: 600, marginTop: 2 }}>
                  {me.grade || '—'}{me.examYear ? ` · ${me.examYear}` : ''}
                </p>
              )}
            </div>
            {!editing && (
              <button type="button" className="btn btn-outline btn-sm" onClick={startEdit}>
                Change grade
              </button>
            )}
          </div>

          {editing && (
            <div className="col" style={{ gap: 12, maxWidth: 420 }}>
              <div className="row wrap" style={{ gap: 12 }}>
                <Field label="Grade">
                  <select
                    className="select"
                    value={grade}
                    onChange={(e) => {
                      const g = e.target.value
                      setGrade(g)
                      if (g !== 'O/L' && g !== 'A/L') setExamYear('')
                    }}
                  >
                    <option value="">Select…</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </Field>
                {needsExamYear && (
                  <Field label={`${grade} exam year`}>
                    <select className="select" value={examYear} onChange={(e) => setExamYear(e.target.value)}>
                      <option value="">Select…</option>
                      {EXAM_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
                  {busy ? <><Spinner /> Saving…</> : 'Save'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={busy}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
          <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
            <p className="tiny faint" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '.04em' }}>Subjects</p>
            {!editingSubjects && (
              <button type="button" className="btn btn-outline btn-sm" onClick={startEditSubjects}>
                Change subjects
              </button>
            )}
          </div>

          {!editingSubjects ? (
            subjects.length ? (
              <div className="row wrap" style={{ gap: 8 }}>
                {subjects.map((s) => (
                  <Badge key={s.id} tone="accent"><Layers width={11} height={11} /> {s.name}</Badge>
                ))}
              </div>
            ) : (
              <p className="small muted">No subjects selected yet.</p>
            )
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {app.approvedSubjects.length === 0 ? (
                <p className="small muted">No subjects available yet.</p>
              ) : (
                <div className="chip-grid">
                  {app.approvedSubjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`chip ${subjectIds.includes(s.id) ? 'on' : ''}`}
                      onClick={() => toggleSubject(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveSubjects} disabled={savingSubjects}>
                  {savingSubjects ? <><Spinner /> Saving…</> : 'Save'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingSubjects(false)} disabled={savingSubjects}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
