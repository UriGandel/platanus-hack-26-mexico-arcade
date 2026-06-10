# Project Documentation: NEON HEIST: CORE RUSH

Welcome, Agent. This document describes the current game implemented in `game.js` so future agents can work from the real gameplay instead of the old starter/reference.

## Game Identity

**NEON HEIST: CORE RUSH** is a Phaser 3 arcade survival heist.

The core fantasy is: steal neon cores, build a risky loot stash, raise the multiplier, then cash out before damage burns the loot. It supports 1P and 2P co-op with a shared bank, shared loot stash, shared heat, and shared multiplier.

## Hard Repo Rules

- Primary game code lives in `game.js`.
- Metadata lives in `metadata.json`.
- Cover art lives in `cover.png`.
- Keep `game.js` under 50 KB after minification.
- Do not add imports, `require`, network calls, external URLs, or external assets.
- Do not run `npm run dev`; the user handles dev server testing.
- Validate with:

```bash
npm run check-restrictions
```

## Current Gameplay Loop

1. Choose mode from the title screen: `1 PLAYER`, `2 PLAYERS`, or `LEADERBOARD`.
2. Choose difficulty with left/right before starting.
3. During a run, kill enemies, parry bullets, dash-tag enemies, and collect cores.
4. These actions add to `LOOT`, the temporary stash at risk.
5. `MULT` increases the value of future loot.
6. `HEAT` rises as the run gets richer and more dangerous.
7. Press `START1` or `START2` during play to cash out:
   - `LOOT` is converted into `BANK`.
   - `LOOT` resets to zero.
   - `HEAT` drops.
   - `MULT` is partially reduced.
8. Taking damage burns a percentage of `LOOT`, resets `MULT`, and raises `HEAT`.
9. Game over saves the final banked score and wave to the leaderboard.

## Difficulty Modes

Difficulty is selected on the menu with joystick left/right.

- `CHILL`: More HP, lower speed/pressure, lower bank multiplier, lower loot burn.
- `NORMAL`: Baseline arcade balance.
- `HARD`: More enemies, faster pressure, higher cashout score multiplier, harsher loot burn.
- `NIGHTMARE`: Maximum enemy speed/count/boss pressure, highest cashout multiplier, most punishing loot burn.

Difficulty affects:

- Player starting HP.
- Enemy count per wave.
- Enemy speed.
- Gunner and boss bullet speed/cadence.
- Boss health and bullet patterns.
- Passive heat growth.
- Percentage of loot lost on damage.
- Score multiplier applied at cashout.

## Controls

Use arcade codes in gameplay logic, never raw keyboard keys.

### Menu

- `P1_U` / `P2_U`: Move menu selection up.
- `P1_D` / `P2_D`: Move menu selection down.
- `P1_L` / `P2_L`: Previous difficulty.
- `P1_R` / `P2_R`: Next difficulty.
- `START1` / `START2` / `P1_1` / `P2_1`: Select.

### Gameplay

- Joystick: Move.
- Button 1 (`P1_1`, `P2_1`): Slash.
- Button 2 (`P1_2`, `P2_2`): Dash.
- Start (`START1`, `START2`): Cash out current loot.

Do not replace existing arrays inside `CABINET_KEYS`; they match the physical arcade cabinet.

## Combat Systems

### Slash

Button 1 creates a forward neon arc. It:

- Damages enemies.
- Cuts the boss.
- Parry-deflects enemy bullets into player-owned projectiles.
- Builds multiplier and loot through kills/parries.

### Dash

Button 2 performs a fast burst in the current direction. Passing through enemies tags them and adds small loot/multiplier pressure.

### Bullet Parry

Slashing enemy bullets:

- Changes bullet ownership to the player.
- Recolors the bullet.
- Sends it forward at high speed.
- Adds loot, multiplier, hitstop, and sound feedback.

### Co-op Link Beam

In 2P mode, if both players are alive and close enough, a green beam connects them. Enemies intersecting the beam take repeat damage. Beam kills add reduced loot but help sustain the shared run.

## Enemies

- `runner`: Basic chaser.
- `gunner`: Holds range and fires bullets.
- `mine`: Fast kamikaze threat; contact explodes and damages players.
- `boss`: Vault Guardian, appears every fourth wave.

Enemy pacing scales with wave and heat. Difficulty multiplies enemy count, speed, bullet pressure, and boss behavior.

## Boss / Jackpot Rule

Every fourth wave spawns the Vault Guardian.

Destroying it does not directly bank points. It adds a large jackpot to `LOOT`, raises heat, and asks the player to make the key heist decision: cash out now or keep risking the stash for more multiplier.

## HUD

The gameplay HUD shows:

- Difficulty name.
- `BANK`: Safe score already cashed out.
- `LOOT`: Temporary stash at risk.
- `MULT`: Current loot multiplier.
- `HEAT`: Current pressure/danger.
- `WAVE`: Current wave.

## Persistence

Leaderboard data uses `window.platanusArcadeStorage` when available and falls back to local storage in local testing. Current key:

```text
neon-heist-scores
```

Stored entries are shaped like:

```js
{ name: "AAA", score: 12345, wave: 7 }
```

Always validate stored data before using it because hackathon storage persists across releases.

## Procedural Assets

All game visuals and audio are generated in `game.js`:

- Canvas textures for ships, enemies, bullets, cores, and boss.
- Phaser graphics for grid, trails, HUD accents, sparks, and effects.
- Web Audio buffers for slash, zap, hit, cashout, and music loop.

`cover.png` is a generated 800x600 PNG representing the neon heist fantasy.

## Current Validation Baseline

After the difficulty update, `npm run check-restrictions` passed with:

- No imports.
- No network calls.
- No external URLs.
- No suspicious code safety patterns.
- `game.js` minified size around 19.34 KB, well under the 50 KB limit.
