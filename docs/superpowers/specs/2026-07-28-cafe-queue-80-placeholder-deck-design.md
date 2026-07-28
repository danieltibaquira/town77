# Cafe Queue 80-card placeholder deck

## Goal

Make the Cafe Queue placeholder data support a full-length game while preserving the existing engine contract and allowing a later replacement with the user's original card catalogue.

## Deck factory

`createPlaceholderOrders()` will return exactly 80 cards. It will repeat the existing twelve original placeholder recipe patterns in deterministic order, assigning each card a unique stable identifier. Recipe quantities and specialty flags remain unchanged.

The recipe seed list remains private implementation data. Consumers receive cloned order and recipe objects, so no game state can mutate the shared factory data.

## Game integration

Setup, order distribution, projection, persistence, scoring, and end-boundary logic continue to consume the deck through the existing `CafeQueueOrder[]` contract. No new network event or client authority is introduced.

The end rule remains unchanged: arm the final round when the deck is exhausted or a player has five penalties, then finish at the starting-player boundary.

## Tests

- Deck has exactly 80 cards and 80 unique IDs.
- Each card retains one of the twelve existing recipe/specialty patterns.
- Returned cards and recipes are independent copies.
- Three-player setup deals seven cards and leaves 73 cards in the deck.
- A deterministic server full-game fixture exhausts the deck, completes the final round, persists `finished`, and emits server-calculated scores.

## Scope boundary

This is temporary original placeholder data. It does not reproduce Coffee Rush card names, art, layouts, or unknown card catalogue details. The supplied real-card catalogue will later replace only the seed data.
