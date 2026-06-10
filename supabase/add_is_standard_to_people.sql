-- Add is_standard column to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS is_standard BOOLEAN DEFAULT true;

-- Update existing records to be 'standard' by default
UPDATE public.people SET is_standard = true WHERE is_standard IS NULL;
