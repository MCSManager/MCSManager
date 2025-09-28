import { readFile } from "fs/promises";
import OpenAI from "openai";
import { sortLanguageFiles } from "./sort-lang-key.mjs";

// 你现在是一名经验丰富的翻译专家，我将给你一系列的文案，翻译时必须遵守以下规则：。
// 1. 这些文本最终会使用到 MCSManager 游戏服务器程序管理面板的UI界面上，它是一个支持 Minecraft，Steam 等的游戏服务器 Web 管理程序。
// 2. 不要回答我的任何问题，我传给你什么文本，你就翻译什么文本，不要问我任何问题。
// 3. 翻译时必须遵守 {target} 语言的语法和习惯用语，不要出现语法错误和习惯用语错误。
// 4. 翻译结果尽可能简短，本地化，不要出现冗余的文本。
// 现在，请你充分理解原文的意思，并且将它翻译成 {target} 语言

const SYSTEM_PROMPT = `You are now an experienced translation expert. I will provide you with a series of texts, and you must follow these rules when translating:  
1. These texts will be used in the UI of the MCSManager game server management panel, a web-based management program supporting Minecraft, Steam, and other game servers.  
2. Do not answer any questions from me. Translate only the texts I provide, without asking any questions.  
3. The translation must adhere to the grammar and idiomatic expressions of the {target} language, avoiding grammatical errors and improper idioms.  
4. Keep the translation as concise and localized as possible, avoiding redundant text.  
Now, fully understand the meaning of the original text and translate it into the {target} language.  `;

export class AiChatSession {
  constructor(apiKey, systemPrompt) {
    this.messages = [{ role: "system", content: systemPrompt }];
    this.apiKey = apiKey;
  }

  async sendMessage(userInput, onStream = () => {}) {
    try {
      const openai = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: this.apiKey
      });

      this.messages.push({ role: "user", content: userInput });

      const completion = await openai.chat.completions.create({
        messages: this.messages,
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

  // 获取对话历史
  getHistory() {
    return this.messages.filter((msg) => msg.role !== "system");
  }

  // 清空对话历史（保留系统提示）
  clearHistory() {
    this.messages = this.messages.filter((msg) => msg.role === "system");
  }

  // 设置新的系统提示
  setSystemPrompt(prompt) {
    this.messages[0] = { role: "system", content: prompt };
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

async function main() {
  const apiKey = await getApiKey();
  const chat = new AiChatSession(apiKey, SYSTEM_PROMPT);

  await sortLanguageFiles();

  // const { content } = await chat.sendMessage(``);
  // await writeFile("output.txt", content);
}

main();
