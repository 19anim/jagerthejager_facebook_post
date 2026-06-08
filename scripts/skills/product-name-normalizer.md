# Skill: Product Name Normalizer

## Purpose
Convert raw image filenames into clean, human-readable Vietnamese product names.

## Input
- `filename`: Raw filename, usually without Vietnamese accents and using underscores/hyphens.

## Rules
- Remove the file extension.
- Convert underscores and hyphens into spaces.
- Restore Vietnamese accents where context is clear.
- Preserve brand names and product terms naturally.
- Keep English brand/product terms when appropriate, such as Pack, Set, Mini, Shot, Limited, Edition.
- Do not invent extra product details that are not present in the filename.
- Do not output explanation.
- Output title-style product name only.

## Examples
- `Jagermeister_Pack_Kem_Tui_Bao_Tu.png` → `Jagermeister Pack Kèm Túi Bao Tử`
- `Jagermeister_Ly_Shot_Xanh.png` → `Jagermeister Ly Shot Xanh`
- `Jagermeister_Hop_Qua.png` → `Jagermeister Hộp Quà`
