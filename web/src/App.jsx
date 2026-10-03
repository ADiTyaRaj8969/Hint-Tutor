import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { OctagonAlert, X, Sparkles } from 'lucide-react'
import { startSession, getHint, checkWorking, askTutor, getComparison } from './api'
import { Background, ScrollProgress } from './components/ui'
import { Nav, Hero } from './components/Hero'
import ProblemPanel from './components/ProblemPanel'
import Pipeline from './components/Pipeline'
import Ladder from './components/Ladder'
import Working from './components/Working'
import Ask from './components/Ask'
import Compare from './components/Compare'
import './App.css'
import './premium.css'

function Toasts({ items, dismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} className="toast error" layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
            <OctagonAlert size={18} style={{ flex: 'none', marginTop: 1 }} />
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={16} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  const [problem, setProblem] = useState('')
  const [sid, setSid] = useState(null)
  const [hints, setHints] = useState([])
  const [phase, setPhase] = useState('idle')
  const [working, setWorking] = useState('')
  const [diag, setDiag] = useState(null)
  const [cmp, setCmp] = useState(null)
  const [busy, setBusy] = useState('')
  const [toasts, setToasts] = useState([])
  const timer = useRef(null)

  const toast = useCallback((message) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-2), { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 9000)
  }, [])
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  const reset = () => {
    setSid(null); setHints([]); setDiag(null); setCmp(null); setWorking(''); setPhase('idle')
  }

  async function start() {
    if (busy) return
    clearTimeout(timer.current)
    reset(); setBusy('start'); setPhase('solve')
    timer.current = setTimeout(() => setPhase((p) => (p === 'solve' ? 'write' : p)), 3500)
    try {
      const s = await startSession(problem)
      clearTimeout(timer.current)
      // Hint 1 is earned like the others: it stays on the server until the student unlocks it.
      setSid(s.session_id); setPhase('ready')
    } catch (e) {
      clearTimeout(timer.current); setPhase('idle'); toast(e.message)
    } finally { setBusy('') }
  }

  async function nextHint() {
    setBusy('hint')
    try { setHints([...hints, await getHint(sid, hints.length + 1)]) }
    catch (e) { toast(e.message) } finally { setBusy('') }
  }

  async function check() {
    setBusy('check'); setDiag(null)
    try { setDiag(await checkWorking(sid, working)) }
    catch (e) { toast(e.message) } finally { setBusy('') }
  }

  async function ask(question) {
    try { return await askTutor(sid, question) } catch (e) { toast(e.message); return null }
  }

  async function compare() {
    setBusy('cmp')
    try { setCmp(await getComparison(sid)) }
    catch (e) { toast(e.message) } finally { setBusy('') }
  }

  return (
    <>
      <ScrollProgress />
      <Background />
      <div className="shell">
        <Nav />
        <Hero />

        <div className="workspace">
          <div className="col-left">
            <div className="slot slot-problem">
              <ProblemPanel problem={problem} setProblem={setProblem} onStart={start} busy={busy === 'start'} />
            </div>
            <div className="slot slot-pipe"><Pipeline phase={phase} /></div>
            {sid && (
              <div className="slot slot-working">
                <Working working={working} setWorking={setWorking} onCheck={check} diag={diag} busy={busy === 'check'} />
              </div>
            )}
            {sid && <div className="slot slot-ask"><Ask onAsk={ask} /></div>}
          </div>

          <div className="col-right">
            <div className="slot slot-ladder">
              <AnimatePresence mode="popLayout">
                {!sid ? (
                  <motion.div key="empty" className="card empty" exit={{ opacity: 0, y: -16 }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
                    <div className="orb"><Sparkles size={34} /></div>
                    <h3>{busy === 'start' ? 'Preparing your hints…' : 'Your hint ladder will appear here'}</h3>
                    <p>{busy === 'start'
                      ? 'The first run can take 20–30 seconds on the free model pool.'
                      : 'Type or paste a problem, then press Start tutoring.'}</p>
                  </motion.div>
                ) : (
                  <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Ladder hints={hints} onNext={nextHint} busy={busy === 'hint'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {sid && (
          <div className="slot slot-compare full">
            <Compare cmp={cmp} onRun={compare} busy={busy === 'cmp'} />
          </div>
        )}
      </div>
      <Toasts items={toasts} dismiss={dismiss} />
    </>
  )
}
