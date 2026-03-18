//@ts-check
import { readdir, readFile, writeFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";

// Language code mapping for AI translation
const LANGUAGE_MAP = {
  "zh_CN.json": "Chinese (Simplified)",
  "zh_TW.json": "Chinese (Traditional)",
  "ja_JP.json": "Japanese",
  "ko_KR.json": "Korean",
  "fr_FR.json": "French",
  "de_DE.json": "German",
  "es_ES.json": "Spanish",
  "pt_BR.json": "Portuguese (Brazil)",
  "ru_RU.json": "Russian",
  "th_TH.json": "Thai",
  "tr_TR.json": "Turkish"
};

const SYSTEM_PROMPT = `You are a UI localization translator for MCSManager.
Input: a JSON array of objects like {"key": string, "text": string}. Translate each "text" to {target}.
Output: ONLY a valid JSON array with the same objects shape, the same "key" values, and the same array order/length.
Rules: keep all placeholders/tokens unchanged (e.g. "{{...}}", "<...>", "{...}"), preserve all whitespace/newlines (including "\\n"), and keep punctuation consistent. Use natural {target} wording and be as concise as possible.
Proper nouns: This software is a management tool for various Steam games and Minecraft game services. If there are proper nouns that are only available in English without corresponding translations, English will be used as the universal version for each language (e.g., Minecraft, Steam, EPIC).
Output raw JSON only (no markdown, no extra commentary).`;

export class AiChatSession {
  constructor(apiKey = "", systemPrompt = "") {
    this.messages = [{ role: "system", content: systemPrompt }];
    this.apiKey = apiKey;
  }

  async sendMessage(userInput = "", onStream = (text = "") => {}) {
    try {
      const openai = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: this.apiKey
      });

      this.messages.push({ role: "user", content: userInput });

      const completion = await openai.chat.completions.create({
        messages: /** @type {any} */ (this.messages),
        model: "deepseek-chat",
        stream: true
      });

      let fullResponse = "";

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onStream(content);
        }
      }

      // Add assistant reply to conversation history
      this.messages.push({ role: "assistant", content: fullResponse });

      return {
        content: fullResponse
      };
    } catch (error) {
      console.error("Request error: ", error.message);
      throw error;
    }
  }

  // Clear conversation history (keep system prompt)
  clearHistory() {
    this.messages = this.messages.filter((msg) => msg.role === "system");
  }
}

async function getApiKey() {
  try {
    const apiKey = await readFile("./ai-api.key", "utf8");
    return apiKey;
  } catch (error) {
    console.error(
      "Error reading API key, please create 'ai-api.key' file, and put your API key in it."
    );
    process.exit(1);
  }
}

/**
 * Translate a list of texts to a target language
 * @param {{key:string, text:string}[]} textList - Text array to translate
 * @param {string} targetLanguage - Target language (e.g., "zh-CN", "en-US")
 * @returns {Promise<{key:string, text:string}[]>} - Translated text array
 */
async function translateText(chatAiSession, textList = [], targetLanguage = "") {
  const result = await chatAiSession.sendMessage(JSON.stringify(textList), (text) => {
    process.stdout.write(text || "");
  });
  let text = result.content;
  text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
  return JSON.parse(text);
}

/**
 * Use en_US.json as the standard to fill missing keys in other language files
 */
async function checkAndFillMissingKeys() {
  const apiKey = await getApiKey();
  const languagesPath = path.join(import.meta.dirname, "../languages");

  // Read standard file en_US.json
  const standardFilePath = path.join(languagesPath, "en_US.json");
  const standardContent = await readFile(standardFilePath, "utf8");
  const standardJson = JSON.parse(standardContent);
  const standardKeys = Object.keys(standardJson);

  console.log(`Standard file en_US.json contains ${standardKeys.length} key-value pairs`);

  // Get all language files
  const languageFiles = await readdir(languagesPath);
  const targetFiles = languageFiles.filter(
    (file) => file.endsWith(".json") && file !== "en_US.json"
  );

  // Process each language file concurrently
  const processFile = async (file) => {
    const systemPrompt = SYSTEM_PROMPT.replace(/{target}/g, LANGUAGE_MAP[file]);
    const chatAiSession = new AiChatSession(apiKey, systemPrompt);

    const filePath = path.join(languagesPath, file);
    const content = await readFile(filePath, "utf8");
    const json = JSON.parse(content);

    // Find missing keys
    const missingKeys = standardKeys.filter((key) => !json.hasOwnProperty(key));

    if (missingKeys.length === 0) {
      console.log(`✅ ${file} has no missing key-value pairs`);
      return;
    }

    console.log(`🔍 ${file} is missing ${missingKeys.length} key-value pairs. Translating...`);

    // Prepare translation data
    const textsToTranslate = missingKeys.map((key) => ({
      key: key,
      text: standardJson[key]
    }));

    // Get target language
    const targetLanguage = LANGUAGE_MAP[file];
    if (!targetLanguage) {
      console.warn(`⚠️  No language mapping found for ${file}. Skipping.`);
      return;
    }

    try {
      // Call translation function
      console.log(`🌍 Translating to ${targetLanguage}...`);
      const translatedTexts = await translateText(chatAiSession, textsToTranslate, targetLanguage);

      // Merge translation results into current language JSON
      for (const translatedItem of translatedTexts) {
        json[translatedItem.key] = translatedItem.text;
      }

      // Write updated content back to file
      const updatedContent = JSON.stringify(json, null, 2);
      await writeFile(filePath, updatedContent, "utf8");

      console.log(`✅ ${file} filled ${missingKeys.length} missing key-value pairs`);

      // Clear conversation history to avoid long context
      chatAiSession.clearHistory();
    } catch (error) {
      console.error(`\n\n❌ Error translating ${file}: ${error.message} \n`);
    }
  };

  await Promise.all(targetFiles.map((file) => processFile(file)));

  console.log("🎉 All language files checked and filled!");
}

async function main() {
  await checkAndFillMissingKeys();
}

main();
