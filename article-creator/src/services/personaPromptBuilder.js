const PLATFORM_LABELS = {
  toutiao: '今日头条',
  weitoutiao: '微头条',
  baijiahao: '百家号',
  wechat: '微信公众号',
  xiaohongshu: '小红书',
  zhihu: '知乎',
};

function safeJoin(values = [], separator = '、') {
  return values.filter(Boolean).join(separator);
}

function normalizeWritingStyle(writingStyle) {
  if (!writingStyle || typeof writingStyle !== 'object') {
    return {};
  }

  return writingStyle;
}

export function buildPersonaProfile(persona) {
  if (!persona) {
    return `
你是一名专业中文内容创作者。
请输出自然、清晰、有信息密度的中文内容。
`.trim();
  }

  const style = normalizeWritingStyle(persona.writingStyle);

  const styleParts = [
    style.tone && `语气偏${style.tone}`,
    style.voice && `表达风格偏${style.voice}`,
    style.structure && `行文结构偏${style.structure}`,
    style.audience && `目标读者是${style.audience}`,
    style.taboos &&
      Array.isArray(style.taboos) &&
      style.taboos.length > 0 &&
      `避免${safeJoin(style.taboos)}`,
    style.keywords &&
      Array.isArray(style.keywords) &&
      style.keywords.length > 0 &&
      `可适当融入${safeJoin(style.keywords)}`,
  ].filter(Boolean);

  const platformName = PLATFORM_LABELS[persona.platform] || persona.platform || '通用平台';

  return `
你现在要扮演以下创作者人设进行写作：

【人设信息】
- 名称：${persona.name || '未命名人设'}
- 职业/身份：${persona.occupation || '内容创作者'}
- 平台：${platformName}

【写作要求】
- 必须以这个人设的认知方式、表达习惯、关注重点来写
- 内容要像真人作者写的，不要有 AI 腔，不要空话套话
- 允许有明确观点，但不要脱离素材瞎编事实
- 优先输出适合中文互联网传播的表达

${styleParts.length > 0 ? `【风格特征】\n- ${styleParts.join('\n- ')}` : ''}
`.trim();
}

export function buildExpandPrompt({ persona, material }) {
  const profile = buildPersonaProfile(persona);

  return `
${profile}

【任务】
请基于下面的素材，写出一篇可直接发布的中文文章。

【素材】
${material}

【输出要求】
- 先拟一个具体、自然、有传播力的标题
- 再输出正文
- 正文要有清晰结构，不要只有空泛观点
- 内容要结合人设身份来组织语言
- 不要解释你在做什么，不要输出提示语
- 不要使用“作为一名AI”这类表述

【返回格式】
请严格返回 JSON：
{
  "title": "文章标题",
  "content": "<p>第一段</p><p>第二段</p>"
}
`.trim();
}

export function buildTitlePrompt({ persona, content, count = 3 }) {
  const profile = buildPersonaProfile(persona);

  return `
${profile}

【任务】
请基于以下文章内容，生成 ${count} 个中文标题。

【文章内容】
${content}

【标题要求】
- 适合中文内容平台传播
- 避免夸张低质标题党
- 要体现文章核心信息
- 风格符合该人设和平台

【返回格式】
请严格返回 JSON：
{
  "titles": ["标题1", "标题2", "标题3"]
}
`.trim();
}

export function buildOptimizePrompt({ persona, content, suggestions }) {
  const profile = buildPersonaProfile(persona);

  return `
${profile}

【任务】
请根据以下优化建议，润色并优化文章正文。

【原文】
${content}

【优化建议】
${suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n')}

【要求】
- 保留原文核心信息
- 按人设风格优化表达
- 提升可读性、逻辑性和传播性
- 输出 HTML 段落格式

【返回格式】
请严格返回优化后的 HTML 正文，不要附加解释。
`.trim();
}

export function buildAnalyzePrompt({ persona, content }) {
  const profile = buildPersonaProfile(persona);

  return `
${profile}

【任务】
请分析下面文章的质量，并给出评分与建议。

【文章内容】
${content}

【评分维度】
- clarity：清晰度
- structure：结构性
- engagement：吸引力
- originality：原创感
- personaMatch：与人设匹配度

【返回格式】
请严格返回 JSON：
{
  "overall": 82,
  "clarity": 80,
  "structure": 84,
  "engagement": 83,
  "originality": 78,
  "personaMatch": 86,
  "suggestions": ["建议1", "建议2"]
}
`.trim();
}

export function buildRewritePrompt({ persona, content, style }) {
  const profile = buildPersonaProfile(persona);

  const rewriteMap = {
    casual: '更口语化、更自然、更像真人聊天表达',
    professional: '更专业、更凝练、更有分析感',
    shorter: '保留核心信息，但整体更短更紧凑',
    longer: '保留主题不变，扩充细节、例子和解释',
  };

  return `
${profile}

【任务】
请将下面文章按指定风格改写。

【原文】
${content}

【改写方向】
${rewriteMap[style] || style}

【要求】
- 保持核心意思不变
- 改写后仍符合当前人设表达方式
- 输出 HTML 段落格式
- 不要附加说明

【返回格式】
请严格返回改写后的 HTML 正文。
`.trim();
}