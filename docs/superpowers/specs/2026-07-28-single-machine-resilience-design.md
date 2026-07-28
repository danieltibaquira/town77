# Single-machine multiplayer resilience

## Goal

Make Town77 reliable for many simultaneous rooms on one Fly machine while preserving active games through browser reloads, transient socket reconnects, and machine restarts. Keep game state private and do not add horizontal scaling.

## Recovery contract

The client persists its room code, player ID, player name, and session token. On `/room/:code` or `/game/:code`, it reconnects using that token whenever the socket connects or reconnects. A rejoined player receives the current persisted room state and resumes the current route. The game route displays a recovery state until this succeeds or returns a terminal room/session error; it must not redirect home while recovery is pending.

## Room state and privacy

SQLite remains the sole durable authority. Each mutation writes the full room state before notifying clients. Server notifications are projected per recipient: a player receives their own hand and never another player's hand. Room membership, score, grid, turn, connection state, and configuration remain shared.

## Connection state

Connection state is tracked per player across sockets. A player is marked disconnected only when their final active socket leaves. Rejoining restores membership and connection state. This supports multiple browser tabs without falsely marking the player offline.

## Atomic data changes

Create-room and join-room persistence use SQLite transactions. A failed player insert rolls back the accompanying room-state change. Existing game mutations remain one synchronous read-modify-write operation in the single Node process.

## Abuse and retention

Use bounded in-memory rate limits: room creation/joining is limited per IP; gameplay events are limited per socket. Expired limiter records are removed. A periodic cleanup deletes empty lobby rooms older than 24 hours and finished rooms older than seven days, along with their player rows. Active and recoverable in-progress rooms are never deleted by cleanup.

## Deployment boundary

Fly runs exactly one always-on machine using the mounted SQLite volume. The app does not claim multi-machine correctness: Socket.IO room membership and the rate-limit/connection maps are process-local, and SQLite is not the shared coordination store.

## Validation

Tests precede each behavior change. Coverage includes game-route reload recovery, reconnect rejoin, recipient-specific state projection, duplicate-tab disconnect handling, transactional rollback, rate limits, cleanup eligibility, and the existing server/client suites. A server integration test exercises the real Socket.IO handler and SQLite database.
