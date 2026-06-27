const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { requireAuth } = require('../middleware/authMiddleware');


router.use(requireAuth);

router.post('/complete', trackingController.saveTrack);
router.get('/:routeId', trackingController.getTrackDetails);

module.exports = router;