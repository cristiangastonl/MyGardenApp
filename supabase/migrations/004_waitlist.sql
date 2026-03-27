-- Waitlist table for landing page signups
-- No RLS needed - this is a public insert-only table accessed via edge function

CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'hero',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on email to avoid duplicates
CREATE UNIQUE INDEX idx_waitlist_email ON public.waitlist(email);

-- No RLS - accessed via service role from edge function
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No public policies - only the edge function (service role) can insert/read
