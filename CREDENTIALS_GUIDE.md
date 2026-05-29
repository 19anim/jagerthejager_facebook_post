# 🔑 How to Get All Required Credentials

Complete step-by-step guide để lấy tất cả tokens và IDs cần thiết.

---

## 1️⃣ OpenAI API Key

### Lấy key

1. Vào [platform.openai.com](https://platform.openai.com)
2. Login / Signup
3. Sidebar → **API keys**
4. Click **Create new secret key**
5. **Copy** và lưu ở chỗ khác
6. Format: `sk-proj-xxxxx...`

### Kiểm tra

```bash
# Local test
OPENAI_API_KEY=sk-proj-... node facebook-auto-post.js MORNING
```

**Budget Check:**

- Vào [Billing → Overview](https://platform.openai.com/account/billing/overview)
- Có credit hay subscription không

---

## 2️⃣ Telegram Bot Token

### Tạo Bot

1. **Chat [@BotFather](https://t.me/botfather)** trên Telegram
2. Send `/newbot`
3. **Bot name**: `Jager Facebook Auto Post` (thường xuyên dùng)
4. **Bot username**: `jager_facebook_auto_bot` (phải kết thúc `_bot`)
5. **Nhận token**: `123456789:ABCdefGHIjklmnoPQRstuvWXYZ1234567890`

### Format

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZ1234567890
           ↑                              ↑
         Digits                       Letters & Numbers (long)
```

### Test Bot

1. Chat bot bạn vừa tạo
2. Send `/start`
3. Nếu nhận tin → bot hoạt động

---

## 3️⃣ Telegram Chat ID

### Lấy Chat ID cá nhân

1. Chat [@userinfobot](https://t.me/userinfobot)
2. Send `/start`
3. Xem response → **id** field là chat ID
4. Format: `1234567890` (9-12 digits)

```
TELEGRAM_CHAT_ID=1234567890
```

### Nếu gửi vào Group?

1. Add bot vào group
2. Send message: `/start`
3. Chat với @userinfobot → `/start` → tìm group ID
4. Format: `-1001234567890` (âm, có 1001 ở đầu)

### Test

```bash
# Kiểm tra bot gửi message được không
node -e "
const axios = require('axios');
axios.post('https://api.telegram.org/bot<TOKEN>/sendMessage', {
  chat_id: <CHAT_ID>,
  text: 'Test message'
}).then(() => console.log('✅ Success')).catch(e => console.log('❌ Failed', e.message))
"
```

---

## 4️⃣ Facebook Page ID

### Lấy Page ID

1. Vào [Facebook Page](https://www.facebook.com/your-page)
2. **About** tab → **Page Info** section
3. Tìm **Page ID** → copy

Hoặc:

1. Vào [Meta Business Suite](https://business.facebook.com/)
2. **Settings** → **Pages** → chọn page
3. **Page Settings** → **Page Info**

### Format

```
FB_PAGE_1_ID=1234567890
```

---

## 5️⃣ Facebook User Access Token

### ⚠️ Cách đúng (Recommended)

#### Step 1: Create App (nếu chưa có)

1. Vào [Meta Developers](https://developers.facebook.com/docs/development-setup-up)
2. Create → New App
3. App Type: **Consumer** (để post)
4. Điền info

#### Step 2: Generate Token

1. Vào [Facebook Graph Explorer](https://developers.facebook.com/tools/explorer)
2. Chọn app vừa tạo (top-left dropdown)
3. Select permissions:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_read_user_content`
4. Generate → Select all pages → Generate access token
5. **Copy token** → Format: `EAABsbCS...` (rất dài)

#### Step 3: Make Token Long-lived

```bash
curl "https://graph.instagram.com/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<USER_TOKEN>"
```

- Replace: `APP_ID`, `APP_SECRET`, `USER_TOKEN`
- Response → copy new token

### 🔒 Security Notes

- **KHÔNG** share token công khai
- Token expiry: 60 days (standard), 5000 days (long-lived)
- Rotate token mỗi 3 tháng
- Revoke nếu compromised: Facebook → Settings → Apps and Websites

### Format

```
FB_PAGE_1_TOKEN=EAABsbCS1ZA4BALbvW9y4P...  (very long)
```

---

## 📋 Complete .env Template

```bash
# .env file (NEVER commit!)

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABCdef...
TELEGRAM_CHAT_ID=1234567890

# Facebook Page 1
FB_PAGE_1_ID=111111111111
FB_PAGE_1_TOKEN=EAABsbCS1ZA4BALbvW9y4P...

# Facebook Page 2
FB_PAGE_2_ID=222222222222
FB_PAGE_2_TOKEN=EAABsbCS1ZA4BALbvW9y5Q...
```

---

## ✅ Verification Checklist

Trước khi deploy:

- [ ] OpenAI key dạng `sk-proj-...`
- [ ] OpenAI key có balance/credits
- [ ] Telegram token dạng `123456:ABC...`
- [ ] Telegram Chat ID là số (9-12 digits)
- [ ] Telegram bot nhận `/start` được
- [ ] Facebook Page IDs là numbers
- [ ] Facebook tokens dạng `EAABsbCS...`
- [ ] Facebook tokens chưa expire
- [ ] Tất cả file trong `.gitignore`

---

## 🚨 Troubleshooting

### "Invalid OpenAI key"

- Kiểm tra format: `sk-proj-...`
- Có space hay kí tự lạ không?
- Key expire chưa? (Regenerate)

### "Telegram message failed"

- Token đúng format không? `123456:ABC...`
- Chat ID có đúng không?
- Bot nhận `/start` được không?

### "Facebook post failed"

- Token hết hạn? (Regenerate)
- Page ID đúng không?
- Token có quyền `pages_manage_posts` không?

### "Token expires in X days"

- Regenerate trước khi expire
- Use long-lived token (5000 days)

---

## 🔄 Token Rotation (Monthly)

1. Regenerate token mới
2. Update `.env` locally
3. Update GitHub Secrets
4. Test thủ công 1 lần
5. Deploy

**Auto-rotation script:**

```bash
# token-rotation.js (optional)
# Regenerate & update GitHub secrets monthly
```

---

**Ready with credentials? → [QUICK_START.md](./QUICK_START.md)**
