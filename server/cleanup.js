const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

db.run("DELETE FROM personas WHERE id IS NULL", function(err) {
  if (err) {
    console.error('清理失败:', err.message);
  } else {
    console.log(`已删除 ${this.changes} 条 id 为 null 的记录`);
  }
  db.close();
});