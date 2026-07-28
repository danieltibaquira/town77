import { useEffect, useMemo, useState } from 'react'
import type { CafeQueueCellId, CafeQueueRecipe, CafeQueueState } from '@town77/shared-types'
import { CAFE_QUEUE_INGREDIENTS } from '@town77/shared-types'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

function sameRecipe(left: CafeQueueRecipe, right: CafeQueueRecipe): boolean {
  return CAFE_QUEUE_INGREDIENTS.every((ingredient) => (left[ingredient] ?? 0) === (right[ingredient] ?? 0))
}

function adjacent(from: CafeQueueCellId, to: CafeQueueCellId): boolean {
  const parse = (cell: CafeQueueCellId) => /^r(\d+)c(\d+)$/.exec(cell)!.slice(1).map(Number)
  const [fromRow, fromCol] = parse(from)
  const [toRow, toCol] = parse(to)
  return Math.abs(fromRow! - toRow!) + Math.abs(fromCol! - toCol!) === 1
}

export function CafeQueueGameScreen({ state, playerId, roomCode }: { state: CafeQueueState; playerId: string; roomCode: string | null }) {
  const navigate = useNavigate()
  const send = useGameStore((store) => store.sendCafeQueueAction)
  const [meepleIndex, setMeepleIndex] = useState(0)
  const me = state.players.find((player) => player.id === playerId)
  const isMyTurn = state.players[state.turnIndex]?.id === playerId
  const currentPosition = me?.meeplePositions[meepleIndex]
  const cells = useMemo(() => Object.keys(state.config.board) as CafeQueueCellId[], [state.config.board])

  useEffect(() => {
    if (state.phase === 'finished') navigate(`/results/${roomCode ?? ''}`)
  }, [navigate, roomCode, state.phase])

  if (!me) return <main data-testid="cafe-queue-game" style={{ minHeight: '100vh' }}>Waiting for player session…</main>

  return (
    <main data-testid="cafe-queue-game" style={{ background: '#f7f1df', color: '#000', minHeight: '100vh', padding: 'var(--space-md)', display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 420px)' }}>
      <section style={{ display: 'grid', alignContent: 'start', gap: 'var(--space-md)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', border: '3px solid #000', background: isMyTurn ? '#ffe66d' : '#fff', padding: 'var(--space-sm)' }}>
          <strong>CAFE QUEUE</strong><span>{isMyTurn ? 'YOUR SERVICE' : `${state.players[state.turnIndex]?.name ?? '…'} is serving`}</span>
        </header>
        <div data-testid="cafe-queue-board" style={{ display: 'grid', gridTemplateColumns: `repeat(${state.config.cols}, minmax(56px, 1fr))`, gap: 6, maxWidth: 620 }}>
          {cells.map((cell) => {
            const occupants = state.players.flatMap((player) => player.meeplePositions.map((position, index) => position === cell ? `${player.id}:${index}` : null)).filter(Boolean)
            const legal = isMyTurn && !me.hasMovedThisTurn && currentPosition !== undefined && adjacent(currentPosition, cell) && occupants.length === 0
            return <button key={cell} type="button" data-testid={`cafe-cell-${cell}`} disabled={!legal} onClick={() => send({ type: 'move_meeple', meepleIndex, path: [cell], rushSpent: 0 })} style={{ minHeight: 74, border: '3px solid #000', background: legal ? '#4ecdc4' : '#fff', color: '#000', fontWeight: 800, cursor: legal ? 'pointer' : 'default' }}>{state.config.board[cell]}<br />{occupants.join(' ')}</button>
          })}
        </div>
        {me.meeplePositions.length > 1 && <div>{me.meeplePositions.map((position, index) => <button key={position} type="button" onClick={() => setMeepleIndex(index)} style={{ marginRight: 6, border: '2px solid #000', background: index === meepleIndex ? '#ff6b6b' : '#fff', color: '#000' }}>Meeple {index + 1}</button>)}</div>}
      </section>

      <aside style={{ display: 'grid', alignContent: 'start', gap: 'var(--space-md)' }}>
        <section style={{ border: '3px solid #000', padding: 'var(--space-sm)', background: '#fff' }}>
          <strong>New ingredients</strong>
          <p data-testid="cafe-collected">{CAFE_QUEUE_INGREDIENTS.map((ingredient) => `${ingredient}: ${me.collectedThisTurn[ingredient] ?? 0}`).join(' · ')}</p>
          <button type="button" disabled={!isMyTurn || Object.keys(me.collectedThisTurn).length === 0} onClick={() => send({ type: 'pour_ingredients', allocations: [{ cupIndex: 0, ingredients: me.collectedThisTurn }] })}>POUR INTO CUP 1</button>
        </section>
        <section style={{ border: '3px solid #000', padding: 'var(--space-sm)', background: '#fff' }}>
          <strong>Your cups</strong>
          {me.cups.map((cup, index) => <div key={index} data-testid={`cafe-cup-${index}`} style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}><span>Cup {index + 1}: {CAFE_QUEUE_INGREDIENTS.map((ingredient) => `${ingredient[0]}${cup.ingredients[ingredient] ?? 0}`).join(' ')}</span><button type="button" disabled={!isMyTurn || Object.keys(cup.ingredients).length === 0} onClick={() => send({ type: 'empty_cup', cupIndex: index })}>EMPTY</button></div>)}
        </section>
        <section style={{ border: '3px solid #000', padding: 'var(--space-sm)', background: '#fff' }}>
          <strong>Your orders</strong>
          {me.orderTabs.flatMap((tab, tabIndex) => tab.map((order) => {
            const cupIndex = me.cups.findIndex((cup) => sameRecipe(cup.ingredients, order.recipe))
            return <div key={order.id} data-testid={`cafe-order-${order.id}`} style={{ marginTop: 6 }}><span>{order.id} · {Object.entries(order.recipe).map(([ingredient, count]) => `${ingredient} ${count}`).join(', ')}</span><button type="button" disabled={!isMyTurn || cupIndex < 0} onClick={() => send({ type: 'complete_orders', completions: [{ cupIndex, tabIndex, orderId: order.id }] })}>SERVE</button></div>
          }))}
        </section>
        <section style={{ border: '3px solid #000', padding: 'var(--space-sm)', background: '#fff' }}>
          <strong>Upgrades</strong>
          <p>{me.completedOrders.length} completed orders available</p>
          {(['double-occupied-cell', 'diagonal-movement', 'double-corner', 'double-specialty-cell'] as const).map((upgrade) => <button key={upgrade} type="button" disabled={!isMyTurn || me.completedOrders.length < 3 || me.activeUpgrades.includes(upgrade)} onClick={() => send({ type: 'activate_upgrade', upgrade })} style={{ marginRight: 4 }}>{me.activeUpgrades.includes(upgrade) ? `✓ ${upgrade}` : upgrade}</button>)}
        </section>
        <button type="button" data-testid="cafe-end-turn" disabled={!isMyTurn} onClick={() => send({ type: 'end_turn' })} style={{ background: '#ff6b6b', color: '#000', border: '3px solid #000', boxShadow: '4px 4px 0 #000', fontWeight: 900, padding: 'var(--space-md)' }}>END TURN</button>
      </aside>
    </main>
  )
}
