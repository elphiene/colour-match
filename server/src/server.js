import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { migrate } from './db.js'
import printersRouter     from './routes/printers.js'
import jobsRouter         from './routes/jobs.js'
import inksRouter         from './routes/inks.js'
import calibrationRouter  from './routes/calibration.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8082

async function start() {
  await migrate()

  const app = express()
  app.use(cors())
  app.use(morgan('dev'))
  app.use(express.json())

  app.use('/api/printers',    printersRouter)
  app.use('/api/jobs',        jobsRouter)
  app.use('/api/inks',        inksRouter)
  app.use('/api/calibration', calibrationRouter)

  // Serve built client in production
  const distPath = join(__dirname, '../../client/dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))

  app.listen(PORT, () => console.log(`colour-match running on http://localhost:${PORT}`))
}

start().catch(err => { console.error(err); process.exit(1) })
