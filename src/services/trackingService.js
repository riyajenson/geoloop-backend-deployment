const { supabaseServiceRole } = require('../config/supabase'); // Adapts to your database client config

exports.createRouteSession = async (userId, data) => {
    // 1. Insert parent session data
    const { data: session, error: sessionError } = await supabaseServiceRole
        .from('route_sessions')
        .insert([{
            user_id: userId,
            local_session_id: data.localSessionId,
            started_at: data.startedAt,
            ended_at: data.endedAt
        }])
        .select()
        .single();

    if (sessionError) throw sessionError;

    // 2. Format the point streams with the newly minted session UUID, explicitly handling altitude
    const bulkPoints = data.points.map((pt) => ({
        session_id: session.id,
        sequence_index: pt.sequenceIndex,
        latitude: pt.latitude,
        longitude: pt.longitude,
        accuracy: pt.accuracy,
        altitude: pt.altitude, // Synced with frontend payload schema
        speed: pt.speed,
        heading: pt.heading,
        recorded_at: pt.recordedAt
    }));

    // 3. Bulk insert points efficiently
    const { error: pointsError } = await supabaseServiceRole
        .from('route_points')
        .insert(bulkPoints);

    if (pointsError) throw pointsError;

    return { routeId: session.id };
};


exports.getRouteWithPoints = async (routeId, userId) => {
    // Fetch parent session data (verifying ownership)
    const { data: session, error: sErr } = await supabaseServiceRole
        .from('route_sessions')
        .select('*')
        .eq('id', routeId)
        .eq('user_id', userId)
        .single();

    if (sErr || !session) return null;

    // Fetch matching trail coordinates ordered by sequence index
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
};


//Triggers the spatial database engine to build a polygon and calculate area

exports.processTerritory = async (routeId, userId) => {

    const { data, error } = await supabaseServiceRole
        .rpc('process_route_territory', {
            p_route_id: routeId,
            p_user_id: userId
        });

    if (error) throw error;

    // If the geometry couldn't form a closed polygon, data[0].is_valid_loop is false
    return data && data[0] ? data[0] : { territory_id: null, area_sqm: 0, is_valid_loop: false };
};