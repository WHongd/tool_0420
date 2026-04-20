export function getTitleCandidates(result) {
  if (Array.isArray(result?.data?.candidates)) return result.data.candidates;
  if (Array.isArray(result?.candidates)) return result.candidates;
  return [];
}

export function getScoreValue(score) {
  if (typeof score === "number") return score;

  if (score && typeof score === "object") {
    if (typeof score.overall === "number") return score.overall;
    if (typeof score.total === "number") return score.total;
  }

  return -1;
}

export function getTitleText(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.title || "";
}

export function normalizeTitleItem(item) {
  if (!item) return null;

  if (typeof item === "string") {
    return {
      title: item,
      reason: "",
      style: "",
      platformFit: "",
      suggestion: "",
      score: null,
      raw: item,
    };
  }

  return {
    title: item.title || "",
    reason:
      item.reason ||
      item.recommendReason ||
      item.analysis ||
      item.description ||
      "",
    style: item.style || item.styleLabel || "",
    platformFit:
      item.platformFit || item.platform_fit || item.platformAnalysis || "",
    suggestion:
      item.suggestion || item.optimizationSuggestion || item.tip || "",
    score: item.score ?? null,
    raw: item,
  };
}

export function pickTopTitleByStyle(items = []) {
  const normalizedItems = items
    .map((item) => normalizeTitleItem(item))
    .filter((item) => item?.title);

  const grouped = new Map();

  normalizedItems.forEach((item) => {
    const styleKey = item.style || "__default__";
    const current = grouped.get(styleKey);

    if (!current) {
      grouped.set(styleKey, item);
      return;
    }

    if (getScoreValue(item.score) > getScoreValue(current.score)) {
      grouped.set(styleKey, item);
    }
  });

  return Array.from(grouped.values());
}

export function getTopThreeCandidates(result) {
  const rawCandidates = getTitleCandidates(result);

  if (!rawCandidates.length) return [];

  const stylePicked = pickTopTitleByStyle(rawCandidates);

  return stylePicked.slice(0, 3);
}

export function getBestTitleItem(result) {
  const best = result?.data?.bestTitle ?? result?.bestTitle ?? null;

  if (!best) {
    return getTopThreeCandidates(result)[0] || null;
  }

  if (typeof best === "string") {
    return { title: best };
  }

  return best;
}

export function findCandidateByTitle(result, title) {
  const candidates = getTopThreeCandidates(result);
  return candidates.find((item) => getTitleText(item) === title) || null;
}