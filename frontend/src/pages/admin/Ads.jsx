import { useRef, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { api } from '../../api/client.js'
import { Card, Empty, Field, Modal } from '../../components/ui.jsx'
import { Plus, Trash, Edit, Grid, Info, Check } from '../../components/icons.jsx'

const blankAd = { title: '', text: '', imageUrl: '', link: '', position: 1, isActive: true }

/**
 * Admin manager for the home-page side-rail ads. Admin can create ads,
 * order them with `position` (1,2,3,4), and switch each active/inactive.
 * Only active ads appear on the public site, in position order.
 */
export default function Ads() {
  const app = useApp()
  const [form, setForm] = useState(null)

  const ads = [...(app.ads || [])].sort((a, b) => a.position - b.position)

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Advertisements</h1>
            <p className="sub">These appear in the side rails of the public home page, in position order. Only active ads are shown.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setForm({ ...blankAd, position: ads.length + 1 })}>
            <Plus width={16} height={16} /> New ad
          </button>
        </div>
      </div>

      <Card pad={false}>
        {ads.length === 0 ? (
          <Empty
            icon={Grid}
            title="No ads yet"
            action={<button className="btn btn-primary" onClick={() => setForm({ ...blankAd })}><Plus width={15} height={15} /> Add ad</button>}
          >
            Create up to four ads to fill the home-page side rails.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Preview</th><th>Title</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td><span className="tiny bold accent">{ad.position}</span></td>
                    <td>
                      {ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt=""
                          style={{ width: 72, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <span className="tiny faint">no image</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ad.title || <span className="faint">Untitled</span>}</div>
                      {ad.text && <div className="tiny muted truncate" style={{ maxWidth: 320 }}>{ad.text}</div>}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${ad.isActive ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => {
                          app.dispatch({ type: 'ad/setActive', id: ad.id, isActive: !ad.isActive })
                          app.toast(ad.isActive ? 'Ad deactivated' : 'Ad activated', ad.isActive ? 'err' : 'ok')
                        }}
                      >
                        {ad.isActive ? <><Check width={13} height={13} /> Active</> : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 5, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setForm(ad)} aria-label="Edit">
                          <Edit width={15} height={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          aria-label="Delete"
                          onClick={async () => {
                            if (!(await app.confirm({ title: 'Delete ad?', text: 'This advertisement will be permanently removed.', confirmText: 'Delete' }))) return
                            app.dispatch({ type: 'ad/remove', id: ad.id })
                            app.toast('Ad removed', 'err')
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

      <Card style={{ marginTop: 'var(--gap)', background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            The home page shows the first two active ads (by position) on the left rail and the next two on the right rail.
            Paste a hosted image URL, and optionally a title, short text and a link the ad opens when clicked.
          </p>
        </div>
      </Card>

      {form && (
        <AdModal
          value={form}
          onClose={() => setForm(null)}
          onSubmit={(payload) => {
            if (form.id) {
              app.dispatch({ type: 'ad/update', id: form.id, payload })
              app.toast('Ad updated')
            } else {
              app.dispatch({ type: 'ad/add', payload })
              app.toast('Ad created')
            }
            setForm(null)
          }}
        />
      )}
    </>
  )
}

function AdModal({ value, onClose, onSubmit }) {
  const app = useApp()
  const [f, setF] = useState(value)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    setUploading(true)
    try {
      const { url } = await api.upload('/ads/upload', fd)
      setF((prev) => ({ ...prev, imageUrl: url }))
    } catch (err) {
      app.toast(err.message || 'Image upload failed', 'err')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={value.id ? 'Edit ad' : 'New ad'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={uploading}
            onClick={() => onSubmit({ ...f, position: Number(f.position) || 0 })}
          >
            {value.id ? 'Save' : 'Create ad'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Image" hint="Upload a banner image (JPG/PNG, up to 5 MB).">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onPickImage}
          />
          {f.imageUrl && (
            <img
              src={f.imageUrl}
              alt=""
              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 10 }}
            />
          )}
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? 'Uploading…' : f.imageUrl ? 'Replace image' : 'Upload image'}
            </button>
            {f.imageUrl && !uploading && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setF({ ...f, imageUrl: '' })}>
                Remove
              </button>
            )}
          </div>
        </Field>
        <Field label="Title">
          <input className="input" placeholder="e.g. A/L Chemistry crash course" value={f.title} onChange={set('title')} />
        </Field>
        <Field label="Text">
          <textarea className="textarea" placeholder="Short line shown under the title" value={f.text} onChange={set('text')} />
        </Field>
        <Field label="Link" hint="Where the ad goes when clicked (optional).">
          <input className="input" placeholder="https://… or /lecturers" value={f.link} onChange={set('link')} />
        </Field>
        <div className="row" style={{ gap: 12 }}>
          <Field label="Position" hint="Display order (1–4).">
            <input className="input" type="number" min="1" value={f.position} onChange={set('position')} />
          </Field>
          <Field label="Status">
            <button
              type="button"
              className={`btn ${f.isActive ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setF({ ...f, isActive: !f.isActive })}
            >
              {f.isActive ? 'Active' : 'Inactive'}
            </button>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
