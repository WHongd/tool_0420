const express = require("express");
const { run, get, mapDraft } = require("../database");

const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    const {
      topic = "",
      title = "",
      content = "",
      platform = "wechat",
      persona = "normal",
      personaId = null,
      personaName = "",
      outline = [],
      metadata = {},
    } = req.body || {};

    const result = await run(
      `
      INSERT INTO drafts (
        topic, title, content, platform, persona,
        persona_id, persona_name, outline, metadata,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        String(topic || ""),
        String(title || ""),
        String(content || ""),
        String(platform || "wechat"),
        String(persona || "normal"),
        personaId ?? null,
        String(personaName || ""),
        JSON.stringify(Array.isArray(outline) ? outline : []),
        JSON.stringify(metadata && typeof metadata === "object" ? metadata : {}),
      ]
    );

    const row = await get(`SELECT * FROM drafts WHERE id = ?`, [result.lastID]);

    res.json({
      success: true,
      data: {
        draftId: row.id,
        draft: mapDraft(row),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "保存草稿失败",
    });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const row = await get(`
      SELECT *
      FROM drafts
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: row ? mapDraft(row) : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "获取最近草稿失败",
    });
  }
});

module.exports = router;