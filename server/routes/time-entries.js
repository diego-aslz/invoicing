import { Router } from 'express';
import db from '../db/connection.js';
import { rowToObject, rowsToArray } from '../db/serialise.js';

const router = Router();

router.get('/', (req, res) => {
  const { projectId, month } = req.query;
  const conditions = [];
  const params = {};

  if (projectId) {
    conditions.push('project_id = @projectId');
    params.projectId = projectId;
  }
  if (month) {
    conditions.push("date LIKE @month || '%'");
    params.month = month;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM time_entries ${where} ORDER BY date DESC`).all(params);
  res.json(rowsToArray(rows));
});

router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { projectId, date, hours, comment = '' } = req.body;

  db.prepare(`
    INSERT INTO time_entries (id, project_id, date, hours, comment, created_at, updated_at)
    VALUES (@id, @projectId, @date, @hours, @comment, @createdAt, @updatedAt)
  `).run({ id, projectId, date, hours, comment, createdAt: now, updatedAt: now });

  const row = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  res.status(201).json(rowToObject(row));
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const camelToSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const allowed = ['date', 'hours', 'comment', 'project_id'];

  const updates = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(req.body)) {
    const snake = camelToSnake(k);
    if (allowed.includes(snake)) {
      updates[snake] = v;
    }
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE time_entries SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

  const row = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  res.json(rowToObject(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
  res.status(204).end();
});

export default router;
