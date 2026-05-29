# Quick Start

## Local Run

```bash
npm install
copy .env.example .env
```

Fill `.env`, then run:

```bash
npm run post:morning
npm run post:noon
```

Or with Node 20:

```bash
node --env-file=.env facebook-auto-post.js MORNING
node --env-file=.env facebook-auto-post.js NOON
```

## GitHub Automatic Run

1. Push this repo to GitHub.
2. Open **Settings -> Secrets and variables -> Actions**.
3. Add:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```

The workflows then run automatically:

- Morning: `08:00 Vietnam time`
- Noon: `12:00 Vietnam time`

To test immediately, go to **Actions**, choose a workflow, and click **Run workflow**.
