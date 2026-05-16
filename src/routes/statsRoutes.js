import express from 'express'
import * as statsController from '../controllers/statsController.js'

const router = express.Router()

router.get('/:id', statsController.getStats)
router.put('/:id', statsController.updateStats)
router.patch('/:id/increment', statsController.incrementStats)

export default router
