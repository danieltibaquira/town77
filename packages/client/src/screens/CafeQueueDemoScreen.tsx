import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLAYERS = ['Ada', 'Bea', 'Cam']
const ACTIONS = [
  'moves to water and collects 1 water',
  'pours ingredients into cup 1',
  'serves an order and advances the queue',
  'moves to milk and collects 1 milk',
  'uses a rush token for an extra move',
  'ends service and passes the turn',
]

const SPEEDS = { Slow: 1600, Normal: 900, Fast: 350 } as const
type Speed = keyof typeof SPEEDS

export function CafeQueueDemoScreen() {
  const navigate = useNavigate()
  const [speed, setSpeed] = useState<Speed>('Normal')
  const [paused, setPaused] = useState(false)
  const [step, setStep] = useState(0)
  const finished = step >= 18
  const active = PLAYERS[step % PLAYERS.length]!
  const log = useMemo(() => Array.from({ length: Math.min(step, 18) }, (_, index) => `${PLAYERS[index % PLAYERS.length]} ${ACTIONS[index % ACTIONS.length]}`), [step])

  useEffect(() => {
    if (paused || finished) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), SPEEDS[speed])
    return () => window.clearTimeout(timer)
  }, [finished, paused, speed, step])

  return <main data-testid="cafe-queue-demo" style={{ background: '#f7f1df', color: '#000', minHeight: '100vh', padding: 24, display: 'grid', gap: 18, maxWidth: 820, margin: '0 auto' }}>
    <header style={{ border: '3px solid #000', background: '#ffe66d', padding: 16 }}><strong>CAFE QUEUE — WATCH DEMO</strong><p style={{ margin: '8px 0 0' }}>{finished ? 'Demo complete · final scores ready' : `${active} is serving`}</p></header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>{Array.from({ length: 16 }, (_, index) => <div key={index} style={{ minHeight: 72, border: '3px solid #000', background: index === step % 16 ? '#4ecdc4' : '#fff', padding: 8 }}>station {index + 1}</div>)}</section>
    <section style={{ border: '3px solid #000', background: '#fff', padding: 16 }}><strong>Action log</strong><ol>{log.slice(-6).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol></section>
    <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(SPEEDS) as Speed[]).map((candidate) => <button key={candidate} type="button" onClick={() => setSpeed(candidate)} style={{ border: '3px solid #000', background: speed === candidate ? '#ffe66d' : '#fff', color: '#000', fontWeight: 800, padding: '10px 14px' }}>{candidate}</button>)}<button type="button" onClick={() => setPaused((value) => !value)} style={{ border: '3px solid #000', background: '#ff6b6b', color: '#000', fontWeight: 800, padding: '10px 14px' }}>{paused ? 'RESUME' : 'PAUSE'}</button>{finished && <button type="button" onClick={() => { setStep(0); setPaused(false) }} style={{ border: '3px solid #000', background: '#4ecdc4', color: '#000', fontWeight: 800, padding: '10px 14px' }}>WATCH AGAIN</button>}<button type="button" onClick={() => navigate('/')} style={{ border: '3px solid #000', background: '#fff', color: '#000', fontWeight: 800, padding: '10px 14px' }}>BACK</button></section>
  </main>
}
