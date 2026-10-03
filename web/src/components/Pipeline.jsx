import { Brain, Layers, ShieldCheck, LockOpen, Check } from 'lucide-react'
import { GlowCard } from './ui'

const STEPS = [
  { key: 'solve', icon: Brain, title: 'Solve privately', text: 'Hidden solution, never shown' },
  { key: 'write', icon: Layers, title: 'Write the ladder', text: 'Three hints, rising specificity' },
  { key: 'guard', icon: ShieldCheck, title: 'Leak guard', text: 'Deterministic check, in code' },
  { key: 'ready', icon: LockOpen, title: 'Reveal in order', text: 'Server-gated, one level at a time' },
]
const ORDER = ['idle', 'solve', 'write', 'guard', 'ready']

export default function Pipeline({ phase }) {
  const at = ORDER.indexOf(phase)
  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
      <h2 className="card-title"><Layers size={18} /> How it works</h2>
      <div className="pipe">
        {STEPS.map((s, i) => {
          const idx = i + 1
          const state = phase === 'ready' ? 'done' : idx < at ? 'done' : idx === at ? 'active' : 'idle'
          const Icon = s.icon
          return (
            <div key={s.key} className={`pipe-step ${state}`}>
              <div className="pipe-node">{state === 'done' ? <Check size={16} /> : <Icon size={16} />}</div>
              {i < STEPS.length - 1 && <div className="pipe-line"><i /></div>}
              <div className="pipe-text"><b>{s.title}</b><span>{s.text}</span></div>
            </div>
          )
        })}
      </div>
    </GlowCard>
  )
}
