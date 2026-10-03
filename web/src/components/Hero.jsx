import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles, GraduationCap } from 'lucide-react'

// Real formulas, grouped by branch. Each card cycles through its own list.
const TILES = [
  { glyph: '△', topic: 'Geometry', formulas: ['A = ½ × b × h', 'a² + b² = c²', 'A = π r²'] },
  { glyph: 'x', topic: 'Algebra', formulas: ['(a + b)² = a² + 2ab + b²', 'a² − b² = (a − b)(a + b)', 'x = (−b ± √(b² − 4ac)) / 2a'] },
  { glyph: '∫', topic: 'Calculus', formulas: ['d/dx xⁿ = n xⁿ⁻¹', '∫ xⁿ dx = xⁿ⁺¹ / (n + 1) + C', 'lim (x→0) sin x / x = 1'] },
  { glyph: '→', topic: 'Motion', formulas: ['speed = distance ÷ time', 'v = u + a t', 's = u t + ½ a t²'] },
]

// Constants: the short form always shows, the rest of the digits slide out on hover.
const CONSTANTS = [
  { sym: 'π', short: '3.14159', more: '26535 89793…' },
  { sym: 'e', short: '2.71828', more: '18284 59045…' },
  { sym: 'φ', short: '1.61803', more: '39887 49894…' },
  { sym: '√2', short: '1.41421', more: '35623 73095…' },
]

function FormulaTile({ glyph, topic, formulas, offset }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    let id
    const t = setTimeout(() => {
      setI((n) => (n + 1) % formulas.length)
      id = setInterval(() => setI((n) => (n + 1) % formulas.length), 4200)
    }, offset)
    return () => { clearTimeout(t); clearInterval(id) }
  }, [formulas.length, offset, reduce])

  return (
    <motion.div className="ftile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + offset / 6000 }}>
      <div className="ftile-top">
        <span className="ftile-glyph">{glyph}</span>
        <span className="ftile-topic">{topic}</span>
      </div>
      <div className="ftile-body" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.code key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28 }}>
            {formulas[i]}
          </motion.code>
        </AnimatePresence>
      </div>
      <div className="ftile-dots">
        {formulas.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}
      </div>
    </motion.div>
  )
}

export function Nav() {
  return (
    <nav className="nav">
      <div className="brand">
        <span className="brand-mark"><GraduationCap size={20} color="#fff" /></span>
        Hint Tutor
      </div>
      <div className="nav-tags" aria-label="Mathematical constants">
        {CONSTANTS.map((c) => (
          <span className="chip mchip" key={c.sym} tabIndex={0}>
            <b>{c.sym}</b>
            <i>≈ {c.short}</i>
            <em>{c.more}</em>
          </span>
        ))}
      </div>
    </nav>
  )
}

const TICKER = ['Never leak the answer', 'Three progressive hints', 'Deterministic guard in code',
  'Server-gated ladder', 'Find the first wrong step', 'Seven guardrails']

function Marquee() {
  const row = TICKER.map((t) => <span key={t}>{t}<b>✦</b></span>)
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}</div>
    </div>
  )
}

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 120 120" aria-hidden="true">
      <defs><path id="sealpath" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
      <circle cx="60" cy="60" r="56" className="seal-bg" />
      <text className="seal-text"><textPath href="#sealpath">LEAK-PROOF · LEAK-PROOF · LEAK-PROOF ·</textPath></text>
      <text x="60" y="68" textAnchor="middle" className="seal-mid">0%</text>
    </svg>
  )
}

export function Hero() {
  return (
    <header className="hero">
      <Marquee />
      <Seal />
      <motion.span className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="dot"><Sparkles size={12} /></span>
        Prompt Engineering for Generative AI
      </motion.span>
      <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
        Learn the <span style={{ whiteSpace: 'nowrap' }}><span className="grad">method</span>,</span><br />never get the answer handed over.
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
        Three progressive hints, and a deterministic check in code that the final answer never
        appears at levels 1 and 2.
      </motion.p>
      <div className="stats">
        {TILES.map((t, i) => <FormulaTile key={t.topic} {...t} offset={i * 1100} />)}
      </div>
    </header>
  )
}
