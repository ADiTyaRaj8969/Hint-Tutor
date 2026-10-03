import { motion } from 'framer-motion'
import { GitCompareArrows, ShieldCheck, TriangleAlert, OctagonAlert } from 'lucide-react'
import { GlowCard, plain } from './ui'

function V1Verdict({ leaks }) {
  if (!leaks) {
    return <div className="verdict warn"><TriangleAlert size={17} style={{ flex: 'none' }} /> No programmatic check — a leak here reaches the student.</div>
  }
  if (leaks.length) {
    const l = leaks[0]
    return (
      <div className="verdict bad">
        <OctagonAlert size={17} style={{ flex: 'none' }} />
        V1 leaked the answer at hint {l.level} ({l.where}) — and nothing in V1 would have stopped it.
      </div>
    )
  }
  return (
    <div className="verdict warn">
      <TriangleAlert size={17} style={{ flex: 'none' }} />
      V1 did not leak here — but nothing in V1 checks. It relies on the model obeying one instruction.
    </div>
  )
}

export default function Compare({ cmp, onRun, busy }) {
  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="card-title"><GitCompareArrows size={18} /> V1 vs V2</h2>
      <p className="card-sub">Same problem through the single-prompt baseline and the decomposed, guarded pipeline.</p>
      <button className="btn btn-ghost" onClick={onRun} disabled={busy}>
        {busy ? <span className="spinner" /> : <GitCompareArrows size={16} />} {cmp ? 'Run again' : 'Compare versions'}
      </button>

      {cmp && (
        <div className="compare">
          <motion.div className="cmp" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h3>V1 <span className="tag">single prompt</span></h3>
            <p className="sub">Zero-shot. One instruction not to reveal the answer. No verification.</p>
            <pre>{plain(cmp.v1_raw)}</pre>
            <V1Verdict leaks={cmp.v1_leaks} />
          </motion.div>
          <motion.div className="cmp v2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
            <h3>V2 <span className="tag">decomposed + guarded</span></h3>
            <p className="sub">Solve, then hint, then verify — five techniques and a deterministic guard.</p>
            {cmp.v2.map((h) => <p key={h.level} className="l"><b>L{h.level}</b>{plain(h.hint)}</p>)}
            <div className="verdict ok"><ShieldCheck size={17} style={{ flex: 'none' }} /> Every L1 and L2 hint passed the leak guard before display.</div>
          </motion.div>
        </div>
      )}
    </GlowCard>
  )
}
