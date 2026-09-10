import { useMemo, useRef, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { useAuth } from '../../store/AuthContext.jsx'
import { api } from '../../api/client.js'
import { Avatar, Card, Field } from '../../components/ui.jsx'
import { Check, Info, Plus } from '../../components/icons.jsx'
import { REQUIRED_PROFILE_FIELDS, missingProfileFields, isProfileComplete } from '../../lib/profile.js'

/**
 * A teacher must complete every required field here before they can use the
 * rest of the panel. Once complete the account waits for admin verification;
 * publishing stays locked until an admin verifies it.
 */
export default function Profile() {
  const app = useApp()
  const auth = useAuth()
  const me = app.instructorById[app.session.id] || {}
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    title: me.title || '',
    city: me.city || '',
    bio: me.bio || '',
    experienceYears: me.experienceYears ?? '',
    hourlyRate: me.hourlyRate ?? '',
  })
  const [subjectIds, setSubjectIds] = useState(me.subjectIds || [])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(me.photoUrl || null)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleSubject = (id) =>
    setSubjectIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  // Merge current form values onto `me` so the checklist reacts as they type.
  const draft = { ...me, ...form, subjectIds, photoUrl: photoPreview || me.photoUrl }
  const missing = missingProfileFields(draft)
  const complete = isProfileComplete(draft)

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!form.title.trim() || !form.city.trim() || !form.bio.trim() || subjectIds.length === 0) {
      app.toast('Please fill in all required fields', 'err')
      return
    }
    if (!photoPreview && !photoFile) {
      app.toast('Please add a profile picture', 'err')
      return
    }
    setBusy(true)
    try {
      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        await api.upload(`/instructors/${me.id}/photo`, fd)
      }
      await api.put(`/instructors/${me.id}`, {
        title: form.title.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        hourlyRate: form.hourlyRate === '' ? 0 : Number(form.hourlyRate),
      })
      await api.put(`/instructors/${me.id}/subjects`, { subjectIds })

      // Refresh both the auth profile (source of truth for the gate) and lists.
      const fresh = await api.get('/auth/me')
      auth.setProfile(fresh.profile)
      await app.refresh()

      setPhotoFile(null)
      app.toast(isProfileComplete(fresh.profile) ? 'Profile submitted for verification' : 'Profile saved')
    } catch (e) {
      app.toast(e.message || 'Could not save profile', 'err')
    } finally {
      setBusy(false)
    }
  }

  const subjects = app.subjects || []

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>{complete ? 'My profile' : 'Complete your profile'}</h1>
            <p className="sub">
              {complete
                ? 'Your profile is complete. Keep it up to date.'
                : 'Fill in every field below before you can publish classes, slots or materials. Your account is then sent for admin verification.'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={busy || !complete}>
            {busy ? 'Saving…' : complete ? 'Save profile' : 'Complete required fields'}
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', gap: 'var(--gap)' }}>
        <div className="col" style={{ gap: 'var(--gap)' }}>
          <Card className="col" style={{ gap: 16 }}>
            <h3>Profile picture</h3>
            <div className="row" style={{ gap: 16 }}>
              <Avatar name={me.name} hue={me.hue} size={72} src={photoPreview || undefined} />
              <div className="col" style={{ gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  <Plus width={14} height={14} /> {photoPreview ? 'Change photo' : 'Upload photo'}
                </button>
                <span className="tiny faint">JPG or PNG, up to 5 MB.</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            </div>
          </Card>

          <Card className="col" style={{ gap: 14 }}>
            <h3>Contact (verified at sign-up)</h3>
            <div className="row" style={{ gap: 12 }}>
              <Field label="Email">
                <input className="input" value={me.email || ''} disabled />
              </Field>
              <Field label="Mobile">
                <input className="input" value={me.phone || ''} disabled />
              </Field>
            </div>
            <p className="tiny faint">These come from your registration and cannot be changed here.</p>
          </Card>

          <Card className="col" style={{ gap: 14 }}>
            <h3>Teaching profile</h3>
            <Field label="Title / headline">
              <input className="input" placeholder="e.g. A/L Physics Teacher · 10 years experience" value={form.title} onChange={set('title')} />
            </Field>
            <div className="row" style={{ gap: 12 }}>
              <Field label="City">
                <input className="input" placeholder="e.g. Colombo" value={form.city} onChange={set('city')} />
              </Field>
              <Field label="Years of experience (optional)">
                <input className="input" type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} />
              </Field>
            </div>
            <Field label="Hourly rate (Rs., optional)">
              <input className="input" type="number" min="0" step="100" value={form.hourlyRate} onChange={set('hourlyRate')} />
            </Field>
            <Field label="About you">
              <textarea className="textarea" style={{ minHeight: 96 }} placeholder="Tell students about your teaching style and experience." value={form.bio} onChange={set('bio')} />
            </Field>
          </Card>

          <Card className="col" style={{ gap: 12 }}>
            <h3>Subjects you teach</h3>
            <p className="tiny faint" style={{ marginTop: -6 }}>Select at least one subject from the catalogue.</p>
            {subjects.length === 0 ? (
              <p className="small muted">No subjects available yet. Please contact the admin.</p>
            ) : (
              <div className="row wrap" style={{ gap: 7 }}>
                {subjects.map((s) => (
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
          </Card>
        </div>

        <div className="col" style={{ gap: 'var(--gap)' }}>
          <Card>
            <h3 style={{ marginBottom: 12 }}>Checklist</h3>
            <div className="col" style={{ gap: 9 }}>
              {REQUIRED_PROFILE_FIELDS.map((f) => {
                const done = !missing.some((m) => m.key === f.key)
                return (
                  <div key={f.key} className="row" style={{ gap: 9 }}>
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flex: 'none',
                        display: 'grid', placeItems: 'center',
                        background: done ? 'var(--success, #16a34a)' : 'var(--border)',
                        color: done ? '#fff' : 'var(--muted)',
                      }}
                    >
                      {done ? <Check width={13} height={13} /> : ''}
                    </span>
                    <span className="small" style={{ color: done ? 'var(--text)' : 'var(--muted)' }}>{f.label}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <Info width={17} height={17} className="accent" style={{ flex: 'none', marginTop: 2 }} />
              <p className="small muted" style={{ lineHeight: 1.6 }}>
                Once every field is complete your account is reviewed by an administrator. You can publish
                classes, slots and materials only after it is verified.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
