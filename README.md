# Jager Facebook Auto Post

Automated Facebook draft post generator for two Jager fan pages. It selects a product image, generates a Vietnamese caption and edited product image with OpenAI, creates Facebook Page draft posts, and sends Telegram status notifications.

## What Runs Automatically

GitHub Actions is already configured:

- Morning workflow: `.github/workflows/morning-post.yml`
  - Runs daily at `01:00 UTC`, which is `08:00 Vietnam time`.
  - Runs `node facebook-auto-post.js MORNING`.
- Noon workflow: `.github/workflows/noon-post.yml`
  - Runs daily at `05:00 UTC`, which is `12:00 Vietnam time`.
  - Runs `node facebook-auto-post.js NOON`.

You can also run either workflow manually from GitHub: open the repo, go to **Actions**, choose the workflow, then click **Run workflow**.

## Required GitHub Secrets

Add these in GitHub under **Settings -> Secrets and variables -> Actions -> New repository secret**:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```

The `.env` file is only for local runs. Never commit it.

## Local Setup

```bash
npm install
copy .env.example .env
```

Fill `.env` with your real keys and tokens.

Run locally:

```bash
npm run post:morning
npm run post:noon
```

On Node 20+, you can also run with an explicit env file:

```bash
node --env-file=.env facebook-auto-post.js MORNING
node --env-file=.env facebook-auto-post.js NOON
```

## Image Folders

- `template/`: reference images for morning posts.
- `stocks/`: reference images for noon posts.
- `posts/`: generated artifacts, ignored by git.

Supported image formats: `.jpg`, `.jpeg`, `.png`.

## Security Notes

- `.env`, generated images, post artifacts, logs, and `node_modules/` are ignored by git.
- The real local `.env` is not tracked.
- Keep Facebook tokens short-lived or rotate them regularly.
- If a real token was ever pushed to GitHub, rotate it immediately even after deleting it from the repo.

## Files

```text
facebook-auto-post.js          Main automation workflow
telegram-notifier.js           Telegram notification helper
.github/workflows/             GitHub Actions schedules
template/                      Morning reference images
stocks/                        Noon reference images
.env.example                   Environment variable template
QUICK_START.md                 Short setup checklist
GITHUB_SETUP.md                GitHub Actions setup details
CREDENTIALS_GUIDE.md           How to get keys and tokens
TROUBLESHOOTING.md             Common errors and fixes
```
