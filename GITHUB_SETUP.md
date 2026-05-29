# GitHub Actions Setup Guide

## 🎯 Mục đích

Chạy tự động post Facebook vào khung giờ cố định (8 AM & 12 PM) mà không cần máy tính chạy liên tục.

---

## 📊 Cách hoạt động

```
GitHub Actions (Cloud)
    ↓
Runs nodejs scripts (facebook-auto-post.js)
    ↓
Generate image + caption
    ↓
Post to Facebook Pages
    ↓
Send Telegram notification
```

---

## 🚀 Setup Steps

### Step 1: Tạo GitHub Repository

1. Tạo repository mới: `facebook-auto-post` (hoặc tên khác)
2. Clone về máy tính
3. Copy toàn bộ files từ project hiện tại vào folder này
4. **Đảm bảo folder chứa:**
   - `.github/workflows/morning-post.yml`
   - `.github/workflows/noon-post.yml`
   - `facebook-auto-post.js`
   - `telegram-notifier.js`
   - `package.json`
   - `.gitignore`
   - `README.md`

### Step 2: Push Code to GitHub

```bash
cd facebook-auto-post
git add .
git commit -m "Initial commit: Facebook auto post with GitHub Actions"
git push origin main
```

### Step 3: Configure GitHub Secrets

1. Vào repository → **Settings** tab
2. Chọn **Secrets and variables** → **Actions**
3. Click **New repository secret** và thêm 8 secrets:

| Secret Name          | Value              | Từ đâu?                                                              |
| -------------------- | ------------------ | -------------------------------------------------------------------- |
| `OPENAI_API_KEY`     | `sk-proj-xxxxx`    | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TELEGRAM_BOT_TOKEN` | `123456:ABCdef...` | [@BotFather](https://t.me/botfather) → `/newbot`                     |
| `TELEGRAM_CHAT_ID`   | `1234567890`       | [@userinfobot](https://t.me/userinfobot) → `/start`                  |
| `FB_PAGE_1_ID`       | Your page 1 ID     | Facebook Page Settings                                               |
| `FB_PAGE_1_TOKEN`    | User access token  | Facebook Graph Explorer                                              |
| `FB_PAGE_2_ID`       | Your page 2 ID     | Facebook Page Settings                                               |
| `FB_PAGE_2_TOKEN`    | User access token  | Facebook Graph Explorer                                              |

### Step 4: Tạo Telegram Bot (nếu chưa có)

**Via BotFather:**

1. Chat với [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Đặt tên: "Jager Facebook Auto Post"
4. Đặt username: `jager_facebook_auto_bot` (kết thúc bằng `_bot`)
5. **Copy token** vào secret `TELEGRAM_BOT_TOKEN`

**Lấy Chat ID:**

1. Chat với bot bạn vừa tạo (gửi `/start`)
2. Tìm [@userinfobot](https://t.me/userinfobot)
3. Send `/start` → copy Chat ID → vào secret `TELEGRAM_CHAT_ID`

### Step 5: Cấu hình Thời gian (Timezone)

**Workflows chạy theo UTC timezone trên GitHub.**

Hiện tại cấu hình:

- **MORNING**: `0 1 * * *` (01:00 UTC = 08:00 Vietnam)
- **NOON**: `0 5 * * *` (05:00 UTC = 12:00 Vietnam)

Muốn thay đổi? Sửa file `.github/workflows/morning-post.yml` hoặc `.github/workflows/noon-post.yml`:

```yaml
on:
  schedule:
    - cron: "0 1 * * *" # HH MM * * *
```

**Chuyển đổi timezone:**

- Vietnam UTC+7 → trừ 7 giờ
- VD: Muốn 9 AM (Vietnam) = 02:00 UTC → cron: `0 2 * * *`

[Cron cheat sheet](https://crontab.guru/)

---

## ✅ Test Workflow

1. Vào repository → **Actions** tab
2. Chọn workflow (VD: "Jager Facebook Auto Post - MORNING")
3. Click **Run workflow** → **Run workflow**
4. Chờ execution

**Xem logs:**

- Click vào run
- Xem console output
- Kiểm tra Telegram nhận được message hay không

---

## 🎛️ Chỉnh Timing Trước khi Deploy

**Lưu ý:** GitHub Actions có thể delay 15 phút do server load.

Muốn chạy lúc **KHÁC** với 8 AM & 12 PM?

1. Edit `.github/workflows/morning-post.yml` và `.github/workflows/noon-post.yml`
2. Tìm dòng `- cron: 'XX YY * * *'`
3. Sửa thành giờ muốn (tính toán từ UTC)

**Ví dụ:**

- 9 AM Vietnam → `0 2 * * *`
- 3 PM Vietnam → `0 8 * * *`
- 7 PM Vietnam → `0 12 * * *`

3. Push changes: `git add . && git commit -m "Update schedule" && git push`

---

## 📋 Checklist Trước Deploy

- [ ] All 8 secrets được add vào GitHub
- [ ] `template/` folder có ảnh test
- [ ] `stocks/` folder có ảnh test
- [ ] Telegram bot hoạt động (test `/start`)
- [ ] Facebook tokens hợp lệ
- [ ] OpenAI API key có balance
- [ ] `.github/workflows/` có 2 YAML files
- [ ] `.gitignore` có `.env`

---

## 🐛 Troubleshooting

### Workflow không chạy đúng giờ?

- GitHub Actions có thể trễ 15 phút
- Check giờ UTC (không phải local time)
- Test bằng "Run workflow" thủ công trước

### "Secret not available"?

- Đảm bảo secret đã thêm đúng tên
- Workspace phải là main branch mới nhận secret

### Image file không tìm thấy?

- Đảm bảo folder `template/` và `stocks/` có file
- Push images **hoặc** GitHub Actions sẽ create empty folder

### Telegram message không đến?

- Kiểm tra token & chat ID đúng không
- Bot đã nhận `/start` chưa?
- Check Telegram "Group Privacy Settings" nếu dùng group

---

## 📊 Monitoring

Sau khi deploy, kiểm tra:

1. **GitHub Actions**: Repository → Actions → view logs
2. **Telegram**: Nhận message notifications?
3. **Facebook Pages**: Posts xuất hiện trong drafts?
4. **Posts folder**: `posts/DD_MM_YYYY/` có artifacts?

---

## 🔄 Updates & Maintenance

**Update code?**

```bash
git commit -am "Update prompts or fix bugs"
git push
# Workflows tự động chạy với code mới
```

**Rotate tokens?**

1. Tạo token mới trên Facebook/OpenAI/Telegram
2. Update GitHub secrets
3. Workflows tự động dùng token mới

---

## 💡 Tips

- Start with test run (`Run workflow` button)
- Monitor first 3-4 automated runs trước khi để automation
- Set GitHub notifications để track failures
- Keep `.env.example` ở repo (nhưng không `.env`)

---

## ❓ FAQ

**Q: Nó chạy on GitHub servers hay máy tôi?**  
A: GitHub servers (Ubuntu runner). Máy bạn không cần bật.

**Q: Có tốn phí không?**  
A: Miễn phí cho public repo (2000 minutes/tháng). Private repo tùy plan.

**Q: Nếu API fail thì sao?**  
A: Telegram sẽ gửi alert. Retry tự động 3 lần, nếu vẫn fail → thông báo lỗi.

**Q: Có log file không?**  
A: Có, check Actions → Workflow run → view logs. Artifacts (posts) download được.

---

**Ready? → Deploy! 🚀**
