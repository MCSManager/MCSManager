// Automatically sort all language keys under languages

import { promises as fs } from "fs";
import path from "path";

const languagesDir = path.join(import.meta.dirname, "../languages");

async function sortLanguageFiles() {
  try {
    const languageFiles = await fs.readdir(languagesDir);
    await Promise.all(
      languageFiles.map(async (file) => {
        if (!file.endsWith(".json")) return;
        console.log(`Sorting ${file}...`);
        const filePath = path.join(languagesDir, file);
        const content = await fs.readFile(filePath, "utf8");
        const jsonContent = JSON.parse(content);
        const keysCount = Object.keys(jsonContent).length;
        const sortedContent = Object.keys(jsonContent)
          .sort()
          .reduce((obj, key) => {
            obj[key] = jsonContent[key];
            return obj;
          }, {});
        if (keysCount !== Object.keys(sortedContent).length) {
          throw new Error(`Error: ${file} keys count is not equal`);
        }
        return await fs.writeFile(filePath, JSON.stringify(sortedContent, null, 2));
      })
    );
    console.log("All language files sorted successfully");
  } catch (err) {
    console.error("Error sorting language files:", err);
  }
}

sortLanguageFiles();
