import express from 'express'
import * as passportController from '../controllers/passportController.js'

const router = express.Router()

router.post('/add', passportController.addCity)
router.get('/:id', passportController.getCities)

export default router
