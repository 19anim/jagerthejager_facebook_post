import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGE_MODEL = "gpt-image-2";

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

const brandingProtection = [
  "ONLY apply extremely subtle blur on tiny secondary label text",
  "slight optical softness on micro typography only",
  "minimal realistic reflection distortion over tiny text details",
  "very subtle focus falloff on tiny secondary lettering",
  "slight natural glare over small typography elements",
  "keep the logo readable while softening microscopic text details",
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

function generateImagePrompt(extraScene = "") {
  const lens = randomItem(lenses);
  const iso = randomItem(["100", "125", "160", "200", "320"]);
  const shutter = randomItem(["1/125", "1/160", "1/200", "1/250", "1/320"]);

  return `
Ultra realistic commercial photography of the ORIGINAL product from the reference image, keep the exact same product identity, preserve the original product shape, preserve original packaging design, preserve original logo placement, preserve original colors and proportions, maintain all primary branding elements

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
retain the main logo and branding visibility,
keep the logo readable,
${randomItem(brandingProtection)},
do not remove the logo

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

function selectReferenceImage() {
  const preferredImagePath = path.join(__dirname, "template", "1.jpg");
  if (fs.existsSync(preferredImagePath)) {
    return preferredImagePath;
  }

  const folderName = path.join(__dirname, "template");
  const files = fs.readdirSync(folderName).filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  if (files.length === 0) {
    throw new Error("No reference images found in template/");
  }

  return path.join(folderName, files[0]);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY. Run with: node --env-file=.env test_image_prompt_once.js",
    );
  }

  const referenceImagePath = selectReferenceImage();
  const prompt = generateImagePrompt();

  console.log(`Reference image: ${referenceImagePath}`);
  console.log(`Prompt preview: ${prompt.slice(0, 220)}...`);
  console.log(`Creating one image with ${IMAGE_MODEL}...`);

  const referenceImage = await toFile(
    fs.createReadStream(referenceImagePath),
    path.basename(referenceImagePath),
    { type: referenceImagePath.toLowerCase().endsWith(".jpg") ? "image/jpeg" : "image/png" },
  );

  const imageResponse = await openai.images.edit({
    model: IMAGE_MODEL,
    image: referenceImage,
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "medium",
  });

  const imageData = imageResponse.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("OpenAI did not return b64_json image data");
  }

  const outputPath = path.join(__dirname, `generated_prompt_test_${Date.now()}.png`);
  fs.writeFileSync(outputPath, Buffer.from(imageData.b64_json, "base64"));

  const stats = fs.statSync(outputPath);
  console.log(`Generated image: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)}KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
