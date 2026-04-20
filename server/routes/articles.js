const express = require("express");
const { all, get, run, mapArticle } = require("../database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await all(`
      SELECT * FROM articles
      ORDER BY updated_at DESC, id DESC
    `);
    res.json(rows.map(mapArticle));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章失败" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await get(`SELECT * FROM articles WHERE id = ?`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章详情失败" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title = "未命名文章",
      content = "",
      personaId = null,
      personaName = "",
    } = req.body;

    if (!String(content).trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await run(
      `
      INSERT INTO articles (
        title, content, persona_id, persona_name,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [title, content, personaId, personaName]
    );

    const row = await get(`SELECT * FROM articles WHERE id = ?`, [result.lastID]);
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建文章失败" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      title = "未命名文章",
      content = "",
      personaId = null,
      personaName = "",
    } = req.body;

    if (!String(content).trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await run(
      `
      UPDATE articles
      SET title = ?, content = ?, persona_id = ?, persona_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [title, content, personaId, personaName, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const row = await get(`SELECT * FROM articles WHERE id = ?`, [req.params.id]);
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新文章失败" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await run(`DELETE FROM articles WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除文章失败" });
  }
});

module.exports = router;