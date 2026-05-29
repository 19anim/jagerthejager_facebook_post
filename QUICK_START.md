# ⚡ Quick Start Guide - 5 Phút Setup

Hướng dẫn nhanh nhất để lên production.

---

## 🔧 Step 1: Prepare Telegram Bot (2 min)

### Tạo Bot

1. Chat @BotFather trên Telegram
2. Send `/newbot`
3. Đặt tên: `Jager Facebook Auto Post`
4. Đặt username: `jager_facebook_auto_bot`
5. **COPY TOKEN** → lưu vào chỗ khác (format: `123456:ABCdef...`)

### Lấy Chat ID

1. Chat bot bạn vừa tạo: `/start`
2. Tìm @userinfobot
3. Send `/start`
4. **COPY Chat ID** (số dài)

---

## 📁 Step 2: Prepare GitHub Repo (2 min)

### Option A: Nếu chưa có git

```bash
cd Facebook_Jagerthejager_page
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

### Option B: Nếu đã có git

```bash
git add .
git commit -m "Update with auto-post setup"
```

### Create GitHub Repo

1. Vào [github.com/new](https://github.com/new)
2. Name: `facebook-auto-post`
3. Public (để dùng free GitHub Actions)
4. **Tạo**
5. Copy push URL

### Push Code

```bash
git remote add origin <URL_VỪA_COPY>
git push -u origin main
```

---

## 🔐 Step 3: Add Secrets (1 min)

Vào GitHub Repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** (thêm 8 cái này):

```
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN         (từ @BotFather)
TELEGRAM_CHAT_ID           (từ @userinfobot)
FB_PAGE_1_ID
FB_PAGE_1_TOKEN
FB_PAGE_2_ID
FB_PAGE_2_TOKEN
```

**Nơi lấy Facebook tokens:**

- Page ID: Facebook Page Settings → Cog icon → Page Info
- Token: [Facebook Graph Explorer](https://developers.facebook.com/tools/explorer) → Generate → copy token

---

## ✨ Done!

Workflows chạy tự động:

- **MORNING**: 8:00 AM Vietnam time ✈️
- **NOON**: 12:00 PM Vietnam time ✈️

---

## 🧪 Test (Optional)

Vào repository → **Actions** tab:

1. Chọn **"Jager Facebook Auto Post - MORNING"**
2. **Run workflow** → **Run workflow**
3. Chờ chạy (xem logs)
4. Kiểm tra Telegram nhận message không

---

## 📊 Monitor

- **GitHub Actions**: Repository → Actions (view logs)
- **Telegram**: Bot gửi success/fail messages
- **Facebook**: Posts xuất hiện trong page drafts
- **Artifacts**: Post data lưu ở `posts/` folder

---

## 🎛️ Custom Time?

Edit workflow file và sửa cron:

`0 1 * * *` → đây là `01:00 UTC` = `8:00 AM Vietnam`

Muốn 9 AM? Sửa thành `0 2 * * *` (= 9 AM Vietnam)

[Cron calculator](https://crontab.guru/)

---

**That's it! Automation ready! 🚀**

Detailed guide → [GITHUB_SETUP.md](./GITHUB_SETUP.md)
