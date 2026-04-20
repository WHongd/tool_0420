const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    occupation TEXT,
    platform TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    writingStyle TEXT NOT NULL, -- JSON 字符串
    contentPreference TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    personaId TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT,
    publishedAt TEXT,
    engagementMetrics TEXT, -- JSON
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articleId TEXT NOT NULL,
    createdAt TEXT,
    FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE
  );
`);

module.exports = db;