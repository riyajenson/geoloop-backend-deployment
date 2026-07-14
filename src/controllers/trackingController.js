import * as trackingService from '../services/trackingService.js'
import * as statsService from '../services/statsService.js' // Pull in your existing stats/XP logic

export async function saveTrack(req, res, next) {
    try {
        const userId = req.user.id;
        const {
            localSessionId,
            startedAt,
            endedAt,
            durationSeconds,
            points,
            distanceMetres,
            elevationGainMetres,
            avgPaceSecondsPerKm,
            splits
        } = req.body;

        if (!localSessionId || !startedAt || !endedAt || !Array.isArray(points) || points.length === 0) {
            return res.status(400).json({ error: 'Missing or malformed tracking data payloads.' });
        }

        // 1. Save the basic raw points stream
        const result = await trackingService.createRouteSession(userId, {
            localSessionId,
            startedAt,
            endedAt,
            durationSeconds,
            points,
            distanceMetres,
            elevationGainMetres,
            avgPaceSecondsPerKm,
            splits
        });

        // 2. Process spatial polygon loop configurations
        const territory = await trackingService.processTerritory(result.routeId, userId);

        let xpEarned = 0;
        if (territory.is_valid_loop) {
            // Scale logic example: 1 XP per 20 square meters captured
            xpEarned = Math.min(Math.floor(territory.area_sqm / 20), 500);

            // Increment profile XP using your project's stats handler [cite: 107]
            if (xpEarned > 0) {
                await statsService.incrementStats(userId, { xp: xpEarned }); // Syncs level up rules dynamically [cite: 107]
            }
        }

        // Return a fully unified payload matching what TerritoryResultScreen.js wants 
        return res.status(201).json({
            message: 'Tracking and territory processed successfully',
            routeId: result.routeId,
            territory: {
                id: territory.territory_id,
                area: territory.area_sqm,
                xpEarned: xpEarned,
                isValidLoop: territory.is_valid_loop
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getTrackDetails(req, res) {
    try {
        const { routeId } = req.params
        const userId = req.user.id

        const track = await trackingService.getRouteWithPoints(routeId, userId)
        if (!track) {
            return res.status(404).json({ success: false, message: 'Track session not found' })
        }

        return res.status(200).json({ success: true, data: track })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}