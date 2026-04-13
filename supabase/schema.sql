-- Personnel Status Enum
CREATE TYPE personnel_status AS ENUM ('בסיס', 'בית', 'סגור');

-- Daily Status Table
CREATE TABLE public.daily_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    status personnel_status NOT NULL DEFAULT 'בית',
    is_automated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, person_id)
);

-- RLS for Daily Status
ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage daily_status" ON public.daily_status
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger Function to sync assignment to status
CREATE OR REPLACE FUNCTION sync_assignment_status() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_status (date, person_id, status, is_automated)
    VALUES (NEW.date, NEW.person_id, 'בסיס', true)
    ON CONFLICT (date, person_id)
    DO UPDATE SET status = 'בסיס', is_automated = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_assignment_upsert ON public.assignments;
CREATE TRIGGER on_assignment_upsert
AFTER INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION sync_assignment_status();

-- Re-create assignments with its UNIQUE constraint and roles
DROP TABLE IF EXISTS public.assignments CASCADE;
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    assigned_role TEXT NOT NULL CHECK (assigned_role IN ('מפקד משמרת', 'קצין התגננות', 'סמב"צ', 'חפיפה')),
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, shift_type, slot_index)
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage assignments" ON public.assignments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-attach the trigger to the newly created table
CREATE TRIGGER on_assignment_upsert
AFTER INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION sync_assignment_status();

-- Existing indexes
CREATE INDEX idx_assignments_date ON public.assignments(date);
CREATE INDEX idx_daily_status_date ON public.daily_status(date);
