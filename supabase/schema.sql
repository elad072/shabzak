-- Create People Table
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    default_role TEXT DEFAULT 'סמב"צ',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.people ADD CONSTRAINT valid_role CHECK (default_role IN ('מפקד משמרת', 'קצין התגננות', 'סמב"צ', 'חפיפה'));

-- Create Assignments Table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    assigned_role TEXT NOT NULL CHECK (assigned_role IN ('מפקד משמרת', 'קצין התגננות', 'סמב"צ', 'חפיפה')),
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 5), -- Increased to 5 slots
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, shift_type, slot_index) -- Crucial for Upsert logic
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Refine RLS Policies
DROP POLICY IF EXISTS "Authenticated users can manage people" ON public.people;
CREATE POLICY "Authenticated users can manage people" ON public.people
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage assignments" ON public.assignments;
CREATE POLICY "Authenticated users can manage assignments" ON public.assignments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_assignments_date ON public.assignments(date);
CREATE INDEX idx_people_last_name ON public.people(last_name);
