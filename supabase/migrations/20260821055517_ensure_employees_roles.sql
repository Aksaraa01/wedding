-- Ensure employees role supports admin, sales, creative.
UPDATE public.employees SET role = 'sales' WHERE role = 'ops';
UPDATE public.employees SET role = 'admin' WHERE role NOT IN ('admin', 'sales', 'creative');

ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'sales', 'creative'));
ALTER TABLE public.employees ALTER COLUMN role SET DEFAULT 'sales';
