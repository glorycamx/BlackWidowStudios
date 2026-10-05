# Z80.si: AI bots that never clock out

**Your AI bots never clock out.** Chatbots wait for you to ask. Z80 bots find leads, post your content, and watch your market around the clock, then text you when something needs a yes. Or build your own bot in a sentence.

The brand line under the wordmark stays: **Super intelligence is here.**

This repository is a product demo. Everything the bots do is **simulated** in the browser by `lib/sim/`, behind a small interface a real backend can replace.

## Run it

```bash
cd z80
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Node 20+. No environment variables are required. See `.env.example` for the slots that real integrations will use.

## Try it

1. Open `/live`. Your bots have been on shift all night: the feed shows what they found, each with **Happened** and **Caught** times. The Right now strip ticks every few seconds with each bot's latest check.
2. Open a bot (`/team/lead-hunter`) to **watch it work**, see its routines with countdowns, switch **Do it without asking**, and teach it a skill.
3. In `/chat`, tell Manager something ongoing ("Text me every morning at 7 with new hot leads"). It becomes a routine. Say "Create a bot that watches Reddit for people asking for a web designer" and a new bot goes on shift.
4. `/calendar` shows posts going out on the exact minute. "Add a test post in 1 minute" lets you watch one.
5. Hide the tab for a few minutes, come back, and read **While you were away**.
6. Add `?at=03:00` to any URL (or use Settings, Time travel) to see the bots at 3 AM. Nothing is saved in that mode.

Settings has demo speed (1x, 2x, 4x), morning text and recap times, quiet hours, browser alerts, and Reset demo workspace.

## Map

| Route | What it is |
| --- | --- |
| `/` | Homepage: five bot clusters, Chatbot vs Z80, While you slept, Meet your bots, how it works |
| `/bots/[slug]` | Public bot profiles with their particle form and a live Watch it work screen |
| `/live` | Home after login: while you were away, Right now, today's counters, the feed |
| `/chat` | Talk to Manager. Ongoing asks become routines, one-offs become jobs. Team chat tab |
| `/team`, `/team/[slug]` | Your team, Create your own bot, and each bot's page |
| `/routines` | Every routine, plus the next 24 hours as lanes |
| `/calendar` | Content calendar: week and list, approve, edit, skip |
| `/jobs`, `/jobs/[id]` | One-off jobs with their live timeline, approvals and results |
| `/approvals`, `/activity` | Needs you; the full history including quiet checks |
| `/memory`, `/apps`, `/settings` | What the bots know, apps and how bots reach you, preferences |

Old routes (`/signals`, `/command`, `/workforce`, `/missions`, `/connections`, `/agents/*`) redirect. Press **Cmd K / Ctrl K** anywhere for the command palette.

## Architecture

```
app/                    routes: (marketing), (app), (auth), api/
components/
  three/                particle engine (raw Three.js + GLSL) and canvas wrapper
  home/                 homepage sections and the scroll-driven scene director
  live/ bots/ routines/ calendar/ command/ missions/ workforce/ workspace/ app/
config/                 site/SEO metadata, pricing (placeholder values)
data/                   bots roster, default routines, skills, apps, permissions, memory
lib/sim/                the always-on simulation: clock, heartbeats, generators,
                        scheduler, backfill, plain-English parsing, BotRuntime
lib/services/           planner, job engine, chat, lead and news pools
lib/store/workspace.ts  client store: state, persistence (z80.workspace.v4) and the tick
lib/time.ts             every user-facing time: local, 12-hour, AM/PM
types/                  the domain model
```

### How the bots run

- **Routines** (`data/routines.ts`) are jobs a bot keeps doing: always on, every few minutes, or on a schedule. Each one is powered by a simulated engine.
- **Heartbeats** (`lib/sim/heartbeats.ts`) are quiet proof of work ("Checked 48 local business sites. All up.") kept in their own small store, out of the feed.
- **Generators** (`lib/sim/generators.ts`) produce finds: lead dossiers, posts, money for Researcher, briefs for Reporter, the morning text and evening recap. Every find carries when it happened and when it was caught.
- **Scheduler** (`lib/sim/scheduler.ts`) runs due routines, posts on the minute, hands work between bots in team chat, and backfills what happened while the app was closed.
- **BotRuntime** (`lib/sim/runtime.ts`) is the seam: list bots and routines, create a routine or bot from plain English, subscribe to finds, approve, pause. A server can implement the same interface.

Nothing is sent, posted or spent without a yes unless that routine has **Do it without asking** on, and jobs still follow the workspace permissions. Sample businesses use the reserved `.example` domain and 555-01xx numbers.

### Replacing the mocks

- **Planning and chat.** `POST /api/z80/plan` and `POST /api/chat` call `getPlanner()` and `getChatResponder()` in `lib/ai/provider.ts`. Implement those with a real model, reading `Z80_AI_API_KEY` server-side, and return the same `Plan` shape. The client (`lib/api.ts`) falls back to the local mock if a request fails.
- **Jobs.** `lib/services/missionService.ts` is pure: `advanceMission` turns a job plus elapsed time into the next job plus *emissions* (activity, chat, approvals, sounds). A real backend can stream the same emissions; `POST /api/missions` and `POST /api/missions/:id/action` document the shapes.
- **Auth.** Implement `AuthProvider` in `lib/auth/index.ts` (Clerk, Auth0, Supabase…). The current provider is a display-name stub and verifies nothing.
- **Integrations.** `data/integrations.ts` is the source of truth for what the site claims. Everything is `coming-soon`/`planned` except the simulated Public Web. Flip an entry to `live` when it ships.
- **Bots.** Add an entry to `data/bots.ts`; it appears in the roster, palette, planner and routes. `sceneGroup` (0 to 4) binds a bot to its particle cluster. Owners can also create bots at runtime.
- **Always-on work.** Replace `lib/sim` behind `BotRuntime` with real monitors that emit the same `FeedItem`, `Heartbeat` and `TeamMessage` shapes.

### The particle engine

One `Points` draw call and one `LineSegments` draw call. Each particle carries six precomputed formations: sphere, five bot clusters, a lattice (Manager), a scanner (Lead Hunter), flowing ribbons (Content Creator) and the ambient field. In the cluster formation, Researcher is a tilted orbit and Reporter is a set of pulsing shells. The vertex shader blends between them by weights, so morphs cost nothing on the CPU. The DOM steers the engine through a small `SceneDirector`; the engine eases toward its targets every frame.

It is loaded with a dynamic import, so Three.js never ships in the initial bundle or on pages that don't use it. It pauses when the tab is hidden or the canvas is offscreen. It uses fewer particles on phones and low-core devices, and lowers its resolution if frames run slow. With `prefers-reduced-motion`, it renders still frames only when the scene changes.

## Honesty rules this build follows

No fake logos, testimonials, customer counts, metrics or certifications. Pricing values are placeholders (`To be announced`). Demo results are labelled as simulated data. Authentication is labelled as simulated and not secure.
