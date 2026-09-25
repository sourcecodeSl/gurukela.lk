import { useRef, useState } from 'react'
import { api } from '../api/client.js'
import { useApp } from '../store/AppContext.jsx'
import { Field, Modal, Spinner } from './ui.jsx'
import { Plus, X } from './icons.jsx'

// Shared MCQ question editing pieces, used by both the live quiz builder
// (instructor QuizManager) and the reusable MCQ bank builder. Kept in one place
// so the two stay identical on validation, correct-answer handling and images.

export const emptyOpt = () => ({ text: '', imageUrl: null })

// The set of correct option indexes for a stored question — reads the array
// field, falling back to the legacy single correctIndex.
export const correctSetOf = (q) =>
  Array.isArray(q.correctIndexes) && q.correctIndexes.length ? q.correctIndexes : [q.correctIndex ?? 0]

export const blankQuestion = () => ({
  text: '',
  imageUrl: null,
  options: [emptyOpt(), emptyOpt(), emptyOpt(), emptyOpt()],
  correctIndexes: [0],
})

/**
 * Compact image picker used for a question or an answer option. Uploads to the
 * given endpoint (defaults to the quiz image endpoint) and reports the public
 * URL back via onChange (null clears).
 */
export function ImagePick({ url, onChange, label = 'Add image', uploadPath = '/quizzes/upload' }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    setBusy(true)
    try {
      const { url: uploaded } = await api.upload(uploadPath, fd)
      onChange(uploaded)
    } catch (err) {
      toast(err.message || 'Image upload failed', 'err')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
      {url ? (
        <>
          <img src={url} alt="" style={{ height: 40, maxWidth: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(null)}>
            <X width={13} height={13} /> Remove
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Spinner /> : <Plus width={13} height={13} />} {busy ? 'Uploading…' : label}
        </button>
      )}
    </div>
  )
}

/**
 * Add/edit a single MCQ question. `value` is the question being edited (or a
 * blank one); onSubmit receives { text, imageUrl, options, correctIndexes }.
 * `uploadPath` is forwarded to the image pickers.
 */
export function QuestionModal({ value, onClose, onSubmit, uploadPath = '/quizzes/upload' }) {
  const [text, setText] = useState(value.text || '')
  const [imageUrl, setImageUrl] = useState(value.imageUrl || null)
  const [options, setOptions] = useState(
    (value.options?.length ? value.options : [emptyOpt(), emptyOpt()]).map((o) =>
      typeof o === 'string' ? { text: o, imageUrl: null } : { text: o.text || '', imageUrl: o.imageUrl || null }
    )
  )
  // Correct answers are tracked as a set of option indexes (multiple allowed).
  const [correct, setCorrect] = useState(() => new Set(correctSetOf(value)))
  const [busy, setBusy] = useState(false)

  const patchOpt = (i, patch) => setOptions(options.map((o, oi) => (oi === i ? { ...o, ...patch } : o)))
  const addOpt = () => setOptions([...options, emptyOpt()])
  const toggleCorrect = (i) =>
    setCorrect((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  const removeOpt = (i) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, oi) => oi !== i))
    // Re-index the correct set around the removed option so it keeps pointing
    // at the same answers.
    setCorrect((prev) => {
      const next = new Set()
      prev.forEach((c) => {
        if (c < i) next.add(c)
        else if (c > i) next.add(c - 1)
      })
      return next
    })
  }

  const optFilled = (o) => o.text.trim() || o.imageUrl
  const filledOptions = options.filter(optFilled)
  const correctFilledCount = [...correct].filter((i) => optFilled(options[i] || {})).length
  const valid =
    (text.trim() || imageUrl) &&
    filledOptions.length >= 2 &&
    correctFilledCount >= 1

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title={value.id ? 'Edit question' : 'Add question'}
      subtitle="Add text and/or an image. Tick every correct answer — more than one is allowed."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid || busy}
            onClick={async () => {
              setBusy(true)
              try {
                // Correct indexes are re-mapped against the filtered list, matching
                // what the user sees (blank options are dropped on save).
                const correctIndexes = [...correct]
                  .filter((i) => optFilled(options[i] || {}))
                  .map((i) => filledOptions.indexOf(options[i]))
                  .sort((a, b) => a - b)
                await onSubmit({
                  text: text.trim(),
                  imageUrl,
                  options: filledOptions.map((o) => ({ text: o.text.trim(), imageUrl: o.imageUrl || null })),
                  correctIndexes,
                })
              } finally {
                setBusy(false)
              }
            }}
          >
            {value.id ? 'Save' : 'Add question'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Question">
          <textarea className="textarea" placeholder="Type the question…" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="Question image (optional)">
          <ImagePick url={imageUrl} onChange={setImageUrl} label="Add question image" uploadPath={uploadPath} />
        </Field>
        <Field label="Answer options" hint="Each answer can have text, an image, or both. Tick every correct answer — you can mark more than one.">
          <div className="col" style={{ gap: 10 }}>
            {options.map((opt, i) => (
              <div key={i} className="row" style={{ gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={correct.has(i)} onChange={() => toggleCorrect(i)} title="Correct answer" />
                <div className="col" style={{ flex: 1, gap: 6 }}>
                  <input className="input" placeholder={`Option ${i + 1}`} value={opt.text} onChange={(e) => patchOpt(i, { text: e.target.value })} />
                  <ImagePick url={opt.imageUrl} onChange={(u) => patchOpt(i, { imageUrl: u })} label="Add image" uploadPath={uploadPath} />
                </div>
                {options.length > 2 && (
                  <button className="btn btn-sm btn-ghost" onClick={() => removeOpt(i)}><X width={13} height={13} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }} onClick={addOpt}><Plus width={12} height={12} /> Add option</button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}
