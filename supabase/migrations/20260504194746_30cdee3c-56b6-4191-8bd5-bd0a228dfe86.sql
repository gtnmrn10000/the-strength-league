
-- Add XP and grade tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN xp integer NOT NULL DEFAULT 0,
ADD COLUMN current_grade text NOT NULL DEFAULT 'recruit';
