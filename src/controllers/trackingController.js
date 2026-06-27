const trackingService = require('../services/trackingService');


exports.saveTrack = async (req, res, next) => {
    try {
        const userId = req.user.id; // Populated by your requireAuth middleware
        const { localSessionId, startedAt, endedAt, points } = req.body;

        if (!localSessionId || !startedAt || !endedAt || !Array.isArray(points) || points.length === 0) {
            return res.status(400).json({ error: 'Missing or malformed tracking data payloads.' });
        }

        const result = await trackingService.createRouteSession(userId, {
            localSessionId,
            startedAt,
            endedAt,
            points
        });

        // The frontend expects routeId back so it can redirect smoothly
        return res.status(201).json({
            message: 'Tracking session stored successfully',
            routeId: result.routeId
        });
    } catch (error) {
        next(error);
    }
};


exports.getTrackDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { routeId } = req.params;

        const routeData = await trackingService.getRouteWithPoints(routeId, userId);

        if (!routeData) {
            return res.status(404).json({ error: 'Tracking session not found.' });
        }

        return res.status(200).json(routeData);
    } catch (error) {
        next(error);
    }
};