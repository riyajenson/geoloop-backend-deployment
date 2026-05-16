import express from 'express'
import * as profileController from '../controllers/profileController.js'

const router = express.Router()

router.get('/:id', profileController.getProfile)
router.put('/:id', profileController.updateProfile)

export default router