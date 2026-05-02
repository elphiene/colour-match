import { Router } from 'express'
import { run, get, all } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await all('SELECT * FROM printers ORDER BY name'))
})

router.post('/', async (req, res) => {
  const { name, notes } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const r = await run('INSERT INTO printers (name, notes) VALUES (?, ?)', [name, notes || null])
    res.json(await get('SELECT * FROM printers WHERE id = ?', [r.lastID]))
  } catch {
    res.status(400).json({ error: 'Printer name already exists' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, notes } = req.body
  await run('UPDATE printers SET name = ?, notes = ? WHERE id = ?', [name, notes || null, req.params.id])
  res.json(await get('SELECT * FROM printers WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM printers WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
