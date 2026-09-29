# Black Widow Studios Client App

The app Black Widow clients keep on their phone: every lead from their website, an AI assistant that handles edits and maintenance and hands off to Cam and Trae when needed, and upgrade offers throughout. Cam and Trae get a team view with an inbox of everything that needs them.

## What clients get

- **Home**: greeting with leads waiting on a call back, lead and win-rate trends, site status (building, Phase 1, live) with a one-tap uptime check, edits in progress.
- **Leads**: every website form submission, filterable by today, 7 or 30 days. One-tap call, text or email, then mark it contacted, won or lost.
- **Assistant** (Claude): logs revision requests with the due time set by their plan, checks whether the site is up, pulls lead numbers, and escalates to Cam and Trae for billing, outages, unhappy clients, account access, or anyone asking for a person. The team can reply in the same thread.
- **Website**: uptime and load time from a monitor that checks every 15 minutes, visitors, call taps and form sends from a small tracking snippet, top pages, one-tap quick changes (update hours, add a special, something's broken) that open the assistant with the message started, and a job-photo upload that opens an edit request.
- **Earn**: the referral program. A ticket-style card shows dollars earned and what's coming off their next bill, a 5-punch card fills with each signup (the 5th pays a bonus), and a personal share link comes with Copy, Share and Text-a-friend buttons. Each referral has a Sent, Talking, Signed, Paid-you tracker. The link opens a public page ("Dan from Granite State Irrigation sent you") where the business claims its discount, and the referrer's phone buzzes right away.
- **Edits**: the revision-turnaround ladder (72h, 48h, 24h, same day), request form, and status of every edit.
- **Review requests**: a lead marked won gets a button that texts the customer the client's Google review link.
- **Plan**: plan comparison with one-tap upgrade requests and add-ons.

## Notifications

Every alert is saved in the in-app bell, and the app pops a toast with vibration and a chime while it's open. With push turned on, the phone buzzes even when the app is closed.

| Who | Buzzes for |
| --- | --- |
| Client | Someone used their referral link, referral signed ($ earned), credit applied, new lead, lead still waiting after 2 hours, team reply, edit started or live, site went live, monthly report (1st of the month), referral signed, day-30 referral ask, day-60 upgrade nudge, offers Cam sends |
| Team | Site down and back up, referrals from share links, escalations (urgent ones buzz harder), upgrade requests, referrals, new revision requests, overdue revisions, a client marking a job won |

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

## Referral program settings

Set in `shared/plans.ts` under `REFERRAL`: $100 per signup, a 5-punch card with a $250 bonus when it fills, and "$100 off your website build" for the business that was referred. These are a proposal; the Ops Manual still lists the incentive as undecided. When a referral signs, mark it Signed on the client's Referrals tab. After the credit comes off their Stripe invoice, tap "Mark applied".

## Website stats snippet

The Site tab on each client's page has a one-line script to paste into their site:

```html
<script src="https://YOUR-APP/api/hooks/t/<siteKey>.js" defer></script>
```

It counts page views, taps on phone, text and email links, and form sends. It uses no cookies and collects no personal data.

## Clickable preview

`npm run build:demo` builds `demo-dist/index.html`: the whole app in one file, running on sample data with a simulated assistant and no server.

## Code map

- `server/`: Express API, Drizzle schema, assistant (`bot.ts`), notifications and push (`notify.ts`), scheduled alerts (`jobs.ts`)
- `client/`: React app. Client screens are in `pages/`, team screens in `pages/team/`, and the service worker is in `public/sw.js`.
- `shared/plans.ts`: tiers, prices, turnaround times, add-ons and the referral credit, from the Operations Manual
