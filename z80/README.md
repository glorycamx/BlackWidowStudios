# Z80.si: autonomous AI agents

**Super intelligence is here.** Z80 agents don't wait for prompts. They run 24/7 on their own: they watch the market, find opportunities, research them, write the outreach and do the work. They only come to you when a decision needs a person.

This repository is a product demo. Agent work and incoming signals are **simulated** by a mock service layer that you can replace with real implementations.

## Run it

```bash
cd z80
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Node 20+. No environment variables are required. See `.env.example` for the slots that real integrations will use.

## The demo flow

1. Go to `/`. Type an objective into the hero console, or press **Deploy your team** to type the demo mission for you.
2. Z80 analyzes the objective and the sphere fragments into the recommended team.
3. Inspect each intelligence, change its role, add or remove agents, then press **Deploy**.
4. You land in mission control (`/missions/m248`). Agents work, activity streams in, and Helm asks for approval.
5. Approve (or hold). The mission completes and shows its results: prospects with personalized openers, which you can export as CSV.

Use **4×** in the mission header to speed things up. Use **Settings → Reset demo workspace** to start over.

## Map

| Route | What it is |
| --- | --- |
| `/` | Cinematic homepage: hero command, team assembly, scroll story |
| `/agents/[slug]` | Public intelligence profiles with their particle form |
| `/command` | One chat, multiple intelligences. Plans, deploys, agent messages, approvals |
| `/signals` | Always-on watches and their live feed: hot-lead dossiers, AI briefings, reminders, autopilot |
| `/missions`, `/missions/[id]` | Mission list; live topology/timeline, approvals, execution feed, results |
| `/workforce`, `/workforce/[slug]` | Roster; agent workspace with pause, permissions and a direct line |
| `/approvals`, `/activity` | Human checkpoints; the audit trail |
| `/memory`, `/connections`, `/settings` | Organization memory, integrations, preferences and demo controls |
| `/login`, `/signup`, `/onboarding` | Auth screens (mock) and conversational onboarding |
| `/pricing`, `/security`, `/company`, `/privacy`, `/terms` | Editorial pages |

Press **⌘K / Ctrl+K** anywhere to open the command palette.

## Architecture

```
app/                    routes: (marketing) public, (app) product, (auth), api/
components/
  three/                particle engine (raw Three.js + GLSL) and canvas wrapper
  home/                 homepage sections and the scroll-driven scene director
  command/              console, analysis, team assembly, command thread
  missions/ workforce/ workspace/ app/   product screens and shared app UI
config/                 site/SEO metadata, pricing (editable, placeholder values)
data/                   agents, integrations, permissions, memory, use cases
lib/services/           planService, missionService (simulator), chat, agent, results
lib/store/workspace.ts  client store: state, persistence and the simulation clock
lib/ai/provider.ts      server-side boundary for a real model provider
lib/auth/               auth provider boundary (mock, not secure)
lib/scene/              director bridging the DOM and the particle engine
types/                  the domain model
```

### Watches and signals (the always-on side)

Watches (`data/watches.ts`) are standing orders that run around the clock: website opportunities, AI implementation opportunities, AI news and reminders. Each one produces **signals**: a hot-lead dossier (business, owner, contact, current site, priority, temperature, problems, Google presence, reviews, value, demo angle, recommended offer and price, upsells, Beacon's outreach script and the next move), a briefing or a reminder. New signals raise a toast, appear in the command thread and the activity log, and can be turned into an outreach mission in one click. With **autopilot** on, every hot lead gets an outreach mission drafted immediately, and it still waits for approval before anything is sent.

In this build `lib/services/signalService.ts` simulates the feed with generated sample data (555-01xx numbers, `.example` domains). Real monitors emit the same `Signal` shape.

### Replacing the mocks

- **Planning and chat.** `POST /api/z80/plan` and `POST /api/chat` call `getPlanner()` and `getChatResponder()` in `lib/ai/provider.ts`. Implement those with a real model, reading `Z80_AI_API_KEY` server-side, and return the same `Plan` shape. The client (`lib/api.ts`) falls back to the local mock if a request fails.
- **Missions.** `lib/services/missionService.ts` is pure: `advanceMission` turns a mission plus elapsed time into the next mission plus *emissions* (activity, chat, approvals, sounds). A real backend can stream the same emissions; `POST /api/missions` and `POST /api/missions/:id/action` document the shapes.
- **Auth.** Implement `AuthProvider` in `lib/auth/index.ts` (Clerk, Auth0, Supabase…). The current provider is a display-name stub and verifies nothing.
- **Integrations.** `data/integrations.ts` is the source of truth for what the site claims. Everything is `coming-soon`/`planned` except the simulated Public Web. Flip an entry to `live` when it ships.
- **Agents.** Add an entry to `data/agents.ts`; it appears in the roster, palette, planner add-menu and routes. `sceneGroup` binds an agent to the particle scene.

### The particle engine

One `Points` draw call and one `LineSegments` draw call. Each particle carries six precomputed formations: sphere, team clusters, a lattice (Helm), a scanner (Lookout), flowing ribbons (Beacon) and the ambient field. The vertex shader blends between them by weights, so morphs cost nothing on the CPU. The DOM steers the engine through a small `SceneDirector`; the engine eases toward its targets every frame.

It is loaded with a dynamic import, so Three.js never ships in the initial bundle or on pages that don't use it. It pauses when the tab is hidden or the canvas is offscreen. It uses fewer particles on phones and low-core devices, and lowers its resolution if frames run slow. With `prefers-reduced-motion`, it renders still frames only when the scene changes.

## Honesty rules this build follows

No fake logos, testimonials, customer counts, metrics or certifications. Pricing values are placeholders (`To be announced`). Demo results are labelled as simulated data. Authentication is labelled as simulated and not secure.
