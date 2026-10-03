import { motion } from 'framer-motion'
import { Compass, Wrench, Footprints, Lock, LockOpen, ArrowRight } from 'lucide-react'
import { Confetti, GlowCard, plain, useTypewriter } from './ui'

const LEVELS = {
  1: { name: 'Orient', icon: Compass, cls: 'l1' },
  2: { name: 'Set up', icon: Wrench, cls: 'l2' },
  3: { name: 'Walk through', icon: Footprints, cls: 'l3' },
}

function HintCard({ hint, latest }) {
  const meta = LEVELS[hint.level]
  const text = plain(hint.hint)
  const { shown, done } = useTypewriter(text, { start: latest })
  const body = latest ? shown : text
  const typing = latest && !done

  return (
    <GlowCard className={`hint-card ${meta.cls}`} style={{ '--c': `var(--${meta.cls === 'l1' ? 'cyan' : meta.cls === 'l2' ? 'violet' : 'amber'})` }}
      initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="hint-top">
        <span className="level-pill"><i /> Hint {hint.level} of 3</span>
        <span className="level-name">{meta.name}</span>
      </div>
      <p className="hint-text">
        {body}{typing && <span className="caret" />}
      </p>
    </GlowCard>
  )
}

function LockedRung({ level }) {
  const meta = LEVELS[level]
  return (
    <motion.div className="rung-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="row">
        <span>Hint {level} · {meta.name}</span>
        <Lock size={15} />
      </div>
      <div className="skeleton" style={{ width: '92%' }} />
      <div className="skeleton" style={{ width: '78%' }} />
    </motion.div>
  )
}

export default function Ladder({ hints, onNext, busy }) {
  const count = hints.length
  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ladder-head">
        <h2 className="card-title" style={{ margin: 0 }}><LockOpen size={18} /> Hint ladder</h2>
        <div className="segs" role="img" aria-label={`${count} of 3 hints revealed`}>
          {[1, 2, 3].map((n) => <i key={n} className={n <= count ? 'on' : ''} />)}
        </div>
      </div>
      {count === 3 && <Confetti key="done" />}
      <p className="card-sub" style={{ marginTop: 6 }}>Each hint is earned: the next level stays on the server until you ask for it.</p>

      <div className="rungs">
        {[1, 2, 3].map((lvl) => {
          const Icon = LEVELS[lvl].icon
          const open = lvl <= count
          const hint = hints[lvl - 1]
          return (
            <div key={lvl} className={`rung ${LEVELS[lvl].cls} ${open ? 'open' : ''}`}>
              <div className="rung-rail">
                <div className="rung-icon">{open ? <Icon size={20} /> : <Lock size={18} />}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                {open ? <HintCard hint={hint} latest={lvl === count} />
                  : lvl === count + 1 ? (
                    <>
                      <LockedRung level={lvl} />
                      <button className="btn btn-unlock" style={{ marginTop: 12 }} onClick={onNext} disabled={busy}>
                        {busy ? <span className="spinner" /> : <LockOpen size={17} />}
                        Unlock hint {lvl}
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : <LockedRung level={lvl} />}
              </div>
            </div>
          )
        })}
      </div>
      {count === 3 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="card-sub" style={{ textAlign: 'center', margin: '22px 0 0' }}>
          That is all three hints — the last step is yours.
        </motion.p>
      )}
    </GlowCard>
  )
}
