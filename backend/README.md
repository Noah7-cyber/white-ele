## Whitepenguin Backend

TypeScript Node.js backend for the White Pingvin project. Provides REST APIs for auth, users, notifications (with real‑time support), uploads, activity logs, and shared resources.

### Tech Stack

- Node.js, TypeScript, Express
- TypeORM (PostgreSQL by default)
- Jest (tests), ESLint (linting)
- PM2 (optional production process manager)

### Quick Start

1. Install dependencies
   ```bash
   npm install
   ```
2. Configure environment variables (see Environment)
3. Build and run (dev)
   ```bash
   npm run dev
   ```
4. Healthcheck: `http://localhost:3000/health`
5. API base: `http://localhost:3000/api/v1`

### Environment

The database is configured via environment variables in `src/modules/core/config/database.ts`.

Required variables (PostgreSQL defaults shown):

- `DB_HOST` (default: ep-noisy-sound-a2pzyyr7-pooler.eu-central-1.aws.neon.tech)
- `DB_PORT` (default: 5432)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME` (test: `cw_backend_test`, otherwise default `cw_backend`)
- `DB_TYPE` (postgres | mysql; default: postgres)
- `DB_SSL` (true|false; default true)
- `DB_LOGGING` (true|false; default false)
- `NODE_ENV` (dev | test | production)

Note: synchronize is enabled in code for development. For production, use migrations and set appropriate envs.

### Scripts

- `npm run dev` — start in dev (`src/index.ts`)
- `npm run build` — compile TypeScript
- `npm start` — run compiled app (`dist/index.modular.js`)
- `npm test` / `npm run test:watch` — run tests
- `npm run lint` / `npm run lint:fix` — lint
- `npm run migration:generate` — generate migration
- `npm run migration:run` / `npm run migration:revert` — run/revert migrations
- `npm run schema:sync` / `npm run schema:drop` — TypeORM schema ops
- `npm run db:setup` — run migrations and seed

### Key Endpoints

- `GET /health`
- `GET /api/v1` — API info
- `POST /api/v1/auth/*` — Auth routes
- `GET /api/v1/countries` — Countries
- `GET /api/v1/activities` — Activity logs
- `GET /api/v1/notifications` — Notifications (see module README)
- `POST /api/v1/upload` — Uploads
- `GET /api/v1/users` — User stats
- `GET /api/v1/profile` / `GET /api/v1/account`

### Modules

- `modules/auth` — authentication and sessions
- `modules/user` — profiles, accounts, user stats
- `modules/notification` — REST + WebSocket notifications
- `modules/shared` — common entities, middleware, utils, uploads, countries, activity logs

### Run with PM2 (optional)

Build the project, then use `ecosystem.config.js`:

```bash
npm run build
pm2 start ecosystem.config.js
```

### Testing

```bash
npm test
```

### License

MIT

- Blogger/Blogspot, WordPress
- Git, GitHub

---

### EN

Hi, I'm Victor (Suver). I’m exploring frontend development and building projects with Blogger/Blogspot, WordPress, GitHub and more. Currently learning the basics of HTML, CSS, and JavaScript.

Contact: VK `https://vk.com/vicktorsuver` · Telegram `https://t.me/suvernet`
