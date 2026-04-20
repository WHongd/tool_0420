const express = require("express");
const {
  generateTitles,
  generateWeitoutiao,
  generateOutline,
  generateSection,
  generateArticle,
} = require("../services/contentService");

const router = express.Router();

router.post("/generate-titles", async (req, res) => {
  try {
    const {
      topic = "",
      platform = "wechat",
      persona = "normal",
      candidateCount = 3,
    } = req.body || {};

    const result = await generateTitles({
      topic,
      platform,
      persona,
      candidateCount,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "标题生成失败" });
  }
});

router.post("/generate-weitoutiao", async (req, res) => {
  try {
    const { topic = "", platform = "weitoutiao", persona = "normal" } = req.body || {};
    const result = await generateWeitoutiao({ topic, platform, persona });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "微头条生成失败" });
  }
});

router.post("/generate-outline", async (req, res) => {
  try {
    const { title = "", platform = "wechat", persona = "normal" } = req.body || {};
    const result = await generateOutline({ title, platform, persona });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "大纲生成失败" });
  }
});

router.post("/generate-section", async (req, res) => {
  try {
    const {
      articleTitle = "",
      platform = "wechat",
      persona = "normal",
      section = {},
    } = req.body || {};

    const result = await generateSection({
      articleTitle,
      platform,
      persona,
      section,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "分段生成失败" });
  }
});

router.post("/generate-article", async (req, res) => {
  try {
    const {
      title = "",
      platform = "wechat",
      persona = "normal",
      withOutline = true,
    } = req.body || {};

    const result = await generateArticle({
      title,
      platform,
      persona,
      withOutline,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "全文生成失败" });
  }
});

module.exports = router;