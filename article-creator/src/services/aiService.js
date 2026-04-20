const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function buildLocalTitleCandidates(topic, platform, persona, candidateCount = 3) {
  const safeTopic = String(topic || "").trim() || "这个话题";

  const personaPrefixMap = {
    normal: ["很多人忽略了", "别低估了", "真正值得想清楚的"],
    emotion: ["说实话", "越来越多人开始意识到", "最让人难受的是"],
    professional: ["从结果来看", "真正需要拆开的", "最值得分析的"],
  };

  const platformSuffixMap = {
    wechat: [
      `为什么“${safeTopic}”值得认真聊一聊？`,
      `关于“${safeTopic}”，很多人其实一直想浅了`,
      `“${safeTopic}”背后，藏着一个更现实的问题`,
    ],
    toutiao: [
      `“${safeTopic}”为什么总能引发争议？`,
      `关于“${safeTopic}”，这几点很关键`,
      `很多人都在谈“${safeTopic}”，但重点不是表面`,
    ],
    weitoutiao: [
      `“${safeTopic}”这件事，真的越来越明显了`,
      `关于“${safeTopic}”，我有几句实话想说`,
      `“${safeTopic}”背后，其实很现实`,
    ],
  };

  const prefixes = personaPrefixMap[persona] || personaPrefixMap.normal;
  const suffixes = platformSuffixMap[platform] || platformSuffixMap.wechat;

  return Array.from({ length: candidateCount }).map((_, index) => ({
    title: `${prefixes[index % prefixes.length]}：${suffixes[index % suffixes.length]}`,
    score: 90 - index * 3,
    reason: "本地 fallback 结果",
  }));
}

function buildLocalWeitoutiao({ topic, persona }) {
  const safeTopic = String(topic || "").trim() || "这个话题";

  if (persona === "emotion") {
    return `说实话，关于“${safeTopic}”，很多人表面上在讨论一件事，实际上是在表达委屈、压力和不甘。你以为只是小问题，放到现实里才会发现，它真正影响的是情绪、判断和选择。很多时候，不是事情本身有多复杂，而是身处其中的人太容易被消耗。`;
  }

  if (persona === "professional") {
    return `围绕“${safeTopic}”，如果只看表面现象，很容易得出片面结论。真正值得关注的是它背后的逻辑链条：问题为什么发生、影响了谁、会带来什么结果，以及普通人该如何判断和应对。把这几点想清楚，内容才有价值。`;
  }

  return `很多人聊“${safeTopic}”时，只停留在表面判断。但真正值得说的，不只是一个观点，而是它背后的现实处境、常见误区和实际影响。把这件事讲明白，往往比单纯表态更有价值。`;
}

function buildLocalOutline({ title, persona }) {
  const safeTitle = String(title || "").trim() || "这个主题";

  if (persona === "emotion") {
    return [
      {
        id: "section_1",
        order: 1,
        title: "开头：先把情绪拉进来",
        summary: `直接点出“${safeTitle}”最让人有感触的地方。`,
      },
      {
        id: "section_2",
        order: 2,
        title: "问题为什么会发生",
        summary: "说明背后的原因，不只是发泄情绪。",
      },
      {
        id: "section_3",
        order: 3,
        title: "现实里最常见的场景",
        summary: "用典型场景让读者对号入座。",
      },
      {
        id: "section_4",
        order: 4,
        title: "我的判断",
        summary: "明确表达你的态度，不要模糊。",
      },
    ];
  }

  if (persona === "professional") {
    return [
      {
        id: "section_1",
        order: 1,
        title: "背景与定义",
        summary: `先把“${safeTitle}”的讨论边界讲清楚。`,
      },
      {
        id: "section_2",
        order: 2,
        title: "核心问题拆解",
        summary: "拆出 2-3 个关键点。",
      },
      {
        id: "section_3",
        order: 3,
        title: "原因与影响",
        summary: "解释为什么会这样，以及会带来什么结果。",
      },
      {
        id: "section_4",
        order: 4,
        title: "结论与建议",
        summary: "给出清晰结论和可执行建议。",
      },
    ];
  }

  return [
    {
      id: "section_1",
      order: 1,
      title: "开头：背景与问题",
      summary: `用简短语言引出“${safeTitle}”为什么值得讨论。`,
    },
    {
      id: "section_2",
      order: 2,
      title: "核心观点一",
      summary: "先讲最重要的切入点。",
    },
    {
      id: "section_3",
      order: 3,
      title: "核心观点二",
      summary: "补充第二层分析和细节。",
    },
    {
      id: "section_4",
      order: 4,
      title: "结尾：总结与行动",
      summary: "收束全文，给出总结或提醒。",
    },
  ];
}

function buildLocalSection({ articleTitle, section, persona }) {
  const title = String(articleTitle || "").trim() || "这个主题";
  const sectionTitle = section?.title || "这一部分";
  const summary = section?.summary || "";

  if (persona === "emotion") {
    return `## ${sectionTitle}

围绕“${title}”，这一部分最重要的不是把话说满，而是把真实感受说透。

${summary}

很多人遇到类似情况时，表面上看是在讨论一件事，实际上是在表达压力、委屈或者不甘。真正能打动人的内容，不是大道理，而是那种“我也经历过”的感觉。`;
  }

  if (persona === "professional") {
    return `## ${sectionTitle}

围绕“${title}”，这一部分重点分析 ${sectionTitle}。

${summary}

可以从问题定义、关键变量和实际影响三个层面展开，这样内容会更清晰。写作时尽量减少空泛判断，多给出可验证的场景、逻辑和结论。`;
  }

  return `## ${sectionTitle}

围绕“${title}”，这一部分重点展开 ${sectionTitle}。

${summary}

可以从用户场景、核心问题和实际价值三个角度继续往下写，让内容更完整、更有层次。写作时尽量避免空泛描述，优先给出具体表达、简短判断和可执行的信息。`;
}

function buildLocalArticle({ title, platform, persona }) {
  const outline = platform === "wechat" ? buildLocalOutline({ title, persona }) : [];
  const opening =
    persona === "emotion"
      ? `说实话，看到“${title}”这个话题，我第一反应不是复杂，而是很多人真的一直没把它想明白。`
      : persona === "professional"
      ? `围绕“${title}”这个主题，如果只做表层表达，很容易失去内容价值。`
      : `很多人一开始看到“${title}”这个问题时，往往只会停留在表面理解。`;

  let content = opening;

  if (platform === "wechat") {
    outline.forEach((section) => {
      content += `\n\n${buildLocalSection({
        articleTitle: title,
        section,
        persona,
      })}`;
    });
  } else {
    content += `\n\n${buildLocalWeitoutiao({ topic: title, persona })}`;
  }

  return {
    outline,
    content,
  };
}

const aiService = {
  async generateTitleAnalysis({ topic, platform, persona, candidateCount = 3 }) {
    try {
      const json = await request("/api/content/generate-titles", {
        method: "POST",
        body: JSON.stringify({
          topic,
          platform,
          persona,
          candidateCount,
        }),
      });

      const titles = json?.data?.titles || [];
      const bestTitle = json?.data?.bestTitle || titles?.[0]?.title || "";

      return {
        titles,
        bestTitle,
      };
    } catch {
      const titles = buildLocalTitleCandidates(topic, platform, persona, candidateCount);
      return {
        titles,
        bestTitle: titles?.[0]?.title || "",
      };
    }
  },

  async generateWeitoutiao({ topic, platform, persona }) {
    try {
      const json = await request("/api/content/generate-weitoutiao", {
        method: "POST",
        body: JSON.stringify({
          topic,
          platform,
          persona,
        }),
      });

      return {
        content: json?.data?.content || "",
      };
    } catch {
      return {
        content: buildLocalWeitoutiao({ topic, persona }),
      };
    }
  },

  async generateOutline({ title, platform, persona }) {
    try {
      const json = await request("/api/content/generate-outline", {
        method: "POST",
        body: JSON.stringify({
          title,
          platform,
          persona,
        }),
      });

      return {
        sections: json?.data?.sections || [],
      };
    } catch {
      return {
        sections: buildLocalOutline({ title, persona }),
      };
    }
  },

  async generateSection({ articleTitle, platform, persona, section }) {
    try {
      const json = await request("/api/content/generate-section", {
        method: "POST",
        body: JSON.stringify({
          articleTitle,
          platform,
          persona,
          section,
        }),
      });

      return {
        content: json?.data?.content || "",
      };
    } catch {
      return {
        content: buildLocalSection({ articleTitle, section, persona }),
      };
    }
  },

  async generateArticle({ title, platform, persona, withOutline = true }) {
    try {
      const json = await request("/api/content/generate-article", {
        method: "POST",
        body: JSON.stringify({
          title,
          platform,
          persona,
          withOutline,
        }),
      });

      return {
        outline: json?.data?.outline || [],
        content: json?.data?.content || "",
      };
    } catch {
      return buildLocalArticle({ title, platform, persona });
    }
  },

  async saveDraft(payload) {
    const json = await request("/api/drafts/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      draftId: json?.data?.draftId || "",
    };
  },

  async getLatestDraft() {
    const json = await request("/api/drafts/latest", {
      method: "GET",
    });

    return json?.data || null;
  },
};

export default aiService;