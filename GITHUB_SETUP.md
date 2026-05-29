# GitHub Actions Setup

This repo already has two scheduled workflows:

- `Jager Facebook Auto Post - MORNING`: daily at `01:00 UTC` / `08:00 Vietnam time`.
- `Jager Facebook Auto Post - NOON`: daily at `05:00 UTC` / `12:00 Vietnam time`.

GitHub runs these in the cloud, so your computer does not need to stay on.

## 1. Add Repository Secrets

Open your GitHub repo:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Add each secret below exactly:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```

Do not put real token values in `.env.example`, README files, workflow YAML files, or source code.

## 2. Run Manually

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Select the morning or noon workflow.
4. Click **Run workflow**.
5. Watch the logs and check Telegram/Facebook draft posts.

## 3. Change Schedule

GitHub cron uses UTC. Vietnam time is UTC+7.

Examples:

```yaml
- cron: "0 1 * * *" # 08:00 Vietnam
- cron: "0 5 * * *" # 12:00 Vietnam
- cron: "0 8 * * *" # 15:00 Vietnam
```

Edit:

- `.github/workflows/morning-post.yml`
- `.github/workflows/noon-post.yml`

Then commit and push the change.

## 4. Deployment Checklist

- GitHub secrets are set.
- `template/` has at least one image.
- `stocks/` has at least one image.
- OpenAI billing/access is active.
- Facebook Page tokens are valid.
- Telegram bot has received `/start` from your account or group.
- First run is tested manually from the Actions tab.

## 5. Common Notes

- Scheduled workflows can start a few minutes late depending on GitHub load.
- Generated `posts/` are uploaded as workflow artifacts for 7 days.
- Updating a secret does not require a code change.
- Updating code or schedule requires `git commit` and `git push`.
