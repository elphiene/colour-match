import { Router } from 'express'
import { run, get, all } from '../db.js'
import patches from '../calibrationPatches.js'
import { generateCalibrationPDF } from '../pdfChart.js'
import multer from 'multer'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHARTS_DIR = join(__dirname, '../../../data/charts')

// Chart files: 'no-white' → Surface + Reverse, 'white' → CBW
const CHART_TYPES = { 'no-white': 'no-white.pdf', 'white': 'white.pdf' }
const MODE_TO_CHART = { surface: 'no-white', reverse: 'no-white', cbw: 'white' }

const upload = multer({
  storage: multer.diskStorage({
    destination: CHARTS_DIR,
    filename: (req, file, cb) => cb(null, CHART_TYPES[req.body.type] || 'unknown.pdf')
  }),
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

const router = Router()
const VALID_MODES = ['surface', 'reverse', 'cbw']

function validateMode(req, res, next) {
  if (!VALID_MODES.includes(req.params.mode))
    return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` })
  next()
}

// ── Get all patches for a printer+mode (with any saved measurements) ──────
router.get('/:printerId/:mode/patches', validateMode, async (req, res) => {
  const { printerId, mode } = req.params
  const measured = await all(
    'SELECT * FROM calibration_patches WHERE printer_id = ? AND print_mode = ?',
    [printerId, mode]
  )
  const measuredById = Object.fromEntries(measured.map(m => [m.patch_ref, m]))

  const result = patches.map(p => ({
    ...p,
    measured_l: measuredById[p.id]?.measured_l ?? null,
    measured_a: measuredById[p.id]?.measured_a ?? null,
    measured_b: measuredById[p.id]?.measured_b ?? null,
    db_id:      measuredById[p.id]?.id ?? null,
  }))

  const total    = patches.length
  const complete = result.filter(p => p.measured_l !== null).length
  res.json({ total, complete, mode, patches: result })
})

// ── Save a single patch measurement ───────────────────────────────────────
router.post('/:printerId/:mode/patches/:patchId', validateMode, async (req, res) => {
  const { printerId, mode, patchId } = req.params
  const { measured_l, measured_a, measured_b } = req.body

  if (measured_l == null || measured_a == null || measured_b == null)
    return res.status(400).json({ error: 'measured_l, measured_a, measured_b required' })

  const patch = patches.find(p => p.id === parseInt(patchId))
  if (!patch) return res.status(404).json({ error: 'Patch not found' })

  const existing = await get(
    'SELECT id FROM calibration_patches WHERE printer_id = ? AND print_mode = ? AND patch_ref = ?',
    [printerId, mode, patchId]
  )
  if (existing) {
    await run(
      'UPDATE calibration_patches SET measured_l=?, measured_a=?, measured_b=? WHERE id=?',
      [measured_l, measured_a, measured_b, existing.id]
    )
    res.json(await get('SELECT * FROM calibration_patches WHERE id = ?', [existing.id]))
  } else {
    const r = await run(
      `INSERT INTO calibration_patches
        (printer_id, print_mode, patch_ref, c, m, y, k, o, g, measured_l, measured_a, measured_b)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [printerId, mode, patchId,
       patch.c, patch.m, patch.y, patch.k, patch.o, patch.g,
       measured_l, measured_a, measured_b]
    )
    res.json(await get('SELECT * FROM calibration_patches WHERE id = ?', [r.lastID]))
  }
})

// ── Clear measurements for a printer+mode ─────────────────────────────────
router.delete('/:printerId/:mode/patches', validateMode, async (req, res) => {
  await run(
    'DELETE FROM calibration_patches WHERE printer_id = ? AND print_mode = ?',
    [req.params.printerId, req.params.mode]
  )
  res.json({ ok: true })
})

// ── Download PDF chart — serves uploaded file if present, else generated ──
router.get('/:printerId/:mode/pdf', validateMode, async (req, res) => {
  const { printerId, mode } = req.params
  const printer = await get('SELECT * FROM printers WHERE id = ?', [printerId])
  if (!printer) return res.status(404).json({ error: 'Printer not found' })

  const chartFile = join(CHARTS_DIR, CHART_TYPES[MODE_TO_CHART[mode]])
  const modeLabels = { surface: 'Surface', reverse: 'Reverse', cbw: 'CBW' }
  const filename = `calibration-${printer.name.replace(/\s+/g,'-')}-${mode}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  if (existsSync(chartFile)) {
    res.sendFile(chartFile)
  } else {
    generateCalibrationPDF({ ...printer, modeLabel: modeLabels[mode] }, patches, res)
  }
})

// ── Upload a chart PDF ─────────────────────────────────────────────────────
router.post('/charts/upload', upload.single('chart'), (req, res) => {
  const { type } = req.body
  if (!CHART_TYPES[type]) return res.status(400).json({ error: 'type must be no-white or white' })
  if (!req.file)          return res.status(400).json({ error: 'No PDF uploaded' })
  res.json({ ok: true, type, filename: req.file.filename })
})

// ── Chart upload status ────────────────────────────────────────────────────
router.get('/charts/status', (req, res) => {
  res.json({
    'no-white': existsSync(join(CHARTS_DIR, 'no-white.pdf')),
    'white':    existsSync(join(CHARTS_DIR, 'white.pdf')),
  })
})

export default router
