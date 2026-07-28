# Direct Entry Workflow

## Goal

Make the home page the only normal entry point for a multiplayer game.

## User Flow

1. The home page shows Create Game, a room-code input, and Join.
2. Create Game uses the standard game configuration, Neobrutalism, and an automatically generated player name. The host is taken to the room lobby when the server creates the room.
3. Join uses the entered room code and an automatically generated player name. The joining player is taken to that room lobby.
4. In the lobby, the host sees Start Game disabled until a second player joins. It becomes enabled at two or more players. Non-hosts do not see Start Game.

## Scope

- Replace the home-page Join navigation button with an inline room-code form.
- Create directly from the home page, using `DEFAULT_GAME_CONFIG` and the default theme.
- Keep existing `/config` and `/join` routes available, but do not link to them from the default path.
- Preserve the existing lobby start authorization and player-count gate.

## Error Handling

The join form is disabled until a non-empty room code is provided. Server-side join errors continue to flow through the existing game store.

## Verification

- Home-screen tests cover direct create and disabled/enabled join states.
- Existing lobby tests cover the disabled host start button, enabled two-player state, and hidden non-host control.
- Rendered QA exercises home create and join controls without creating a production room.
