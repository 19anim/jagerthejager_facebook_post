import { Annotation, StateGraph, END } from "@langchain/langgraph";
import OpenAI, { toFile } from "openai";
import Jimp from "jimp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

// =========================================================================
// KHỞI TẠO
// =========================================================================
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CAPTION_MODEL = "gpt-4o-mini";
const IMAGE_MODEL = "gpt-image-2";
const IMAGE_SIZE = "1536x1024";
const IMAGE_QUALITY = "medium";

const FOOTER_PAGE_1 = `\n\n--- 
Sđt - 0927183879 - Ân
https://jagerthejagershop.netlify.app
IG: jagerthejager
Tiktok: odayiembanthuochoconhuou
Page facebook chính : https://www.facebook.com/odayiembanthuochoconhuou
Facebook: https://www.facebook.com/19.anim`;

const FOOTER_PAGE_2 = `\n\n--- 
Sđt - 0927183879 - Ân
https://jagerthejagershop.netlify.app
IG: jagerthejager
Tiktok: odayiembanthuochoconhuou
Page facebook phụ: https://www.facebook.com/jagerthejagerxop
Facebook: https://www.facebook.com/19.anim`;

// =========================================================================
// ĐỊNH NGHĨA STATE
// =========================================================================
const GraphState = Annotation.Root({
  timeSlot: Annotation(),
  imagePath: Annotation(),
  productName: Annotation(),
  caption: Annotation(),
  captionApproved: Annotation(),
  generatedImageUrl: Annotation(),
  generatedImagePath: Annotation(),
  processedImagePath: Annotation(),
  qualityApproved: Annotation(),
  attempts: Annotation(),
});

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
Replace all visible "Jägermeister" branding with fictional premium liquor branding using random but realistic-looking text. Generate a new non-existent wordmark in a similar visual style and placement while preserving the bottle shape, label structure, deer emblem, and retro aesthetic. Do not use the original trademark or close spelling variations. The replacement text should appear naturally printed on the label and fully integrated into the packaging design.

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
// WORKFLOW NODES
// =========================================================================

async function nodeSelectImage(state) {
  console.log(`\n[${state.timeSlot}] Starting post generation workflow`);
  console.log(`[${state.timeSlot}] Selecting reference image...`);

  const folderName = path.join(
    __dirname,
    state.timeSlot === "MORNING"
      ? process.env.TEMPLATE_FOLDER || "template"
      : process.env.STOCKS_FOLDER || "stocks",
  );

  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
    throw new Error(`Missing folder: ${folderName}`);
  }

  const files = fs.readdirSync(folderName).filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
  if (files.length === 0) throw new Error(`No images found in ${folderName}`);

  const randomFile = files[Math.floor(Math.random() * files.length)];
  const selectedPath = path.join(folderName, randomFile);
  const productName = path
    .basename(randomFile, path.extname(randomFile))
    .replace(/[-_]+/g, " ")
    .trim();

  console.log(`[${state.timeSlot}] ✓ Selected: ${randomFile} (${productName})`);

  return {
    imagePath: selectedPath,
    productName,
    attempts: 0,
  };
}

async function nodeGenerateCaption(state) {
  console.log(`[${state.timeSlot}] Generating caption (attempt ${state.attempts + 1})...`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const productName = state.productName || "product";
  const prompt = `Role: You are a Jagermeister fanpage admin.
Expect: Write a natural, witty, 2-3 sentence caption about "${productName}". No AI-ish phrases.
Write in Vietnamese, be conversational and persuasive. Use emojis if fitting.
AVOID: 'khám phá', 'hành trình', 'tuyệt hảo', 'chiêu mộ', 'đông đảo'
Just reply with the caption, no explanation.`;

  const message = await openai.chat.completions.create({
    model: CAPTION_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 150,
  });

  const caption = message.choices[0].message.content.trim();
  console.log(`[${state.timeSlot}] ✓ Caption: ${caption.substring(0, 60)}...`);

  return {
    caption,
    attempts: state.attempts + 1,
  };
}

async function nodeQualityCheckCaption(state) {
  console.log(`[${state.timeSlot}] Checking caption quality...`);

  const caption = state.caption.toLowerCase();
  const bannedKeywords = ["khám phá", "hành trình", "tuyệt hảo", "chiêu mộ", "đông đảo"];
  const containsAIWord = bannedKeywords.some((word) => caption.includes(word));

  if (!containsAIWord && state.caption.length <= 150) {
    console.log(`[${state.timeSlot}] ✓ Caption passed quality check`);
    return { captionApproved: true };
  }

  if (state.attempts >= 2) {
    console.log(`[${state.timeSlot}] ⚠ Caption accepted after 2 retries`);
    return { captionApproved: true };
  }

  console.log(`[${state.timeSlot}] ✗ Caption failed - retrying...`);
  return { captionApproved: false };
}

async function nodeGenerateImage(state) {
  console.log(`[${state.timeSlot}] Generating image...`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const imagePrompt = generateImagePrompt("", state.productName);

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

    const generatedImagePath = path.join(
      __dirname,
      `generated_${state.timeSlot.toLowerCase()}_${Date.now()}.png`,
    );

    if (imageData?.b64_json) {
      fs.writeFileSync(generatedImagePath, Buffer.from(imageData.b64_json, "base64"));
    } else if (imageUrl) {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
      fs.writeFileSync(generatedImagePath, response.data);
    } else {
      throw new Error("No image data returned");
    }

    if (!fs.existsSync(generatedImagePath)) {
      throw new Error("Failed to save image");
    }

    const fileSize = fs.statSync(generatedImagePath).size;
    console.log(`[${state.timeSlot}] ✓ Image generated (${(fileSize / 1024).toFixed(1)}KB)`);

    return {
      generatedImageUrl: imageUrl || "b64_json",
      generatedImagePath,
    };
  } catch (error) {
    console.error(`[${state.timeSlot}] ✗ Image generation failed: ${error.message}`);
    throw error;
  }
}

async function nodeProcessImage(state) {
  console.log(`[${state.timeSlot}] Processing image...`);

  let fullImage;
  try {
    fullImage = await Jimp.read(state.generatedImagePath);
  } catch (err) {
    throw new Error(`Cannot read image: ${err.message}`);
  }

  const w = fullImage.bitmap.width;
  const h = fullImage.bitmap.height;

  // Obfuscate label
  try {
    const blurSize = Math.min(150, Math.floor(w / 4));
    const startX = Math.max(0, w - blurSize - 30);
    const startY = 30;

    if (startX + blurSize <= w && startY + blurSize <= h) {
      const pixelatedRegion = fullImage.clone().crop(startX, startY, blurSize, blurSize).blur(12);
      fullImage.composite(pixelatedRegion, startX, startY);
      console.log(`[${state.timeSlot}] ✓ Label obfuscated`);
    }
  } catch (err) {
    console.log(`[${state.timeSlot}] ⚠ Could not obfuscate: ${err.message}`);
  }

  // Add watermark
  const watermarkPath = path.join(__dirname, "watermark.png");
  if (fs.existsSync(watermarkPath)) {
    try {
      const watermark = await Jimp.read(watermarkPath);
      watermark.resize(Math.floor(fullImage.bitmap.width * 0.15), Jimp.AUTO);
      fullImage.composite(
        watermark,
        fullImage.bitmap.width - watermark.bitmap.width - 20,
        fullImage.bitmap.height - watermark.bitmap.height - 20,
      );
      console.log(`[${state.timeSlot}] ✓ Watermark added`);
    } catch (err) {
      console.log(`[${state.timeSlot}] ⚠ Could not add watermark: ${err.message}`);
    }
  }

  const outputPath = path.join(
    __dirname,
    `processed_${state.timeSlot.toLowerCase()}_${Date.now()}.jpg`,
  );
  await fullImage.writeAsync(outputPath);

  console.log(`[${state.timeSlot}] ✓ Image processed`);

  return {
    processedImagePath: outputPath,
  };
}

async function nodeQualityCheckImage(state) {
  console.log(`[${state.timeSlot}] Checking image quality...`);

  if (!fs.existsSync(state.processedImagePath)) {
    throw new Error(`Image not found: ${state.processedImagePath}`);
  }

  const stats = fs.statSync(state.processedImagePath);
  if (stats.size < 10000) {
    console.log(`[${state.timeSlot}] ✗ Image too small`);
    return { qualityApproved: false };
  }

  console.log(
    `[${state.timeSlot}] ✓ Image quality check passed (${(stats.size / 1024).toFixed(1)}KB)`,
  );
  return { qualityApproved: true };
}

async function savePostArtifacts(state) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const dateFolder = `${dd}_${mm}_${yyyy}`;

  const slot = state.timeSlot || "UNKNOWN";
  const baseDir = path.join(__dirname, process.env.POSTS_FOLDER || "posts", dateFolder, slot);
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
  fs.copyFileSync(srcImage, destImage);

  const captionFile = path.join(baseDir, `${nameSafe}_${timeSuffix}.txt`);
  fs.writeFileSync(captionFile, state.caption || "");

  console.log(`[${state.timeSlot}] ✓ Artifacts saved to: ${baseDir}`);
}

async function nodePublishPost(state) {
  console.log(`[${state.timeSlot}] Publishing to Facebook...`);

  // Step 1: Upload photo and get photo ID
  async function uploadPhoto(pageId, token, imagePath, maxTries = 3) {
    for (let i = 0; i < maxTries; i++) {
      try {
        const form = new FormData();
        form.append("source", fs.createReadStream(imagePath));
        form.append("published", "true");
        form.append("access_token", token);

        console.log(
          `[${state.timeSlot}] Uploading photo to page ${pageId}... (attempt ${i + 1}/${maxTries})`,
        );

        const response = await axios.post(
          `https://graph.facebook.com/v25.0/${pageId}/photos`,
          form,
          {
            headers: { ...form.getHeaders() },
            timeout: 120000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          },
        );

        const photoId = response.data?.id;
        if (!photoId) throw new Error("No photo ID returned from upload");

        console.log(`[${state.timeSlot}] ✓ Photo uploaded successfully. Photo ID: ${photoId}`);
        return { success: true, photoId, data: response.data };
      } catch (err) {
        console.warn(
          `[${state.timeSlot}] ⚠ Photo upload retry ${i + 1}/${maxTries} failed: ${err.message}`,
        );
        if (i < maxTries - 1) await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return { success: false, error: new Error("Max photo upload retries exceeded") };
  }

  // Step 2: Create post with the uploaded photo
  async function createPostWithPhoto(pageId, token, photoId, caption, maxTries = 3) {
    for (let i = 0; i < maxTries; i++) {
      try {
        const attachedMedia = JSON.stringify([{ media_fbid: photoId }]);

        const form = new FormData();
        form.append("message", caption);
        form.append("attached_media", attachedMedia);
        form.append("access_token", token);
        form.append("published", "true");

        console.log(
          `[${state.timeSlot}] Creating post with photo ID: ${photoId}... (attempt ${i + 1}/${maxTries})`,
        );
        console.log(`[${state.timeSlot}] Caption: ${caption.substring(0, 80)}...`);

        const response = await axios.post(`https://graph.facebook.com/v25.0/${pageId}/feed`, form, {
          headers: { ...form.getHeaders() },
          timeout: 60000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        const postId = response.data?.id;
        if (!postId) throw new Error("No post ID returned from feed creation");

        console.log(`[${state.timeSlot}] ✓ Post created successfully. Post ID: ${postId}`);
        return { success: true, postId, data: response.data };
      } catch (err) {
        console.warn(
          `[${state.timeSlot}] ⚠ Post creation retry ${i + 1}/${maxTries} failed: ${err.message}`,
        );
        if (i < maxTries - 1) await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return { success: false, error: new Error("Max post creation retries exceeded") };
  }

  async function tryPublishWithRetries(pageId, token, imagePath, caption, maxTries = 3) {
    // Step 1: Upload photo first
    const uploadResult = await uploadPhoto(pageId, token, imagePath, maxTries);
    if (!uploadResult.success) {
      return uploadResult;
    }

    // Step 2: Create post with the uploaded photo
    const postResult = await createPostWithPhoto(
      pageId,
      token,
      uploadResult.photoId,
      caption,
      maxTries,
    );

    if (!postResult.success) {
      return postResult;
    }

    return {
      success: true,
      data: {
        photo_id: uploadResult.photoId,
        post_id: postResult.postId,
        ...uploadResult.data,
        ...postResult.data,
      },
    };
  }

  const results = await Promise.all([
    tryPublishWithRetries(
      process.env.FB_PAGE_1_ID,
      process.env.FB_PAGE_1_TOKEN,
      state.processedImagePath,
      (state.caption || "") + FOOTER_PAGE_1,
      3,
    ),
    tryPublishWithRetries(
      process.env.FB_PAGE_2_ID,
      process.env.FB_PAGE_2_TOKEN,
      state.processedImagePath,
      (state.caption || "") + FOOTER_PAGE_2,
      3,
    ),
  ]);

  const pages = [
    results[0].success
      ? { page: 1, success: true }
      : { page: 1, error: true, msg: results[0].error?.message },
    results[1].success
      ? { page: 2, success: true }
      : { page: 2, error: true, msg: results[1].error?.message },
  ];

  const allSuccess = pages.every((p) => p.success);
  const someFailed = pages.some((p) => p.error);

  pages.forEach((p) => {
    if (p.success) {
      console.log(`[${state.timeSlot}] ✓ Page ${p.page} published successfully`);
    } else {
      console.error(`[${state.timeSlot}] ✗ Page ${p.page} failed: ${p.msg}`);
    }
  });

  if (allSuccess) {
    console.log(`[${state.timeSlot}] ✓ All pages published!`);
    await savePostArtifacts(state);
  } else if (someFailed) {
    console.log(`[${state.timeSlot}] ⚠ Partial success`);
  } else {
    console.log(`[${state.timeSlot}] ✗ All pages failed`);
  }

  return {};
}

function decideCaption(state) {
  return state.captionApproved ? "generate_image" : "generate_caption";
}

function decideImage(state) {
  return state.qualityApproved ? "publish" : "generate_image";
}

// =========================================================================
// WORKFLOW
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
// MAIN
// =========================================================================

async function main() {
  const timeSlot = process.argv[2] || "MORNING";
  console.log(`\n🚀 Starting Facebook Auto Post [${timeSlot}]\n`);

  try {
    await app.invoke({ timeSlot });
    console.log(`\n✅ ${timeSlot} slot completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ ${timeSlot} slot failed: ${error.message}\n`);
    process.exit(1);
  }
}

main();
