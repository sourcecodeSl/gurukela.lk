import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useApp } from '../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal, SkeletonCard, SkeletonText } from './ui.jsx'
import { Plus, Trash, Edit, Check, X, Layers, Book, Copy } from './icons.jsx'
import { QuestionModal, correctSetOf, blankQuestion } from './QuestionEditor.jsx'

const UPLOAD_PATH = '/question-banks/upload'

/**
 * Full page for managing reusable MCQ banks — used by both instructors and
 * admins. Each bank is a standalone set of questions with a shared password;
 * an instructor can later import the bank into a live quiz by typing that
 * password. Talks entirely to /question-banks (role is enforced server-side).
 */
export default function QuestionBankManager({ intro }) {
  const { toast, confirm } = useApp()
  const [banks, setBanks] = useState(null)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      setBanks(await api.get('/question-banks'))
    } catch (e) {
      toast(e.message || 'Failed to load MCQ banks', 'err')
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (openId)
    return (
      <BankEditor
        bankId={openId}
        onBack={() => {
          setOpenId(null)
          load()
        }}
      />
    )

  return (
    <>
      <div className="page-head">
        <h1>MCQ Banks</h1>
        <p className="sub">{intro || 'Build reusable sets of MCQ questions ahead of time. Share a bank’s password so it can be imported into any live test.'}</p>
      </div>
      <BankList
        banks={banks}
        onOpen={setOpenId}
        onCreate={async (payload) => {
          const b = await api.post('/question-banks', payload)
          await load()
          setOpenId(b.id)
        }}
        onDelete={async (b) => {
          if (!(await confirm({ title: 'Delete MCQ bank?', text: `“${b.title}” and its questions will be removed. Tests already built from it keep their copies.`, confirmText: 'Delete' }))) return
          await api.del(`/question-banks/${b.id}`)
          toast('MCQ bank removed', 'err')
          load()
        }}
      />
    </>
  )
}

/* ------------------------------- list ------------------------------- */

function BankList({ banks, onOpen, onCreate, onDelete }) {
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      await onCreate({ title: title.trim(), importPassword: password.trim() || undefined })
      setTitle('')
      setPassword('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row">
        <p className="small muted" style={{ flex: 1 }}>
          Create a bank, add MCQ questions, then share its password with any teacher who should be able to import it.
        </p>
        {!creating && (
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            <Plus width={15} height={15} /> New bank
          </button>
        )}
      </div>

      {creating && (
        <Card className="col" style={{ gap: 12 }}>
          <Field label="Bank title">
            <input className="input" placeholder="e.g. Grade 11 Physics — Unit 1" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="Import password (optional)" hint="Others type this to import the bank. Leave blank to auto-generate one.">
            <input className="input" placeholder="Auto-generated if left blank" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={!title.trim() || busy} onClick={submit}>Create</button>
          </div>
        </Card>
      )}

      {banks == null ? (
        <div className="col" style={{ gap: 10 }}>
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : banks.length === 0 && !creating ? (
        <Empty icon={Book} title="No MCQ banks yet">Create a reusable set of MCQ questions.</Empty>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {banks.map((b) => (
            <Card key={b.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
              <div className="col" style={{ flex: 1, gap: 4 }}>
                <strong>{b.title}</strong>
                <span className="tiny faint row" style={{ gap: 10 }}>
                  <span className="row" style={{ gap: 4 }}><Layers width={12} height={12} />{b.questionCount ?? 0} questions</span>
                  <PasswordChip password={b.importPassword} />
                </span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => onOpen(b.id)}><Edit width={14} height={14} /> Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(b)}><Trash width={14} height={14} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Shows the import password with a one-click copy. Kept compact for list/header.
function PasswordChip({ password }) {
  const { toast } = useApp()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      toast('Password copied')
    } catch {
      toast('Copy failed — select it manually', 'err')
    }
  }
  return (
    <button type="button" className="row" style={{ gap: 4, cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit' }} onClick={copy} title="Copy password">
      Password: <code style={{ fontWeight: 700 }}>{password}</code>
      <Copy width={12} height={12} />
    </button>
  )
}

/* ------------------------------ editor ------------------------------ */

function BankEditor({ bankId, onBack }) {
  const { toast, confirm } = useApp()
  const [bank, setBank] = useState(null)
  const [editing, setEditing] = useState(null)
  const [renaming, setRenaming] = useState(false)

  const load = useCallback(async () => {
    try {
      setBank(await api.get(`/question-banks/${bankId}`))
    } catch (e) {
      toast(e.message || 'Failed to load bank', 'err')
    }
  }, [bankId, toast])

  useEffect(() => {
    load()
  }, [load])

  const saveQuestion = async (payload) => {
    try {
      if (editing.id) await api.put(`/question-banks/${bankId}/questions/${editing.id}`, payload)
      else await api.post(`/question-banks/${bankId}/questions`, payload)
      setEditing(null)
      load()
    } catch (e) {
      toast(e.message || 'Could not save question', 'err')
    }
  }

  if (!bank) return <SkeletonText lines={5} />
  const questions = bank.questions || []

  return (
    <div className="col" style={{ gap: 14 }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <X width={14} height={14} /> Back to banks
      </button>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <h2 style={{ margin: 0 }}>{bank.title}</h2>
          <span className="tiny faint row" style={{ gap: 10 }}>
            <span>{questions.length} question{questions.length === 1 ? '' : 's'}</span>
            <PasswordChip password={bank.importPassword} />
          </span>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => setRenaming(true)}><Edit width={14} height={14} /> Settings</button>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing(blankQuestion())}><Plus width={14} height={14} /> Add question</button>
      </div>

      {questions.length === 0 ? (
        <Empty icon={Layers} title="No questions yet">Add MCQ questions and mark the correct option.</Empty>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {questions.map((qq, i) => (
            <Card key={qq.id} className="col" style={{ gap: 8 }}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                <strong style={{ flex: 1 }}>{i + 1}. {qq.text}</strong>
                <button className="btn btn-sm btn-outline" onClick={() => setEditing(qq)}><Edit width={13} height={13} /></button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    if (!(await confirm({ title: 'Remove question?', confirmText: 'Remove' }))) return
                    await api.del(`/question-banks/${bankId}/questions/${qq.id}`)
                    load()
                  }}
                ><Trash width={13} height={13} /></button>
              </div>
              {qq.imageUrl && <img src={qq.imageUrl} alt="" style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, alignSelf: 'flex-start' }} />}
              <div className="col" style={{ gap: 4 }}>
                {qq.options.map((opt, oi) => {
                  const correct = correctSetOf(qq).includes(oi)
                  return (
                    <span key={oi} className={`small row ${correct ? 'bold' : 'muted'}`} style={{ gap: 6, alignItems: 'center' }}>
                      {correct ? <Check width={13} height={13} style={{ color: 'var(--success)' }} /> : <span style={{ width: 13 }} />}
                      {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ height: 34, maxWidth: 80, objectFit: 'cover', borderRadius: 5 }} />}
                      {opt.text}
                    </span>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <QuestionModal value={editing} onClose={() => setEditing(null)} onSubmit={saveQuestion} uploadPath={UPLOAD_PATH} />
      )}
      {renaming && (
        <BankSettingsModal
          bank={bank}
          onClose={() => setRenaming(false)}
          onSave={async (payload) => {
            try {
              await api.put(`/question-banks/${bankId}`, payload)
              setRenaming(false)
              load()
              toast('Bank updated')
            } catch (e) {
              toast(e.message || 'Could not update', 'err')
            }
          }}
        />
      )}
    </div>
  )
}

function BankSettingsModal({ bank, onClose, onSave }) {
  const [title, setTitle] = useState(bank.title)
  const [password, setPassword] = useState(bank.importPassword)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!title.trim() || !password.trim()) return
    setBusy(true)
    try {
      await onSave({ title: title.trim(), importPassword: password.trim() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      width={440}
      title="Bank settings"
      subtitle="Rename the bank or change the password teachers use to import it."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!title.trim() || !password.trim() || busy} onClick={submit}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Bank title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="Import password" hint="At least 4 characters. Teachers type this exactly to import.">
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
