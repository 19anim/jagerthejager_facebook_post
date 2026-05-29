# 🚀 Hướng Dẫn Setup & Chạy Jager Auto-Post System

## 📋 Yêu Cầu

- Node.js v16+ với `npm`
- OpenAI API Key (https://platform.openai.com/api-keys)
- Replicate API Token (https://replicate.com/account/api-tokens)
- Facebook Page Access Tokens (đã có)
- Ảnh watermark.png trong thư mục gốc

---

## 🔑 Step 1: Lấy API Keys

### OpenAI API Key

1. Vào https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy key (dạng: `sk-...`)

### Replicate API Token

1. Vào https://replicate.com/account/api-tokens
2. Copy API token (dạng: `r8_...`)

---

## 🔧 Step 2: Cập Nhật `.env`

Mở file `.env` và điền:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-key-here

# Replicate API Token
REPLICATE_API_TOKEN=r8_your-actual-token-here
```

⚠️ **QUAN TRỌNG**: Không commit `.env` lên GitHub!

---

## 📁 Step 3: Chuẩn Bị Thư Mục Ảnh

```
Facebook Jagerthejager page/
├── template/          # Ảnh Jagermeister (dùng cho 8h sáng)
│   ├── bottle1.jpg
│   ├── bottle2.jpg
│   └── ...
├── stocks/            # Ảnh vật dụng liên quan (dùng cho 12h trưa)
│   ├── zippo1.jpg
│   ├── model-car.jpg
│   └── ...
└── watermark.png      # Logo/watermark của bạn
```

**Hướng dẫn**:

- Chuẩn bị ít nhất 2-3 ảnh mỗi folder
- Ảnh tốt nhất là 1024x1024px trở lên
- Format: JPG, PNG

---

## 📦 Step 4: Cài Dependencies

```bash
npm install
```

Lệnh này sẽ cài:

- `openai` - ChatGPT API
- OpenAI Images - `gpt-image-1-mini`
- `jimp` - Xử lý ảnh
- `axios` - HTTP requests
- Và các package khác

---

## ▶️ Step 5: Chạy Test

### Chạy lần đầu (test local):

```bash
node --env-file=.env test_v2.js
```

**Quá trình chạy**:

1. Chọn ảnh ngẫu nhiên từ `template/` (MORNING)
2. Tạo caption bằng ChatGPT
3. Kiểm soát chất lượng caption
4. Tạo ảnh bằng OpenAI Images (`gpt-image-1-mini`)
5. Obfuscate nhãn Jagermeister (làm mờ 1 vài ký tự)
6. Thêm watermark
7. Kiểm soát chất lượng ảnh
8. Đăng DRAFT lên Facebook (2 page)
9. Lặp lại với NOON slot và `stocks/`

**Kết quả**:

- 4 ảnh được lưu: `generated_*.png`, `processed_*.jpg`
- 2 DRAFT posts trên Facebook (mỗi page 1 post)
- Logs chi tiết trên console

---

## 🐛 Troubleshooting

### Lỗi: `OPENAI_API_KEY not found`

→ Kiểm tra xem `.env` có khóa `OPENAI_API_KEY` không

### Lỗi: `401 Unauthorized` từ OpenAI

→ API key sai, hãy tạo key mới

### Lỗi: `Replicate API call failed`

→ Replicate token hết hạn hoặc sai, hãy copy lại token mới

### Lỗi: `Facebook page not found`

→ Kiểm tra `FB_PAGE_1_ID` và `FB_PAGE_1_TOKEN` có đúng không

### Ảnh tạo ra không tốt

→ Hãy tinh chỉnh prompt trong `nodeGenerateCaption` node

---

## 📊 Chi Phí API

| Service                        | Chi Phí                           |
| ------------------------------ | --------------------------------- |
| OpenAI (gpt-4o-mini)           | caption model                     |
| OpenAI (gpt-image-1-mini)      | image model                       |
| **Tổng/ngày (2 posts)**        | ~$0.07 (rất rẻ)                   |

→ Free trial OpenAI: $5, đủ chạy 500+ caption
→ Image model hiện dùng: `gpt-image-1-mini`

---

## 🎯 Kế Tiếp: Tự Động Chạy Hàng Ngày

### Tùy Chọn 1: GitHub Actions (Miễn Phí)

1. Push repo lên GitHub
2. Tạo `.github/workflows/schedule.yml`:

```yaml
name: Auto Post
on:
  schedule:
    - cron: "0 8 * * *" # 8h sáng
    - cron: "0 12 * * *" # 12h trưa

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: node --env-file=.env test_v2.js
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          REPLICATE_API_TOKEN: ${{ secrets.REPLICATE_API_TOKEN }}
          FB_PAGE_1_ID: ${{ secrets.FB_PAGE_1_ID }}
          FB_PAGE_1_TOKEN: ${{ secrets.FB_PAGE_1_TOKEN }}
          FB_PAGE_2_ID: ${{ secrets.FB_PAGE_2_ID }}
          FB_PAGE_2_TOKEN: ${{ secrets.FB_PAGE_2_TOKEN }}
```

3. Thêm secrets vào GitHub Settings → Secrets → New repository secret

### Tùy Chọn 2: Cron Job Local (VPS/Máy Chủ Riêng)

```bash
# Chạy lệnh sau:
crontab -e

# Thêm vào:
0 8 * * * cd /path/to/project && node --env-file=.env test_v2.js >> logs/morning.log 2>&1
0 12 * * * cd /path/to/project && node --env-file=.env test_v2.js >> logs/noon.log 2>&1
```

### Tùy Chọn 3: Serverless (Vercel/Netlify)

Có thể deploy function để chạy, nhưng phức tạp hơn. Hỏi nếu cần!

---

## 🎨 Tinh Chỉnh Kết Quả

### Đổi Model ChatGPT

Trong `nodeGenerateCaption()`, sửa:

```javascript
model: "gpt-4o-mini"; // model tạo caption
```

### Đổi Model Tạo Ảnh

Trong `nodeGenerateImage()`, sửa:

```javascript
model: "gpt-image-1-mini"; // model tạo ảnh
quality: "high"; // hỗ trợ low, medium, high, auto
```

### Điều Chỉnh Prompt

Sửa `promptPrefix` trong `nodeGenerateImage()` để tạo style ảnh khác

---

## ✅ Checklist Trước Khi Chạy

- [ ] OpenAI API key đã thêm vào `.env`
- [ ] Replicate token đã thêm vào `.env`
- [ ] Thư mục `template/` có ảnh
- [ ] Thư mục `stocks/` có ảnh
- [ ] File `watermark.png` tồn tại
- [ ] Chạy `npm install` thành công
- [ ] Facebook page IDs & tokens đúng

---

**Happy posting! 🍻**
