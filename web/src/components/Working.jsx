import { AnimatePresence, motion } from 'framer-motion'
import { PenLine, CircleCheck, TriangleAlert, Info, Search } from 'lucide-react'
import { GlowCard, plain } from './ui'

/** Server numbers only non-blank lines; map that index back to the editor line. */
function badLine(working, step) {
  if (!step) return -1
  let seen = 0
  const lines = working.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) { seen += 1; if (seen === step) return i }
  }
  return -1
}

const TONE = {
  correct: { cls: 'ok', icon: CircleCheck, title: 'Every step checks out.' },
  incomplete: { cls: 'info', icon: Info, title: 'No mistakes so far — but you have not finished yet.' },
  error: { cls: 'warn', icon: TriangleAlert },
}

export function Diagnosis({ result }) {
  if (!result) return null
  const t = TONE[result.status] || TONE.error
  const Icon = t.icon
  const title = result.status === 'error' ? `First mistake: step ${result.first_wrong_step ?? '?'}` : t.title
  return (
    <motion.div className={`result ${t.cls}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="result-head"><Icon size={20} /> {title}</div>
      {result.what_they_did && <p className="kv"><b>What you did.</b> {plain(result.what_they_did)}</p>}
      {result.why_wrong && <p className="kv"><b>Why it does not work.</b> {plain(result.why_wrong)}</p>}
      {result.targeted_hint && <div className="callout">{plain(result.targeted_hint)}</div>}
    </motion.div>
  )
}

export default function Working({ working, setWorking, onCheck, diag, busy }) {
  const lines = Math.max(4, working.split('\n').length)
  const bad = diag?.status === 'error' ? badLine(working, diag.first_wrong_step) : -1

  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <h2 className="card-title"><PenLine size={18} /> Check my working</h2>
      <p className="card-sub">Write your steps, one per line. The tutor finds the first line that goes wrong and hints at that mistake.</p>

      <div className="editor">
        <div className="gutter" aria-hidden="true">
          {Array.from({ length: lines }, (_, i) => <div key={i} className={i === bad ? 'bad' : ''}>{i + 1}</div>)}
        </div>
        <textarea
          rows={4} value={working} spellCheck={false}
          onChange={(e) => setWorking(e.target.value)}
          placeholder={'speed = distance x time\nspeed = 120 x 2 = 240'}
          aria-label="Your working, one step per line"
        />
      </div>

      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={onCheck} disabled={busy || !working.trim()}>
        {busy ? <span className="spinner" /> : <Search size={16} />} Check my steps
      </button>

      <AnimatePresence mode="wait">
        <Diagnosis key={diag ? JSON.stringify(diag) : 'none'} result={diag} />
      </AnimatePresence>
    </GlowCard>
  )
}
