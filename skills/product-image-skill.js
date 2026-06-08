import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSkill(filename) {
  return fs.readFileSync(path.join(__dirname, filename), "utf8");
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueRandomItems(arr, count) {
  const copy = [...arr];
  const picked = [];
  while (copy.length && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
}

const sceneThemes = [
  "late-night Vietnamese street bar table, wet pavement reflections, practical neon far behind",
  "small premium apartment party corner, real furniture, half-used glasses, casual clutter",
  "dark wooden bar counter with believable scratches, condensation marks, and warm practical lights",
  "outdoor night market table, background people as soft silhouettes, documentary lifestyle mood",
  "collector shelf inside a dim room, mixed objects around it, imperfect real-life arrangement",
  "restaurant private room, warm table lamp, plates and glasses naturally out of focus",
  "industrial concrete corner, metal tray, natural dust and texture, not a clean studio backdrop",
  "car trunk picnic setup at night, soft city lights in the background, candid lifestyle atmosphere",
  "kitchen counter before a party, ice bucket and unopened snacks blurred in the background",
  "balcony table at blue hour, city bokeh, real ambient light and mild wind movement",
  "low-lit lounge sofa table, leather texture, practical lamps, realistic background separation",
  "messy but tasteful product prep table, receipt, keys, lighter, and glass edges in the periphery",
];

const cameraBodies = ["Sony A7R V", "Canon EOS R5", "Nikon Z8", "Leica SL2", "Fujifilm GFX 100S"];

const lenses = [
  { focal: "24mm", aperture: "f/2.8", feel: "environmental product shot with perspective" },
  { focal: "28mm", aperture: "f/2.8", feel: "close lifestyle angle with visible setting" },
  { focal: "35mm", aperture: "f/1.8", feel: "natural editorial perspective" },
  { focal: "50mm", aperture: "f/1.6", feel: "premium commercial compression" },
  { focal: "85mm", aperture: "f/2", feel: "soft background separation without plastic bokeh" },
];

const cameraAngles = [
  "three-quarter angle from slightly above, product rotated about 18 degrees away from camera",
  "low three-quarter angle from the left side, not centered, with subtle foreground blur",
  "over-the-table angle, camera tilted down about 25 degrees, product placed off-center",
  "side-biased editorial angle, product facing slightly away, label still readable but not flat",
  "handheld candid commercial angle, minor natural tilt, realistic perspective distortion",
  "close three-quarter crop with part of the product near the edge of frame",
  "diagonal tabletop composition, product on the lower third, background leading lines",
  "slightly top-down 45-degree product angle, natural tabletop context visible",
  "low angle through foreground glassware, product sharp behind a realistic blurred object",
  "asymmetric rule-of-thirds framing, product not perfectly centered, believable camera height",
];

const compositions = [
  "editorial product photography with negative space for social feed",
  "candid premium lifestyle ad, not a flat e-commerce packshot",
  "realistic bar-table commercial composition with layered foreground and background",
  "premium social media product shot that feels photographed, not rendered",
  "magazine-style lifestyle composition with imperfect human placement",
  "high-end but believable Facebook post visual, natural props and real-world scale",
];

const lightings = [
  "single warm practical key light plus soft cool ambient fill, real shadow falloff",
  "window-like side light with gentle rim light, natural shadow transitions",
  "bar neon spill in the far background, warm highlight on glass, controlled reflections",
  "low-key tungsten table light, imperfect reflections, believable specular highlights",
  "soft overhead practical light mixed with background bokeh, no over-polished CGI shine",
  "blue-hour ambient light with warm foreground practical lamp contrast",
  "cinematic side light from 45 degrees, visible contact shadows on the table",
];

const backgroundRules = [
  "background must be a real place with depth, not a generic gradient or repeated luxury wall",
  "avoid symmetrical studio backgrounds unless explicitly necessary",
  "include subtle real-life imperfections: dust, condensation, tiny scratches, table texture, uneven reflections",
  "make the background different from a typical dark luxury backdrop; use contextual lifestyle details",
  "keep background objects softly blurred and secondary; never let them compete with the product",
  "use foreground occlusion sparingly, like blurred glass edge, napkin, ice bucket rim, or table object",
];

const realismDetails = [
  "natural lens distortion and physically plausible shadows",
  "tiny imperfections on reflective surfaces, no waxy plastic finish",
  "real contact shadow under the product",
  "authentic glass and packaging reflections",
  "slight unevenness in prop placement, not perfectly generated symmetry",
  "subtle film grain and realistic sensor noise",
  "sharp product details without oversharpened AI texture",
  "believable depth of field, not fake background blur",
  "realistic color contamination from the environment",
];

const colorGradings = [
  "warm editorial nightlife tones with natural skin-safe color science",
  "rich but restrained commercial contrast, no oversaturated AI colors",
  "premium dark amber and green accents, realistic highlight rolloff",
  "documentary-lifestyle color grade with polished product emphasis",
  "cinematic contrast with natural blacks and preserved label detail",
];

export const productImageSkill = {
  name: "premium_product_image_variation_skill",
  description:
    "Create a varied, realistic product-image edit prompt from a reference image, preserving product identity while improving background, camera angle, and non-AI realism.",
  buildPrompt({ productName = "", extraScene = "" } = {}) {
    const lens = randomItem(lenses);
    const iso = randomItem(["100", "125", "160", "200", "320", "400"]);
    const shutter = randomItem(["1/80", "1/100", "1/125", "1/160", "1/200", "1/250"]);
    const selectedRealism = uniqueRandomItems(realismDetails, 5);
    const selectedBackgroundRules = uniqueRandomItems(backgroundRules, 3);

    const productContext = productName
      ? `Product display name: "${productName}". Understand this as the human-readable product name, not as raw filename text.`
      : "";

    const markdownSkill = readSkill("premium-product-image.md");

    return `
${markdownSkill}

TASK:
Create a premium, highly realistic commercial lifestyle photograph using the ORIGINAL product from the reference image.

PRODUCT PRESERVATION:
- Keep the same product identity, object type, shape, packaging structure, proportions, main colors, and layout.
- Do not turn the product into another item.
- Do not redesign the product category.
- Preserve readable visual identity where legally acceptable, but avoid exact trademark recreation if the image model would otherwise copy protected marks.
- Preserve the source image orientation and aspect ratio; do not convert horizontal references into vertical layouts.
${productContext}

IMPORTANT IMAGE PROBLEM TO FIX:
The output must NOT look like a front-facing AI packshot. Avoid flat direct frontal view, perfect symmetry, generic luxury gradient backgrounds, floating objects, plastic CGI reflections, over-clean surfaces, and repeated dark studio backdrops.

SCENE THEME:
${randomItem(sceneThemes)}${extraScene ? `, ${extraScene}` : ""}

CAMERA AND ANGLE:
Shot on ${randomItem(cameraBodies)}, ${lens.focal} lens, ${lens.aperture}, ISO ${iso}, shutter speed ${shutter}.
Camera direction: ${randomItem(cameraAngles)}.
Lens feel: ${lens.feel}.

COMPOSITION:
${randomItem(compositions)}.
Use layered depth: foreground, product plane, and background plane. Keep product hero focus, but make the framing feel like a real photographer chose the angle.

LIGHTING:
${randomItem(lightings)}.
Make reflections physically believable and tied to the environment.

BACKGROUND RULES:
- ${selectedBackgroundRules.join("\n- ")}

REALISM DETAILS:
- ${selectedRealism.join("\n- ")}

COLOR GRADING:
${randomItem(colorGradings)}.

FINAL QUALITY:
Photorealistic, premium social-commerce advertising image, believable optics, realistic materials, natural depth, no AI-generated look, no over-smoothed surfaces, no warped logo/text, no extra duplicate products.
`.replace(/\n\s+\n/g, "\n\n").trim();
  },
};
