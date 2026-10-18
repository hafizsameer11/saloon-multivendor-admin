# MyBeauty+ — multi-vendor beauty marketplace

Website, mobile app and backend in one folder. They share one database through the API.

| Folder | What | Tech |
| --- | --- | --- |
| `apps/api` | REST API + database + payments | Node.js 22, Express, TypeScript, MySQL 8 (Prisma), Stripe Connect |
| `apps/web` | Website: customers, seller panel, admin panel | React 18, Vite, Tailwind |
| `apps/mobile` | One app for guests, customers and salon owners | Expo SDK 57, Expo Router |
| `packages/shared` | Types, the availability engine, the API client used by web + mobile | TypeScript (no dependencies) |

## Run everything on Windows (with the backend)

Needs Node.js 20+ and MySQL 8 (or Docker: `docker compose up -d` inside `apps/api`).

```bat
cd D:\mybeauty
npm run install:all

REM 1) API — see apps/api/README.md for the MySQL commands
cd apps\api
copy .env.example .env
npx prisma migrate deploy
npm run seed
npm run dev                     REM http://localhost:4000/api/v1/health

REM 2) Website (new terminal)
cd D:\mybeauty\apps\web
copy .env.example .env.local    REM VITE_API_URL=http://localhost:4000/api/v1
npm run dev                     REM http://localhost:5173

REM 3) Mobile (new terminal) — on a real phone use your PC's LAN IP, not localhost
cd D:\mybeauty\apps\mobile
copy .env.example .env          REM edit EXPO_PUBLIC_API_URL=http://<your-PC-IP>:4000/api/v1
npx expo start                  REM scan the QR code with Expo Go
```

For the phone to load uploaded photos, set `API_PUBLIC_URL=http://<your-PC-IP>:4000` in `apps/api/.env`. Allow port 4000 in Windows Firewall.

**Without** `VITE_API_URL` / `EXPO_PUBLIC_API_URL` the website and app still run as the standalone demo prototype with data stored on the device. That's handy for showing the client the design without a server.

## Demo accounts

With the API, the password is **demo1234** for every account. In standalone demo mode any password works.

| Role | Email |
| --- | --- |
| Customer | giulia@demo.it |
| Seller, approved (Barberia Elite, Stripe ready) | marco@barberiaelite.it |
| Seller, under review (Luna Nails Studio) | sofia@lunanails.it |
| Admin | admin@mybeauty.it |

`npm run api:seed` **wipes and reloads** the demo data (refuses in production).

## Payments

Until Stripe keys are added to `apps/api/.env`, payments run in **test mode**: a labelled "Paga (test)" button and no real money. With keys, the website uses Stripe's card form and the app uses Stripe's payment sheet. Card data never touches our server.

How seller money works (wallet, withdrawal, commission cut at withdrawal, the 90-day Stripe rule) is described in `apps/api/README.md` and in the plan doc.

## Tests

- `npm run api:test`: 40 end-to-end API tests on a real MySQL test database.
- Browser tests of the full flows (web: 27 steps, mobile: 16 steps) were run against the API during development.

## Booking: normal slots + salon time windows

- **Normal slots (automatic):** come from opening hours, staff working days/skills and service length (30-minute grid). One engine (`packages/shared/src/slots.ts`) runs on the server and in both apps.
- **Time windows ("Fasce orarie", seller menu):** the salon opens a block on purpose — e.g. Sunday 10:00–13:00, **4 places**, services A/B/C — for many days at once (date range + weekdays). Each customer booking takes one place; when places run out the window disappears. Works on closed days too.
  - Window tied to a stylist → that person's normal slots are blocked for the whole window. No stylist → extra places on top of normal hours.
  - Services booked must fit inside the window. Window bookings can't be moved (cancel and rebook). Places can't go below what's booked; a window with bookings can be closed, not deleted.
  - The last place is protected by a database lock (tested: two customers racing → one wins).

## Language and theme

- **Italian / English everywhere**: the apps send `X-Lang` on every call, so server errors and validation messages come back in the user's language. Notifications and emails are written in the recipient's saved language (`User.lang`, updated when they switch). Content that sellers type (descriptions, service names, policies) is shown as written.
- **Light / dark theme**: toggle in the website header (also on dashboards) and in the app (home, profile, seller "Altro"). Saved per device; dark is the default. Photo areas and the ivory shop pages keep their look in both themes on purpose.

## Status and next steps

See `apps/api/PROGRESS.md` (always up to date) and the plan doc "MyBeauty+ Backend Plan".

## Known limits

- Real Stripe has not been run yet: everything is tested in mock mode. Apple Pay / Google Pay in the app need a development build, not Expo Go.
- Commission on cash paid at the salon can make a seller's wallet negative. The client must decide how to collect it.
- Google/Apple sign-in, push notifications, SMS and SDI e-invoicing were **removed from scope** at the client's request (no buttons or toggles left in the UI). The SDI code / PEC fields stay in the seller application because they are the seller's invoicing data.
- Notifications created before a user switched language stay in the old language.
- Photos are Unsplash placeholders (some show real brand labels); legal pages are placeholder text.
