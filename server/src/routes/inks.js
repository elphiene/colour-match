import { Router } from 'express'
import { run, get, all } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await all('SELECT * FROM custom_inks ORDER BY name'))
})

router.post('/', async (req, res) => {
  const { name, c = 0, m = 0, y = 0, k = 0, o = 0, g = 0, notes } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const r = await run(
      'INSERT INTO custom_inks (name, c, m, y, k, o, g, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, c, m, y, k, o, g, notes || null]
    )
    res.json(await get('SELECT * FROM custom_inks WHERE id = ?', [r.lastID]))
  } catch {
    res.status(400).json({ error: 'Ink name already exists' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, c = 0, m = 0, y = 0, k = 0, o = 0, g = 0, notes } = req.body
  await run(
    'UPDATE custom_inks SET name=?, c=?, m=?, y=?, k=?, o=?, g=?, notes=? WHERE id=?',
    [name, c, m, y, k, o, g, notes || null, req.params.id]
  )
  res.json(await get('SELECT * FROM custom_inks WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM custom_inks WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
