const express = require('express');
const db = require('../db');
const router = express.Router();

// 获取所有已发布文章
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM articles ORDER BY publishedAt DESC').all();
  // 解析 engagementMetrics JSON
  rows.forEach(row => {
    if (row.engagementMetrics) row.engagementMetrics = JSON.parse(row.engagementMetrics);
  });
  res.json(rows);
});

// 发布文章
router.post('/', (req, res) => {
  const { id, title, content, personaId, platform, status, publishedAt, engagementMetrics, createdAt, updatedAt } = req.body;
  const stmt = db.prepare(`
    INSERT INTO articles (id, title, content, personaId, platform, status, publishedAt, engagementMetrics, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, content, personaId, platform, status, publishedAt, JSON.stringify(engagementMetrics), createdAt, updatedAt);
  res.status(201).json({ id });
});

// 删除文章
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;