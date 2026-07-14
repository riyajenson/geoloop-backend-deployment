CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.route_sessions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  area_sqm NUMERIC(12, 2) NOT NULL CHECK (area_sqm >= 0),
  is_valid_loop BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territories_user ON public.territories (user_id);
CREATE INDEX IF NOT EXISTS idx_territories_session ON public.territories (session_id);

-- ─── Constants ─────────────────────────────────────────────────────────────
-- Maximum distance in metres between first and last point to consider the
-- route a "closed loop" eligible for territory capture.
-- Matches the frontend loopTracker threshold of 50 m for loop detection.
CREATE OR REPLACE FUNCTION public.process_route_territory(
  target_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id        UUID;
  v_points         JSON;
  v_point_count    INTEGER;
  v_first_lat      NUMERIC;
  v_first_lng      NUMERIC;
  v_last_lat       NUMERIC;
  v_last_lng       NUMERIC;
  v_delta_lat      NUMERIC;
  v_delta_lng      NUMERIC;
  v_avg_lat        NUMERIC;
  v_dist_m         NUMERIC;
  v_is_loop        BOOLEAN := FALSE;
  v_area_sqm       NUMERIC := 0;
  v_territory_id   UUID;
  v_loop_threshold NUMERIC := 50;
  v_i              INTEGER;
  v_lat            NUMERIC;
  v_lng            NUMERIC;
  v_next_lat       NUMERIC;
  v_next_lng       NUMERIC;
  v_x_m            NUMERIC;
  v_y_m            NUMERIC;
  v_next_x_m       NUMERIC;
  v_next_y_m       NUMERIC;
BEGIN
  -- Get the user_id and point count for this session
  SELECT rs.user_id, COUNT(rp.id)
  INTO v_user_id, v_point_count
  FROM public.route_sessions rs
  LEFT JOIN public.route_points rp ON rp.session_id = rs.id
  WHERE rs.id = target_session_id
  GROUP BY rs.user_id;

  IF NOT FOUND OR v_user_id IS NULL THEN
    RETURN json_build_object(
      'territory_id', NULL::UUID,
      'area_sqm', 0,
      'is_valid_loop', FALSE
    );
  END IF;

  -- Need at least 3 points to form a polygon
  IF v_point_count < 3 THEN
    RETURN json_build_object(
      'territory_id', NULL::UUID,
      'area_sqm', 0,
      'is_valid_loop', FALSE
    );
  END IF;

  -- Get first and last point coordinates
  SELECT latitude, longitude INTO v_first_lat, v_first_lng
  FROM public.route_points
  WHERE session_id = target_session_id
  ORDER BY sequence_index ASC
  LIMIT 1;

  SELECT latitude, longitude INTO v_last_lat, v_last_lng
  FROM public.route_points
  WHERE session_id = target_session_id
  ORDER BY sequence_index DESC
  LIMIT 1;

  -- Haversine distance between first and last point
  -- Approx: 1 degree = 111111 m at equator, scaled by cos(avg_lat) for longitude
  v_avg_lat := radians((v_first_lat + v_last_lat) / 2);
  v_delta_lat := (v_first_lat - v_last_lat) * 111111;
  v_delta_lng := (v_first_lng - v_last_lng) * 111111 * cos(v_avg_lat);
  v_dist_m := sqrt(v_delta_lat * v_delta_lat + v_delta_lng * v_delta_lng);

  -- Check if the route forms a closed loop
  IF v_dist_m <= v_loop_threshold THEN
    v_is_loop := TRUE;

    -- Approximate polygon area using a modified shoelace formula
    -- Convert lat/lng to metres, compute sum over edges
    v_avg_lat := radians(v_first_lat);  -- Use first point's lat for scale

    FOR v_i IN 0..(v_point_count - 2) LOOP
      SELECT latitude, longitude INTO v_lat, v_lng
      FROM public.route_points
      WHERE session_id = target_session_id
      ORDER BY sequence_index ASC
      OFFSET v_i LIMIT 1;

      SELECT latitude, longitude INTO v_next_lat, v_next_lng
      FROM public.route_points
      WHERE session_id = target_session_id
      ORDER BY sequence_index ASC
      OFFSET v_i + 1 LIMIT 1;

      -- Convert to metres relative to first point
      v_y_m    := (v_lat    - v_first_lat) * 111111;
      v_x_m    := (v_lng    - v_first_lng) * 111111 * cos(radians(v_lat));
      v_next_y_m := (v_next_lat - v_first_lat) * 111111;
      v_next_x_m := (v_next_lng - v_first_lng) * 111111 * cos(radians(v_next_lat));

      -- Shoelace term: xi * yi+1 - xi+1 * yi
      v_area_sqm := v_area_sqm + (v_x_m * v_next_y_m - v_next_x_m * v_y_m);
    END LOOP;

    -- Close the polygon: last point to first point
    v_y_m := (v_last_lat - v_first_lat) * 111111;
    v_x_m := (v_last_lng - v_first_lng) * 111111 * cos(radians(v_last_lat));

    SELECT latitude, longitude INTO v_lat, v_lng
    FROM public.route_points
    WHERE session_id = target_session_id
    ORDER BY sequence_index ASC
    LIMIT 1;

    v_next_y_m := (v_lat - v_first_lat) * 111111;
    v_next_x_m := (v_lng - v_first_lng) * 111111 * cos(radians(v_lat));

    v_area_sqm := v_area_sqm + (v_x_m * v_next_y_m - v_next_x_m * v_y_m);

    -- Absolute value of half the shoelace sum
    v_area_sqm := abs(v_area_sqm) / 2;

    -- Insert territory record
    INSERT INTO public.territories (session_id, user_id, area_sqm, is_valid_loop)
    VALUES (target_session_id, v_user_id, v_area_sqm, TRUE)
    RETURNING id INTO v_territory_id;
  END IF;

  RETURN json_build_object(
    'territory_id', v_territory_id,
    'area_sqm', round(v_area_sqm, 2),
    'is_valid_loop', v_is_loop
  );
END;
$$;
