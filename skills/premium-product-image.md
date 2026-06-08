# Skill: Premium Product Image Variation

## Purpose
Create a premium, realistic product-image edit prompt from a reference image. The skill must preserve the original product identity while improving the background, angle, lighting, and realism.

## Inputs
- `productName`: Human-readable product name. This is not raw filename text.
- `extraScene`: Optional extra scene direction.
- `creativeBrief`: Runtime-generated camera, angle, lighting, background, realism, and color notes.

## Core Instruction
Create a premium, highly realistic commercial lifestyle photograph using the ORIGINAL product from the reference image.



## Branding Replacement Rules
If the reference image contains any visible Jägermeister / Jagermeister / Jager / Jäger / Mast-Jägermeister wording, label text, cap text, box text, mat text, logo wordmark, or close spelling variation, replace that visible brand wording with the exact replacement brand name: **NimAnim**.

Required behavior:
- Do not keep, recreate, or sharpen the exact Jägermeister wordmark.
- Do not use close spellings such as Jaegermeister, Jagermeister, Jäger Master, Jager Master, Jager The Jager, or similar lookalikes.
- Use **NimAnim** as the replacement wordmark, with this exact capitalization, when the text area is large enough to be readable.
- If the label surface is small, curved, distant, or partially hidden, still prefer a clean short **NimAnim** wordmark rather than adding extra words.
- Do not invent additional replacement names unless the text is too small to read; the intended brand identity is always **NimAnim**.
- Keep the bottle shape, label structure, deer/stag-style emblem, color palette, retro layout, and overall collector aesthetic when they are part of the product identity.
- The **NimAnim** text must look naturally printed on the product, label, box, cap, glass, mat, or accessory.
- Avoid warped, unreadable, duplicated, or nonsense text.
- If the brand appears many times, replace all visible occurrences consistently with **NimAnim**.
- Preserve the commercial look while making the brand text non-infringing and not identical to the original trademark.

## Product Preservation Rules
- Keep the same product identity, object type, shape, packaging structure, proportions, main colors, and layout.
- Do not turn the product into another item.
- Do not redesign the product category.
- Preserve the source image orientation and aspect ratio; do not convert horizontal references into vertical layouts.
- Preserve the product identity through shape, layout, color structure, and emblem placement, while replacing protected brand wording as described above.
- Treat `productName` as a display name only. Do not render filename-like text in the image.

## Main Visual Problem To Fix
The output must NOT look like a front-facing AI packshot. Avoid:
- flat direct frontal view
- perfect symmetry
- generic luxury gradient backgrounds
- repeated dark studio backdrops
- floating objects
- plastic CGI reflections
- over-clean surfaces
- fake bokeh
- warped or duplicated logos/text

## Direction
Use `creativeBrief` to create varied, believable outputs. The image should feel like a real photographer chose the scene and angle, not like a template.

The result should include:
- a real-world background with depth
- a non-direct camera angle, preferably 3/4, side-biased, low-angle, top-down, or asymmetrical
- natural foreground/product/background layering
- believable contact shadows
- realistic material reflections
- subtle imperfections such as dust, condensation, scratches, table texture, uneven placement, or sensor noise

## Output Requirements
Return only the final image-generation prompt. Do not explain the prompt.
