-- Add testing_mode to syrve_config (Retry with new timestamp)
ALTER TABLE public.syrve_config ADD COLUMN IF NOT EXISTS testing_mode boolean NOT NULL DEFAULT false;
