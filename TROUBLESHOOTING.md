# 🐛 Troubleshooting Guide

Giải pháp cho các lỗi thường gặp.

---

## ❌ Error: "Cannot find module 'openai'"

### Nguyên nhân

Dependencies không cài đặt.

### Fix

```bash
npm install
# hoặc
npm ci  # trên GitHub Actions
```

---

## ❌ Error: "Invalid OpenAI API key"

### Nguyên nhân

- Key sai format
- Key expire
- Key không có credits

### Fix

1. Kiểm tra key format: `sk-proj-...`
2. Không có space ở đầu/cuối
3. Regenerate key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Check balance: [billing/overview](https://platform.openai.com/account/billing/overview)

### Test

```bash
node -e "
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
client.models.list().then(r => console.log('✅ Valid')).catch(e => console.log('❌ Error:', e.message))
"
```

---

## ❌ Error: "Telegram notification failed"

### Nguyên nhân

- Token sai
- Chat ID sai
- Bot không active

### Fix

```bash
# Test Telegram connection
node -e "
const axios = require('axios');
axios.post(\`https://api.telegram.org/bot\${process.env.TELEGRAM_BOT_TOKEN}/sendMessage\`, {
  chat_id: process.env.TELEGRAM_CHAT_ID,
  text: 'Test from Node'
}).then(() => console.log('✅ Telegram OK')).catch(e => console.log('❌ Error:', e.message))
"
```

### Verify

1. Token format: `123456:ABCdef...`
2. Chat ID format: `1234567890` (hoặc `-1001234567890` nếu group)
3. Bot đã nhận `/start` không?

---

## ❌ Error: "Facebook token invalid"

### Nguyên nhân

- Token expire
- Token format sai
- Token không có quyền

### Fix

1. Regenerate token: [Graph Explorer](https://developers.facebook.com/tools/explorer)
2. Kiểm tra permissions: `pages_manage_posts`, `pages_read_engagement`
3. Convert to long-lived token (5000 days validity)

---

## ❌ Error: "Image file not found"

### Nguyên nhân

- Folder `template/` hoặc `stocks/` trống
- Path sai

### Fix

```bash
# Kiểm tra folder
ls template/
ls stocks/

# Có ảnh không?
ls template/*.{jpg,png,jpeg}
```

### Add Images

```bash
# Copy ảnh vào
cp /path/to/images template/
cp /path/to/images stocks/

git add template/ stocks/
git commit -m "Add template images"
git push
```

---

## ❌ Error: "Cannot read property 'content' of undefined"

### Nguyên nhân

OpenAI response không có format mong đợi (model overload, timeout).

### Fix

1. Retry: Script chạy `nodeGenerateCaption()` 2 lần
2. Kiểm tra OpenAI status: [status.openai.com](https://status.openai.com)
3. Thử lúc khác (server overload)

---

## ❌ GitHub Action không chạy

### Nguyên nhân

1. Schedule disabled
2. Secrets missing
3. Code error

### Fix

**Check 1: Actions enabled?**

```
Settings → Actions → Allowed actions
✅ "Allow all actions and reusable workflows"
```

**Check 2: Secrets added?**

```
Settings → Secrets and variables → Actions
Tất cả 8 secrets có không?
```

**Check 3: Cron syntax?**

```
.github/workflows/morning-post.yml
- cron: '0 1 * * *'  ← format correct?
```

[Cron validator](https://crontab.guru/)

**Check 4: Run manually**

```
Actions tab → Select workflow
→ Run workflow → Run workflow button
```

---

## ❌ Workflow chạy nhưng failed

### View Logs

1. Vào **Actions** tab
2. Chọn failed workflow run
3. Click job → view console output
4. Tìm error message

### Common Errors

**"Secret not available"**

- Đảm bảo secret name đúng chính xác (case-sensitive)
- Secrets apply vào main branch?

**"npm ERR! 404 Not Found"**

- Package không có
- Check package.json dependencies
- Run `npm install` locally first

**"timeout"**

- Script chạy quá lâu (> 6 hours)
- Kiểm tra loop infinite, API blocking

---

## ⏰ Workflow không chạy đúng giờ

### Nguyên nhân

- GitHub delay (15+ min)
- Cron syntax sai
- Timezone confusion

### Fix

1. **Test thủ công trước:**

   ```
   Actions → Run workflow (manual)
   ```

2. **Kiểm tra cron:**
   - `0 1 * * *` = 01:00 UTC = 08:00 Vietnam
   - `0 5 * * *` = 05:00 UTC = 12:00 Vietnam
   - Validate: [crontab.guru](https://crontab.guru)

3. **Check GitHub Actions schedule:**
   - GitHub chạy trên **UTC** (không local time)
   - Delay là bình thường (5-15 min)

4. **View next run time:**
   ```
   Actions → Workflow → view schedule details
   ```

---

## 📊 Post không xuất hiện trên Facebook

### Nguyên nhân

1. Draft chỉ save, chưa publish
2. Token expire
3. Page ID sai

### Fix

1. **Manual check:**
   - Vào Facebook page → Drafts section
   - Post draft có không?
   - Publish thủ công để test

2. **Verify token:**
   - Regenerate: [Graph Explorer](https://developers.facebook.com/tools/explorer)
   - Check permissions

3. **Verify Page ID:**
   - Vào page → About → check ID
   - Format: numbers only, no text

---

## 💾 Post artifacts không save

### Nguyên nhân

Publish fail → artifact không save (by design).

### Check

```bash
ls posts/
# Nếu folder trống → publish bị fail

# Xem failed attempts
cat posts/failed_uploads.json
```

### Fix

1. Check Facebook token
2. Check network
3. Retry thủ công:
   ```bash
   node facebook-auto-post.js MORNING
   ```

---

## 🔐 ".env not found" error

### Nguyên nhân

Local chạy cần `.env`, nhưng chưa tạo.

### Fix

```bash
# Copy từ example
cp .env.example .env

# Fill values
nano .env  # hoặc edit file

# Test
node facebook-auto-post.js MORNING
```

---

## ⚡ Script chạy quá lâu

### Nguyên nhân

- AI processing lâu
- Image generation timeout
- Network lag

### Fix

1. **Increase timeout:**
   - Edit script → increase axios timeout

   ```javascript
   const client = new OpenAI({
     timeout: 120000, // 2 minutes
   });
   ```

2. **Check image size:**
   - Ảnh quá lớn? Resize
   - Format: PNG → JPG (faster)

3. **Monitor API:**
   - OpenAI status: [status.openai.com](https://status.openai.com)
   - Facebook status: [Facebook Status](https://developers.facebook.com/status)

---

## 📝 Logs không chi tiết

### Fix

Edit script để thêm debug logs:

```javascript
console.log("[DEBUG]", "Generating caption...", state.selectedImage);
```

Hoặc set environment:

```bash
DEBUG=* node facebook-auto-post.js MORNING
```

---

## 🔄 Cách reset & restart

### Full reset

```bash
# Remove all generated files
rm -rf posts/
rm -rf *.png *.jpg *.jpeg

# Reset code
git clean -fd
git checkout HEAD

# Reinstall
npm ci

# Test
npm run post:morning
```

### Soft reset

```bash
# Keep posts, just update code
git add .
git commit -m "fixes"
git push

# GitHub Actions auto updates
```

---

## 📞 Contact & Support

**Still stuck?** Kiểm tra:

1. `.github/workflows/` syntax valid?
2. Tất cả secrets added?
3. Images exist locally?
4. API keys valid & active?
5. Network connection OK?

---

**Debugging tips:**

- Always check logs first
- Test component individually
- Verify API keys manually
- Use "Run workflow" to test before scheduled runs

🚀 **Back to main → [README.md](./README.md)**
