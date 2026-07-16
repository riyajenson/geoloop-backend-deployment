import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import passportRoutes from './routes/passportRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
//import leaderboardRoutes from './routes/leaderboardRoutes.js'
import testRoutes from './routes/testRoutes.js'
import otpRoutes from './routes/otpRoutes.js'
import signupRoutes from './routes/signupRoutes.js'
import friendRoutes from './routes/friendRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import trackingRoutes from './routes/trackingRoutes.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'GeoLoop backend running',
  })
})


app.use('/api/auth', authRoutes);
app.use('/auth', signupRoutes)
app.use('/profile', profileRoutes)
app.use('/stats', statsRoutes)
app.use('/passport', passportRoutes)
app.use('/rooms', roomRoutes)
app.use('/friends', friendRoutes)
//app.use('/leaderboard', leaderboardRoutes)
app.use('/api', testRoutes)
app.use('/otp', otpRoutes)
app.use('/activity', activityRoutes)
app.use('/notifications', notificationRoutes)
app.use('/tracking', trackingRoutes)


const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})