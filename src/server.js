import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import passportRoutes from './routes/passportRoutes.js'
//import leaderboardRoutes from './routes/leaderboardRoutes.js'
import testRoutes from './routes/testRoutes.js'
import otpRoutes from './routes/otpRoutes.js'
import signupRoutes from './routes/signupRoutes.js'

const app = express()

/**
 * Middleware
 */
app.use(cors())
app.use(express.json())

/**
 * Health check route
 */
app.get('/', (req, res) => {
  res.json({
    message: 'GeoLoop backend running',
  })
})

/**
 * Routes
 */
app.use('/auth', authRoutes)
app.use('/auth', signupRoutes)
app.use('/profile', profileRoutes)
app.use('/stats', statsRoutes)
app.use('/passport', passportRoutes)
//app.use('/leaderboard', leaderboardRoutes)
app.use('/api', testRoutes)
app.use('/otp', otpRoutes)

/**
 * Server start
 */
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})