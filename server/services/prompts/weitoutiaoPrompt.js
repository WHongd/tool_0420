function getWeitoutiaoPrompt(topic, count, compactText) {
  const safeTopic = compactText(topic) || "这个话题";

  return `
请围绕主题“${safeTopic}”，生成 ${count} 个微头条标题。

【核心目标】
快速表达观点，让人一眼明白 + 愿意点

---

【要求】

- 简短（10~18字）  
- 直接表达  
- 有明确观点  

---

【表达方式】

✔ X这事，没那么简单  
✔ 很多人都看错了  
✔ 这件事，普通人要小心  
✔ 真正的问题不在这  

---

【禁止】

- 空话  
- 分析标题  
- 复杂结构  

---

【输出格式】

返回 JSON：
{
  "titles": [
    { "title": "标题1", "score": 95, "reason": "原因" }
  ],
  "bestTitle": "最佳标题"
}

只返回 JSON，不要解释
`.trim();
}

module.exports = {
  getWeitoutiaoPrompt,
};