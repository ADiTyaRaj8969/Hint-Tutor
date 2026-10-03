import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Compass, Wrench, Footprints, Lock, LockOpen, ShieldCheck, ShieldAlert,
  Check, TriangleAlert, ArrowRight, Info,
} from 'lucide-react'
import { GlowCard, plain, useTypewriter } from './ui'

const LEVELS = {
  1: { name: 'Orient', icon: Compass, cls: 'l1', contract: 'Concept only — no equation, no arithmetic.' },
  2: { name: 'Set up', icon: Wrench, cls: 'l2', contract: 'The setup — which value goes where, but not the result.' },
  3: { name: 'Walk through', icon: Footprints, cls: 'l3', contract: 'The method with real numbers, stopping before the last step.' },
}

const RULES = [
  ['alias match', 'alias match'],
  ['numeric ±1e-6', 'numeric match'],
  ['equation RHS', 'equation RHS'],
]

/** Three rule checks that tick over one after another, so the guard is visibly working. */
function GuardReport({ hint }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    const ids = [1, 2, 3, 4].map((n) => setTimeout(() => setStep(n), 380 * n))
    return () => ids.forEach(clearTimeout)
  }, [hint.hint])

  if (!hint.guarded) {
    return (
      <div className="guard">
        <div className="guard-head neutral">
          <Info size={17} /> Level 3 may approach the answer — unguarded by design
        </div>
      </div>
    )
  }

  const done = step >= 4
  const caught = hint.leak_detected
  return (
    <div className="guard">
      {!done && <div className="scan" key={hint.hint} />}
      <div className={`guard-head ${!done ? 'neutral' : caught ? 'warn' : 'ok'}`}>
        {!done ? <span className="spinner" style={{ width: 15, height: 15 }} />
          : caught ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        {!done ? 'Scanning for the answer…'
          : caught ? `Leak intercepted (${hint.leak_where}) — hint regenerated before display`
            : 'Leak check passed — the answer is not in this hint'}
      </div>
      <div className="guard-rules">
        {RULES.map(([label, key], i) => {
          const checked = step > i
          const hit = checked && caught && hint.leak_where === key
          return (
            <motion.span
              key={label}
              className={`rule ${checked ? (hit ? 'hit' : 'pass') : ''}`}
              animate={checked ? { scale: [0.9, 1.08, 1] } : {}}
              transition={{ duration: 0.35 }}
            >
              {checked ? (hit ? <TriangleAlert size={13} /> : <Check size={13} />) : <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />}
              {label}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
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
      <p className="contract">{meta.contract}</p>
      <AnimatePresence>
        {(!latest || done) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4 }}>
            <GuardReport hint={hint} />
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="progress" aria-label={`${count} of 3 hints revealed`}><i style={{ width: `${(count / 3) * 100}%` }} /></div>
      </div>
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
