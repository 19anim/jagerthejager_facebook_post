import { Annotation, StateGraph, END } from "@langchain/langgraph";
import OpenAI, { toFile } from "openai";
import Jimp from "jimp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

// =========================================================================
// 1. KHỞI TẠO CLIENT
// =========================================================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPTION_MODEL = "gpt-4o-mini";
const IMAGE_MODEL = "gpt-image-2";
const IMAGE_SIZE = "1536x1024";
const IMAGE_QUALITY = "medium";

// =========================================================================
// 2. ĐỊNH NGHĨA TRẠNG THÁI (STATE)
// =========================================================================
const GraphState = Annotation.Root({
  timeSlot: Annotation(), // "MORNING" hoặc "NOON"
  imagePath: Annotation(), // Đường dẫn ảnh gốc (template hoặc stocks)
  productName: Annotation(), // Tên sản phẩm lấy từ tên file ảnh
  caption: Annotation(), // Caption được AI tạo ra
  captionApproved: Annotation(), // Caption đã được phê duyệt?
  generatedImageUrl: Annotation(), // URL ảnh được tạo, nếu API trả về URL
  generatedImagePath: Annotation(), // Đường dẫn ảnh được tải xuống và lưu
  processedImagePath: Annotation(), // Ảnh đã obfuscate + watermark
  qualityApproved: Annotation(), // Ảnh được phê duyệt?
  attempts: Annotation(), // Số lần thử lại
});

const FOOTER_PAGE_1 = "\n\n--- \n🥃 Ghé Page 1 để săn Jager giá tốt nhé anh em!";
const FOOTER_PAGE_2 = "\n\n--- \n🔥 Page 2 luôn sẵn hàng Jagermeister chính hãng!";

// =========================================================================
// 3. NODE: CHỌN ẢNH
// =========================================================================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const sceneThemes = [
  "cinematic luxury bar atmosphere",
  "premium minimalist studio",
  "luxury dark editorial setup",
  "modern industrial environment",
  "high-end lifestyle atmosphere",
  "warm premium interior",
  "cinematic nightlife environment",
  "exclusive collector display",
  "luxury lounge atmosphere",
  "premium commercial backdrop",
  "high-end restaurant ambience",
  "modern luxury apartment",
];

const cameras = [
  "Sony A7R V",
  "Canon EOS R5",
  "Nikon Z8",
  "Leica SL2",
  "Fujifilm GFX 100S",
  "Phase One XF IQ4",
];

const lenses = [
  { focal: "24mm", aperture: "f/2.8" },
  { focal: "35mm", aperture: "f/1.8" },
  { focal: "50mm", aperture: "f/1.4" },
  { focal: "85mm", aperture: "f/1.8" },
  { focal: "105mm", aperture: "f/2" },
  { focal: "135mm", aperture: "f/2.8" },
];

const compositions = [
  "hero product composition with cinematic depth",
  "premium close-up commercial framing",
  "realistic editorial perspective",
  "natural luxury advertising composition",
  "dramatic low-angle product shot",
  "symmetrical premium framing",
  "soft lifestyle commercial perspective",
  "high-end catalog photography composition",
];

const lightings = [
  "soft cinematic rim lighting",
  "premium studio soft lighting",
  "natural window lighting",
  "warm tungsten atmosphere",
  "realistic ambient lighting",
  "luxury commercial lighting setup",
  "moody cinematic shadows",
  "golden hour reflections",
];

const backgrounds = [
  "luxury dark environment with believable depth and subtle bokeh",
  "premium studio backdrop with realistic depth",
  "cinematic lifestyle environment",
  "modern industrial background",
  "high-end luxury interior",
  "minimal dark textured backdrop",
  "premium editorial environment",
  "soft atmospheric background blur",
];

const realismDetails = [
  "ultra realistic material textures",
  "authentic reflections",
  "realistic imperfections",
  "natural depth of field",
  "realistic camera optics",
  "true-to-life materials",
  "non-AI appearance",
  "no CGI look",
  "sharp focus on product",
  "premium optical realism",
  "realistic shadow transitions",
  "natural commercial rendering",
];

const colorGradings = [
  "luxury cinematic tones",
  "premium editorial color grading",
  "realistic commercial color science",
  "rich shadows with natural highlights",
  "subtle realistic contrast",
  "high-end advertising color treatment",
  "magazine-quality color rendering",
];

function generateImagePrompt(extraScene = "", productName = "") {
  const lens = randomItem(lenses);
  const iso = randomItem(["100", "125", "160", "200", "320"]);
  const shutter = randomItem(["1/125", "1/160", "1/200", "1/250", "1/320"]);
  const productContext = productName
    ? `Product name: ${productName}. Use the file name to reinforce the product's identity in the generated image.`
    : "";

  return `
Ultra realistic commercial photography of the ORIGINAL product from the reference image, keep the exact same product identity, preserve the original product shape, preserve original packaging design, preserve original logo placement, preserve original colors and proportions, maintain all primary branding elements

${productContext}
Preserve the original image orientation and aspect ratio: do not turn a horizontal reference image into a vertical one.
Generate a fresh premium background and lighting while keeping the product framing consistent with the source.

Do NOT redesign the product,
do NOT replace the object,
do NOT generate a different item,
do NOT alter the product category

Luxury commercial photography aesthetic, highly photorealistic, visually persuasive for customers, premium editorial quality, natural optical rendering, realistic materials and reflections, non-AI appearance

Scene Theme:
${randomItem(sceneThemes)} ${extraScene}

Shot on ${randomItem(cameras)}, using ${lens.focal} lens, ${lens.aperture}, ISO ${iso}, shutter speed ${shutter}

Composition:
${randomItem(compositions)}

Lighting:
${randomItem(lightings)}

Background:
${randomItem(backgrounds)}

Branding Protection:
Replace all visible “Jägermeister” branding with fictional premium liquor branding using random but realistic-looking text. Generate a new non-existent wordmark in a similar visual style and placement while preserving the bottle shape, label structure, deer emblem, and retro aesthetic. Do not use the original trademark or close spelling variations. The replacement text should appear naturally printed on the label and fully integrated into the packaging design.

Rendering Details:
${randomItem(realismDetails)},
${randomItem(realismDetails)},
${randomItem(realismDetails)},
${randomItem(realismDetails)},
${randomItem(realismDetails)}

Color Grading:
${randomItem(colorGradings)}

Final Quality:
8k photorealistic image,
magazine-quality advertising photography,
luxury branding visual,
realistic commercial rendering,
high-end product photography,
premium cinematic realism
`
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

// =========================================================================
// NODE: Select source image
// =========================================================================
async function nodeSelectImage(state) {
  console.log(`\n=== CA TEST: ${state.timeSlot} ===`);
  console.log("--- NODE: Chọn Ảnh Gốc ---");

  // MORNING: dùng template (ảnh Jagermeister)
  // NOON: dùng stocks (ảnh vật dụng liên quan)
  const folderName = path.join(__dirname, state.timeSlot === "MORNING" ? "template" : "stocks");

  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
    throw new Error(
      `Thư mục '${folderName}' chưa tồn tại. Hãy bỏ ít nhất 1 tấm ảnh vào đó rồi chạy lại.`,
    );
  }

  const files = fs.readdirSync(folderName).filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
  if (files.length === 0) throw new Error(`Thư mục ${folderName} đang trống! Hãy bỏ ảnh test vào.`);

  const randomFile = files[Math.floor(Math.random() * files.length)];
  const selectedPath = path.join(folderName, randomFile);
  const productName = path
    .basename(randomFile, path.extname(randomFile))
    .replace(/[-_]+/g, " ")
    .trim();

  console.log(`=> Chọn ảnh: ${randomFile}`);
  console.log(`=> Tên sản phẩm từ file: ${productName}`);

  return {
    imagePath: selectedPath,
    productName,
    attempts: 0,
  };
}

// =========================================================================
// 4. NODE: TẠO CAPTION BẰNG OPENAI GPT-4O-MINI
// =========================================================================
async function nodeGenerateCaption(state) {
  console.log(`--- NODE: Tạo Caption Bằng ${CAPTION_MODEL} (Lần thử: ${state.attempts + 1}) ---`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY trong môi trường (env)!");
  }

  const productName = state.productName || "sản phẩm";
  const role = `Role: Bạn là Admin fanpage Jagermeister.`;
  const expect = `Expect: Viết caption thật tự nhiên, không giống AI, dí dỏm và ngắn gọn, chỉ 2-3 câu, liên quan đến ${productName}, tạo cảm giác muốn mua mà không dài dòng.`;
  const context = `Viết caption cho ảnh Jagermeister, sản phẩm: ${productName}`;

  const prompt = `${role}
${expect}
${context}
Yêu cầu:
- Tiếng Việt, văn phong hài hước, vui vẻ, hấp dẫn
- Ngắn gọn dưới 100 từ, tối ưu 2-3 câu
- Tạo cảm giác muốn mua sắm
- KHÔNG dùng từ AI-ish: 'khám phá', 'hành trình', 'tuyệt hảo', 'chiêu mộ', 'đông đảo'
- Không dài dòng lê thê
- Viết như một người bán hàng thật thụ, vui vẻ
- Có thể dùng emoji
- Tập trung vào cảm xúc tích cực, sự lôi kéo

Chỉ trả lời caption, không cần giải thích gì khác.`;

  const message = await openai.chat.completions.create({
    model: CAPTION_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  const caption = message.choices[0].message.content.trim();
  console.log(`=> Caption: ${caption}`);

  return {
    caption: caption,
    attempts: state.attempts + 1,
  };
}

// =========================================================================
// 5. NODE: KIỂM SOÁT CHẤT LƯỢNG CAPTION
// =========================================================================
async function nodeQualityCheckCaption(state) {
  console.log("--- NODE: Kiểm Soát Chất Lượng Caption ---");

  const caption = state.caption.toLowerCase();
  const bannedKeywords = ["khám phá", "hành trình", "tuyệt hảo", "chiêu mộ", "đông đảo"];
  const containsAIWord = bannedKeywords.some((word) => caption.includes(word));

  if (!containsAIWord && state.caption.length <= 150) {
    console.log("=> ✅ CAPTION ĐẠT CHUẨN!");
    return { captionApproved: true };
  }

  // Nếu thử quá 2 lần, chấp nhận
  if (state.attempts >= 2) {
    console.log("=> ⚠️ Đã thử 2 lần, chấp nhận bản hiện tại để tiếp tục.");
    return { captionApproved: true };
  }

  console.log("=> ❌ CAPTION CHỈ CÒN: Từ khóa AI hoặc quá dài. Thử lại...");
  return { captionApproved: false };
}

// =========================================================================
// 6. NODE: TẠO ẢNH BẰNG GPT-IMAGE-1-MINI (OPENAI)
// =========================================================================
async function nodeGenerateImage(state) {
  console.log(`--- NODE: Tạo Ảnh Bằng ${IMAGE_MODEL} ---`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY trong môi trường (env)!");
  }

  const imagePrompt = generateImagePrompt("", state.productName);

  console.log(`[${IMAGE_MODEL} Prompt] ${imagePrompt.substring(0, 80)}...`);

  try {
    const referenceImage = await toFile(
      fs.createReadStream(state.imagePath),
      path.basename(state.imagePath),
      { type: state.imagePath.toLowerCase().endsWith(".jpg") ? "image/jpeg" : "image/png" },
    );

    const imageResponse = await openai.images.edit({
      model: IMAGE_MODEL,
      image: referenceImage,
      prompt: imagePrompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
    });

    const imageData = imageResponse.data?.[0];
    const imageUrl = imageData?.url;
    console.log(`=> ✅ Ảnh được tạo thành công`);

    // Tải ảnh xuống
    const generatedImagePath = path.join(
      __dirname,
      `generated_${state.timeSlot.toLowerCase()}_${Date.now()}.png`,
    );
    try {
      if (imageData?.b64_json) {
        fs.writeFileSync(generatedImagePath, Buffer.from(imageData.b64_json, "base64"));
      } else if (imageUrl) {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
        fs.writeFileSync(generatedImagePath, response.data);
      } else {
        throw new Error("OpenAI did not return an image url or b64_json");
      }

      if (!fs.existsSync(generatedImagePath)) {
        throw new Error("File ảnh không được lưu");
      }
      const fileSize = fs.statSync(generatedImagePath).size;
      console.log(`=> ✅ Ảnh tải về thành công (${(fileSize / 1024).toFixed(1)}KB)`);

      return {
        generatedImageUrl: imageUrl || "b64_json",
        generatedImagePath: generatedImagePath,
      };
    } catch (downloadErr) {
      console.warn(`⚠️ Không thể lưu ảnh ${IMAGE_MODEL}: ${downloadErr.message}`);
      console.log(`=> Fallback: Sử dụng ảnh gốc từ template/stocks`);
      return {
        generatedImageUrl: "fallback",
        generatedImagePath: state.imagePath,
      };
    }
  } catch (error) {
    console.error(`=> ❌ Lỗi ${IMAGE_MODEL}: ${error.message}`);
    console.log(`=> Fallback: Sử dụng ảnh gốc từ template/stocks`);
    return {
      generatedImageUrl: "fallback",
      generatedImagePath: state.imagePath,
    };
  }
}

// =========================================================================
// 7. NODE: XỬ LÝ ẢNH (OBFUSCATE + WATERMARK)
// =========================================================================
async function nodeProcessImage(state) {
  console.log("--- NODE: Xử Lý Ảnh (Obfuscate + Watermark) ---");

  let fullImage;
  try {
    fullImage = await Jimp.read(state.generatedImagePath);
  } catch (err) {
    throw new Error(`Không thể đọc ảnh: ${err.message}`);
  }

  const w = fullImage.bitmap.width;
  const h = fullImage.bitmap.height;

  // --- BƯỚC 1: Obfuscate nhãn Jagermeister ---
  // Pixelate vùng trên cùng bên phải (nơi thường có nhãn)
  try {
    const blurSize = Math.min(150, Math.floor(w / 4));
    const startX = Math.max(0, w - blurSize - 30);
    const startY = 30;

    // Tạo vùng pixelate bằng cách blur
    if (startX + blurSize <= w && startY + blurSize <= h) {
      const pixelatedRegion = fullImage.clone().crop(startX, startY, blurSize, blurSize).blur(12);

      fullImage.composite(pixelatedRegion, startX, startY);
      console.log(`=> Đã obfuscate vùng nhãn`);
    }
  } catch (obfuscateErr) {
    console.log(`-> Cảnh báo: Không thể obfuscate (${obfuscateErr.message}), tiếp tục...`);
  }

  // --- BƯỚC 2: Thêm watermark ---
  const lowercaseWatermarkPath = path.join(__dirname, "watermark.png");
  const uppercaseWatermarkPath = path.join(__dirname, "watermark.PNG");
  const watermarkPath = fs.existsSync(lowercaseWatermarkPath)
    ? lowercaseWatermarkPath
    : uppercaseWatermarkPath;

  if (!fs.existsSync(watermarkPath)) {
    console.log("-> Chưa tìm thấy watermark.png, tạo watermark test tạm thời.");
    const dummyWatermark = new Jimp({
      width: 100,
      height: 40,
      color: 0xff0000ff,
    });
    await dummyWatermark.writeAsync(lowercaseWatermarkPath);
  }

  try {
    const watermark = await Jimp.read(
      fs.existsSync(watermarkPath) ? watermarkPath : lowercaseWatermarkPath,
    );

    watermark.resize(Math.floor(fullImage.bitmap.width * 0.15), Jimp.AUTO);

    fullImage.composite(
      watermark,
      fullImage.bitmap.width - watermark.bitmap.width - 20,
      fullImage.bitmap.height - watermark.bitmap.height - 20,
    );

    console.log(`=> Đã thêm watermark`);
  } catch (watermarkErr) {
    console.log(`-> Cảnh báo: Không thể thêm watermark (${watermarkErr.message}), tiếp tục...`);
  }

  const outputPath = path.join(
    __dirname,
    `processed_${state.timeSlot.toLowerCase()}_${Date.now()}.jpg`,
  );
  await fullImage.writeAsync(outputPath);

  console.log(`=> ✅ Ảnh đã được xử lý: ${outputPath}`);

  return {
    processedImagePath: outputPath,
  };
}

// =========================================================================
// NODE: LƯU ARTIFACTS (ẢNH + CAPTION) THEO NGÀY VÀ CA
// =========================================================================
async function savePostArtifacts(state) {
  console.log("--- NODE: Lưu artifacts (ảnh + caption) ---");

  try {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const dateFolder = `${dd}_${mm}_${yyyy}`; // DD_MM_YYYY

    const slot = state.timeSlot || "UNKN";
    const baseDir = path.join(__dirname, "posts", dateFolder, slot);
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    const srcImage = state.processedImagePath || state.generatedImagePath || state.imagePath;
    const ext = path.extname(srcImage) || ".jpg";
    const nameSafe = (state.productName || "product")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]/g, "");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const timeSuffix = `${hh}${min}${ss}`;

    const destImage = path.join(baseDir, `${nameSafe}_${timeSuffix}${ext}`);
    try {
      fs.copyFileSync(srcImage, destImage);
    } catch (copyErr) {
      console.warn(`-> Không thể copy ảnh vào ${destImage}: ${copyErr.message}`);
    }

    const captionFile = path.join(baseDir, `${nameSafe}_${timeSuffix}.txt`);
    try {
      fs.writeFileSync(captionFile, state.caption || "");
    } catch (capErr) {
      console.warn(`-> Không thể lưu caption: ${capErr.message}`);
    }

    console.log(`=> ✅ Lưu artifacts hoàn tất: ${baseDir}`);
  } catch (err) {
    console.error("=> ❌ Lỗi khi lưu artifacts:", err.message || err);
  }

  return {};
}

// =========================================================================
// 8. NODE: KIỂM SOÁT CHẤT LƯỢNG ẢNH
// =========================================================================
async function nodeQualityCheckImage(state) {
  console.log("--- NODE: Kiểm Soát Chất Lượng Ảnh ---");

  // Đơn giản: kiểm tra file tồn tại
  if (!fs.existsSync(state.processedImagePath)) {
    throw new Error(`Ảnh không tồn tại: ${state.processedImagePath}`);
  }

  const stats = fs.statSync(state.processedImagePath);
  if (stats.size < 10000) {
    // Nhỏ hơn 10KB = có vấn đề
    console.log("=> ❌ Ảnh quá nhỏ, có vấn đề");
    return { qualityApproved: false };
  }

  console.log(`=> ✅ ẢNH ĐẠT CHUẨN (${(stats.size / 1024).toFixed(1)}KB)`);
  return { qualityApproved: true };
}

// =========================================================================
// 9. NODE: ĐĂNG BÀI LÊN FACEBOOK
// =========================================================================
async function createFacebookDraftPost({ pageId, accessToken, imagePath, caption }) {
  try {
    const graphApiBase = "https://graph.facebook.com/v25.0";
    const photoUrl = `${graphApiBase}/${pageId}/photos`;

    const form = new FormData();
    form.append("source", fs.createReadStream(imagePath));
    form.append("access_token", accessToken);
    form.append("published", "false");

    console.log(`[Bước 1/2] Đang upload ảnh lên Page ${pageId}...`);
    const photoResponse = await axios.post(photoUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (typeof photoResponse.data === "string" && photoResponse.data.includes("<!DOCTYPE html>")) {
      throw new Error("Facebook trả về HTML error. Kiểm tra token.");
    }

    const photoId = photoResponse.data?.id;
    if (!photoId) {
      throw new Error(`Facebook không cấp ID ảnh. Phản hồi: ${JSON.stringify(photoResponse.data)}`);
    }

    console.log(`[Bước 1/2] ✅ Lấy ID ảnh: ${photoId}`);

    const feedUrl = `${graphApiBase}/${pageId}/feed`;

    console.log(`[Bước 2/2] Tạo DRAFT post trên Meta...`);
    const feedResponse = await axios.post(
      feedUrl,
      {
        message: caption,
        access_token: accessToken,
        published: false,
        unpublished_content_type: "DRAFT",
        attached_media: [{ media_fbid: photoId }],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      },
    );

    return feedResponse.data;
  } catch (error) {
    const fbErrorMsg = error.response?.data?.error?.message || error.message;
    throw new Error(fbErrorMsg);
  }
}

async function nodePublishPost(state) {
  console.log("--- NODE: Đăng Bài DRAFT Lên Facebook ---");

  try {
    const p1 = createFacebookDraftPost({
      pageId: process.env.FB_PAGE_1_ID,
      accessToken: process.env.FB_PAGE_1_TOKEN,
      imagePath: state.processedImagePath,
      caption: state.caption + FOOTER_PAGE_1,
    }).catch((err) => ({ error: true, page: 1, msg: err.message }));

    const p2 = createFacebookDraftPost({
      pageId: process.env.FB_PAGE_2_ID,
      accessToken: process.env.FB_PAGE_2_TOKEN,
      imagePath: state.processedImagePath,
      caption: state.caption + FOOTER_PAGE_2,
    }).catch((err) => ({ error: true, page: 2, msg: err.message }));

    const results = await Promise.all([p1, p2]);

    results.forEach((res) => {
      if (res && res.error) {
        console.error(`\n❌ LỖI PAGE ${res.page}: ${res.msg}`);
      } else {
        console.log(`\n✅ PAGE ${results.indexOf(res) + 1}: Đã tạo DRAFT post thành công`);
      }
    });

    if (!results.some((res) => res?.error)) {
      console.log(`\n🎉 HOÀN THÀNH: DRAFT posts đã tạo trên cả 2 page ca ${state.timeSlot}!`);
    }
  } catch (globalError) {
    console.error("❌ Lỗi hệ thống mạch Graph:", globalError);
  }

  return {};
}

// =========================================================================
// 10. ĐIỀU HƯỚNG GRAPH
// =========================================================================
function decideCaption(state) {
  return state.captionApproved ? "generate_image" : "generate_caption";
}

function decideImage(state) {
  return state.qualityApproved ? "publish" : "generate_image";
}

// =========================================================================
// 11. KHỞI TẠO WORKFLOW
// =========================================================================
const workflow = new StateGraph(GraphState)
  .addNode("select_image", nodeSelectImage)
  .addNode("generate_caption", nodeGenerateCaption)
  .addNode("quality_check_caption", nodeQualityCheckCaption)
  .addNode("generate_image", nodeGenerateImage)
  .addNode("process_image", nodeProcessImage)
  .addNode("save_artifacts", savePostArtifacts)
  .addNode("quality_check_image", nodeQualityCheckImage)
  .addNode("publish", nodePublishPost)

  .addEdge("__start__", "select_image")
  .addEdge("select_image", "generate_caption")
  .addEdge("generate_caption", "quality_check_caption")
  .addConditionalEdges("quality_check_caption", decideCaption, {
    generate_image: "generate_image",
    generate_caption: "generate_caption",
  })
  .addEdge("generate_image", "process_image")
  .addEdge("process_image", "quality_check_image")
  .addConditionalEdges("quality_check_image", decideImage, {
    publish: "save_artifacts",
    generate_image: "generate_image",
  })
  .addEdge("save_artifacts", "publish")
  .addEdge("publish", END);

const app = workflow.compile();

// =========================================================================
// 12. CHẠY WORKFLOW
// =========================================================================
async function runAllTests() {
  console.log(
    `\n🚀 BẮT ĐẦU CHẠY KIỂM THỬ: ${CAPTION_MODEL} CAPTION + ${IMAGE_MODEL} IMAGES + FACEBOOK POSTING\n`,
  );

  try {
    await app.invoke({ timeSlot: "MORNING" });
    console.log("\n✅ MORNING ca hoàn thành!\n");

    await app.invoke({ timeSlot: "NOON" });
    console.log("\n✅ NOON ca hoàn thành!\n");

    console.log("🎉 Thử nghiệm kết thúc! Hãy mở Meta Business Suite để kiểm tra DRAFT posts.\n");
  } catch (err) {
    console.error("❌ Lỗi thực thi:", err);
  }
}

runAllTests();
