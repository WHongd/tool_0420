const express = require("express");
const { all, get, run, mapFavorite } = require("../database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await all(`
      SELECT * FROM favorites
      ORDER BY created_at DESC, id DESC
    `);
    res.json(rows.map(mapFavorite));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取收藏失败" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { targetType, targetId } = req.body;

    if (!targetType || !String(targetType).trim()) {
      return res.status(400).json({ error: "targetType is required" });
    }
    if (targetId === undefined || targetId === null) {
      return res.status(400).json({ error: "targetId is required" });
    }

    const exists = await get(
      `SELECT * FROM favorites WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );

    if (exists) {
      return res.json(mapFavorite(exists));
    }

    const result = await run(
      `INSERT INTO favorites (target_type, target_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [targetType, targetId]
    );

    const row = await get(`SELECT * FROM favorites WHERE id = ?`, [result.lastID]);
    res.json(mapFavorite(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建收藏失败" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await run(`DELETE FROM favorites WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除收藏失败" });
  }
});

module.exports = router;