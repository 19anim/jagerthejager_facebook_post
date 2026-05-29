import { Annotation, StateGraph, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import Jimp from "jimp";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

// =========================================================================
// 1. ĐỊNH NGHĨA TRẠNG THÁI (STATE)
// =========================================================================
const GraphState = Annotation.Root({
  timeSlot: Annotation(),
  imagePath: Annotation(),
  processedImagePath: Annotation(),
  caption: Annotation(),
  qualityApproved: Annotation(),
  attempts: Annotation(),
});

const FOOTER_PAGE_1 = "\n\n--- \n🥃 Ghé Page 1 để săn Jager giá tốt nhé anh em!";
const FOOTER_PAGE_2 = "\n\n--- \n🔥 Page 2 luôn sẵn hàng Jagermeister chính hãng!";

// =========================================================================
// HÀM ĐĂNG BÀI NHÁP CHUẨN multipart/form-data (upload file trực tiếp lên Graph API)
// =========================================================================
async function createFacebookDraftPost({ pageId, accessToken, imagePath, caption }) {
  try {
    // --- BƯỚC 1: Tải ảnh ẩn lên hệ thống bằng multipart/form-data ---
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

    // Kiểm tra định dạng phản hồi để bắt lỗi sớm
    if (typeof photoResponse.data === "string" && photoResponse.data.includes("<!DOCTYPE html>")) {
      throw new Error("Facebook vẫn trả về trang web HTML lỗi. Hãy kiểm tra lại hiệu lực Token.");
    }

    const photoId = photoResponse.data?.id;
    if (!photoId) {
      throw new Error(`Facebook không cấp ID ảnh. Phản hồi: ${JSON.stringify(photoResponse.data)}`);
    }
    console.log(`[Bước 1/2] Đã lấy mã định danh ảnh ngầm thành công: ${photoId}`);

    // --- BƯỚC 2: Tạo bài viết nháp chính thức kết nối kèm mã ID ảnh vừa lấy ---
    const feedUrl = `${graphApiBase}/${pageId}/feed`;

    console.log(`[Bước 2/2] Khởi tạo bài đăng DRAFT trên Meta Content Library...`);
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

// =========================================================================
// 2. CÁC NODE XỬ LÝ LANGGRAPH (Giữ nguyên luồng Graph logic)
// =========================================================================
async function nodeSelectImage(state) {
  console.log(`\n=== CA TEST: ${state.timeSlot} ===`);
  console.log("--- NODE: Chọn Ảnh ---");
  const folderName = state.timeSlot === "MORNING" ? "./template" : "./stocks";

  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
    throw new Error(
      `Thư mục '${folderName}' chưa tồn tại. Hãy bỏ ít nhất 1 tấm ảnh vào đó rồi chạy lại.`,
    );
  }

  const files = fs.readdirSync(folderName).filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
  if (files.length === 0) throw new Error(`Thư mục ${folderName} đang trống! Hãy bỏ ảnh test vào.`);

  const randomFile = files[Math.floor(Math.random() * files.length)];
  return {
    imagePath: path.join(folderName, randomFile),
    attempts: 0,
  };
}

async function nodeProcessImage(state) {
  console.log("--- NODE: Xử lý Đồ Họa Ảnh ---");
  const image = await Jimp.read(state.imagePath);

  if (!fs.existsSync("./watermark.png")) {
    console.log("-> Chưa tìm thấy watermark.png, hệ thống tự tạo logo test tạm thời.");
    const dummyWatermark = new Jimp(100, 40, 0xff0000ff);
    await dummyWatermark.writeAsync("./watermark.png");
  }

  const watermark = await Jimp.read("./watermark.png");
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  image.blur(6);

  watermark.resize(w * 0.25, Jimp.AUTO);
  image.composite(watermark, w - watermark.bitmap.width - 20, h - watermark.bitmap.height - 20);

  const outputPath = `./output_${state.timeSlot.toLowerCase()}.jpg`;
  await image.writeAsync(outputPath);

  return { processedImagePath: outputPath };
}

async function nodeGenerateCaption(state) {
  console.log(`--- NODE: AI Nghĩ Caption (Lần thử: ${state.attempts + 1}) ---`);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Thiếu GEMINI_API_KEY trong môi trường (env)!");
  }

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const imageBuffer = fs.readFileSync(state.imagePath).toString("base64");

  const prompt = `Bạn là một chủ shop bán rượu Jagermeister, viết bài bằng tiếng Việt văn phong hài hước, ngắn gọn dưới 20 từ. 
  Không dùng các từ sáo rỗng như 'khám phá', 'tuyệt hảo'. Viết tự nhiên như người thật đăng status bán hàng vui vẻ.`;

  const message = new HumanMessage({
    content: [
      { type: "text", text: prompt },
      { type: "image_url", image_url: `data:image/jpeg;base64,${imageBuffer}` },
    ],
  });

  const response = await model.invoke([message]);
  return {
    caption: response.content.trim(),
    attempts: state.attempts + 1,
  };
}

async function nodeQualityCheck(state) {
  console.log("--- NODE: Kiểm Soát Chất Lượng ---");
  const caption = state.caption.toLowerCase();
  const bannedKeywords = ["khám phá", "hành trình", "tuyệt hảo"];
  const containsAIWord = bannedKeywords.some((word) => caption.includes(word));

  if (!containsAIWord && state.caption.length <= 150) {
    console.log("=> CHẤT LƯỢNG ĐẠT BÀI ĐĂNG!");
    return { qualityApproved: true };
  }

  // SỬA TẠI ĐÂY: Khi test dưới máy, chỉ cho phép thử tối đa 1 lần để tránh tốn Quota 429
  if (state.attempts >= 1) {
    console.log("=> Tránh quá tải hạn mức API, chấp nhận bản hiện tại để đăng.");
    return { qualityApproved: true };
  }

  console.log("=> CẢNH BÁO: Caption dính từ khóa AI. Đang thử lại...");
  return { qualityApproved: false };
}

async function nodePublishPost(state) {
  console.log("--- NODE: Đăng Bài Dạng DRAFT Chuẩn Lên Meta ---");

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
        console.error(`\n❌ LỖI KHỞI TẠO DRAFT TẠI PAGE ${res.page}: ${res.msg}`);
      }
    });

    if (!results.some((res) => res?.error)) {
      console.log(
        `🎉 HOÀN THÀNH: Bản nháp chuẩn đã hiển thị trên Meta Business Suite ca ${state.timeSlot}!`,
      );
    }
  } catch (globalError) {
    console.error("❌ Lỗi hệ thống mạch Graph:", globalError);
  }
  return {};
}

// =========================================================================
// 3. ĐIỀU HƯỚNG GRAPH
// =========================================================================
function decideNextStep(state) {
  return state.qualityApproved ? "publish" : "generate_caption";
}

const workflow = new StateGraph(GraphState)
  .addNode("select_image", nodeSelectImage)
  .addNode("process_image", nodeProcessImage)
  .addNode("generate_caption", nodeGenerateCaption)
  .addNode("quality_check", nodeQualityCheck)
  .addNode("publish", nodePublishPost)

  .addEdge("__start__", "select_image")
  .addEdge("select_image", "process_image")
  .addEdge("process_image", "generate_caption")
  .addEdge("generate_caption", "quality_check")
  .addConditionalEdges("quality_check", decideNextStep, {
    publish: "publish",
    generate_caption: "generate_caption",
  })
  .addEdge("publish", END);

const app = workflow.compile();

async function runAllTests() {
  console.log("🚀 BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG LANGGRAPH DƯỚI MÁY...");
  await app.invoke({ timeSlot: "MORNING" });
  await app.invoke({ timeSlot: "NOON" });
  console.log(
    "\n Thử nghiệm kết thúc! Hãy mở Meta Business Suite của 2 Page để check phần Bản Nháp (Draft).",
  );
}

runAllTests().catch((err) => console.error("Lỗi thực thi test tổng thể:", err));
