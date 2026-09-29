# Black Widow Studios Client App

The app Black Widow clients keep on their phone: every lead from their website, an AI assistant that handles edits and maintenance and hands off to Cam and Trae when needed, and upgrade offers throughout. Cam and Trae get a team view with an inbox of everything that needs them.

## What clients get

- **Home**: greeting with leads waiting on a call back, lead and win-rate trends, site status (building, Phase 1, live) with a one-tap uptime check, edits in progress.
- **Leads**: every website form submission, filterable by today, 7 or 30 days. One-tap call, text or email, then mark it contacted, won or lost.
- **Assistant** (Claude): logs revision requests with the due time set by their plan, checks whether the site is up, pulls lead numbers, and escalates to Cam and Trae for billing, outages, unhappy clients, account access, or anyone asking for a person. The team can reply in the same thread.
- **Edits**: the revision-turnaround ladder (72h, 48h, 24h, same day), request form, and status of every edit.
- **Plan and Refer**: plan comparison with one-tap upgrade requests, add-ons, and the $100-off referral program.

## Notifications

Every alert is saved in the in-app bell, and the app pops a toast with vibration and a chime while it's open. With push turned on, the phone buzzes even when the app is closed.

| Who | Buzzes for |
| --- | --- |
| Client | New lead, lead still waiting after 2 hours, team reply, edit started or live, site went live, monthly report (1st of the month), referral signed, day-30 referral ask, day-60 upgrade nudge, offers Cam sends |
| Team | Escalations (urgent ones buzz harder), upgrade requests, referrals, new revision requests, overdue revisions, a client marking a job won |

Push notes:

- **iPhone:** the client has to add the app to their Home Screen (Share, then "Add to Home Screen") and open it from there before they can turn on alerts. iOS uses its standard vibration and ignores custom buzz patterns.
- **Android:** the custom buzz patterns work.
- **Email:** escalations, upgrade requests and referrals are also emailed to the team through Resend when `RESEND_API_KEY` is set.

## Upsells

- Home shows a next-plan card with copy for each tier.
- Leads offers ads management.
- A lead marked won offers review blasts.
- Edits shows the faster turnaround on the next plan and offers town pages.
- Plan lists every tier and add-on.
- The assistant mentions an upgrade when it fits, and logs interest.

Every "I'm interested" tap buzzes Cam and Trae as a hot upsell. On each client's page, the team can push a ready-made or custom offer straight to the client's phone.

## Run it locally

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, SESSION_SECRET, ANTHROPIC_API_KEY
npm run vapid:generate        # paste the two keys into .env for phone push
npm run db:push               # create tables
npm run dev                   # API on :3001, app on :5173
```

On first start the server creates team logins from `TEAM_SEED` and prints their passwords to the log once. `SEED_DEMO=1` also creates a sample client (`demo@blackwidow.studio` / `demo1234`).

Without `ANTHROPIC_API_KEY` the app still works: chat messages go straight to the team as escalations.

## Deploy on Replit

1. Import the repo. Add Replit's Postgres, which sets `DATABASE_URL`.
2. Add secrets: `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `APP_URL`, and optionally `RESEND_API_KEY`. Set `SEED_DEMO=0`.
3. Build with `npm install && npm run db:push && npm run build`. Run with `npm start`, which serves the API and app on port 5000.

Push notifications need HTTPS, which Replit deployments provide.

## Hook up a client's lead form

Each client has a site key, and their page in the team view has a ready-to-paste form snippet. Their site's form posts to:

```
POST /api/hooks/lead/<siteKey>
fields: name, phone, email, message   (JSON or form-encoded)
optional: _redirect (thank-you URL), _gotcha (hidden honeypot)
```

## Clickable preview

`npm run build:demo` builds `demo-dist/index.html`: the whole app in one file, running on sample data with a simulated assistant and no server.

## Code map

- `server/`: Express API, Drizzle schema, assistant (`bot.ts`), notifications and push (`notify.ts`), scheduled alerts (`jobs.ts`)
- `client/`: React app. Client screens are in `pages/`, team screens in `pages/team/`, and the service worker is in `public/sw.js`.
- `shared/plans.ts`: tiers, prices, turnaround times, add-ons and the referral credit, from the Operations Manual
