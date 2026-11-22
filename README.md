# VOLT vs TITAN

**▶ Play now in your browser: https://machangdoniel.github.io/volt-vs-titan/**

A 3D superhero duel across a procedurally generated universe that runs in the browser. Built with Three.js and Vite, and all original characters.

**Heroes** (stats and moves live in `src/fighter.js`):
| Hero | Style | K (beam) | Q (special) |
|---|---|---|---|
| VOLT | Speedster | Lightning | Time Slow: enemy at 30% speed |
| TITAN | Powerhouse flyer | Heat Vision | Shockwave: area blast and stun |
| NOVA | Ranged blaster | Homing Plasma Orb | Star Barrage: 7 seeking stars |
| RIFT | Teleporting speedster | Phase Shards (3-way) | Blink Strike: teleport behind and hit (counts toward combos) |
| GLACIER | Ice tank | Frost Ray (slows) | Ice Prison: freezes the enemy solid |

**The fight travels:** land a **3-hit combo** (punches or Blink Strike) to **LAUNCH** your opponent. After 12 seconds in a system, a launch sends both fighters through warp space into the next system. Each system is generated from a seed and is one of 8 types: terran, desert, ice or lava planet, a ringed gas giant, a **star corona** (the surface burns), a **black hole** (gravity pulls you in and the core hurts), or an asteroid belt.

Matches are best of 3 against an AI opponent (Easy / Normal / Hard). You can pick the opponent or leave it on random.

## Controls
| Key | Action |
|---|---|
| W A S D / arrows | Move (W = toward the enemy, A/D = circle around them) |
| Space / C | Fly up / down |
| J or left click | Punch (short wind-up, so it can be blocked) |
| K or right click | Beam (costs energy) |
| Shift | Dash |
| Q | Special ability |
| F (hold) | Block (blocked hits deal 75% less damage, but drain energy) |
| Esc | Pause |

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
```
Add `#demo` to the URL to watch AI vs AI. Optional flags, joined with `-`: an arena (`mars`, `deep`), a hero (`nova`), `seed20` to start in a generated system, or `warptest`. Example: `#demo-glacier-seed20`.

## Project layout
- `src/main.js`: renderer, game loop, rounds, camera, input, HUD, sounds
- `src/fighter.js`: **hero roster (stats live here)**, character models, moves, combos
- `src/combat.js`: projectiles (homing, spread, chill)
- `src/ai.js`: AI opponent
- `src/world.js`: procedural star systems, hazards, asteroids, starfield
- `src/effects.js`: particles and shockwave rings

## Deploy (free)
```bash
npm run build      # outputs dist/
```
Upload `dist/` to any static host:
- **Cloudflare Pages:** `npx wrangler pages deploy dist` (free, unlimited bandwidth)
- **Netlify:** drag `dist/` onto app.netlify.com/drop
- **GitHub Pages / itch.io:** upload the `dist/` folder (itch.io: zip it, then choose "HTML game")

The only real cost is a custom domain (about $10–15/year), and that's optional.
