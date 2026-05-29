# Credentials Guide

Use this guide to collect the values required by `.env` locally and by GitHub Actions secrets in the repository.

## OpenAI

1. Go to the OpenAI dashboard.
2. Create an API key.
3. Save it as `OPENAI_API_KEY`.

Do not paste the real key into any committed file.

## Telegram

Create a bot:

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`.
3. Follow the prompts.
4. Save the bot token as `TELEGRAM_BOT_TOKEN`.

Get your chat ID:

1. Send `/start` to your new bot.
2. Message `@userinfobot`.
3. Save the returned numeric ID as `TELEGRAM_CHAT_ID`.

## Facebook Pages

For each target page, collect:

```text
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```

Use Facebook developer tools or Graph API Explorer to generate tokens with the permissions your Page posting flow requires. Prefer long-lived page tokens where appropriate, and rotate them if they may have been exposed.

## Local `.env`

Copy `.env.example` to `.env` and fill the real values:

```text
OPENAI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
FB_PAGE_1_ID=...
FB_PAGE_1_TOKEN=...
FB_PAGE_2_ID=...
FB_PAGE_2_TOKEN=...
```

`.env` is ignored by git and should stay local.

## GitHub Actions

Add the same values as repository secrets:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Required secrets:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```
