const express = require('express');
const db = require('../db');
const router = express.Router();

// 获取所有人设
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM personas').all();
  res.json(rows);
});

// 获取单个人设
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// 创建人设
router.post('/', (req, res) => {
  const { id, name, age, occupation, platform, avatar, bio, writingStyle, contentPreference, createdAt, updatedAt } = req.body;
  const stmt = db.prepare(`
    INSERT INTO personas (id, name, age, occupation, platform, avatar, bio, writingStyle, contentPreference, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, age, occupation, platform, avatar, bio, JSON.stringify(writingStyle), contentPreference, createdAt, updatedAt);
  res.status(201).json({ id });
});

// 更新人设
router.put('/:id', (req, res) => {
  const { name, age, occupation, platform, avatar, bio, writingStyle, contentPreference, updatedAt } = req.body;
  const stmt = db.prepare(`
    UPDATE personas SET name=?, age=?, occupation=?, platform=?, avatar=?, bio=?, writingStyle=?, contentPreference=?, updatedAt=?
    WHERE id=?
  `);
  stmt.run(name, age, occupation, platform, avatar, bio, JSON.stringify(writingStyle), contentPreference, updatedAt, req.params.id);
  res.json({ success: true });
});

// 删除人设
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM personas WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;