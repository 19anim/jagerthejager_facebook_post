import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const timeSlot = (args.find((arg) => !arg.startsWith("--")) || "MORNING").toUpperCase();
const runsArg = args.find((arg) => arg.startsWith("--runs="));
const runs = Number.parseInt(runsArg?.split("=")[1] || "10", 10);
const reset = args.includes("--reset");

if (!["MORNING", "NOON"].includes(timeSlot)) {
  throw new Error('Time slot must be "MORNING" or "NOON".');
}

if (!Number.isInteger(runs) || runs < 1) {
  throw new Error("--runs must be a positive integer.");
}

process.env.IMAGE_SELECTION_HISTORY_FILE =
  process.env.IMAGE_SELECTION_TEST_HISTORY_FILE || ".cache/image-selection-history.test.json";

const {
  getImageReuseWindowDays,
  getImageSelectionHistoryFile,
  loadImageSelectionHistory,
  selectReferenceImage,
} = await import("../image-selection-history.js");

const historyFile = getImageSelectionHistoryFile();

if (reset && fs.existsSync(historyFile)) {
  fs.rmSync(historyFile);
}

const folderType =
  timeSlot === "MORNING"
    ? process.env.TEMPLATE_FOLDER || "template"
    : process.env.STOCKS_FOLDER || "stocks";
const folderPath = path.resolve(folderType);
const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

if (files.length === 0) {
  throw new Error(`No images found in ${folderPath}`);
}

console.log(`Testing ${timeSlot} image selection without calling external APIs.`);
console.log(`Folder: ${folderPath}`);
console.log(`Images: ${files.length}`);
console.log(`Reuse window: ${getImageReuseWindowDays()} days`);
console.log(`Test cache: ${historyFile}\n`);

for (let index = 1; index <= runs; index += 1) {
  const selectedImage = selectReferenceImage(files, folderType);
  console.log(`[${index}/${runs}] Used image: ${selectedImage}`);
}

console.log("\nCached selection history:");
console.log(JSON.stringify(loadImageSelectionHistory(), null, 2));
