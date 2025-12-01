
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// CORS
const allowedOrigin = process.env.ORIGIN || '*'
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === allowedOrigin) {
      callback(null, true)
    } else {
      callback(new Error('CORS: Origin ikke tilladt'))
    }
  },
  methods: ['GET', 'POST'],
}))

app.use(helmet())
app.use(express.json())
app.use(morgan('tiny'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})
app.use('/api/', limiter)

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI mangler')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
console.log('MongoDB forbundet')

// Schema kun med navn
const signupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'signups' })

const Signup = mongoose.model('Signup', signupSchema)

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/stats', async (req, res) => {
  const count = await Signup.countDocuments()
  res.json({ count })
})

app.post('/api/signup', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Navn er påkrævet.' })
    }
    const signup = new Signup({ name: String(name).trim() })
    await signup.save()
    res.status(201).json({ message: 'Tilmelding gemt', id: signup._id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Serverfejl' })
  }
})

app.get('/api/signups', async (req, res) => {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Uautoriseret' })
  }
  const list = await Signup.find().sort({ createdAt: -1 }).lean()
  res.json(list)
})

app.listen(PORT, () => console.log(`Server kører på port ${PORT}`))
