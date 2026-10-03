import { motion } from 'framer-motion'
import { Sparkles, GraduationCap } from 'lucide-react'
import { CountUp } from './ui'

const STATS = [
  [3, 'hint levels'],
  [3, 'leak-check rules'],
  [7, 'guardrails'],
  [5, 'prompting techniques'],
]

export function Nav() {
  return (
    <nav className="nav">
      <div className="brand">
        <span className="brand-mark"><GraduationCap size={20} color="#fff" /></span>
        Hint Tutor
      </div>
      <div className="nav-tags">
        <span className="chip">Team 5</span>
        <span className="chip">Problem 13</span>
        <span className="chip">Theme C · Reasoning</span>
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
        Learn the <span className="grad">method</span>,<br />never get the answer handed over.
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
        Three progressive hints, and a deterministic check in code that the final answer never
        appears at levels 1 and 2.
      </motion.p>
      <div className="stats">
        {STATS.map(([n, label], i) => (
          <motion.div key={label} className="stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}>
            <b><CountUp to={n} /></b>
            <span>{label}</span>
          </motion.div>
        ))}
      </div>
    </header>
  )
}
