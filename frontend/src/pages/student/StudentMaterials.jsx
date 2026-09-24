import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Badge, Card } from '../../components/ui.jsx'
import { Book, Video, Globe } from '../../components/icons.jsx'

const KIND_META = {
  pdf: { label: 'PDF', icon: Book, tone: 'danger', cta: 'Open PDF' },
  recording: { label: 'Recording', icon: Video, tone: 'accent', cta: 'Watch' },
  link: { label: 'Link', icon: Globe, tone: '', cta: 'Open' },
}

/**
 * Shown on a student's registered seminar / booked slot / enrolled group class.
 * Lists the lecture materials the instructor pinned to that session. Pass
 * exactly one of `seminarId` / `slotId` / `groupId`. Renders nothing when empty.
 */
export default function StudentMaterials({ seminarId, slotId, groupId }) {
  const [materials, setMaterials] = useState([])

  const query = seminarId ? `seminarId=${seminarId}` : slotId ? `slotId=${slotId}` : `groupId=${groupId}`

  const load = useCallback(async () => {
    try {
      setMaterials(await api.get(`/materials?${query}`))
    } catch {
      /* not in the audience / transient — leave as-is */
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  if (materials.length === 0) return null

  return (
    <Card className="col" style={{ gap: 8 }}>
      <span className="small bold row" style={{ gap: 6 }}><Book width={15} height={15} /> Lecture materials</span>
      <div className="col" style={{ gap: 6 }}>
        {materials.map((m) => {
          const meta = KIND_META[m.kind] || KIND_META.link
          const Icon = meta.icon
          return (
            <div key={m.id} className="row" style={{ gap: 8, alignItems: 'center' }}>
              <Icon width={15} height={15} className="faint" />
              <div className="col" style={{ flex: 1, minWidth: 0 }}>
                <span className="small truncate">{m.title}</span>
                {m.description && <span className="tiny faint truncate">{m.description}</span>}
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <a className="btn btn-sm btn-outline" href={m.url} target="_blank" rel="noreferrer">{meta.cta}</a>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
