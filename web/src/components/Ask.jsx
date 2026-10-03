import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleQuestion, Send, ShieldAlert, Info } from 'lucide-react'
import { GlowCard } from './ui'

export default function Ask({ onAsk }) {
  const [q, setQ] = useState('')
  const [reply, setReply] = useState(null)
  const [tick, setTick] = useState(0)

  async function submit(e) {
    e.preventDefault()
    if (!q.trim()) return
    const r = await onAsk(q)
    if (r) { setReply(r); setTick((n) => n + 1) }
  }

  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="card-title"><MessageCircleQuestion size={18} /> Ask the tutor</h2>
      <p className="card-sub">Try &ldquo;just tell me the answer&rdquo; — the refusal is static text, no model involved.</p>
      <form className="ask-row" onSubmit={submit}>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. just tell me the answer" aria-label="Ask the tutor" />
        <button className="btn btn-ghost" type="submit" disabled={!q.trim()}><Send size={15} /> Ask</button>
      </form>
      <AnimatePresence mode="wait">
        {reply && (
          <motion.div key={tick} className={`ask-reply ${reply.refused ? 'refused shake' : 'info'}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {reply.refused ? <ShieldAlert size={18} style={{ flex: 'none' }} /> : <Info size={18} style={{ flex: 'none' }} />}
            <span>{reply.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  )
}
