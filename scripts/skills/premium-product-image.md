# Skill: Premium Product Image Variation

## Purpose
Create a premium, realistic product-image edit prompt from a reference image. The skill must preserve the original product identity while improving the background, angle, lighting, and realism.

## Inputs
- `productName`: Human-readable product name. This is not raw filename text.
- `extraScene`: Optional extra scene direction.
- `creativeBrief`: Runtime-generated camera, angle, lighting, background, realism, and color notes.

## Core Instruction
Create a premium, highly realistic commercial lifestyle photograph using the ORIGINAL product from the reference image.

## Product Preservation Rules
- Keep the same product identity, object type, shape, packaging structure, proportions, main colors, and layout.
- Do not turn the product into another item.
- Do not redesign the product category.
- Preserve the source image orientation and aspect ratio; do not convert horizontal references into vertical layouts.
- Preserve readable visual identity where legally acceptable, but avoid exact trademark recreation if the image model would otherwise copy protected marks.
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
