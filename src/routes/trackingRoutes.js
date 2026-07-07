import { Router } from 'express'
import { saveTrack, getTrackDetails } from '../controllers/trackingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post('/complete', saveTrack)
router.get('/:routeId', getTrackDetails)

export default router