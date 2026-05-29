import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGE_MODEL = "gpt-image-2";
const IMAGE_SIZE = "1536x1024";
const IMAGE_QUALITY = "medium";
const INPUT_FILENAME = "Jagermeister_Winter_Retro_Edition.png";
const INPUT_PATH = path.join(__dirname, "template", INPUT_FILENAME);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Thiếu OPENAI_API_KEY trong môi trường. Hãy đặt OPENAI_API_KEY trước khi chạy.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(productName) {
  return `Ultra realistic commercial photography of the ORIGINAL product from the reference image, keep the exact same product identity, preserve the original product shape, preserve original packaging design, preserve original logo placement, preserve original colors and proportions, maintain all primary branding elements.

Product name: ${productName}. Use the file name to reinforce the product's identity in the generated image.
Preserve the original image orientation and aspect ratio. Keep horizontal images horizontal, do not force a vertical crop.
Generate a fresh premium background and lighting while keeping the product framing consistent with the source.

Do NOT redesign the product,
do NOT replace the object,
do NOT generate a different item,
do NOT alter the product category.

Branding Protection:
Replace all visible “Jägermeister” branding with fictional premium liquor branding using random but realistic-looking text. Generate a new non-existent wordmark in a similar visual style and placement while preserving the bottle shape, label structure, deer emblem, and retro aesthetic. Do not use the original trademark or close spelling variations. The replacement text should appear naturally printed on the label and fully integrated into the packaging design.

Final Quality:
1536x1024, photorealistic, magazine-quality advertising photography, premium commercial realism.`;
}

async function run() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Không tìm thấy file input: ${INPUT_PATH}`);
  }

  const productName = path
    .basename(INPUT_FILENAME, path.extname(INPUT_FILENAME))
    .replace(/[-_]+/g, " ")
    .trim();
  const prompt = buildPrompt(productName);
  console.log("Prompt:\n", prompt);

  const referenceImage = await toFile(fs.createReadStream(INPUT_PATH), path.basename(INPUT_PATH), {
    type: "image/jpeg",
  });

  const result = await openai.images.edit({
    model: IMAGE_MODEL,
    image: referenceImage,
    prompt,
    n: 1,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
  });

  const output = result.data?.[0];
  if (!output) {
    throw new Error("OpenAI không trả về ảnh.");
  }

  const outPath = path.join(
    __dirname,
    `test_output_${productName.replace(/\s+/g, "_")}_${Date.now()}.png`,
  );
  if (output.b64_json) {
    fs.writeFileSync(outPath, Buffer.from(output.b64_json, "base64"));
    console.log(`Ảnh đã lưu: ${outPath}`);
  } else if (output.url) {
    const response = await axios.get(output.url, { responseType: "arraybuffer", timeout: 30000 });
    fs.writeFileSync(outPath, response.data);
    console.log(`Ảnh đã tải về và lưu: ${outPath}`);
  } else {
    throw new Error("Không tìm thấy b64_json hoặc url trong kết quả ảnh.");
  }
}

run().catch((err) => {
  console.error("Lỗi khi tạo ảnh thử nghiệm:", err.message || err);
  process.exit(1);
});
