# 🍹 Jager Facebook Auto Post

Automated system to generate, optimize, and post AI-generated product images to Facebook Pages with Telegram notifications.

> **🚀 Quick Start?** See [QUICK_START.md](./QUICK_START.md) for 5-minute setup
>
> **📖 Full Guides:** [CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md) | [GITHUB_SETUP.md](./GITHUB_SETUP.md) | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Features

✅ **Automated Content Generation**

- AI-powered product image editing using OpenAI's GPT-4 and image models
- Smart caption generation with Vietnamese language support
- Branding protection (obfuscate sensitive text)
- Watermark integration

✅ **Dual-Mode Publishing**

- Publish to 2 Facebook pages simultaneously
- Separate content for MORNING (8 AM) and NOON (12 PM) slots
- Automatic retry with 3 attempts per page

✅ **GitHub Actions Integration**

- Scheduled auto-posting (configurable via cron)
- Telegram notifications for success/failure alerts
- Artifact storage of generated posts

✅ **Telegram Bot Notifications**

- Real-time alerts on post success
- Detailed error reporting for failed steps
- Partial success notifications

---

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- OpenAI API key (GPT-4o-mini, image generation access)
- Facebook Graph API tokens (2 pages)
- Telegram bot token and chat ID

---

## 🔧 Setup Instructions

### Step 1: Clone Repository

```bash
git clone <repo-url>
cd facebook-auto-post
npm install
```

### Step 2: Create Telegram Bot

**2.1 Create Bot via BotFather**

1. Open Telegram, search for `@BotFather`
2. Send `/start`
3. Send `/newbot`
4. Set bot name: `Jager Facebook Auto Post Bot`
5. Set bot username: `jager_facebook_auto_post_bot` (must end with `_bot`)
6. **Save the token** (format: `123456:ABCdef...`)

**2.2 Get Your Chat ID**

1. Open your new bot
2. Send any message to activate it
3. Search for `@userinfobot` in Telegram
4. Send `/start`
5. **Save your Chat ID** (format: `1234567890`)

### Step 3: Configure Environment Variables

Create `.env` file in project root:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABCdef...
TELEGRAM_CHAT_ID=1234567890

# Facebook Page 1
FB_PAGE_1_ID=your_page_1_id
FB_PAGE_1_TOKEN=your_page_1_token

# Facebook Page 2
FB_PAGE_2_ID=your_page_2_id
FB_PAGE_2_TOKEN=your_page_2_token
```

### Step 4: Prepare Image Files

- **Morning posts**: Place images in `template/` folder
- **Noon posts**: Place images in `stocks/` folder
- Supported formats: JPG, JPEG, PNG
- File names become product names (e.g., `Jagermeister_Winter_Retro_Edition.JPG` → "Jagermeister Winter Retro Edition")

### Step 5: Setup GitHub Actions (Optional)

1. Push code to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add repository secrets:
   - `OPENAI_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `FB_PAGE_1_ID`, `FB_PAGE_1_TOKEN`
   - `FB_PAGE_2_ID`, `FB_PAGE_2_TOKEN`

4. **Workflow runs automatically:**
   - **MORNING**: 8:00 AM Vietnam time (01:00 UTC)
   - **NOON**: 12:00 PM Vietnam time (05:00 UTC)

5. To adjust timing, edit `.github/workflows/*.yml` cron expressions

---

## 🚀 Usage

### Local Run

```bash
# Morning post
node facebook-auto-post.js MORNING

# Noon post
node facebook-auto-post.js NOON
```

### Via GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select "Jager Facebook Auto Post - MORNING" or "NOON"
3. Click **Run workflow**
4. Select branch and start

---

## 📂 Folder Structure

```
.
├── facebook-auto-post.js      # Main workflow
├── telegram-notifier.js       # Telegram integration
├── package.json
├── .env                       # Config (git-ignored)
├── .gitignore
├── .github/
│   └── workflows/
│       ├── morning-post.yml
│       └── noon-post.yml
├── template/                  # Morning reference images
│   └── *.jpg, *.png
├── stocks/                    # Noon reference images
│   └── *.jpg, *.png
├── posts/                     # Generated posts (git-ignored)
│   └── DD_MM_YYYY/
│       ├── MORNING/
│       │   ├── product_HHMMSS.jpg
│       │   └── product_HHMMSS.txt
│       └── NOON/
└── watermark.png              # Custom watermark (optional)
```

---

## 🔔 Telegram Notifications

Bot sends messages for:

✅ **Success**: All pages posted successfully
⚠️ **Partial**: Some pages failed
❌ **Failure**: All attempts failed
🛠️ **Step Failure**: Error at specific stage (image gen, caption, etc.)

---

## 🐛 Troubleshooting

| Issue                                          | Solution                                             |
| ---------------------------------------------- | ---------------------------------------------------- |
| "Missing OPENAI_API_KEY"                       | Check `.env` file has correct key                    |
| "No images found in template/"                 | Create `template/` folder and add images             |
| "Telegram bot token or chat ID not configured" | Run bot first, get chat ID via `@userinfobot`        |
| "Facebook API error"                           | Verify page tokens are valid & not expired           |
| "Image quality check failed"                   | Generated image is too small; retry or adjust prompt |

---

## 📝 Example Output

```
🚀 Starting Facebook Auto Post [MORNING]

[MORNING] Starting post generation workflow
[MORNING] Selecting reference image...
[MORNING] ✓ Selected: Jagermeister_Winter_Retro_Edition.JPG (Jagermeister Winter Retro Edition)
[MORNING] Generating caption (attempt 1)...
[MORNING] ✓ Caption: Mùa đông này, có gì mà không có Jager? 🔥 Dùng ngay chế độ retro...
[MORNING] Checking caption quality...
[MORNING] ✓ Caption passed quality check
[MORNING] Generating image...
[MORNING] ✓ Image generated (2456.3KB)
[MORNING] Processing image...
[MORNING] ✓ Label obfuscated
[MORNING] ✓ Watermark added
[MORNING] ✓ Image processed
[MORNING] Checking image quality...
[MORNING] ✓ Image quality check passed (2456.3KB)
[MORNING] Publishing to Facebook...
[MORNING] ✓ Page 1 published successfully
[MORNING] ✓ Page 2 published successfully
[MORNING] ✓ All pages published!
[MORNING] ✓ Artifacts saved to: posts/30_05_2026/MORNING

✅ MORNING slot completed successfully!
```

---

## 🔐 Security

- `.env` file is in `.gitignore` - never commit secrets
- Telegram token and Chat ID should be kept private
- Facebook tokens should have minimal permissions (posts only)
- GitHub Actions secrets are encrypted

---

## � Documentation & Guides

| Document                                           | Purpose                                              |
| -------------------------------------------------- | ---------------------------------------------------- |
| **[QUICK_START.md](./QUICK_START.md)**             | ⚡ 5-minute setup guide for fast deployment          |
| **[CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)** | 🔑 Step-by-step guide to get all API keys and tokens |
| **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**           | 📱 Complete GitHub Actions & automation setup        |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**     | 🐛 Solutions for common errors                       |
| **.env.example**                                   | 📝 Template for environment variables                |

### File Structure

```
facebook-auto-post/
├── facebook-auto-post.js          # Main workflow orchestrator
├── telegram-notifier.js            # Telegram notification module
├── .github/workflows/
│   ├── morning-post.yml           # 8 AM Vietnam schedule
│   └── noon-post.yml              # 12 PM Vietnam schedule
├── template/                       # Product image templates
├── stocks/                         # Stock images
├── posts/                          # Generated artifacts (DD_MM_YYYY/MORNING|NOON/)
├── README.md                       # This file
├── QUICK_START.md                 # Fast setup (5 min)
├── CREDENTIALS_GUIDE.md           # Token/key acquisition
├── GITHUB_SETUP.md                # GitHub Actions config
├── TROUBLESHOOTING.md             # Error solutions
├── .env.example                   # Environment template
├── .gitignore                      # Git ignore rules
└── package.json                   # Dependencies
```

---

## �📄 License

MIT

---

## 🤝 Support

For issues or questions, create an issue in the repository.
