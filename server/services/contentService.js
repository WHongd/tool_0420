const { getWechatPrompt } = require("../prompts/wechatPrompt");
const { getToutiaoPrompt } = require("../prompts/toutiaoPrompt");
const { getWeitoutiaoPrompt } = require("../prompts/weitoutiaoPrompt");

function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();
  if (value === "toutiao") return "toutiao";
  if (value === "weitoutiao") return "weitoutiao";
  return "wechat";
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanModelOutput(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^###\s*/gm, "")
    .replace(/^##\s*/gm, "")
    .replace(/^#\s*/gm, "")
    .replace(new RegExp("`{3}[\\s\\S]*?`{3}", "g"), "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeExtractJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {}

  const match = String(text || "").match(/(\{[\s\S]*\})/);
  if (!match?.[1]) return fallback;

  try {
    return JSON.parse(match[1]);
  } catch {
    return fallback;
  }
}

function getModelConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl:
      process.env.DEEPSEEK_BASE_URL ||
      "https://api.deepseek.com/v1/chat/completions",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 20000),
  };
}

async function callChatModel(messages, options = {}) {
  const config = getModelConfig();

  if (!config.apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.88,
        max_tokens: options.maxTokens ?? 1500,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`模型请求失败：${response.status} ${errorText}`);
    }

    const json = await response.json();
    return String(json?.choices?.[0]?.message?.content || "").trim();
  } catch (error) {
    console.error("模型调用失败:", error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function detectTitleType(title) {
  const t = String(title || "");

  if (/不安|难受|扎心|说实话|心酸|无力感/.test(t)) {
    return "emotion";
  }

  if (/很多人|问题不在|根本不在|看错|没看懂|但/.test(t)) {
    return "judgement";
  }

  if (/信号|不是偶然|意味着|变化在后面|接下来/.test(t)) {
    return "signal";
  }

  if (/普通人|吃亏|影响|代价|成本/.test(t)) {
    return "reality";
  }

  return "normal";
}

function buildArticlePrompt(title, platform) {
  const p = normalizePlatform(platform);
  const type = detectTitleType(title);
  const safeTitle = compactText(title) || "这个主题";

  const commonRules = `
通用要求：
1. 写之前先在内部确定一个核心观点，但不要把“核心观点是”写出来。
2. 整篇文章必须围绕这个观点展开，不要东一段西一段。
3. 像人在表达，不要像AI总结材料。
4. 涉及人物、领导人、公司高管、时事信息时，如果不确定最新情况，不要写死具体人名和身份。
5. 不要编造事实，不要使用不确定的“当前、最新、最近”表达。
6. 不要输出 Markdown 格式。
`.trim();

  if (type === "emotion") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 从情绪或感受切入。
2. 写清楚为什么这件事让人不安、难受或有触动。
3. 多写普通人的现实处境。
4. 不要讲大道理，要像人在说话。
5. 结尾收回到一个明确判断。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "judgement") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 开头直接指出：很多人可能看错了。
2. 说明大家为什么会看错。
3. 再讲真正的问题在哪里。
4. 中间要有现实例子或具体处境。
5. 结尾给出明确判断。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "signal") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 解释这个“信号”到底是什么。
2. 说明它为什么不是偶然。
3. 推演可能带来的变化。
4. 让读者感觉“后面可能还有更大的变化”。
5. 结尾收束成判断，不要空泛总结。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "reality") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 从普通人的现实利益切入。
2. 写清楚这件事会影响谁。
3. 不要只讲宏大叙事，要落到生活、工作、钱、选择、压力。
4. 中间要有现实感。
5. 结尾给出一个克制但明确的判断。

${commonRules}

只返回正文。
`.trim();
  }

  return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 开头直接进入问题。
2. 中间围绕一个核心观点展开。
3. 多写判断、现实、人的处境。
4. 不要写成说明文。
5. 结尾自然收束。

${commonRules}

只返回正文。
`.trim();
}

function buildSystemPrompt(platform) {
  const p = normalizePlatform(platform);

  if (p === "toutiao") {
    return `
你是一个今日头条内容作者。
要求：标题和正文要有冲突感、判断感、现实感。
正文要直接、有观点、有讨论空间。
结尾不要主动写固定互动句，系统会单独处理。
`.trim();
  }

  if (p === "weitoutiao") {
    return `
你是一个微头条作者。
要求：短、直接、有观点，开头尽快抓住人。
`.trim();
  }

  return `
你是一个微信公众号作者。
要求：有观点、有人味、有现实感。
风格类似高阅读量观点号，但不要模仿具体作者句子。
文章要像人在表达判断，不要像说明文。
`.trim();
}

function buildLocalTitleFallback(topic) {
  const safeTopic = compactText(topic) || "这个话题";

  return {
    titles: [
      {
        title: `${safeTopic}这件事，可能没那么简单`,
        score: 90,
        reason: "有提醒感，容易引发继续阅读",
      },
      {
        title: `很多人都在聊${safeTopic}，但重点不在这`,
        score: 88,
        reason: "有反转感，能制造点击欲",
      },
      {
        title: `${safeTopic}背后，普通人更该看懂这一点`,
        score: 86,
        reason: "有现实代入感",
      },
    ],
    bestTitle: `${safeTopic}这件事，可能没那么简单`,
    fallback: true,
  };
}

async function generateTitles({
  topic,
  platform,
  persona,
  candidateCount = 4,
}) {
  const p = normalizePlatform(platform);
  const count = Math.max(3, Number(candidateCount) || 4);

  let userPrompt = "";

  if (p === "wechat") {
    userPrompt = getWechatPrompt(topic, count, compactText);
  } else if (p === "toutiao") {
    userPrompt = getToutiaoPrompt(topic, count, compactText);
  } else {
    userPrompt = getWeitoutiaoPrompt(topic, count, compactText);
  }

  try {
    const content = await callChatModel([{ role: "user", content: userPrompt }], {
      temperature: 0.92,
      maxTokens: 900,
    });

    const parsed = safeExtractJson(content, null);

    if (parsed && Array.isArray(parsed.titles)) {
      const titles = parsed.titles
        .map((item, index) => ({
          title: compactText(item?.title) || `标题候选 ${index + 1}`,
          score: Number(item?.score) || 95 - index * 3,
          reason: compactText(item?.reason) || "模型生成结果",
        }))
        .filter((item) => item.title)
        .slice(0, count);

      if (titles.length) {
        return {
          titles,
          bestTitle:
            compactText(parsed.bestTitle) || compactText(titles[0]?.title) || "",
        };
      }
    }
  } catch (error) {
    console.error("标题生成失败:", error.message);
  }

  return buildLocalTitleFallback(topic);
}

async function generateWeitoutiao({ topic, platform = "weitoutiao", persona }) {
  const safeTopic = compactText(topic) || "这个话题";

  const prompt = `
请围绕主题“${safeTopic}”写一篇微头条。

要求：
1. 200-400字。
2. 开头直接进入观点。
3. 语言自然，有态度。
4. 不要写成说明文。
5. 不要输出 Markdown。
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt("weitoutiao") },
        { role: "user", content: prompt },
      ],
      { temperature: 0.9, maxTokens: 800 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: `说实话，关于“${safeTopic}”，很多人看到的只是表面。真正值得关注的，是它背后对普通人的现实影响。`,
    fallback: true,
  };
}

async function generateOutline({ title, platform, persona }) {
  const safeTitle = compactText(title) || "这个主题";

  const prompt = `
请围绕标题“${safeTitle}”生成文章大纲。

要求：
1. 4个部分。
2. 每个部分有标题和一句摘要。
3. 不要太像教程，要有观点推进。

返回 JSON 数组：
[
  { "id": "section_1", "order": 1, "title": "部分标题", "summary": "一句摘要" }
]

只返回 JSON。
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt(platform) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.8, maxTokens: 900 }
    );

    const parsed = safeExtractJson(content, null);

    if (Array.isArray(parsed)) {
      return {
        sections: parsed.map((item, index) => ({
          id: item?.id || `section_${index + 1}`,
          order: Number(item?.order) || index + 1,
          title: compactText(item?.title) || `第${index + 1}部分`,
          summary: compactText(item?.summary) || "",
        })),
      };
    }
  } catch {}

  return {
    sections: [
      {
        id: "section_1",
        order: 1,
        title: "先把问题抛出来",
        summary: `围绕“${safeTitle}”直接进入核心问题。`,
      },
      {
        id: "section_2",
        order: 2,
        title: "为什么很多人看偏了",
        summary: "指出常见误解。",
      },
      {
        id: "section_3",
        order: 3,
        title: "真正值得关注的地方",
        summary: "展开现实影响。",
      },
      {
        id: "section_4",
        order: 4,
        title: "最后给出判断",
        summary: "收束全文。",
      },
    ],
    fallback: true,
  };
}

async function generateSection({ articleTitle, platform, persona, section }) {
  const safeTitle = compactText(articleTitle) || "这个主题";
  const sectionTitle = compactText(section?.title) || "这一部分";
  const summary = compactText(section?.summary || "");

  const prompt = `
请为文章“${safeTitle}”写其中一个部分。

当前部分：
- 标题：${sectionTitle}
- 摘要：${summary}

要求：
1. 像真人表达，不像材料总结。
2. 有观点、有现实感。
3. 不要使用 Markdown 小标题。
4. 只返回正文。
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt(platform) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.86, maxTokens: 1000 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: `围绕“${safeTitle}”，这一部分重点讲“${sectionTitle}”。${summary ? `\n\n${summary}` : ""}`,
    fallback: true,
  };
}

async function generateToutiaoEnding({ title, content }) {
  const prompt = `
基于下面这篇今日头条正文，生成一句适合放在结尾的互动收尾。

要求：
1. 只能输出一句话。
2. 必须贴合正文核心观点。
3. 不要只写“你怎么看”。
4. 要自然，能引发评论。

标题：${compactText(title)}
正文：${compactText(content).slice(0, 1600)}
`.trim();

  try {
    const result = await callChatModel([{ role: "user", content: prompt }], {
      temperature: 0.85,
      maxTokens: 120,
    });

    const cleaned = cleanModelOutput(result);
    if (cleaned) return cleaned;
  } catch {}

  return "这件事你更认同哪一种判断？";
}

async function appendToutiaoEndingIfNeeded({ title, content }) {
  const cleaned = cleanModelOutput(content);
  if (!cleaned) return cleaned;

  const lastParagraph = cleaned.split(/\n+/).filter(Boolean).slice(-1)[0] || "";

  const alreadyInteractive =
    /[？?]/.test(lastParagraph) &&
    /(你|大家|评论区|怎么看|怎么选|更认同|觉得)/.test(lastParagraph);

  if (alreadyInteractive) return cleaned;

  const ending = await generateToutiaoEnding({ title, content: cleaned });
  return `${cleaned}\n\n${ending}`.trim();
}

async function generateArticle({
  title,
  platform,
  persona,
  withOutline = true,
}) {
  const p = normalizePlatform(platform);
  const safeTitle = compactText(title) || "这个主题";

  try {
    if (p === "wechat" && withOutline) {
      const outlineResult = await generateOutline({ title, platform, persona });
      const sections = outlineResult.sections || [];
      const blocks = [];

      for (const section of sections) {
        const part = await generateSection({
          articleTitle: title,
          platform,
          persona,
          section,
        });

        blocks.push(part.content || "");
      }

      return {
        outline: sections,
        content: cleanModelOutput(blocks.join("\n\n")),
        fallback: Boolean(outlineResult.fallback),
      };
    }

    if (p === "weitoutiao") {
      const result = await generateWeitoutiao({
        topic: title,
        platform,
        persona,
      });

      return {
        outline: [],
        content: cleanModelOutput(result.content || ""),
        fallback: Boolean(result.fallback),
      };
    }

    const prompt = buildArticlePrompt(safeTitle, platform);

    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt(platform) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.88, maxTokens: 1800 }
    );

    if (content) {
      const finalContent =
        p === "toutiao"
          ? await appendToutiaoEndingIfNeeded({
              title: safeTitle,
              content,
            })
          : cleanModelOutput(content);

      return {
        outline: [],
        content: finalContent,
      };
    }
  } catch {}

  return {
    outline: [],
    content: `围绕“${safeTitle}”，这件事最值得讨论的不是表面，而是它背后对普通人的现实影响。`,
    fallback: true,
  };
}

module.exports = {
  normalizePlatform,
  generateTitles,
  generateWeitoutiao,
  generateOutline,
  generateSection,
  generateArticle,
};