const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

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

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function mapDraft(row) {
  if (!row) return null;
  return {
    draftId: row.id,
    id: row.id,
    topic: row.topic || "",
    title: row.title || "",
    content: row.content || "",
    platform: row.platform || "wechat",
    persona: row.persona || "normal",
    personaId: row.persona_id,
    personaName: row.persona_name || "",
    outline: safeJsonParse(row.outline, []),
    metadata: safeJsonParse(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

  await run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT,
      title TEXT,
      content TEXT,
      platform TEXT DEFAULT 'wechat',
      persona TEXT DEFAULT 'normal',
      persona_id INTEGER,
      persona_name TEXT,
      outline TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("数据库初始化完成。");
}

module.exports = {
  db,
  run,
  get,
  all,
  safeJsonParse,
  mapPersona,
  mapArticle,
  mapFavorite,
  mapDraft,
  initDatabase,
};