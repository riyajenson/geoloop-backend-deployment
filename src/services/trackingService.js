import { supabaseServiceRole } from '../config/supabase.js'

export async function createRouteSession(userId, data) {
    // 1. Insert parent session with new metric columns passed from frontend
    const { data: session, error: sessionError } = await supabaseServiceRole
        .from('route_sessions')
        .insert([{
            user_id: userId,
            local_session_id: data.localSessionId,
            started_at: data.startedAt,
            ended_at: data.endedAt,
            distance_metres: data.distanceMetres || null,
            elevation_gain_metres: data.elevationGainMetres || null,
            avg_pace_seconds_per_km: data.avgPaceSecondsPerKm || null,
            splits: data.splits ? JSON.stringify(data.splits) : '[]'
        }])
        .select()
        .single();

    if (sessionError) throw sessionError;

    // 2. Format point streams supporting both native telemetry and simplified { lat, lng } signatures
    const bulkPoints = data.points.map((pt, idx) => ({
        session_id: session.id,
        sequence_index: pt.sequenceIndex !== undefined ? pt.sequenceIndex : idx,
        latitude: pt.latitude ?? pt.lat, // Resolves the gap with simplified paths safely
        longitude: pt.longitude ?? pt.lng, // Resolves the gap with simplified paths safely
        accuracy: pt.accuracy ?? null,
        altitude: pt.altitude ?? null,
        speed: pt.speed ?? null,
        heading: pt.heading ?? null,
        recorded_at: pt.recordedAt ?? new Date().toISOString()
    }));

    // 3. Perform a bulk insert of the formatted telemetry points
    const { error: pointsError } = await supabaseServiceRole
        .from('route_points')
        .insert(bulkPoints);

    if (pointsError) throw pointsError;

    return { routeId: session.id };
}

export async function getRouteWithPoints(routeId, userId) {
    const { data: session, error: sErr } = await supabaseServiceRole
        .from('route_sessions')
        .select('*')
        .eq('id', routeId)
        .eq('user_id', userId)
        .single();

    if (sErr || !session) return null;

    const { data: points, error: pErr } = await supabaseServiceRole
        .from('route_points')
        .select('sequence_index, latitude, longitude, accuracy, altitude, speed, recorded_at')
        .eq('session_id', routeId)
        .order('sequence_index', { ascending: true });

    if (pErr) throw pErr;

    return {
        ...session,
        points
    };
}

//Processes polygon coordinates for closed-loop territory evaluation via PostGIS

export async function processTerritory(routeId, userId) {
    const { data, error } = await supabaseServiceRole.rpc('process_route_territory', {
        target_session_id: routeId
    })

    if (error) {
        console.error('PostGIS Territory Processing Error:', error)
        return { success: false, area_sqm: 0, xp_earned: 0 }
    }

    return data || { success: true }
}