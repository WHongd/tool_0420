const path = require("path");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// 按你的实际数据库路径修改
const dbPath = path.resolve(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function mapPersona(row) {
  if (!row) return row;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    intro: row.intro,
    tone: row.tone,
    audience: row.audience,
    prompt: row.prompt,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArticle(row) {
  if (!row) return row;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    personaId: row.persona_id,
    personaName: row.persona_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFavorite(row) {
  if (!row) return row;

  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
  };
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      intro TEXT,
      tone TEXT,
      audience TEXT,
      prompt TEXT NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      persona_id INTEGER,
      persona_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("数据库初始化完成。");
}

/**
 * 健康检查
 */
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

/**
 * Personas
 */

// 获取全部人设：不搜索，直接返回全部，按更新时间倒序
app.get("/api/personas", async (req, res) => {
  try {
    const rows = await all(
      `
      SELECT *
      FROM personas
      ORDER BY updated_at DESC, id DESC
      `
    );

    res.json(rows.map(mapPersona));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设失败" });
  }
});

// 获取单个人设
app.get("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get(`SELECT * FROM personas WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({ error: "Persona not found" });
    }

    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设详情失败" });
  }
});

// 新建人设
app.post("/api/personas", async (req, res) => {
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
        name,
        role,
        intro,
        tone,
        audience,
        prompt,
        tags,
        created_at,
        updated_at
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

// 编辑人设
app.put("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
      SET
        name = ?,
        role = ?,
        intro = ?,
        tone = ?,
        audience = ?,
        prompt = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [name.trim(), role.trim(), intro, tone, audience, finalPrompt, tags, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }

    const row = await get(`SELECT * FROM personas WHERE id = ?`, [id]);
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新人设失败" });
  }
});

// 删除人设
app.delete("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM personas WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除人设失败" });
  }
});

/**
 * Articles
 */

// 获取文章列表
app.get("/api/articles", async (req, res) => {
  try {
    const rows = await all(
      `
      SELECT *
      FROM articles
      ORDER BY updated_at DESC, id DESC
      `
    );

    res.json(rows.map(mapArticle));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章失败" });
  }
});

// 获取单篇文章
app.get("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get(`SELECT * FROM articles WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章详情失败" });
  }
});

// 新建文章
app.post("/api/articles", async (req, res) => {
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
        title,
        content,
        persona_id,
        persona_name,
        created_at,
        updated_at
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

// 更新文章
app.put("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
      SET
        title = ?,
        content = ?,
        persona_id = ?,
        persona_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [title, content, personaId, personaName, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const row = await get(`SELECT * FROM articles WHERE id = ?`, [id]);
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新文章失败" });
  }
});

// 删除文章
app.delete("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM articles WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除文章失败" });
  }
});

/**
 * Favorites
 */

// 获取收藏
app.get("/api/favorites", async (req, res) => {
  try {
    const rows = await all(
      `
      SELECT *
      FROM favorites
      ORDER BY created_at DESC, id DESC
      `
    );

    res.json(rows.map(mapFavorite));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取收藏失败" });
  }
});

// 新建收藏
app.post("/api/favorites", async (req, res) => {
  try {
    const { targetType, targetId } = req.body;

    if (!targetType || !String(targetType).trim()) {
      return res.status(400).json({ error: "targetType is required" });
    }

    if (targetId === undefined || targetId === null) {
      return res.status(400).json({ error: "targetId is required" });
    }

    const exists = await get(
      `
      SELECT *
      FROM favorites
      WHERE target_type = ? AND target_id = ?
      `,
      [targetType, targetId]
    );

    if (exists) {
      return res.json(mapFavorite(exists));
    }

    const result = await run(
      `
      INSERT INTO favorites (target_type, target_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      [targetType, targetId]
    );

    const row = await get(`SELECT * FROM favorites WHERE id = ?`, [result.lastID]);
    res.json(mapFavorite(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建收藏失败" });
  }
});

// 删除收藏
app.delete("/api/favorites/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM favorites WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除收藏失败" });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("数据库初始化失败：", error);
    process.exit(1);
  });