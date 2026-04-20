const express = require("express");
const { all, get, run, mapPersona } = require("../database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await all(`
      SELECT * FROM personas
      ORDER BY updated_at DESC, id DESC
    `);
    res.json(rows.map(mapPersona));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设失败" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await get(`SELECT * FROM personas WHERE id = ?`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: "Persona not found" });
    }
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设详情失败" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      role,
      intro = "",
      tone = "",
      audience = "",
      prompt = "",
      tags = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!role || !String(role).trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    const finalPrompt =
      String(prompt).trim() ||
      [
        `角色定位：${role}`,
        intro ? `角色简介：${intro}` : "",
        tone ? `语气风格：${tone}` : "",
        audience ? `目标受众：${audience}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    const result = await run(
      `
      INSERT INTO personas (
        name, role, intro, tone, audience, prompt, tags,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [name.trim(), role.trim(), intro, tone, audience, finalPrompt, tags]
    );

    const row = await get(`SELECT * FROM personas WHERE id = ?`, [result.lastID]);
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建人设失败" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      role,
      intro = "",
      tone = "",
      audience = "",
      prompt = "",
      tags = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!role || !String(role).trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    const finalPrompt =
      String(prompt).trim() ||
      [
        `角色定位：${role}`,
        intro ? `角色简介：${intro}` : "",
        tone ? `语气风格：${tone}` : "",
        audience ? `目标受众：${audience}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    const result = await run(
      `
      UPDATE personas
      SET name = ?, role = ?, intro = ?, tone = ?, audience = ?, prompt = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [name.trim(), role.trim(), intro, tone, audience, finalPrompt, tags, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }

    const row = await get(`SELECT * FROM personas WHERE id = ?`, [req.params.id]);
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新人设失败" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await run(`DELETE FROM personas WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除人设失败" });
  }
});

module.exports = router;