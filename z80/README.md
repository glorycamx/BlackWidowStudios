# Z80.si — AI Workforce Operating System

**Describe the outcome. Deploy the team.**

A product demo of Z80: a homepage experience and working product where you describe an objective, Z80 assembles a team of intelligences (Dots, Grok Bot, Muse), and you watch them work, approve their output, and inspect the results.

Everything runs without a backend or API keys. Planning and agent work are **simulated** by a mock service layer that you can replace with real implementations.

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
4. You land in mission control (`/missions/m248`). Agents work, activity streams in, and Dots asks for approval.
5. Approve (or hold). The mission completes and shows its results: prospects with personalized openers, which you can export as CSV.

Use **4×** in the mission header to speed things up. Use **Settings → Reset demo workspace** to start over.

## Map

| Route | What it is |
| --- | --- |
| `/` | Cinematic homepage: hero command, team assembly, scroll story |
| `/agents/[slug]` | Public intelligence profiles with their particle form |
| `/command` | One chat, multiple intelligences. Plans, deploys, agent messages, approvals |
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

### Replacing the mocks

- **Planning and chat.** `POST /api/z80/plan` and `POST /api/chat` call `getPlanner()` and `getChatResponder()` in `lib/ai/provider.ts`. Implement those with a real model, reading `Z80_AI_API_KEY` server-side, and return the same `Plan` shape. The client (`lib/api.ts`) falls back to the local mock if a request fails.
- **Missions.** `lib/services/missionService.ts` is pure: `advanceMission` turns a mission plus elapsed time into the next mission plus *emissions* (activity, chat, approvals, sounds). A real backend can stream the same emissions; `POST /api/missions` and `POST /api/missions/:id/action` document the shapes.
- **Auth.** Implement `AuthProvider` in `lib/auth/index.ts` (Clerk, Auth0, Supabase…). The current provider is a display-name stub and verifies nothing.
- **Integrations.** `data/integrations.ts` is the source of truth for what the site claims. Everything is `coming-soon`/`planned` except the simulated Public Web. Flip an entry to `live` when it ships.
- **Agents.** Add an entry to `data/agents.ts`; it appears in the roster, palette, planner add-menu and routes. `sceneGroup` binds an agent to the particle scene.

### The particle engine

One `Points` draw call and one `LineSegments` draw call. Each particle carries six precomputed formations: sphere, team clusters, the Dots lattice, the Grok scanner, Muse ribbons and the ambient field. The vertex shader blends between them by weights, so morphs cost nothing on the CPU. The DOM steers the engine through a small `SceneDirector`; the engine eases toward its targets every frame.

It is loaded with a dynamic import, so Three.js never ships in the initial bundle or on pages that don't use it. It pauses when the tab is hidden or the canvas is offscreen. It uses fewer particles on phones and low-core devices, and lowers its resolution if frames run slow. With `prefers-reduced-motion`, it renders still frames only when the scene changes.

## Honesty rules this build follows

No fake logos, testimonials, customer counts, metrics or certifications. Pricing values are placeholders (`To be announced`). Demo results are labelled as simulated data. Authentication is labelled as simulated and not secure.
