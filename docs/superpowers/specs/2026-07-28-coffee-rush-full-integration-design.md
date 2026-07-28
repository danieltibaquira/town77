# Coffee Rush Full Integration Design

## Goal

Add an original cafe-queue game module to Town77 that supports authoritative multiplayer rooms, reload/reconnect recovery, solo play, and a playable client while keeping the existing tile-placement game unchanged.

## Scope

Coffee Rush is a separate game ID and does not reuse tile-placement state. It reuses Town77's room identity, SQLite persistence, presence, recovery, state projection, rate limiting, and theme infrastructure.

Until the user supplies a card catalogue, the module uses a small original placeholder order deck. It is intentionally not a reproduction of Coffee Rush card names, art, layouts, or recipe catalogue. The deck is injected through a typed seed contract and can be replaced without changing rules code.

## Architecture

### Shared contract

Add discriminated game state and socket actions for `cafe-queue`. Shared types own:

- ingredient kinds, finite supply, rush supply, recipes, cups, orders, upgrades, and player state;
- game configuration, including player limit, board topology, initial resources, and order seeds;
- server-authoritative action payloads and result events;
- a serializable persisted snapshot that never contains client-only state.

### Pure game engine

Create `packages/game-engine/src/games/cafe-queue/`. It has no database or socket dependencies. Its processors take state plus an action, return a new state, and fail with typed domain errors.

The module implements setup, legal path validation, finite collection, rush spending, cup allocation/emptying, exact multiset recipe completion, specialty rewards, upgrade activation, overload distribution, order aging, penalty creation, end arming, final-round boundary, scoring, and a deterministic bot.

### Server authority

The server selects a game module from the room game ID, stores its snapshot in the existing room record, and exposes Coffee Rush-specific event handlers. Every state-changing action is authenticated by the room session token, checked against turn ownership, rate limited, applied transactionally, persisted before broadcast, and projected per recipient.

Hidden state remains hidden: the order deck sequence, other players' cup contents, and private planning data are absent from recipient projections.

### Client

Add a game chooser and Coffee Rush routes. The client renders an original ingredient-grid presentation, own cups and orders, public player queues, upgrades, resources, turn affordances, and results. It sends action intents only and restores from the server snapshot after a reload.

## Game rules contract

- 2-4 players. Three/four player games use one meeple per player; two-player games use two each and move one per turn.
- Supply is finite: beans 18; each other ingredient kind starts at 12; rush supply starts at 15.
- A normal move path has one to three steps; rush tokens buy extra steps. Orthogonal movement is default; diagonal movement is an upgrade.
- Passing through an occupied cell is allowed and collects normally; the final cell cannot be occupied.
- Newly collected ingredients may be poured into cups or returned. Existing cup contents cannot transfer between cups; emptying returns all contents to supply.
- Orders require exact ingredient multisets. Multiple matching cups can complete multiple orders in a turn.
- Three completed orders can activate one permanent upgrade. Overlapping collection multipliers stack.
- Completed orders overload neighboring players' tab-one queues. Orders age each turn; tab-four departures become penalties and award rush tokens when available.
- End arms when the order deck runs out or a player has five penalties, then resolves at the documented starting-player round boundary.
- Score is completed orders plus two per active upgrade minus penalties. Tie-break: completed orders, then rush tokens, then shared win.

## Error handling

Reject without mutation: wrong game or phase, non-current player, invalid path, insufficient rush tokens, occupied final cell, unavailable/invalid cup, non-exact recipe, illegal upgrade purchase, unavailable order, and malformed payload. Handler responses provide a stable error code and a user-safe message.

## Test strategy

1. Pure engine: setup, each processor, every rejection path, finite-resource invariant, two-player deviations, end boundary, scoring ties, seeded determinism, and bot legality.
2. Server: create/join/start, private-state projection, turn authority, transactional persistence, reload/reconnect, duplicate tabs, and two-player through four-player rooms.
3. Client: chooser, configuration, legal interaction affordances, cup/order workflow, reconnect recovery, and results.
4. End-to-end: create room, join players, start, play a deterministic complete game, reload one player mid-game, and finish with server-calculated results.

## Acceptance criteria

- Existing Town77 tile-placement tests and behaviour remain unchanged.
- Coffee Rush can be created, joined, started, resumed after reload, completed, and scored through the deployed app.
- No player can see another player's cup contents or the future order deck.
- Server restart/reconnect restores the persisted snapshot and resets transient presence safely.
- All rule mutations are deterministic under a seed and fully covered by automated tests.
- Placeholder orders are clearly original and replaceable through one typed deck module.
