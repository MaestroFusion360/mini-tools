import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as emoji from "node-emoji";
import emojilib from "emojilib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "src", "features", "data");
const outputPath = path.join(outputDir, "emoji-catalog.json");

function mapCategory(rawCategory = "", name = "") {
  const normalizedName = String(name).toLowerCase();
  switch (rawCategory) {
    case "people":
      if (
        /face|smile|laugh|wink|kiss|cry|tear|angry|astonished|grin|grinning|heart_eyes|blush|sleep/.test(
          normalizedName,
        )
      ) {
        return "smileys";
      }
      return "people";
    case "nature":
      return "animals";
    case "food_drink":
      return "food";
    case "travel_places":
      return "travel";
    case "objects":
      return "objects";
    case "symbols":
      return "symbols";
    case "flags":
      return "flags";
    case "activity":
      return "activity";
    default:
      return "objects";
  }
}

function toDisplayName(name = "") {
  return String(name).replaceAll("_", " ").replaceAll("-", " ").trim();
}

async function main() {
  const all = emoji.search(/.*/);
  const items = all
    .map((item) => {
      const meta = emojilib.lib[item.name] || {};
      return {
        emoji: item.emoji,
        name: toDisplayName(item.name),
        category: mapCategory(meta.category, item.name),
        tags: Array.isArray(meta.keywords) ? meta.keywords.slice(0, 16) : [],
      };
    })
    .filter((item) => item.emoji && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(items), "utf8");
  console.log(
    `Generated emoji catalog: ${items.length} entries -> ${outputPath}`,
  );
}

main().catch((error) => {
  console.error("Failed to generate emoji catalog:", error);
  process.exitCode = 1;
});
