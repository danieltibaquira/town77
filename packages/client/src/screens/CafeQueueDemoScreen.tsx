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
const BOARD = [
  ['beans', 'milk', 'steam', 'ice'],
  ['water', 'tea', 'chocolate', 'caramel'],
  ['milk', 'steam', 'ice', 'beans'],
  ['tea', 'water', 'caramel', 'chocolate'],
]
const RESOURCE_COLORS: Record<string, string> = { beans: '#7b4b2a', milk: '#fff', steam: '#d9f0ff', ice: '#8ee3f5', water: '#5bc0eb', tea: '#a8d05f', chocolate: '#8f5d3b', caramel: '#e6a756' }
const PATHS = [[0, 4, 5, 1], [1, 2, 6, 10], [2, 3, 7, 11]]

export function CafeQueueDemoScreen() {
  const navigate = useNavigate()
  const [speed, setSpeed] = useState<Speed>('Normal')
  const [paused, setPaused] = useState(false)
  const [step, setStep] = useState(0)
  const finished = step >= 18
  const active = PLAYERS[step % PLAYERS.length]!
  const log = useMemo(() => Array.from({ length: Math.min(step, 18) }, (_, index) => `${PLAYERS[index % PLAYERS.length]} ${ACTIONS[index % ACTIONS.length]}`), [step])
  const positions = PLAYERS.map((_, playerIndex) => PATHS[playerIndex]![Math.min(3, Math.floor((step + playerIndex) / 3) % 4)]!)
  const supplies = 102 - Math.min(step, 18)

  useEffect(() => {
    if (paused || finished) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), SPEEDS[speed])
    return () => window.clearTimeout(timer)
  }, [finished, paused, speed, step])

  return <main data-testid="cafe-queue-demo" style={{ background: '#f7f1df', color: '#000', minHeight: '100vh', padding: 24, display: 'grid', gap: 18, maxWidth: 1100, margin: '0 auto' }}>
    <header style={{ border: '3px solid #000', background: '#ffe66d', padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>CAFE QUEUE — WATCH DEMO</strong><span>{finished ? 'DEMO COMPLETE' : `${active.toUpperCase()} IS SERVING`}</span></header>
    <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(290px, 360px)', gap: 18 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', border: '3px solid #000', padding: 10, background: '#fff' }}><strong>Ingredient board</strong><span>Supply: {supplies}/102</span></div>
        <div data-testid="demo-resource-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>{BOARD.flatMap((row, rowIndex) => row.map((ingredient, colIndex) => { const index = rowIndex * 4 + colIndex; const occupants = positions.map((position, playerIndex) => position === index ? PLAYERS[playerIndex]![0] : '').filter(Boolean).join(' '); return <div key={`${rowIndex}-${colIndex}`} style={{ minHeight: 100, border: '3px solid #000', background: RESOURCE_COLORS[ingredient], color: ingredient === 'beans' || ingredient === 'chocolate' ? '#fff' : '#000', padding: 10, display: 'grid', alignContent: 'space-between', fontWeight: 900 }}><span>{ingredient.toUpperCase()}</span><span style={{ background: '#ff6b6b', border: '2px solid #000', color: '#000', display: occupants ? 'inline-block' : 'none', padding: '2px 5px', width: 'fit-content' }}>{occupants}</span></div> }))}</div>
      </div>
      <aside style={{ display: 'grid', alignContent: 'start', gap: 12 }}>
        <section style={{ border: '3px solid #000', background: '#fff', padding: 12 }}><strong>Baristas</strong>{PLAYERS.map((player, index) => <div key={player} style={{ border: '2px solid #000', background: active === player && !finished ? '#ffe66d' : '#fff', marginTop: 8, padding: 8 }}><strong>{player}</strong><br /><small>Cup: {index === step % 3 ? 'beans + water' : 'empty'} · Orders: {Math.max(0, 4 - Math.floor(step / 5))}</small></div>)}</section>
        <section style={{ border: '3px solid #000', background: '#fff', padding: 12 }}><strong>Orders in queue</strong><p style={{ margin: '8px 0 0' }}>Beans + water</p><p style={{ margin: '4px 0' }}>Tea + ice + water</p><p style={{ margin: '4px 0' }}>Chocolate + milk</p></section>
        <section style={{ border: '3px solid #000', background: '#fff', padding: 12 }}><strong>Action log</strong><ol style={{ marginBottom: 0 }}>{log.slice(-5).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ol></section>
      </aside>
    </section>
    <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(SPEEDS) as Speed[]).map((candidate) => <button key={candidate} type="button" onClick={() => setSpeed(candidate)} style={{ border: '3px solid #000', background: speed === candidate ? '#ffe66d' : '#fff', color: '#000', fontWeight: 800, padding: '10px 14px' }}>{candidate}</button>)}<button type="button" onClick={() => setPaused((value) => !value)} style={{ border: '3px solid #000', background: '#ff6b6b', color: '#000', fontWeight: 800, padding: '10px 14px' }}>{paused ? 'RESUME' : 'PAUSE'}</button>{finished && <button type="button" onClick={() => { setStep(0); setPaused(false) }} style={{ border: '3px solid #000', background: '#4ecdc4', color: '#000', fontWeight: 800, padding: '10px 14px' }}>WATCH AGAIN</button>}<button type="button" onClick={() => navigate('/')} style={{ border: '3px solid #000', background: '#fff', color: '#000', fontWeight: 800, padding: '10px 14px' }}>BACK</button></section>
  </main>
}
