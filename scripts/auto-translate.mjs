//@ts-check
import { readdir, readFile, writeFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import { sortLanguageFiles } from "./sort-lang-key.mjs";

// 语言代码映射，用于AI翻译
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

// 你现在是一名经验丰富的翻译专家，我将给你一系列的文案，翻译时必须遵守以下规则：。
// 1. 这些文本最终会使用到 MCSManager 游戏服务器程序管理面板的UI界面上，它是一个支持 Minecraft，Steam 等的游戏服务器 Web 管理程序。
// 2. 不要回答我的任何问题，我传给你什么文本，你就翻译什么文本，不要问我任何问题。
// 3. 翻译时必须遵守 {target} 语言的语法和习惯用语，不要出现语法错误和习惯用语错误。
// 4. 翻译结果尽可能简短，本地化，不要出现冗余的文本。
// 5. 我会给你 JSON 格式的文本，请翻译结果也返回 JSON 格式。
// 现在，请你充分理解原文的意思，并且将它翻译成 {target} 语言

const SYSTEM_PROMPT = `你现在是一名经验丰富的翻译专家，我将给你一系列的文案，翻译时必须遵守以下规则：
1. 翻译时必须遵守 {target} 语言的语法和习惯用语，不要出现语法错误和习惯用语错误，尽可能的简短。
2. 我会给你 JSON 格式的文本，请翻译结果也返回 JSON 纯文本，请确保 JSON 格式正确，注意转移符号等。
现在，请你充分理解原文的意思，并且将它翻译成 {target} 语言`;

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

      // 添加助手回复到对话历史
      this.messages.push({ role: "assistant", content: fullResponse });

      return {
        content: fullResponse
      };
    } catch (error) {
      console.error("Request error: ", error.message);
      throw error;
    }
  }

  // 清空对话历史（保留系统提示）
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
 * 将一组文本翻译成目标语言
 * @param {{key:string, text:string}[]} textList - 需要翻译的文本数组
 * @param {string} targetLanguage - 目标语言（如 "zh-CN", "en-US" 等）
 * @returns {Promise<{key:string, text:string}[]>} - 翻译后的文本数组
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
 * 以 en_US.json 为标准，检查并填充其他语言文件中缺失的键值对
 */
async function checkAndFillMissingKeys() {
  const apiKey = await getApiKey();
  const languagesPath = path.join(import.meta.dirname, "../languages");

  // 读取标准文件 en_US.json
  const standardFilePath = path.join(languagesPath, "en_US.json");
  const standardContent = await readFile(standardFilePath, "utf8");
  const standardJson = JSON.parse(standardContent);
  const standardKeys = Object.keys(standardJson);

  console.log(`标准文件 en_US.json 包含 ${standardKeys.length} 个键值对`);

  // 获取所有语言文件
  const languageFiles = await readdir(languagesPath);
  const targetFiles = languageFiles.filter(
    (file) => file.endsWith(".json") && file !== "en_US.json"
  );

  // 逐个处理每个语言文件
  for (const file of targetFiles) {
    const systemPrompt = SYSTEM_PROMPT.replace(/{target}/g, LANGUAGE_MAP[file]);
    const chatAiSession = new AiChatSession(apiKey, systemPrompt);

    const filePath = path.join(languagesPath, file);
    const content = await readFile(filePath, "utf8");
    const json = JSON.parse(content);
    const existingKeys = Object.keys(json);

    // 找出缺失的键
    const missingKeys = standardKeys.filter((key) => !json.hasOwnProperty(key));

    if (missingKeys.length === 0) {
      console.log(`✅ ${file} 没有缺失的键值对`);
      continue;
    }

    console.log(`🔍 ${file} 缺失 ${missingKeys.length} 个键值对，开始翻译...`);

    // 准备翻译数据
    const textsToTranslate = missingKeys.map((key) => ({
      key: key,
      text: standardJson[key]
    }));

    // 获取目标语言
    const targetLanguage = LANGUAGE_MAP[file];
    if (!targetLanguage) {
      console.warn(`⚠️  未找到 ${file} 对应的语言映射，跳过`);
      continue;
    }

    try {
      // 调用翻译函数
      console.log(`🌍 正在翻译到 ${targetLanguage}...`);
      const translatedTexts = await translateText(chatAiSession, textsToTranslate, targetLanguage);

      // 将翻译结果添加到当前语言的 JSON 对象中
      for (const translatedItem of translatedTexts) {
        json[translatedItem.key] = translatedItem.text;
      }

      // 将更新后的内容写回文件
      const updatedContent = JSON.stringify(json, null, 2);
      await writeFile(filePath, updatedContent, "utf8");

      console.log(`✅ ${file} 已成功填充 ${missingKeys.length} 个缺失的键值对`);

      // 清空对话历史，避免上下文过长
      chatAiSession.clearHistory();
    } catch (error) {
      console.error(`❌ 翻译 ${file} 时发生错误:`, error.message);
    }
  }

  console.log("🎉 所有语言文件检查和填充完成!");
}

async function main() {
  await checkAndFillMissingKeys();
  await sortLanguageFiles();
}

main();
