# Skill: Image Caption Context Extractor

## Purpose
Analyze the uploaded product/reference image and turn it into useful context for a Vietnamese Facebook caption.

This skill does **not** write the final caption. It only describes what is visible and what angle the caption should take.

## Inputs
- `image`: The actual product/reference image.
- `filenameProductName`: Optional fallback product name from the filename.
- `timeSlot`: Posting time slot, for light context only.

## What To Extract
Return a compact JSON object with these keys:

```json
{
  "mainProduct": "short human-readable product name in Vietnamese",
  "visibleItems": ["item 1", "item 2"],
  "notableDetails": ["detail 1", "detail 2"],
  "mood": "short Vietnamese phrase, do not use the word vibe",
  "sellingAngles": ["angle 1", "angle 2"],
  "captionHint": "one practical caption direction in Vietnamese",
  "needsWebResearch": false,
  "webSearchQuery": "short query only if needed"
}
```

## Rules
- Look at the actual image first. Do not depend on filename unless the image is unclear.
- Use Vietnamese for user-facing fields.
- Avoid the words: vibe, vibes, chill, đẳng cấp, nâng tầm.
- Prefer concrete product observations: color, material, accessory type, set contents, decor use, collector value, gift use, shelf/bar/table use.
- If the product appears to be a limited edition, collaboration item, or a hard-to-identify collectible, set `needsWebResearch` to true and provide a short search query.
- If the image is clear enough for a caption, set `needsWebResearch` to false.
- Do not invent technical claims, rarity, price, origin, or availability.
- Return JSON only. No markdown, no explanation.
