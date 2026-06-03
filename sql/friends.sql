CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT friend_requests_sender_not_receiver CHECK (sender_id <> receiver_id)
);

CREATE UNIQUE INDEX idx_friend_requests_pending_directed
  ON public.friend_requests (sender_id, receiver_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX idx_friend_requests_pending_pair
  ON public.friend_requests (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id)
  )
  WHERE status = 'pending';

CREATE INDEX idx_friend_requests_receiver_pending
  ON public.friend_requests (receiver_id, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX idx_friend_requests_sender
  ON public.friend_requests (sender_id);

-- ---------------------------------------------------------------------------

CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT friends_user_not_friend CHECK (user_id <> friend_id),
  CONSTRAINT friends_user_friend_unique UNIQUE (user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON public.friends (user_id);
CREATE INDEX idx_friends_friend_id ON public.friends (friend_id);

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_receiver_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  SELECT sender_id
  INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND receiver_id = p_receiver_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or not pending'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.friend_requests
  SET status = 'accepted'
  WHERE id = p_request_id;

  INSERT INTO public.friends (user_id, friend_id)
  VALUES
    (v_sender_id, p_receiver_id),
    (p_receiver_id, v_sender_id)
  --ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;
