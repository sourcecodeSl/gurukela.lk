import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import {
  Badge, Card, Empty, Modal, Stat, fmtDate, money,
} from '../../components/ui.jsx'
import { Money, Ticket, Users, Video, Printer, Info } from '../../components/icons.jsx'

// A short, human-friendly receipt number derived from the payment id + date so
// the same payment always renders the same reference on its receipt.
const receiptNo = (p) => {
  const d = new Date(p.at)
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const tail = String(p.id).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase()
  return `GC-${ymd}-${tail}`
}

const typeLabel = { group: 'Group class', seminar: 'Seminar', slot: 'One-to-one' }
const typeIcon = { group: Users, seminar: Video, slot: Ticket }

export default function Payments() {
  const app = useApp()
  const [receipt, setReceipt] = useState(null)

  const studentId = app.session.role === 'student' ? app.session.id : null

  const payments = useMemo(
    () => (app.payments || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at)),
    [app.payments]
  )

  if (!studentId) {
    return (
      <Card>
        <Empty icon={Info} title="Student view only">Switch to the student account to see your payments.</Empty>
      </Card>
    )
  }

  const total = payments.reduce((s, p) => s + (p.status === 'success' ? p.amount : 0), 0)

  return (
    <>
      <div className="page-head">
        <h1>Payments</h1>
        <p className="sub">Your payment history and receipts.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <Stat label="Total paid" value={money(total)} sub={`${payments.length} payment${payments.length === 1 ? '' : 's'}`} icon={Money} />
        <Stat label="Classes paid" value={payments.filter((p) => p.type === 'group').length} icon={Users} />
        <Stat label="Sessions & seminars" value={payments.filter((p) => p.type !== 'group').length} icon={Ticket} />
      </div>

      {payments.length === 0 ? (
        <Card><Empty icon={Money} title="No payments yet">Once you pay for a class, session or seminar, it will show up here with a receipt you can print.</Empty></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Paid for</th><th>Instructor</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const Icon = typeIcon[p.type] || Ticket
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="col" style={{ lineHeight: 1.35 }}>
                          <span className="small truncate" style={{ maxWidth: 240, fontWeight: 600 }}>{p.title}</span>
                          <Badge tone="accent" style={{ alignSelf: 'flex-start', marginTop: 3 }}>
                            <Icon width={12} height={12} /> {typeLabel[p.type] || 'Payment'}
                          </Badge>
                        </div>
                      </td>
                      <td className="small muted">{p.instructorName || '—'}</td>
                      <td className="small muted" style={{ textTransform: 'capitalize' }}>{p.method}</td>
                      <td className="bold">{money(p.amount)}</td>
                      <td>
                        <Badge tone={p.status === 'success' ? 'success' : p.status === 'refunded' ? 'accent' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="small muted">{fmtDate(p.at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => setReceipt(p)}>
                          <Printer width={14} height={14} /> Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {receipt && (
        <Modal
          open
          title="Payment receipt"
          width={460}
          onClose={() => setReceipt(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setReceipt(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer width={15} height={15} /> Print / Save PDF
              </button>
            </>
          }
        >
          <div id="receipt-print" className="receipt">
            <div className="receipt-head">
              <img className="brand-mark" src="/brand/logo-icon.png" alt="GetClass" width={40} height={40} />
              <div>
                <div className="rc-brand">GetClass.lk</div>
                <div className="rc-sub">Official payment receipt</div>
              </div>
            </div>

            <div className="receipt-title">Receipt details</div>
            <div className="receipt-rows">
              <div className="rc-row"><span className="rc-k">Receipt no.</span><span className="rc-v">{receiptNo(receipt)}</span></div>
              <div className="rc-row"><span className="rc-k">Date</span><span className="rc-v">{fmtDate(receipt.at, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="rc-row"><span className="rc-k">Student</span><span className="rc-v">{app.me?.name || 'Student'}</span></div>
              <div className="rc-row"><span className="rc-k">Paid for</span><span className="rc-v">{receipt.title}</span></div>
              <div className="rc-row"><span className="rc-k">Type</span><span className="rc-v">{typeLabel[receipt.type] || 'Payment'}</span></div>
              {receipt.instructorName && (
                <div className="rc-row"><span className="rc-k">Instructor</span><span className="rc-v">{receipt.instructorName}</span></div>
              )}
              <div className="rc-row"><span className="rc-k">Payment method</span><span className="rc-v" style={{ textTransform: 'capitalize' }}>{receipt.method}</span></div>
              <div className="rc-row"><span className="rc-k">Status</span><span className="rc-v" style={{ textTransform: 'capitalize' }}>{receipt.status}</span></div>
            </div>

            <div className="receipt-total">
              <span className="rc-k">Total paid</span>
              <span className="rc-v">{money(receipt.amount)}</span>
            </div>

            <p className="receipt-foot">
              Thank you for learning with GetClass.lk. This receipt is computer-generated and valid without a signature.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
