import { Annotation, StateGraph, END } from "@langchain/langgraph";
import OpenAI from "openai";
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
const IMAGE_MODEL = "gpt-image-1-mini";

// =========================================================================
// 2. ĐỊNH NGHĨA TRẠNG THÁI (STATE)
// =========================================================================
const GraphState = Annotation.Root({
  timeSlot: Annotation(), // "MORNING" hoặc "NOON"
  imagePath: Annotation(), // Đường dẫn ảnh gốc (template hoặc stocks)
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
async function nodeSelectImage(state) {
  console.log(`\n=== CA TEST: ${state.timeSlot} ===`);
  console.log("--- NODE: Chọn Ảnh Gốc ---");

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
  console.log(`=> Chọn ảnh: ${randomFile}`);

  return {
    imagePath: selectedPath,
    attempts: 0,
  };
}

// =========================================================================
// 4. NODE: TẠO CAPTION BẰNG OPENAI
// =========================================================================
async function nodeGenerateCaption(state) {
  console.log(`--- NODE: Tạo Caption Bằng ChatGPT (Lần thử: ${state.attempts + 1}) ---`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY trong môi trường (env)!");
  }

  const context =
    state.timeSlot === "MORNING"
      ? "Viết caption cho ảnh đồ uống Jagermeister sẽ bán vào buổi sáng 8h"
      : "Viết caption cho ảnh vật dụng, phụ kiện liên quan đến Jagermeister sẽ bán vào buổi trưa 12h";

  const prompt = `${context}
Yêu cầu:
- Tiếng Việt, văn phong hài hước, vui vẻ, hấp dẫn
- Ngắn gọn dưới 100 từ
- Tạo cảm giác muốn mua sắm
- KHÔNG dùng từ AI-ish: 'khám phá', 'hành trình', 'tuyệt hảo', 'chiêu mộ', 'đông đảo'
- Viết như một người bán hàng thật thụy, vui vẻ
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

  if (state.attempts >= 2) {
    console.log("=> ⚠️ Đã thử 2 lần, chấp nhận bản hiện tại để tiếp tục.");
    return { captionApproved: true };
  }

  console.log("=> ❌ CAPTION CÓ VẤN ĐỀ: Từ khóa AI hoặc quá dài. Thử lại...");
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

  let promptPrefix = "";
  if (state.timeSlot === "MORNING") {
    promptPrefix =
      "professional product photography of Jagermeister bottle on elegant background, dramatic lighting, high quality, realistic, 4k";
  } else {
    promptPrefix =
      "professional product photography of Jagermeister merchandise (zippo lighter, model car, collectible) on clean white background, studio lighting, highly detailed";
  }

  const imagePrompt = `${promptPrefix}. ${state.caption}. No watermark, no text, premium quality.`;

  console.log(`[${IMAGE_MODEL} Prompt] ${imagePrompt.substring(0, 80)}...`);

  try {
    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    const imageData = imageResponse.data?.[0];
    const imageUrl = imageData?.url;
    console.log(`=> ✅ ${IMAGE_MODEL} tạo ảnh thành công`);

    // Tải ảnh xuống
    const generatedImagePath = path.join(__dirname, `generated_${state.timeSlot.toLowerCase()}_${Date.now()}.png`);
    try {
      if (imageData?.b64_json) {
        fs.writeFileSync(generatedImagePath, Buffer.from(imageData.b64_json, "base64"));
      } else if (imageUrl) {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
        fs.writeFileSync(generatedImagePath, response.data);
      } else {
        throw new Error("OpenAI did not return an image url or b64_json");
      }
      
      // Kiểm tra file tồn tại và có size
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
        generatedImagePath: state.imagePath, // Dùng ảnh gốc
      };
    }
  } catch (error) {
    console.error(`=> ❌ Lỗi ${IMAGE_MODEL}: ${error.message}`);
    console.log(`=> Fallback: Sử dụng ảnh gốc từ template/stocks`);
    return {
      generatedImageUrl: "fallback",
      generatedImagePath: state.imagePath, // Fallback to original image
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
    if (!fs.existsSync(state.generatedImagePath)) {
      throw new Error(`File không tồn tại: ${state.generatedImagePath}`);
    }
    fullImage = await Jimp.read(state.generatedImagePath);
  } catch (err) {
    console.error(`❌ Không thể đọc ảnh: ${err.message}`);
    throw err;
  }

  const w = fullImage.bitmap.width;
  const h = fullImage.bitmap.height;
  console.log(`=> Ảnh được tải (${w}x${h}px)`);

  // --- BƯỚC 1: Obfuscate nhãn Jagermeister ---
  try {
    const blurSize = Math.min(150, Math.floor(w / 4));
    const startX = Math.max(0, w - blurSize - 30);
    const startY = 30;

    if (startX + blurSize <= w && startY + blurSize <= h) {
      const pixelatedRegion = fullImage
        .clone()
        .crop(startX, startY, blurSize, blurSize)
        .blur(12);

      fullImage.composite(pixelatedRegion, startX, startY);
      console.log(`=> Đã obfuscate vùng nhãn`);
    }
  } catch (obfuscateErr) {
    console.log(`-> Cảnh báo: Không thể obfuscate (${obfuscateErr.message}), tiếp tục...`);
  }

  // --- BƯỚC 2: Thêm watermark ---
  const lowercaseWatermarkPath = path.join(__dirname, "watermark.png");
  const uppercaseWatermarkPath = path.join(__dirname, "watermark.PNG");
  const watermarkPath = fs.existsSync(lowercaseWatermarkPath) ? lowercaseWatermarkPath : uppercaseWatermarkPath;

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
    const watermark = await Jimp.read(fs.existsSync(watermarkPath) ? watermarkPath : lowercaseWatermarkPath);

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

  const outputPath = path.join(__dirname, `processed_${state.timeSlot.toLowerCase()}_${Date.now()}.jpg`);
  try {
    await fullImage.writeAsync(outputPath);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error("File output không được tạo");
    }
    
    const processedSize = fs.statSync(outputPath).size;
    console.log(`=> ✅ Ảnh đã được xử lý (${(processedSize / 1024).toFixed(1)}KB): ${outputPath}`);
  } catch (writeErr) {
    console.error(`❌ Lỗi ghi file: ${writeErr.message}`);
    throw writeErr;
  }

  return {
    processedImagePath: outputPath,
  };
}

// =========================================================================
// 8. NODE: KIỂM SOÁT CHẤT LƯỢNG ẢNH
// =========================================================================
async function nodeQualityCheckImage(state) {
  console.log("--- NODE: Kiểm Soát Chất Lượng Ảnh ---");

  if (!fs.existsSync(state.processedImagePath)) {
    throw new Error(`Ảnh không tồn tại: ${state.processedImagePath}`);
  }

  const stats = fs.statSync(state.processedImagePath);
  if (stats.size < 10000) {
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
    const graphApiBase = "https://graph.facebook.com/v17.0";
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
    publish: "publish",
    generate_image: "generate_image",
  })
  .addEdge("publish", END);

const app = workflow.compile();

// =========================================================================
// 12. CHẠY WORKFLOW
// =========================================================================
async function runAllTests() {
  console.log(`\n🚀 BẮT ĐẦU CHẠY KIỂM THỬ: ${CAPTION_MODEL} CAPTION + ${IMAGE_MODEL} IMAGES + FACEBOOK POSTING\n`);
  console.log("💰 Chi phí ước tính: ~$0.04/post (caption + image)\n");

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
