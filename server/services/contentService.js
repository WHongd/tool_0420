/**
 * ============================================
 * 内容生成服务（增强版 - 保留原结构）
 * ============================================
 * 本次优化点：
 * 1. 公众号 → 类似“也评风格”（表达型，不是说明型）
 * 2. 今日头条 → 保持爆文 + 结尾互动
 * 3. 微头条 → 短、直接
 * 4. 去除 Markdown（解决 ** 问题）
 */

// ================= 工具函数 =================

function normalizePlatform(platform) {
  const value = String(platform || "").toLowerCase();
  if (value === "toutiao") return "toutiao";
  if (value === "weitoutiao") return "weitoutiao";
  return "wechat";
}

function normalizePersona(persona) {
  const value = String(persona || "").toLowerCase();
  if (value === "emotion") return "emotion";
  if (value === "professional") return "professional";
  return "normal";
}

function cleanMarkdown(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/##/g, "")
    .trim();
}

// ================= 核心 Prompt =================

function buildSystemPrompt(platform, persona) {
  const p = normalizePlatform(platform);
  const r = normalizePersona(persona);

  // 🔥 公众号：也评风格
  if (p === "wechat") {
    return `
你是一个高阅读量公众号作者。

你的写作目标：
不是写解释，而是表达观点。

【核心要求】
1. 必须有态度、有判断
2. 不要写“分析型文章”
3. 不要用：
- 首先 / 其次 / 最后
- 总而言之

【开头】
- 直接进入观点
- 不要铺垫

【正文】
- 像人在说话
- 可以有情绪
- 多用现实感

【标题】
- 必须有点击欲
- 要有：冲突 / 反转 / 情绪 / 判断

禁止：
❌ 关于XX的分析
❌ 几点思考

示例：
- 很多人都在说XX，但问题根本不在这
- 说实话，XX越看越不对劲
- 我越来越觉得，XX其实是误判

【输出】
- 不要 Markdown
- 不要解释
`;
  }

  // 🟠 今日头条
  if (p === "toutiao") {
    return `
你是一个今日头条爆文作者。

要求：
- 有观点
- 有争议感
- 有讨论空间
- 结尾加一句互动（你怎么看？）

不要写说明文
`;
  }

  // 🔵 微头条
  return `
你是一个微头条作者。

要求：
- 短
- 直接
- 有观点
- 开头就抓人

不要写成长文
`;
}

// ================= 模型调用 =================

async function callChatModel(messages) {
  try {
    const res = await fetch(process.env.DEEPSEEK_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL,
        messages,
        temperature: 0.9,
      }),
    });

    const json = await res.json();
    return json?.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

// ================= 标题生成 =================

async function generateTitles({ topic, platform, persona }) {
  const p = normalizePlatform(platform);

  const prompt =
    p === "wechat"
      ? `围绕“${topic}”生成4个爆文标题（必须有点击欲）`
      : `围绕“${topic}”生成4个适合${p}的标题`;

  const content = await callChatModel([
    { role: "system", content: buildSystemPrompt(platform, persona) },
    { role: "user", content: prompt },
  ]);

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return {
      titles: [
        { title: `很多人都在说${topic}，但问题不在这` },
        { title: `${topic}，其实很多人理解错了` },
      ],
    };
  }
}

// ================= 正文生成 =================

async function generateArticle({ title, platform, persona }) {
  const p = normalizePlatform(platform);

  const prompt = `
围绕标题“${title}”写一篇内容
`;

  let content = await callChatModel([
    { role: "system", content: buildSystemPrompt(platform, persona) },
    { role: "user", content: prompt },
  ]);

  content = cleanMarkdown(content);

  // ✅ 今日头条加互动
  if (p === "toutiao") {
    content += "\n\n你怎么看？";
  }

  return { content };
}

// ================= 导出 =================

module.exports = {
  generateTitles,
  generateArticle,
};