const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

async function initDatabase() {
  try {
    // 检查 articles 表是否存在
    const hasArticles = await db.schema.hasTable('articles');
    if (!hasArticles) {
      console.log('❌ articles 表不存在，请先运行主服务器创建表');
      process.exit(1);
    }

    // 添加 aiScore 列（如果不存在）
    const hasAiScore = await db.schema.hasColumn('articles', 'aiScore');
    if (!hasAiScore) {
      await db.schema.table('articles', (table) => {
        table.text('aiScore');
      });
      console.log('✅ 已添加 aiScore 列到 articles 表');
    } else {
      console.log('✅ aiScore 列已存在');
    }

    // 添加 engagementMetrics 列（如果不存在）
    const hasEngagementMetrics = await db.schema.hasColumn('articles', 'engagementMetrics');
    if (!hasEngagementMetrics) {
      await db.schema.table('articles', (table) => {
        table.text('engagementMetrics');
      });
      console.log('✅ 已添加 engagementMetrics 列到 articles 表');
    } else {
      console.log('✅ engagementMetrics 列已存在');
    }

    console.log('数据库表结构修复完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error.message);
    process.exit(1);
  }
}

initDatabase();