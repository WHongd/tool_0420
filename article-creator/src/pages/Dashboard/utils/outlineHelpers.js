function normalizeTitle(title = "") {
  return String(title).trim();
}

function pickOutlineCount(title) {
  const len = normalizeTitle(title).length;
  if (len <= 8) return 3;
  if (len <= 18) return 4;
  return 5;
}

function getPersonaOutlinePresets(persona, safeTitle) {
  if (persona === "emotion") {
    return [
      {
        title: "开头：情绪切入",
        summary: `直接点出“${safeTitle}”最让人有感触的地方，用情绪把读者拉进来。`,
      },
      {
        title: "为什么会这样",
        summary: `解释背后的原因，让情绪表达不只是宣泄，而是有逻辑。`,
      },
      {
        title: "现实中的典型场景",
        summary: `加入真实场景，让读者觉得这就是自己会遇到的事。`,
      },
      {
        title: "我的判断",
        summary: `明确表达你的态度和判断，不要模糊。`,
      },
      {
        title: "结尾：给读者一句话",
        summary: `用一句有力度的话收尾，增强记忆点。`,
      },
    ];
  }

  if (persona === "professional") {
    return [
      {
        title: "背景与定义",
        summary: `先把“${safeTitle}”的背景和边界讲清楚。`,
      },
      {
        title: "核心问题拆解",
        summary: `把问题拆成 2-3 个关键点，方便后面展开。`,
      },
      {
        title: "原因与影响",
        summary: `说明为什么会这样，以及它会带来什么结果。`,
      },
      {
        title: "案例或实际场景",
        summary: `用例子验证前面的分析，而不是只讲抽象结论。`,
      },
      {
        title: "结论与建议",
        summary: `输出清晰结论，并给出可执行建议。`,
      },
    ];
  }

  return [
    {
      title: "开头：背景与问题",
      summary: `用简短语言引出“${safeTitle}”为什么值得讨论。`,
    },
    {
      title: "核心观点一",
      summary: `先讲“${safeTitle}”里最重要的第一个判断或切入点。`,
    },
    {
      title: "核心观点二",
      summary: `补充第二层分析，展开方法、原因或关键细节。`,
    },
    {
      title: "案例 / 说明",
      summary: `加入例子、场景或具体说明，让内容更容易理解。`,
    },
    {
      title: "结尾：总结与行动",
      summary: `收束全文，给出总结、提醒或下一步建议。`,
    },
  ];
}

export function generateLocalOutline(title, persona = "normal") {
  const safeTitle = normalizeTitle(title) || "这个主题";
  const count = pickOutlineCount(safeTitle);
  const presets = getPersonaOutlinePresets(persona, safeTitle).slice(0, count);

  return presets.map((item, index) => ({
    id: `section_${index + 1}`,
    order: index + 1,
    title: item.title,
    summary: item.summary,
    content: "",
    status: "idle",
  }));
}

function buildBodyByPersona(articleTitle, sectionTitle, summary, persona) {
  if (persona === "emotion") {
    return [
      `围绕“${articleTitle}”，这一部分最重要的不是把话说满，而是把真实感受说透。`,
      `${summary}`,
      `很多人遇到类似情况时，表面上看是在讨论一件事，实际上是在表达压力、委屈或者不甘。`,
      `真正能打动人的内容，不是大道理，而是你把那种“我也经历过”的感觉写出来。`,
    ].join("\n");
  }

  if (persona === "professional") {
    return [
      `围绕“${articleTitle}”，这一部分重点分析 ${sectionTitle}。`,
      `${summary}`,
      `可以从问题定义、关键变量和实际影响三个层面展开，这样内容会更清晰。`,
      `写作时尽量减少空泛判断，多给出可验证的场景、逻辑和结论。`,
    ].join("\n");
  }

  return [
    `围绕“${articleTitle}”，这一部分重点展开 ${sectionTitle}。`,
    `${summary}`,
    `可以从用户场景、核心问题和实际价值三个角度继续往下写，让内容更完整、更有层次。`,
    `写作时尽量避免空泛描述，优先给出具体表达、简短判断和可执行的信息。`,
  ].join("\n");
}

export function generateLocalSectionContent(
  articleTitle,
  section,
  persona = "normal"
) {
  const safeArticleTitle = normalizeTitle(articleTitle) || "这个主题";
  const safeSectionTitle = section?.title || "这一部分";
  const safeSummary = section?.summary || "";

  return [
    `## ${safeSectionTitle}`,
    ``,
    buildBodyByPersona(
      safeArticleTitle,
      safeSectionTitle,
      safeSummary,
      persona
    ),
  ]
    .filter(Boolean)
    .join("\n");
}