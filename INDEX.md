# 📑 Complete Setup Index

Choose your path based on your situation:

---

## 🚀 Start Here

### 1️⃣ **I want to deploy in 5 minutes**

→ **[QUICK_START.md](./QUICK_START.md)**

For experienced users who want fast setup.

---

### 2️⃣ **I don't know where to get API keys**

→ **[CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)**

Step-by-step for:

- OpenAI API key
- Telegram bot token & Chat ID
- Facebook page IDs & tokens

---

### 3️⃣ **I understand everything, show me full setup**

→ **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**

Complete guide including:

- GitHub repository setup
- Adding secrets to GitHub
- Configuring cron schedules
- Timezone calculation

---

### 4️⃣ **Something is broken, I need help**

→ **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

Solutions for:

- API key errors
- Telegram issues
- Facebook token problems
- GitHub Actions not running
- Script timeout
- Other errors

---

## 📚 All Documents

| File                                           | What It Is             | When to Use                              |
| ---------------------------------------------- | ---------------------- | ---------------------------------------- |
| [README.md](./README.md)                       | Overview of the system | Understand what this project does        |
| [QUICK_START.md](./QUICK_START.md)             | Fast setup (5 min)     | You're experienced & just want to deploy |
| [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md) | How to get all tokens  | You don't know how to get API keys       |
| [GITHUB_SETUP.md](./GITHUB_SETUP.md)           | Full automation setup  | Setting up GitHub Actions & scheduling   |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)     | Error solutions        | Something failed & you need help         |
| [.env.example](./.env.example)                 | Template config        | See what variables you need              |
| [package.json](./package.json)                 | Dependencies           | Check installed packages                 |

---

## 🎯 Recommended Path

### For First-Time Setup:

1. **[CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)** - Get all keys (20 min)
2. **[QUICK_START.md](./QUICK_START.md)** - Deploy to GitHub (10 min)
3. **Test manually** - Run workflow via GitHub Actions (5 min)
4. **Monitor** - Check Telegram for notifications

**Total: ~45 minutes**

### For Existing Users (Upgrading):

1. **[QUICK_START.md](./QUICK_START.md)** - Fast refresh (5 min)
2. **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - Update schedule/secrets (10 min)
3. **Deploy** - Push to GitHub (2 min)

**Total: ~17 minutes**

### For Debugging:

1. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Find your error
2. **Follow the fix**
3. **Test**
4. **Deploy**

---

## ⚡ Quick Reference

### Commands

```bash
# Local test (before GitHub)
node facebook-auto-post.js MORNING
node facebook-auto-post.js NOON

# Install dependencies
npm install

# Using npm scripts
npm run post:morning
npm run post:noon
npm start  # defaults to MORNING
```

### Environment Setup

```bash
# Create .env from template
cp .env.example .env

# Edit with your values
nano .env  # or any editor
```

### GitHub Actions Manual Trigger

1. Go to repository → **Actions** tab
2. Select workflow (morning-post or noon-post)
3. Click **Run workflow**
4. Monitor logs in real-time

---

## ✅ Setup Checklist

Before going live:

- [ ] OpenAI API key acquired
- [ ] Telegram bot created (@BotFather)
- [ ] Telegram Chat ID obtained (@userinfobot)
- [ ] Facebook page IDs & tokens ready
- [ ] `.env` file created locally (test)
- [ ] `template/` folder has images
- [ ] `stocks/` folder has images
- [ ] GitHub repository created
- [ ] Secrets added to GitHub (all 8)
- [ ] `.github/workflows/` files pushed
- [ ] First manual run successful
- [ ] Telegram notifications working

---

## 🔐 Security Reminders

✅ DO:

- Keep `.env` file secret (in .gitignore)
- Use long-lived Facebook tokens
- Rotate tokens monthly
- Use GitHub Secrets for sensitive data

❌ DON'T:

- Commit `.env` file
- Share API keys publicly
- Use personal access tokens for production
- Store secrets in code comments

---

## 🆘 Need More Help?

1. **Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** first
2. **Test components individually:**
   ```bash
   node -e "require('openai')" # check OpenAI
   node -e "require('axios')" # check network
   ```
3. **Run locally first** before GitHub Actions
4. **Check GitHub Actions logs** for error details

---

## 📈 What's Next?

After successful deployment:

1. **Monitor first week** - Check Telegram & Facebook daily
2. **Adjust prompts** - Edit caption/image generation prompts if needed
3. **Add more images** - Keep template/ and stocks/ folders updated
4. **Rotate tokens** - Refresh API keys monthly
5. **Update schedule** - Modify cron times if needed

---

## 🎓 Learning Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cron Schedule Syntax](https://crontab.guru)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Ready to start? → [QUICK_START.md](./QUICK_START.md) or [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)**

🚀 Let's automate!
