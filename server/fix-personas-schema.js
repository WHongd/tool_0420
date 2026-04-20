const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// 你的仓库结构是：tool/server + tool/database.sqlite
// 所以 server 目录下脚本应指向上一级数据库文件
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

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const columnNames = columns.map((item) => item.name);

  if (!columnNames.includes(columnName)) {
    console.log(`${tableName} 表缺少 ${columnName} 字段，开始补充...`);
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  } else {
    console.log(`${tableName}.${columnName} 已存在，跳过。`);
  }
}

async function main() {
  try {
    console.log("开始检查并修复数据库字段...");

    // personas
    await ensureColumn("personas", "name", "TEXT");
    await ensureColumn("personas", "tags", "TEXT");
    await ensureColumn("personas", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("personas", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

    console.log("开始回填 personas.name ...");
    await run(`
      UPDATE personas
      SET name = CASE
        WHEN role IS NOT NULL AND TRIM(role) <> '' THEN role
        ELSE '未命名人设'
      END
      WHERE name IS NULL OR TRIM(name) = ''
    `);

    console.log("开始补齐 personas.created_at ...");
    await run(`
      UPDATE personas
      SET created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL OR TRIM(created_at) = ''
    `);

    console.log("开始补齐 personas.updated_at ...");
    await run(`
      UPDATE personas
      SET updated_at = CURRENT_TIMESTAMP
      WHERE updated_at IS NULL OR TRIM(updated_at) = ''
    `);

    // articles
    const articleTables = await all(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = 'articles'
    `);

    if (articleTables.length > 0) {
      await ensureColumn("articles", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");
      await ensureColumn("articles", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

      console.log("开始补齐 articles.created_at ...");
      await run(`
        UPDATE articles
        SET created_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL OR TRIM(created_at) = ''
      `);

      console.log("开始补齐 articles.updated_at ...");
      await run(`
        UPDATE articles
        SET updated_at = CURRENT_TIMESTAMP
        WHERE updated_at IS NULL OR TRIM(updated_at) = ''
      `);
    }

    // favorites
    const favoriteTables = await all(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = 'favorites'
    `);

    if (favoriteTables.length > 0) {
      await ensureColumn("favorites", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

      console.log("开始补齐 favorites.created_at ...");
      await run(`
        UPDATE favorites
        SET created_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL OR TRIM(created_at) = ''
      `);
    }

    console.log("数据库字段修复完成。");
  } catch (error) {
    console.error("修复失败：", error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error("关闭数据库失败：", err);
      } else {
        console.log("数据库连接已关闭。");
      }
    });
  }
}

main();