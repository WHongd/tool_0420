const express = require('express');
const router = express.Router();

// 注意：需要从主应用传入 db 实例，或者通过 req.app.get('db') 获取
// 这里假设主应用中已设置 app.set('db', db)，然后通过 req.app.get('db') 获取

// 获取收藏列表
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db'); // 获取 knex 实例
    const rows = await db('favorites').select('articleId').orderBy('createdAt', 'desc');
    const articleIds = rows.map(row => row.articleId);
    res.json(articleIds);
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 添加收藏
router.post('/:articleId', async (req, res) => {
  const { articleId } = req.params;
  if (!articleId) {
    return res.status(400).json({ error: '缺少 articleId' });
  }
  try {
    const db = req.app.get('db');
    // 检查是否已收藏
    const existing = await db('favorites').where({ articleId }).first();
    if (existing) {
      return res.status(409).json({ error: '已经收藏过这篇文章' });
    }
    await db('favorites').insert({
      articleId,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, articleId });
  } catch (err) {
    console.error('添加收藏失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 取消收藏
router.delete('/:articleId', async (req, res) => {
  const { articleId } = req.params;
  try {
    const db = req.app.get('db');
    const deletedCount = await db('favorites').where({ articleId }).del();
    if (deletedCount === 0) {
      return res.status(404).json({ error: '收藏记录不存在' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('取消收藏失败:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;