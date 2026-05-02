import { Router } from 'express'
import { run, get, all } from '../db.js'
import { deltaE2000 } from '../deltaE.js'

const router = Router()

// ── Jobs ──────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  res.json(await all(`
    SELECT j.*, p.name as printer_name,
      (SELECT COUNT(*) FROM match_attempts WHERE job_id = j.id) as attempt_count,
      (SELECT MIN(delta_e) FROM match_attempts WHERE job_id = j.id AND delta_e IS NOT NULL) as best_delta_e
    FROM colour_jobs j
    LEFT JOIN printers p ON j.printer_id = p.id
    ORDER BY j.created_at DESC
  `))
})

router.get('/:id', async (req, res) => {
  const job = await get(`
    SELECT j.*, p.name as printer_name
    FROM colour_jobs j
    LEFT JOIN printers p ON j.printer_id = p.id
    WHERE j.id = ?
  `, [req.params.id])
  if (!job) return res.status(404).json({ error: 'Not found' })
  job.attempts = await all(
    'SELECT * FROM match_attempts WHERE job_id = ? ORDER BY attempt_number',
    [req.params.id]
  )
  res.json(job)
})

router.post('/', async (req, res) => {
  const { printer_id, name, target_l, target_a, target_b, notes } = req.body
  if (!name || target_l == null || target_a == null || target_b == null)
    return res.status(400).json({ error: 'name, target_l, target_a, target_b required' })
  const r = await run(
    'INSERT INTO colour_jobs (printer_id, name, target_l, target_a, target_b, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [printer_id || null, name, target_l, target_a, target_b, notes || null]
  )
  res.json(await get('SELECT * FROM colour_jobs WHERE id = ?', [r.lastID]))
})

router.put('/:id', async (req, res) => {
  const { printer_id, name, target_l, target_a, target_b, notes } = req.body
  await run(
    'UPDATE colour_jobs SET printer_id=?, name=?, target_l=?, target_a=?, target_b=?, notes=? WHERE id=?',
    [printer_id || null, name, target_l, target_a, target_b, notes || null, req.params.id]
  )
  res.json(await get('SELECT * FROM colour_jobs WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM colour_jobs WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

// ── Attempts ──────────────────────────────────────────────────────────────

router.post('/:id/attempts', async (req, res) => {
  const job = await get('SELECT * FROM colour_jobs WHERE id = ?', [req.params.id])
  if (!job) return res.status(404).json({ error: 'Job not found' })

  const { c = 0, m = 0, y = 0, k = 0, o = 0, g = 0,
          result_l, result_a, result_b, notes } = req.body

  const last = await get(
    'SELECT MAX(attempt_number) as n FROM match_attempts WHERE job_id = ?',
    [req.params.id]
  )
  const attempt_number = (last.n || 0) + 1

  let delta_e = null, delta_l = null, delta_a = null, delta_b = null, passed = 0
  if (result_l != null && result_a != null && result_b != null) {
    delta_l = result_l - job.target_l
    delta_a = result_a - job.target_a
    delta_b = result_b - job.target_b
    delta_e = deltaE2000(
      { L: job.target_l, a: job.target_a, b: job.target_b },
      { L: result_l,     a: result_a,     b: result_b }
    )
    passed = delta_e < 2 ? 1 : 0
  }

  const r = await run(`
    INSERT INTO match_attempts
      (job_id, attempt_number, c, m, y, k, o, g,
       result_l, result_a, result_b, delta_e, delta_l, delta_a, delta_b, passed, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, attempt_number, c, m, y, k, o, g,
     result_l ?? null, result_a ?? null, result_b ?? null,
     delta_e, delta_l, delta_a, delta_b, passed, notes || null]
  )
  res.json(await get('SELECT * FROM match_attempts WHERE id = ?', [r.lastID]))
})

router.put('/:jobId/attempts/:id', async (req, res) => {
  const job = await get('SELECT * FROM colour_jobs WHERE id = ?', [req.params.jobId])
  if (!job) return res.status(404).json({ error: 'Job not found' })

  const { c = 0, m = 0, y = 0, k = 0, o = 0, g = 0,
          result_l, result_a, result_b, notes } = req.body

  let delta_e = null, delta_l = null, delta_a = null, delta_b = null, passed = 0
  if (result_l != null && result_a != null && result_b != null) {
    delta_l = result_l - job.target_l
    delta_a = result_a - job.target_a
    delta_b = result_b - job.target_b
    delta_e = deltaE2000(
      { L: job.target_l, a: job.target_a, b: job.target_b },
      { L: result_l,     a: result_a,     b: result_b }
    )
    passed = delta_e < 2 ? 1 : 0
  }

  await run(`
    UPDATE match_attempts
    SET c=?, m=?, y=?, k=?, o=?, g=?,
        result_l=?, result_a=?, result_b=?,
        delta_e=?, delta_l=?, delta_a=?, delta_b=?, passed=?, notes=?
    WHERE id=?`,
    [c, m, y, k, o, g,
     result_l ?? null, result_a ?? null, result_b ?? null,
     delta_e, delta_l, delta_a, delta_b, passed, notes || null,
     req.params.id]
  )
  res.json(await get('SELECT * FROM match_attempts WHERE id = ?', [req.params.id]))
})

router.delete('/:jobId/attempts/:id', async (req, res) => {
  await run('DELETE FROM match_attempts WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
