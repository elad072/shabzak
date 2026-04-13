-- 1. Create Settings Roles Table
CREATE TABLE public.settings_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    color_code TEXT DEFAULT '#94a3b8', -- Default slate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert Default Roles
INSERT INTO public.settings_roles (role_name, display_order, color_code) VALUES
('מפקד משמרת', 1, '#3b82f6'), -- Blue-500
('קצין התגננות', 2, '#16a34a'), -- Green-600
('סמב"צ', 3, '#f97316'), -- Orange-500
('חפיפה', 4, '#9333ea'); -- Purple-600

-- 3. Add Role ID to People
ALTER TABLE public.people ADD COLUMN default_role_id UUID REFERENCES public.settings_roles(id) ON DELETE SET NULL;

-- 4. Add Role ID to Assignments
ALTER TABLE public.assignments ADD COLUMN role_id UUID REFERENCES public.settings_roles(id) ON DELETE CASCADE;

-- 5. Migrate Existing Data (People)
UPDATE public.people p
SET default_role_id = r.id
FROM public.settings_roles r
WHERE p.default_role = r.role_name;

-- 6. Migrate Existing Data (Assignments)
UPDATE public.assignments a
SET role_id = r.id
FROM public.settings_roles r
WHERE a.assigned_role = r.role_name;

-- 7. Update Assignments Constraints
-- Make role_id NOT NULL after migration
ALTER TABLE public.assignments ALTER COLUMN role_id SET NOT NULL;
-- Drop old string column
ALTER TABLE public.assignments DROP COLUMN assigned_role;
-- Drop old string column from people (optional, keeping for safety or removing if requested)
-- ALTER TABLE public.people DROP COLUMN default_role;

-- 8. Enable RLS for Settings
ALTER TABLE public.settings_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage settings_roles" ON public.settings_roles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Update Trigger for sync_assignment_status
-- Re-defining to handle the migration if needed, but the current trigger uses NEW.person_id and NEW.date which hasn't changed.
-- The trigger is already set up on public.assignments.

-- 10. View update (optional helper)
-- CREATE OR REPLACE VIEW assignment_details AS
-- SELECT a.*, r.role_name, r.color_code
-- FROM public.assignments a
-- JOIN public.settings_roles r ON a.role_id = r.id;
