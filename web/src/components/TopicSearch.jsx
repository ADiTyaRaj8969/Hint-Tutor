import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Sparkles, Wand2 } from 'lucide-react'
import { searchTopics } from '../api'

/** Search the topic catalogue; picking one fills the problem box (canned sample or generated). */
export default function TopicSearch({ onPick, picking }) {
  const [query, setQuery] = useState('')
  const [topics, setTopics] = useState([])
  const [open, setOpen] = useState(false)

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      searchTopics(query).then(setTopics).catch(() => setTopics([]))
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="topic-search">
      <div className="field-label"><label htmlFor="topic">Search topics</label>
        {topics.length > 0 && <span>{topics.length} {query ? 'matching' : 'available'}</span>}
      </div>
      <div className="search-box">
        <Search size={16} />
        <input
          id="topic" type="text" value={query} autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          placeholder="integrals, probability, trigonometry, matrices…"
        />
      </div>

      <AnimatePresence initial={false}>
        {open && topics.length > 0 && (
          <motion.ul className="topic-list"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}>
            {topics.map((t) => (
              <li key={t.slug}>
                <button type="button" className="topic-chip" disabled={!!picking}
                  onClick={() => { onPick(t); setOpen(false); setQuery(t.label) }}>
                  {t.label}
                  {t.sample
                    ? <span className="chip-tag ready"><Sparkles size={10} /> sample</span>
                    : <span className="chip-tag gen"><Wand2 size={10} /> generate</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {open && query && topics.length === 0 && <div className="topic-empty">No topic matches &ldquo;{query}&rdquo;.</div>}
      {picking && <div className="topic-busy"><span className="spinner" style={{ width: 14, height: 14 }} /> {picking}</div>}
    </div>
  )
}
