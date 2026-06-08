import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSkill(filename) {
  return fs.readFileSync(path.join(__dirname, filename), "utf8");
}

function imageToDataUrl(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const b64 = fs.readFileSync(imagePath).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function extractJson(text) {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

const bannedCaptionPhrases = [
  "vibe",
  "vibes",
  "chill",
  "khám phá",
  "hành trình",
  "tuyệt hảo",
  "chiêu mộ",
  "đông đảo",
  "nâng tầm",
  "đẳng cấp",
  "trải nghiệm khó quên",
  "không thể bỏ lỡ",
  "sự lựa chọn hoàn hảo",
  "thưởng thức trọn vẹn",
  "tinh hoa",
  "bùng nổ vị giác",
  "lựa chọn số một",
];

export const captionSkill = {
  name: "image_first_natural_vietnamese_facebook_caption_skill",
  description:
    "Analyze the actual product image first, optionally research unclear references, then write a short natural Vietnamese Facebook caption without AI-ish wording.",
  bannedPhrases: bannedCaptionPhrases,

  async analyzeImageContext({
    openai,
    imagePath,
    filenameProductName = "",
    timeSlot = "",
    model = "gpt-4o-mini",
  } = {}) {
    const skill = readSkill("image-caption-context.md");
    const dataUrl = imageToDataUrl(imagePath);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${skill}\n\nfilenameProductName: ${filenameProductName || "unknown"}\ntimeSlot: ${timeSlot || "unknown"}`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 450,
    });

    const raw = response.choices?.[0]?.message?.content || "";
    const parsed = extractJson(raw);

    return parsed || {
      mainProduct: filenameProductName || "sản phẩm Jager",
      visibleItems: [],
      notableDetails: [],
      mood: "ảnh sản phẩm tối màu, thiên về trưng bày",
      sellingAngles: ["để decor", "làm quà hoặc sưu tầm"],
      captionHint: "viết caption ngắn, tập trung vào món đang thấy trong ảnh",
      needsWebResearch: false,
      webSearchQuery: "",
    };
  },

  async researchIfNeeded({ openai, captionContext, model = "gpt-4o-mini" } = {}) {
    if (!captionContext?.needsWebResearch || !captionContext?.webSearchQuery) return "";
    if (process.env.ENABLE_CAPTION_WEB_RESEARCH !== "true") return "";

    // Requires an OpenAI SDK version that supports Responses API + web_search_preview.
    // If unavailable, the script safely falls back to image-only captioning.
    if (!openai.responses?.create) return "";

    try {
      const response = await openai.responses.create({
        model,
        tools: [{ type: "web_search_preview" }],
        input: `Search briefly for this Jagermeister-related collectible/product reference and summarize only useful caption facts in Vietnamese. Do not include prices or unsupported rarity claims. Query: ${captionContext.webSearchQuery}`,
      });
      return response.output_text?.trim() || "";
    } catch (error) {
      console.warn(`[caption-skill] Web research skipped: ${error.message}`);
      return "";
    }
  },

  buildPrompt({ productName = "", timeSlot = "", captionContext = {}, webResearch = "" } = {}) {
    const skill = readSkill("natural-vietnamese-facebook-caption.md");
    return `
${skill}

INPUT DATA:
productName: ${productName || "unknown"}
timeSlot: ${timeSlot || "unknown"}
captionContext JSON:
${JSON.stringify(captionContext, null, 2)}
${webResearch ? `\nwebResearch:\n${webResearch}` : ""}

Write the final caption now. Remember: do not use the words vibe, vibes, chill, gu.
`.trim();
  },

  isGoodCaption(caption = "") {
    const normalized = caption.toLowerCase();
    const hasBannedPhrase = bannedCaptionPhrases.some((word) => normalized.includes(word));
    const tooLong = caption.length > 260;
    const tooManyHashtags = (caption.match(/#/g) || []).length > 1;
    const tooManyEmojis = (caption.match(/[\p{Extended_Pictographic}]/gu) || []).length > 3;
    const hasTitle = /^caption\s*[:：]/i.test(caption.trim()) || /^bài viết\s*[:：]/i.test(caption.trim());
    return !hasBannedPhrase && !tooLong && !tooManyHashtags && !tooManyEmojis && !hasTitle;
  },
};
