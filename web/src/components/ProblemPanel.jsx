import { useRef } from 'react'
import { Play, PenLine } from 'lucide-react'
import { GlowCard } from './ui'

const MAX = 2000

export default function ProblemPanel({ samples, problem, setProblem, onStart, busy, topicSlot }) {
  const over = problem.length > MAX
  const ref = useRef(null)

  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
      <h2 className="card-title"><PenLine size={18} /> Your problem</h2>

      {topicSlot}

      <div className="field-label" style={{ marginTop: 16 }}><span>Or try a sample</span></div>
      <div className="samples" role="list">
        {samples.map((s) => (
          <button
            key={s.label} role="listitem" type="button"
            className={`sample ${problem === s.problem ? 'active' : ''}`}
            onClick={() => { setProblem(s.problem); ref.current?.focus() }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="field-label">
        <label htmlFor="problem">Problem</label>
        <span className={`count ${over ? 'over' : ''}`}>{problem.length} / {MAX}</span>
      </div>
      <textarea
        id="problem" ref={ref} rows={4} value={problem}
        onChange={(e) => setProblem(e.target.value)}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onStart() }}
        placeholder="Paste any school-level word problem…"
      />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onStart} disabled={busy}>
        {busy ? <span className="spinner" /> : <Play size={17} fill="currentColor" />}
        {busy ? 'Working…' : 'Start tutoring'}
        {!busy && <kbd>Ctrl ↵</kbd>}
      </button>
    </GlowCard>
  )
}
