const express = require('express');
const cors = require('cors');
const knex = require('knex');
const knexConfig = require('./knexfile');

const app = express();
const db = knex(knexConfig.development);

// 将 db 实例挂载到 app，供路由文件使用
app.set('db', db);

app.use(cors());
app.use(express.json());

// ========== 自动创建或修复表结构 ==========
async function initDatabase() {
  // 创建 personas 表
  const hasPersonas = await db.schema.hasTable('personas');
  if (!hasPersonas) {
    await db.schema.createTable('personas', (table) => {
      table.string('id').primary();
      table.string('name');
      table.integer('age');
      table.string('occupation');
      table.string('platform');
      table.text('avatar');
      table.text('bio');
      table.text('writingStyle');
      table.string('contentPreference');
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.timestamp('updatedAt').defaultTo(db.fn.now());
    });
    console.log('✅ 表 personas 创建成功');
  } else {
    console.log('✅ 表 personas 已存在');
  }

  // 创建 articles 表（包含 publishedAt 和 aiProvider 列）
  const hasArticles = await db.schema.hasTable('articles');
  if (!hasArticles) {
    await db.schema.createTable('articles', (table) => {
      table.string('id').primary();
      table.string('title');
      table.text('content');
      table.string('personaId');
      table.string('platform');
      table.string('status');
      table.text('aiScore');
      table.text('engagementMetrics');
      table.timestamp('createdAt');
      table.timestamp('updatedAt');
      table.timestamp('publishedAt');
      table.string('aiProvider');  // 新增：记录使用的AI模型
    });
    console.log('✅ 表 articles 创建成功');
  } else {
    console.log('✅ 表 articles 已存在');
    // 检查并添加 publishedAt 列（兼容旧表）
    const hasPublishedAt = await db.schema.hasColumn('articles', 'publishedAt');
    if (!hasPublishedAt) {
      await db.schema.table('articles', (table) => {
        table.timestamp('publishedAt');
      });
      console.log('✅ 已添加 publishedAt 列到 articles 表');
    }
    // 检查并添加 aiProvider 列
    const hasAiProvider = await db.schema.hasColumn('articles', 'aiProvider');
    if (!hasAiProvider) {
      await db.schema.table('articles', (table) => {
        table.string('aiProvider');
      });
      console.log('✅ 已添加 aiProvider 列到 articles 表');
    }
  }

  // 创建 favorites 表
  const hasFavorites = await db.schema.hasTable('favorites');
  if (!hasFavorites) {
    await db.schema.createTable('favorites', (table) => {
      table.increments('id');
      table.string('articleId').notNullable().unique();
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
    console.log('✅ 表 favorites 创建成功');
  } else {
    console.log('✅ 表 favorites 已存在');
  }
}

// 执行数据库初始化（不阻塞启动）
initDatabase().catch(err => console.error('数据库初始化失败:', err));

// ========== 挂载收藏夹路由 ==========
const favoritesRouter = require('./routes/favorites');
app.use('/api/favorites', favoritesRouter);

// ========== 人设相关接口 ==========
app.get('/api/personas', async (req, res) => {
  try {
    const personas = await db('personas').select('*').whereNotNull('id').orderBy('createdAt', 'desc');
    personas.forEach(p => {
      if (p.writingStyle) {
        try {
          p.writingStyle = JSON.parse(p.writingStyle);
        } catch (e) {
          p.writingStyle = {};
        }
      }
    });
    res.json(personas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/personas', async (req, res) => {
  try {
    const { id, name, age, occupation, platform, avatar, bio, writingStyle, contentPreference } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少 id 字段' });
    }
    const newPersona = {
      id,
      name: name || '',
      age: age || 0,
      occupation: occupation || '',
      platform: platform || 'toutiao',
      avatar: avatar || null,
      bio: bio || '',
      writingStyle: JSON.stringify(writingStyle || {}),
      contentPreference: contentPreference || 'mixed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db('personas').insert(newPersona);
    const inserted = { ...newPersona };
    if (inserted.writingStyle) inserted.writingStyle = JSON.parse(inserted.writingStyle);
    res.status(201).json(inserted);
  } catch (err) {
    console.error('创建人设失败:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.writingStyle) {
      updates.writingStyle = JSON.stringify(updates.writingStyle);
    }
    updates.updatedAt = new Date().toISOString();
    await db('personas').where({ id }).update(updates);
    const updated = await db('personas').where({ id }).first();
    if (updated && updated.writingStyle) {
      updated.writingStyle = JSON.parse(updated.writingStyle);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('personas').where({ id }).del();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== 文章相关接口 ==========
app.get('/api/articles', async (req, res) => {
  try {
    let query = db('articles').select('*');
    if (req.query.personaId) query = query.where('personaId', req.query.personaId);
    if (req.query.platform) query = query.where('platform', req.query.platform);
    if (req.query.status) query = query.where('status', req.query.status);
    const articles = await query;
    articles.forEach(a => {
      if (a.aiScore) a.aiScore = JSON.parse(a.aiScore);
      if (a.engagementMetrics) a.engagementMetrics = JSON.parse(a.engagementMetrics);
    });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const article = req.body;
    const now = new Date().toISOString();
    const newArticle = {
      ...article,
      aiScore: article.aiScore ? JSON.stringify(article.aiScore) : null,
      engagementMetrics: article.engagementMetrics ? JSON.stringify(article.engagementMetrics) : null,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      aiProvider: article.aiProvider || null,  // 保存 AI 提供商
    };
    await db('articles').insert(newArticle);
    res.status(201).json(article);
  } catch (err) {
    console.error('发布文章失败:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('articles').where({ id }).del();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});