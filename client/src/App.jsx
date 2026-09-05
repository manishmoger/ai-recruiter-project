import { useState, useRef, useEffect } from 'react'
import './App.css'

const API = '/api'

const EXAMPLES = [
  'RDS developers, 4–7 years, worked at startups, based in Bangalore',
  'Senior frontend engineers with React and TypeScript, 5+ years',
  'Backend engineers with Node.js and PostgreSQL, startup or scaleup background',
]

function scoreClass(s) {
  if (s >= 70) return 'hi'
  if (s >= 40) return 'md'
  return 'lo'
}

function Card({ profile, index, votes, onVote, frozen }) {
  const vote = votes[profile.id]
  return (
    <div className={`card ${vote === true ? 'yes' : vote === false ? 'no' : ''}`}>
      <div className="card-head">
        <div className="card-identity">
          <div className="card-name">{index + 1}. {profile.name}</div>
          <div className="card-role">{profile.current_title} · {profile.current_company}</div>
          <div className="card-tags">
            <span className="tag loc">{profile.location}</span>
            <span className="tag exp">{profile.years_experience} yrs</span>
            <span className="tag co">{profile.current_company_type}</span>
          </div>
        </div>
        {profile.score !== undefined && (
          <div className="card-score">
            <div className={`score-val ${scoreClass(profile.score)}`}>{profile.score}</div>
            <div className="score-lbl">/ 100</div>
          </div>
        )}
      </div>

      <div className="card-skills">
        {profile.skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
      </div>

      {profile.reason && <div className="card-reason">{profile.reason}</div>}

      {!frozen && (
        <div className="card-actions">
          <button className={`btn-yes ${vote === true ? 'on' : ''}`} onClick={() => onVote(profile.id, true)}>
            Looks good
          </button>
          <button className={`btn-no ${vote === false ? 'on' : ''}`} onClick={() => onVote(profile.id, false)}>
            Not right
          </button>
        </div>
      )}
    </div>
  )
}

function Sidebar({ filters, rubric, onLock }) {
  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h3>Current search</h3>
      </div>
      <div className="sidebar-body">
        <div className="criteria-block">
          <div className="criteria-label">Filters</div>
          {filters.location && (
            <div className="criteria-row">
              <div className="criteria-key">Location</div>
              <div className="criteria-val">{filters.location}</div>
            </div>
          )}
          <div className="criteria-row">
            <div className="criteria-key">Experience</div>
            <div className="criteria-val">
              {filters.minExperience}–{filters.maxExperience >= 99 ? '∞' : filters.maxExperience} years
            </div>
          </div>
          {filters.companyType && (
            <div className="criteria-row">
              <div className="criteria-key">Company type</div>
              <div className="criteria-val">{filters.companyType}</div>
            </div>
          )}
          {filters.skills?.length > 0 && (
            <div className="criteria-row">
              <div className="criteria-key">Skills</div>
              <div className="skill-chips" style={{ marginTop: 4 }}>
                {filters.skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-sep" />

        <div className="criteria-block">
          <div className="criteria-label">What we're looking for</div>
          <div className="rubric-lines">
            {rubric.map((r, i) => <div key={i} className="rubric-line">{r}</div>)}
          </div>
        </div>
      </div>

      <button className="btn-lock" onClick={onLock}>Lock in this search</button>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('search')
  const [query, setQuery] = useState('')
  const [step, setStep] = useState(0)
  const [filters, setFilters] = useState(null)
  const [rubric, setRubric] = useState([])
  const [profiles, setProfiles] = useState([])
  const [total, setTotal] = useState(0)
  const [votes, setVotes] = useState({})
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [round, setRound] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const push = (from, text, updated = false) =>
    setMsgs(prev => [...prev, { from, text, updated }])

  async function search() {
    if (!query.trim()) return
    setErr(null)
    setPhase('loading')
    setStep(1)
    setVotes({})
    setMsgs([])
    setRound(0)

    try {
      const res = await fetch(`${API}/full-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      setStep(2)
      if (!res.ok) throw new Error((await res.json()).message || 'Search failed')
      const data = await res.json()
      setStep(3)
      setFilters(data.filters)
      setRubric(data.rubric)
      setProfiles(data.topProfiles)
      setTotal(data.totalMatches)
      setRound(1)
      push('them', `Got ${data.totalMatches} results. Showing the top ${data.topProfiles.length}. Mark any that look off and tell me what to adjust.`)
      setPhase('results')
    } catch (e) {
      setErr(e.message)
      setPhase('search')
    }
  }

  async function refine() {
    const msg = input.trim()
    if (!msg || busy) return

    const goodNames = Object.entries(votes).filter(([, v]) => v === true)
      .map(([id]) => profiles.find(p => p.id === id)?.name).filter(Boolean)
    const badNames = Object.entries(votes).filter(([, v]) => v === false)
      .map(([id]) => profiles.find(p => p.id === id)?.name).filter(Boolean)

    let full = msg
    if (goodNames.length) full += ` (good: ${goodNames.join(', ')})`
    if (badNames.length) full += ` (not right: ${badNames.join(', ')})`

    push('me', msg)
    setInput('')
    setVotes({})
    setBusy(true)
    setErr(null)

    try {
      const res = await fetch(`${API}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentFilters: filters, currentRubric: rubric, feedback: full, shownProfiles: profiles }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed')
      const data = await res.json()
      setFilters(data.filters)
      setRubric(data.rubric)
      setProfiles(data.topProfiles)
      setTotal(data.totalMatches)
      setRound(r => r + 1)
      push('them', data.changes, true)
      push('them', `${data.totalMatches} results now. Showing top ${data.topProfiles.length}.`)
    } catch (e) {
      setErr(e.message)
      push('them', `Ran into an error: ${e.message}. Previous results are still there.`)
    } finally {
      setBusy(false)
    }
  }

  function voteOn(id, val) {
    setVotes(prev => ({ ...prev, [id]: prev[id] === val ? undefined : val }))
  }

  // Search
  if (phase === 'search') return (
    <div className="app">
      <header className="header">
        <div className="header-logo">Flexiple <span>/ Sourcing</span></div>
      </header>
      <div className="search-screen">
        <div className="search-intro">
          <h1>Who are you trying to hire?</h1>
          <p>Write it out the way you'd explain it to a colleague — skills, years of experience, location, the kind of company they should have come from.</p>
        </div>
        <div className="search-form">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. RDS developers with 4–7 years of experience, worked at startups, based in Bangalore"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) search() }}
            autoFocus
          />
          {err && <div className="err">{err}</div>}
          <div className="search-row">
            <span className="search-tip">Ctrl+Enter to search</span>
            <button className="btn-search" onClick={search} disabled={!query.trim()}>Search</button>
          </div>
        </div>
        <div className="examples">
          <div className="examples-label">Some examples to get started</div>
          {EXAMPLES.map(ex => (
            <button key={ex} className="example-btn" onClick={() => setQuery(ex)}>{ex}</button>
          ))}
        </div>
      </div>
    </div>
  )

  // Loading
  if (phase === 'loading') {
    const steps = ['Reading your query', 'Building filters and scoring criteria', 'Matching and ranking candidates']
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo">Flexiple <span>/ Sourcing</span></div>
        </header>
        <div className="loading-screen">
          <p>Working on it…</p>
          <div className="progress-steps">
            {steps.map((s, i) => (
              <div key={i} className={`progress-step ${i < step ? 'done' : i === step - 1 ? 'active' : ''}`}>
                <div className="step-indicator" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Frozen
  if (phase === 'frozen') return (
    <div className="app">
      <header className="header">
        <div className="header-logo">Flexiple <span>/ Sourcing</span></div>
        <div className="header-context">Locked after {round} round{round !== 1 ? 's' : ''}</div>
      </header>
      <div className="frozen-page">
        <div className="frozen-notice">Search locked. Here's what you ended up with.</div>

        <div className="frozen-block">
          <h3>Filters</h3>
          <div className="frozen-pills">
            {filters.location && <div className="frozen-pill"><span className="k">Location</span><span className="v">{filters.location}</span></div>}
            <div className="frozen-pill">
              <span className="k">Experience</span>
              <span className="v">{filters.minExperience}–{filters.maxExperience >= 99 ? '∞' : filters.maxExperience} yrs</span>
            </div>
            {filters.companyType && <div className="frozen-pill"><span className="k">Company</span><span className="v">{filters.companyType}</span></div>}
            {filters.skills?.map(s => <div key={s} className="frozen-pill"><span className="k">Skill</span><span className="v">{s}</span></div>)}
          </div>
        </div>

        <div className="frozen-block">
          <h3>What we were looking for</h3>
          <div className="frozen-rubric">
            {rubric.map((r, i) => <div key={i} className="frozen-rubric-row">{r}</div>)}
          </div>
        </div>

        <div className="frozen-block">
          <h3>Final shortlist — {profiles.length} people</h3>
          <div className="frozen-cards">
            {profiles.map((p, i) => <Card key={p.id} profile={p} index={i} votes={{}} onVote={() => {}} frozen />)}
          </div>
        </div>

        <button className="btn-again" onClick={() => { setPhase('search'); setQuery('') }}>Start over</button>
      </div>
    </div>
  )

  // Results
  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">Flexiple <span>/ Sourcing</span></div>
        <div className="header-context">
          "{query.length > 55 ? query.slice(0, 55) + '…' : query}"
          {round > 1 && ` · ${round - 1} refinement${round - 1 !== 1 ? 's' : ''}`}
        </div>
      </header>

      <div className="workspace">
        <Sidebar filters={filters} rubric={rubric} onLock={() => setPhase('frozen')} />

        <div className="results-area">
          <div className="results-bar">
            <h2>Results</h2>
            <span className="results-count">{total} matched · showing top {profiles.length}</span>
          </div>

          {err && <div className="err">{err} — previous results still shown.</div>}

          {profiles.length === 0 ? (
            <div className="no-results">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Nothing matched</div>
              <p>Try loosening the experience range, dropping the location, or changing the company type in the chat below.</p>
            </div>
          ) : (
            <div className="cards">
              {profiles.map((p, i) => (
                <Card key={p.id} profile={p} index={i} votes={votes} onVote={voteOn} frozen={false} />
              ))}
            </div>
          )}

          <div className="chat">
            <div className="chat-log">
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.from === 'me' ? 'me' : 'them'}`}>
                  <div className="msg-who">{m.from === 'me' ? 'you' : ''}</div>
                  <div className={`msg-text ${m.updated ? 'updated' : ''}`}>{m.text}</div>
                </div>
              ))}
              {busy && (
                <div className="msg them">
                  <div className="msg-who"></div>
                  <div className="msg-text"><div className="dots"><span /><span /><span /></div></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder='Tell me what to change, e.g. "1 is too junior" or "only startup experience"'
                onKeyDown={e => { if (e.key === 'Enter') refine() }}
                disabled={busy}
              />
              <button className="btn-refine" onClick={refine} disabled={!input.trim() || busy}>Update</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
