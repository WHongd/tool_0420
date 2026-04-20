const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

async function addColumn() {
  try {
    const hasColumn = await db.schema.hasColumn('articles', 'aiProvider');
    if (!hasColumn) {
      await db.schema.table('articles', (table) => {
        table.string('aiProvider');
      });
      console.log('✅ 已成功添加 aiProvider 列到 articles 表');
    } else {
      console.log('✅ aiProvider 列已存在，无需添加');
    }
    process.exit(0);
  } catch (error) {
    console.error('添加列失败:', error.message);
    process.exit(1);
  }
}

addColumn();