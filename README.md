# Adaptive Stealth — Nightfall Prototype

A browser-playable stealth/horror prototype based on the Adaptive Stealth Game AI blueprint. The player moves through a dark facility while an alien hunter makes decisions from imperfect sensory information.

## Current implementation

- Top-down playable facility with keyboard movement, collision, an extraction zone, stamina, and health.
- Vision cone and line-of-sight checks blocked by facility walls.
- Sound-event hearing from footsteps, sprinting, and thrown metal decoys.
- A decaying spatial scent trail that can be followed after visual contact is lost.
- Utility action scoring across patrol, investigate noise, search last known position, follow scent, intercept, and recover.
- A player-habit profile that tracks crouching, movement, and decoy frequency; repeated decoys reduce noise-investigation utility.
- Tension director states: LULL, BUILD-UP, CLIMAX, and RECOVERY.
- Responsive telemetry dashboard and local-only gameplay; no camera, identity recognition, or data collection.

This is a **prototype**, not a full 3D game-engine build. It demonstrates the decision and sensory loop in a lightweight web simulation. Multi-agent pack coordination, full pathfinding/navmesh, real material-based acoustic raycasts, and production-quality animation/audio remain future expansions.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Import `kaartik00k-tech/Adaptive-Stealth` in Vercel.
2. Use the Next.js framework preset.
3. Keep the build command as `npm run build` and install command as `npm install`.
4. Deploy. No environment variables are required for the current game.

The application is client-side for gameplay, so it does not need a server database to run.

## Supabase (optional future capability)

Supabase dependencies and an `.env.example` are included for a future account, leaderboard, or cloud-save feature, but no Supabase client is used in this gameplay-only version. Do not add credentials until a feature needs them. If cloud persistence is added, use Supabase Auth, per-user Row Level Security, and server-validated writes. Never expose a service-role key in browser code.

## Controls

- **WASD / Arrow keys:** move
- **Shift / Control:** crouch and reduce footstep noise
- **Space:** sprint (consumes stamina and generates loud sounds)
- **E:** throw a decoy in the direction of movement
- Reach the glowing green exit in the lower-right corner to extract.

## Verification

Run `npm run build` before deployment. A real browser play-test is recommended after deployment. The game uses canvas drawing and client-side simulation; it does not require MATLAB, webcam access, or external model files.

## Privacy and limitations

All game simulation runs in the browser. No images, audio, camera feeds, or player telemetry are uploaded or stored. The enemy's behavior is a simplified deterministic heuristic prototype and should not be represented as a production game AI or a validated model of human behavior.
