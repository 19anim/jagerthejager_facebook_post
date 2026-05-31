import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getImageReuseWindowDays() {
  const configuredDays = Number.parseInt(process.env.IMAGE_REUSE_WINDOW_DAYS || "7", 10);
  return Number.isInteger(configuredDays) && configuredDays > 0 ? configuredDays : 7;
}

function getImageSelectionHistoryFile() {
  return path.resolve(
    __dirname,
    process.env.IMAGE_SELECTION_HISTORY_FILE || ".cache/image-selection-history.json",
  );
}

function loadImageSelectionHistory() {
  const historyFile = getImageSelectionHistoryFile();
  if (!fs.existsSync(historyFile)) return {};

  try {
    return JSON.parse(fs.readFileSync(historyFile, "utf8"));
  } catch (error) {
    console.warn(`Could not read image selection history, starting fresh: ${error.message}`);
    return {};
  }
}

function saveImageSelectionHistory(history) {
  const historyFile = getImageSelectionHistoryFile();
  const historyFolder = path.dirname(historyFile);
  const temporaryFile = `${historyFile}.tmp`;

  fs.mkdirSync(historyFolder, { recursive: true });
  fs.writeFileSync(temporaryFile, `${JSON.stringify(history, null, 2)}\n`);
  fs.renameSync(temporaryFile, historyFile);
}

function selectReferenceImage(files, folderType) {
  const history = loadImageSelectionHistory();
  const now = Date.now();
  const reuseWindowDays = getImageReuseWindowDays();
  const reuseWindowMs = reuseWindowDays * 24 * 60 * 60 * 1000;
  const candidates = files.map((file) => {
    const historyKey = `${folderType}/${file}`;
    const selectedAt = Date.parse(history[historyKey] || "");

    return {
      file,
      historyKey,
      selectedAt: Number.isNaN(selectedAt) ? 0 : selectedAt,
    };
  });
  const unusedCandidates = candidates.filter(
    (candidate) => now - candidate.selectedAt >= reuseWindowMs,
  );

  let selected;
  if (unusedCandidates.length > 0) {
    selected = randomItem(unusedCandidates);
  } else {
    selected = [...candidates].sort((a, b) => a.selectedAt - b.selectedAt)[0];
    console.warn(
      `[${folderType}] All images were selected within the last ${reuseWindowDays} days. ` +
        `Reusing the least recently selected image: ${selected.file}`,
    );
  }

  history[selected.historyKey] = new Date(now).toISOString();
  saveImageSelectionHistory(history);

  return selected.file;
}

export {
  getImageReuseWindowDays,
  getImageSelectionHistoryFile,
  loadImageSelectionHistory,
  selectReferenceImage,
};
