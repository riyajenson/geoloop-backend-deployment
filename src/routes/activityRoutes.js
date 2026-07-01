import { Router } from 'express'
import { getFeed } from '../controllers/activityController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth)
router.get('/feed', getFeed)

export default router