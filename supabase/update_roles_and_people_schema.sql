-- Update settings_roles table
ALTER TABLE public.settings_roles 
ADD COLUMN IF NOT EXISTS rank TEXT,
ADD COLUMN IF NOT EXISTS teken TEXT,
ADD COLUMN IF NOT EXISTS teken_quantity INTEGER DEFAULT 0;

-- Update people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS rank TEXT;
