const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articleId TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('创建表失败:', err.message);
    else console.log('favorites 表已就绪');
  });
});

db.close();