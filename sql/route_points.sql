CREATE TABLE public.route_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.route_sessions (id) ON DELETE CASCADE,
  sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  accuracy NUMERIC(6, 2),
  altitude NUMERIC(8, 2),
  speed NUMERIC(6, 2),
  heading NUMERIC(5, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_route_points_session ON public.route_points (session_id);
CREATE INDEX idx_route_points_sequence ON public.route_points (session_id, sequence_index);
